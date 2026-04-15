import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import { requireAuth } from "@/lib/upload-auth"
import { getBrandsData, getProductsData, saveProductsData } from "@/lib/blob-data"
import type { Product, BrandId } from "@/lib/products"

function generateSlug(name: string, brand: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "") || `${brand.toLowerCase()}-${Date.now()}`
}

function generateId(name: string, brand: string): string {
  const baseId = `${brand.toLowerCase()}-${name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")}`

  return baseId || `${brand.toLowerCase()}-${Date.now()}`
}

function hasOwn(obj: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function normalizeStringArray(input: unknown): string[] | undefined {
  if (!Array.isArray(input)) return undefined
  return input
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get("brandId")

    const products = (await getProductsData()) as Product[]

    const noCacheHeaders = {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
    }

    if (brandId) {
      const filteredProducts = products.filter((p) => p.brand === brandId)
      return NextResponse.json({ products: filteredProducts }, { headers: noCacheHeaders })
    }

    return NextResponse.json({ products }, { headers: noCacheHeaders })
  } catch (error) {
    console.error("Get products error:", error)
    return NextResponse.json(
      { error: "獲取產品列表失敗" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const body = await request.json()
    const { name, description, features, images, brand, detailContentHtml, detailLayout, coverImage } = body

    if (!name || !description || !brand) {
      return NextResponse.json(
        { error: "請填寫產品名稱、介紹和選擇公司" },
        { status: 400 }
      )
    }

    // 驗證品牌是否存在
    const brands = (await getBrandsData()) as { id: string }[]

    if (!brands.some((b) => b.id === brand)) {
      return NextResponse.json(
        { error: "無效的公司" },
        { status: 400 }
      )
    }

    // 讀取現有產品數據
    const products = (await getProductsData()) as Product[]

    // 生成 slug 和 id
    const slug = generateSlug(name, brand)
    const id = generateId(name, brand)

    // 檢查 slug 是否已存在
    let finalSlug = slug
    if (products.some((p) => p.slug === slug)) {
      finalSlug = `${slug}-${Date.now()}`
    }

    // 創建新產品（使用默認分類和類型）
    const newProduct: Product = {
      id: products.some((p) => p.id === id) ? `${id}-${Date.now()}` : id,
      name,
      description,
      category: "無人機測繪", // 默認分類
      type: "lidar", // 默認類型
      slug: finalSlug,
      brand: brand as BrandId,
      coverImage: coverImage || undefined,
      images: images || [],
      features: features || [],
      detailContentHtml: detailContentHtml || "",
      detailLayout: detailLayout || undefined,
      link: `/products/${finalSlug}`,
      highlight: false,
      online: true,
    }

    products.push(newProduct)

    await saveProductsData(products)

    return NextResponse.json({
      success: true,
      message: "產品新增成功",
      product: newProduct,
    })
  } catch (error: unknown) {
    const err = error as Error
    if (err.message === "未授權") {
      return NextResponse.json(
        { error: "未授權訪問" },
        { status: 401 }
      )
    }

    console.error("Create product error:", error)
    const isBlobError =
      err.message?.includes("BLOB_READ_WRITE_TOKEN") || err.message?.includes("生產環境請設定")
    const errorMessage = isBlobError
      ? "儲存失敗：請確認 BLOB_READ_WRITE_TOKEN 已設定"
      : "新增產品失敗: " + (err.message || "未知錯誤")
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  let debugProductId: string | null = null
  let debugBodyKeys: string[] = []
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("id")
    debugProductId = productId

    if (!productId) {
      return NextResponse.json(
        { error: "請提供產品ID" },
        { status: 400 }
      )
    }

    const body = (await request.json()) as Record<string, unknown>
    debugBodyKeys = Object.keys(body)

    // 讀取現有產品數據
    const products = (await getProductsData()) as Product[]

    // 找到要修改的產品
    const productIndex = products.findIndex((p) => p.id === productId)

    if (productIndex === -1) {
      return NextResponse.json(
        { error: "找不到該產品" },
        { status: 404 }
      )
    }

    const existingProduct = products[productIndex]

    const nextName =
      hasOwn(body, "name") && typeof body.name === "string" && body.name.trim()
        ? body.name.trim()
        : existingProduct.name
    const nextDescription =
      hasOwn(body, "description") && typeof body.description === "string"
        ? body.description
        : existingProduct.description
    const nextBrand = (hasOwn(body, "brand") && typeof body.brand === "string"
      ? body.brand
      : existingProduct.brand) as BrandId

    if (!nextName || !nextDescription || !nextBrand) {
      return NextResponse.json({ error: "產品名稱、介紹與公司不可為空" }, { status: 400 })
    }

    const brands = (await getBrandsData()) as { id: string }[]
    if (!brands.some((b) => b.id === nextBrand)) {
      return NextResponse.json({ error: "無效的公司" }, { status: 400 })
    }

    // 僅在 name/brand 有變更時才重新計算 slug，避免連結漂移
    const shouldRegenerateSlug =
      hasOwn(body, "name") || hasOwn(body, "brand") || hasOwn(body, "slug")
    let nextSlug =
      hasOwn(body, "slug") && typeof body.slug === "string" && body.slug.trim()
        ? generateSlug(body.slug, nextBrand)
        : shouldRegenerateSlug
        ? generateSlug(nextName, nextBrand)
        : existingProduct.slug

    if (
      products.some((p) => p.id !== existingProduct.id && p.slug === nextSlug)
    ) {
      nextSlug = `${nextSlug}-${Date.now()}`
    }

    const nextFeatures = hasOwn(body, "features")
      ? normalizeStringArray(body.features) ?? []
      : existingProduct.features ?? []

    const nextImages = hasOwn(body, "images")
      ? normalizeStringArray(body.images) ?? []
      : existingProduct.images ?? []

    const nextDetailContentHtml = hasOwn(body, "detailContentHtml")
      ? typeof body.detailContentHtml === "string"
        ? body.detailContentHtml
        : existingProduct.detailContentHtml ?? ""
      : existingProduct.detailContentHtml

    const nextDetailLayout = hasOwn(body, "detailLayout")
      ? body.detailLayout && typeof body.detailLayout === "object"
        ? (body.detailLayout as Product["detailLayout"])
        : undefined
      : existingProduct.detailLayout

    const nextLink =
      hasOwn(body, "link") && typeof body.link === "string" && body.link.trim()
        ? body.link
        : `/products/${nextSlug}`

    const nextCoverImage = hasOwn(body, "coverImage")
      ? typeof body.coverImage === "string" ? body.coverImage : undefined
      : existingProduct.coverImage

    const nextCoverImagePosition = hasOwn(body, "coverImagePosition")
      ? typeof body.coverImagePosition === "string" ? body.coverImagePosition : undefined
      : existingProduct.coverImagePosition

    products[productIndex] = {
      ...existingProduct,
      name: nextName,
      description: nextDescription,
      brand: nextBrand,
      slug: nextSlug,
      link: nextLink,
      coverImage: nextCoverImage,
      coverImagePosition: nextCoverImagePosition,
      features: nextFeatures,
      images: nextImages,
      detailContentHtml: nextDetailContentHtml,
      detailLayout: nextDetailLayout,
    }

    await saveProductsData(products)

    return NextResponse.json({
      success: true,
      message: "產品修改成功",
      product: products[productIndex],
    })
  } catch (error: unknown) {
    const err = error as Error
    if (err.message === "未授權") {
      return NextResponse.json(
        { error: "未授權訪問" },
        { status: 401 }
      )
    }

    console.error("Update product error:", {
      name: err?.name,
      message: err?.message,
      stackTop: err?.stack?.split("\n").slice(0, 3).join(" | "),
      productIdExists: !!debugProductId,
      bodyKeys: debugBodyKeys,
      hasName: debugBodyKeys.includes("name"),
      hasDescription: debugBodyKeys.includes("description"),
      hasBrand: debugBodyKeys.includes("brand"),
      hasDetailLayout: debugBodyKeys.includes("detailLayout"),
      hasDetailContentHtml: debugBodyKeys.includes("detailContentHtml"),
    })
    const isBlobError =
      err.message?.includes("BLOB_READ_WRITE_TOKEN") || err.message?.includes("生產環境請設定")
    const isValidationError =
      err.message?.toLowerCase().includes("invalid") ||
      err.message?.toLowerCase().includes("validation")
    const errorMessage = isBlobError
      ? "儲存失敗：請確認 BLOB_READ_WRITE_TOKEN 已設定"
      : isValidationError
      ? "修改產品失敗：資料格式不正確"
      : "修改產品失敗: " + (err.message || "未知錯誤")
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("id")

    if (!productId) {
      return NextResponse.json(
        { error: "請提供產品ID" },
        { status: 400 }
      )
    }

    // 讀取現有產品數據
    const products = (await getProductsData()) as Product[]

    // 刪除產品
    const filteredProducts = products.filter((p) => p.id !== productId)

    if (filteredProducts.length === products.length) {
      return NextResponse.json(
        { error: "找不到該產品" },
        { status: 404 }
      )
    }

    await saveProductsData(filteredProducts)

    return NextResponse.json({
      success: true,
      message: "產品刪除成功",
    })
  } catch (error: unknown) {
    const err = error as Error
    if (err.message === "未授權") {
      return NextResponse.json(
        { error: "未授權訪問" },
        { status: 401 }
      )
    }

    console.error("Delete product error:", error)
    const isBlobError =
      err.message?.includes("BLOB_READ_WRITE_TOKEN") || err.message?.includes("生產環境請設定")
    const errorMessage = isBlobError
      ? "儲存失敗：請確認 BLOB_READ_WRITE_TOKEN 已設定"
      : "刪除產品失敗: " + (err.message || "未知錯誤")
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
