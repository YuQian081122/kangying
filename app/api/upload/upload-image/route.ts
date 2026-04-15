import { NextRequest, NextResponse } from "next/server"
import { mkdir, writeFile } from "fs/promises"
import { join } from "path"
import { requireAuth } from "@/lib/upload-auth"
import { getUploadsDir } from "@/lib/blob-data"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
]

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const formData = await request.formData()
    const type = formData.get("type") as string
    const brandId = formData.get("brandId") as string
    const productSlug = formData.get("productSlug") as string
    const file = formData.get("file") as File

    if (!type || !file) {
      return NextResponse.json(
        { error: "缺少必要參數" },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "不支援的文件類型。僅支援 JPG, PNG, WebP, GIF 與 MP4 影片" },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "文件太大。最大大小為 10MB" },
        { status: 400 }
      )
    }

    const extension = file.name.split(".").pop() || "png"
    let relativePath: string

    if (type === "brand") {
      if (!brandId) {
        return NextResponse.json(
          { error: "缺少品牌ID" },
          { status: 400 }
        )
      }
      relativePath = `brands/${brandId.toLowerCase()}.${extension}`
    } else if (type === "product") {
      if (!brandId || !productSlug) {
        return NextResponse.json(
          { error: "缺少品牌ID或產品slug" },
          { status: 400 }
        )
      }
      const timestamp = Date.now()
      relativePath = `products/${brandId.toLowerCase()}/${productSlug}/${timestamp}.${extension}`
    } else {
      return NextResponse.json(
        { error: "無效的類型" },
        { status: 400 }
      )
    }

    const uploadsDir = getUploadsDir()
    const fullPath = join(uploadsDir, relativePath)
    const dir = fullPath.replace(/[/\\][^/\\]+$/, "")
    await mkdir(dir, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(fullPath, buffer)

    const publicUrl = `/api/uploads/${relativePath}`

    return NextResponse.json({
      success: true,
      path: publicUrl,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "未知錯誤"

    if (message === "未授權") {
      return NextResponse.json(
        { error: "未授權訪問" },
        { status: 401 }
      )
    }

    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "上傳失敗: " + message },
      { status: 500 }
    )
  }
}
