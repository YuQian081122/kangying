import { NextRequest, NextResponse } from "next/server"
import { readFile, stat } from "fs/promises"
import { join } from "path"
import { getUploadsDir } from "@/lib/blob-data"

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  svg: "image/svg+xml",
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params

    const sanitized = segments
      .map((s) => s.replace(/\.\./g, "").replace(/[<>:"|?*]/g, ""))
      .filter(Boolean)

    if (sanitized.length === 0) {
      return NextResponse.json({ error: "路徑無效" }, { status: 400 })
    }

    const filePath = join(getUploadsDir(), ...sanitized)

    const uploadsDir = getUploadsDir()
    if (!filePath.startsWith(uploadsDir)) {
      return NextResponse.json({ error: "禁止存取" }, { status: 403 })
    }

    const fileStat = await stat(filePath)
    if (!fileStat.isFile()) {
      return NextResponse.json({ error: "檔案不存在" }, { status: 404 })
    }

    const ext = filePath.split(".").pop()?.toLowerCase() || ""
    const contentType = MIME_TYPES[ext] || "application/octet-stream"

    const buffer = await readFile(filePath)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return NextResponse.json({ error: "檔案不存在" }, { status: 404 })
  }
}
