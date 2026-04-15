import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
import { requireAuth } from "@/lib/upload-auth"
import { getBrandsData, saveBrandsData, getProductsData } from "@/lib/blob-data"
import type { Brand, BrandId } from "@/lib/products"

function generateBrandId(name: string): BrandId {
  // 將公司名稱轉換為 ID（大寫，移除特殊字符）
  return name
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "")
    .replace(/\//g, "")
    .toUpperCase() as BrandId
}

export async function GET() {
  try {
    const brands = (await getBrandsData()) as Brand[]

    return NextResponse.json({ brands }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    })
  } catch (error) {
    console.error("Get brands error:", error)
    return NextResponse.json(
      { error: "獲取公司列表失敗" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const body = await request.json()
    const { name, description, logoImage } = body

    if (!name || !description) {
      return NextResponse.json(
        { error: "請填寫公司名稱和介紹" },
        { status: 400 }
      )
    }

    // 讀取現有公司數據
    const brands = (await getBrandsData()) as Brand[]

    // 生成 ID
    let brandId = generateBrandId(name)
    
    // 檢查 ID 是否已存在
    let counter = 1
    while (brands.some((b) => b.id === brandId)) {
      brandId = `${generateBrandId(name)}${counter}` as BrandId
      counter++
    }

    // 創建新公司
    const newBrand: Brand = {
      id: brandId,
      name,
      description,
      logoImage: logoImage || `/brands/${brandId.toLowerCase()}.png`,
    }

    brands.push(newBrand)

    await saveBrandsData(brands)

    revalidatePath("/")
    revalidatePath("/products")

    return NextResponse.json({
      success: true,
      message: "公司新增成功",
      brand: newBrand,
    })
  } catch (error: unknown) {
    const err = error as Error
    if (err.message === "未授權") {
      return NextResponse.json(
        { error: "未授權訪問" },
        { status: 401 }
      )
    }

    console.error("Create brand error:", error)
    const isBlobError =
      err.message?.includes("BLOB_READ_WRITE_TOKEN") || err.message?.includes("生產環境請設定")
    const errorMessage = isBlobError
      ? "儲存失敗：請確認 BLOB_READ_WRITE_TOKEN 已設定"
      : "新增公司失敗: " + (err.message || "未知錯誤")
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get("id")

    if (!brandId) {
      return NextResponse.json(
        { error: "請提供公司ID" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, description, logoImage } = body

    if (!name || !description) {
      return NextResponse.json(
        { error: "請填寫公司名稱和介紹" },
        { status: 400 }
      )
    }

    // 讀取現有公司數據
    const brands = (await getBrandsData()) as Brand[]

    // 找到要修改的公司
    const brandIndex = brands.findIndex((b) => b.id === brandId)

    if (brandIndex === -1) {
      return NextResponse.json(
        { error: "找不到該公司" },
        { status: 404 }
      )
    }

    // 更新公司信息
    brands[brandIndex] = {
      ...brands[brandIndex],
      name,
      description,
      logoImage: logoImage || brands[brandIndex].logoImage,
    }

    await saveBrandsData(brands)

    revalidatePath("/")
    revalidatePath("/products")

    return NextResponse.json({
      success: true,
      message: "公司修改成功",
      brand: brands[brandIndex],
    })
  } catch (error: unknown) {
    const err = error as Error
    if (err.message === "未授權") {
      return NextResponse.json(
        { error: "未授權訪問" },
        { status: 401 }
      )
    }

    console.error("Update brand error:", error)
    const isBlobError =
      err.message?.includes("BLOB_READ_WRITE_TOKEN") || err.message?.includes("生產環境請設定")
    const errorMessage = isBlobError
      ? "儲存失敗：請確認 BLOB_READ_WRITE_TOKEN 已設定"
      : "修改公司失敗: " + (err.message || "未知錯誤")
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get("id")

    if (!brandId) {
      return NextResponse.json(
        { error: "請提供公司ID" },
        { status: 400 }
      )
    }

    // 讀取現有數據
    const brands = (await getBrandsData()) as Brand[]
    const products = (await getProductsData()) as { brand?: string }[]

    const hasProducts = products.some((p: any) => p.brand === brandId)

    if (hasProducts) {
      return NextResponse.json(
        { error: "無法刪除：該公司還有相關產品，請先刪除所有相關產品" },
        { status: 400 }
      )
    }

    // 刪除公司
    const filteredBrands = brands.filter((b) => b.id !== brandId)

    if (filteredBrands.length === brands.length) {
      return NextResponse.json(
        { error: "找不到該公司" },
        { status: 404 }
      )
    }

    await saveBrandsData(filteredBrands)

    revalidatePath("/")
    revalidatePath("/products")

    return NextResponse.json({
      success: true,
      message: "公司刪除成功",
    })
  } catch (error: unknown) {
    const err = error as Error
    if (err.message === "未授權") {
      return NextResponse.json(
        { error: "未授權訪問" },
        { status: 401 }
      )
    }

    console.error("Delete brand error:", error)
    const isBlobError =
      err.message?.includes("BLOB_READ_WRITE_TOKEN") || err.message?.includes("生產環境請設定")
    const errorMessage = isBlobError
      ? "儲存失敗：請確認 BLOB_READ_WRITE_TOKEN 已設定"
      : "刪除公司失敗: " + (err.message || "未知錯誤")
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
