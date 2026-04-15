import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/upload-auth"
import { getPageLayouts, getPageLayout, savePageLayout, deletePageLayout } from "@/lib/blob-data"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (key) {
      const layout = await getPageLayout(key)
      return NextResponse.json({ layout }, {
        headers: { "Cache-Control": "no-store" },
      })
    }

    await requireAuth()
    const layouts = await getPageLayouts()
    return NextResponse.json({ layouts }, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "未知錯誤"
    if (message === "未授權") {
      return NextResponse.json({ error: "未授權訪問" }, { status: 401 })
    }
    console.error("Get page layouts error:", error)
    return NextResponse.json({ error: "讀取頁面畫布失敗" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (!key) {
      return NextResponse.json({ error: "缺少 key 參數" }, { status: 400 })
    }

    const body = await request.json()
    const { layout } = body

    if (!layout || typeof layout !== "object") {
      return NextResponse.json({ error: "缺少 layout 資料" }, { status: 400 })
    }

    await savePageLayout(key, layout)

    return NextResponse.json({ success: true, message: "頁面畫布已儲存" })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "未知錯誤"
    if (message === "未授權") {
      return NextResponse.json({ error: "未授權訪問" }, { status: 401 })
    }
    console.error("Save page layout error:", error)
    return NextResponse.json({ error: "儲存頁面畫布失敗: " + message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (!key) {
      return NextResponse.json({ error: "缺少 key 參數" }, { status: 400 })
    }

    await deletePageLayout(key)

    return NextResponse.json({ success: true, message: "頁面畫布已刪除" })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "未知錯誤"
    if (message === "未授權") {
      return NextResponse.json({ error: "未授權訪問" }, { status: 401 })
    }
    console.error("Delete page layout error:", error)
    return NextResponse.json({ error: "刪除頁面畫布失敗" }, { status: 500 })
  }
}
