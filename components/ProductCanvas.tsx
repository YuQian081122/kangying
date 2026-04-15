"use client"

import { useState, useRef, useEffect, lazy, Suspense } from "react"
import { createPortal } from "react-dom"
import type { Product, ProductDetailLayout, ProductDetailElement } from "@/lib/products"
import { Loader2, Save, Type as TypeIcon, Image as ImageIcon, Video, Grid3x3, LayoutGrid, RectangleHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { CanvasGuideOverlay } from "@/components/canvas/CanvasGuideOverlay"

const LazyCanvasElementWrapper = lazy(() =>
  import("@/components/canvas/CanvasElementWrapper").then((m) => ({ default: m.CanvasElementWrapper }))
)

function StaticElement({ x, y, width, height, children }: {
  x: number; y: number; width: number; height: number; children: React.ReactNode
}) {
  return <div className="absolute" style={{ left: x, top: y, width, height }}>{children}</div>
}

const DESIGN_WIDTH = 1200

type ProductCanvasProps = {
  product: Product
  isAdmin: boolean
  scrollToCanvasIfHash?: boolean
}

function createEmptyLayout(): ProductDetailLayout {
  return {
    elements: [],
    canvasHeight: 600,
  }
}

export function ProductCanvas({ product, isAdmin, scrollToCanvasIfHash = false }: ProductCanvasProps) {
  const [layout, setLayout] = useState<ProductDetailLayout>(
    product.detailLayout ?? createEmptyLayout()
  )
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [uploading, setUploading] = useState(false)

  const [editing, setEditing] = useState(isAdmin)
  const [activeTextId, setActiveTextId] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [showGuides, setShowGuides] = useState(false)
  const showGuidesRef = useRef(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [videoUrlInput, setVideoUrlInput] = useState("")
  const [videoModalError, setVideoModalError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => { showGuidesRef.current = showGuides }, [showGuides])

  useEffect(() => {
    if (scrollToCanvasIfHash && typeof window !== "undefined" && window.location.hash === "#canvas" && isAdmin) {
      document.getElementById("canvas")?.scrollIntoView({ behavior: "smooth" })
      setEditing(true)
    }
  }, [scrollToCanvasIfHash, isAdmin])

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const w = el.offsetWidth
      setScale(w / DESIGN_WIDTH)
    })
    ro.observe(el)
    setScale(el.offsetWidth / DESIGN_WIDTH)
    return () => ro.disconnect()
  }, [])

  const updateElement = (id: string, partial: Partial<ProductDetailElement>) => {
    setLayout((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => (el.id === id ? { ...el, ...partial } : el)),
    }))
  }

  const removeElement = (id: string) => {
    setLayout((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== id),
    }))
  }

  const SNAP_THRESHOLD = 8
  const GRID_X = 100
  const GRID_Y = 50

  const snapPosition = (
    currentId: string, x: number, y: number, width: number, height: number,
    elements: ProductDetailElement[]
  ): { x: number; y: number } => {
    const myR = x + width, myB = y + height
    const myCX = x + width / 2, myCY = y + height / 2

    let bestX = x, bestY = y
    let bestDistX = SNAP_THRESHOLD + 1, bestDistY = SNAP_THRESHOLD + 1

    const tryX = (snapVal: number, dist: number) => {
      if (dist <= SNAP_THRESHOLD && dist < bestDistX) { bestDistX = dist; bestX = snapVal }
    }
    const tryY = (snapVal: number, dist: number) => {
      if (dist <= SNAP_THRESHOLD && dist < bestDistY) { bestDistY = dist; bestY = snapVal }
    }

    for (const el of elements) {
      if (el.id === currentId) continue
      const oL = el.x, oR = el.x + el.width, oT = el.y, oB = el.y + el.height
      const oCX = el.x + el.width / 2, oCY = el.y + el.height / 2

      tryX(oL, Math.abs(x - oL)); tryX(oR - width, Math.abs(x - oR))
      tryX(oL - width, Math.abs(myR - oL)); tryX(oR - width, Math.abs(myR - oR))
      tryX(oCX - width / 2, Math.abs(myCX - oCX))

      tryY(oT, Math.abs(y - oT)); tryY(oB - height, Math.abs(y - oB))
      tryY(oT - height, Math.abs(myB - oT)); tryY(oB - height, Math.abs(myB - oB))
      tryY(oCY - height / 2, Math.abs(myCY - oCY))
    }

    if (showGuidesRef.current && editing) {
      for (let gx = 0; gx <= DESIGN_WIDTH; gx += GRID_X) {
        tryX(gx, Math.abs(x - gx))
        tryX(gx - width, Math.abs(myR - gx))
        tryX(gx - width / 2, Math.abs(myCX - gx))
      }
      for (let gy = 0; gy <= canvasHeight; gy += GRID_Y) {
        tryY(gy, Math.abs(y - gy))
        tryY(gy - height, Math.abs(myB - gy))
        tryY(gy - height / 2, Math.abs(myCY - gy))
      }
    }

    return {
      x: bestDistX <= SNAP_THRESHOLD ? bestX : x,
      y: bestDistY <= SNAP_THRESHOLD ? bestY : y,
    }
  }

  const duplicateElement = (id: string) => {
    const source = layout.elements.find((el) => el.id === id)
    if (!source) return
    const prefix = source.type === "image" ? "img" : source.type === "video" ? "video" : "text"
    const copy: ProductDetailElement = {
      ...JSON.parse(JSON.stringify(source)),
      id: `${prefix}-${Date.now()}`,
      x: source.x + 20,
      y: source.y + 20,
    }
    setLayout((prev) => ({ ...prev, elements: [...prev.elements, copy] }))
  }

  const addTextBlock = () => {
    setLayout((prev) => ({ ...prev, elements: [...prev.elements, {
      id: `text-${Date.now()}`, type: "paragraph" as const,
      x: 40, y: 40, width: 500, height: 180,
      props: { text: "雙擊編輯文字", fontSize: 24, color: "#ffffff" },
    }] }))
  }

  const addCardBlock = () => {
    setLayout((prev) => ({ ...prev, elements: [...prev.elements, {
      id: `card-${Date.now()}`, type: "card" as const,
      x: 40, y: 40, width: 280, height: 180,
      props: { title: "標題", description: "在此輸入描述內容", titleFontSize: 20, descFontSize: 14, titleColor: "#ffffff", descColor: "#a1a1aa" },
    }] }))
  }

  const addButtonBlock = () => {
    setLayout((prev) => ({ ...prev, elements: [...prev.elements, {
      id: `btn-${Date.now()}`, type: "button" as const,
      x: 40, y: 40, width: 200, height: 50,
      props: { text: "按鈕文字", fontSize: 16, color: "#ffffff" },
    }] }))
  }

  // 單一按鈕上傳圖片或影片（依檔案型別決定）
  const handleInsertImage = async () => {
    if (!product.brand || !product.slug) {
      setMessage({
        type: "error",
        text: "找不到產品品牌或網址 slug，無法上傳圖片。",
      })
      return
    }

    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/jpeg,image/jpg,image/png,image/webp,image/gif,video/mp4"

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      setUploading(true)
      setMessage(null)
      try {
        const formData = new FormData()
        formData.append("type", "product")
        formData.append("brandId", product.brand)
        formData.append("productSlug", product.slug)
        formData.append("file", file)

        const res = await fetch("/api/upload/upload-image", {
          method: "POST",
          credentials: "include",
          body: formData,
        })

        const data = await res.json()

        if (!res.ok || !data?.path) {
          throw new Error(data?.error || "檔案上傳失敗")
        }

        const isVideo = file.type.startsWith("video/")
        const id = `${isVideo ? "video" : "img"}-${Date.now()}`

        const element: ProductDetailElement = isVideo
          ? {
              id,
              type: "video",
              x: 80,
              y: 80,
              width: 560,
              height: 315,
              props: {
                src: data.path,
                provider: "direct",
              },
            }
          : {
              id,
              type: "image",
              x: 80,
              y: 80,
              width: 320,
              height: 240,
              props: {
                src: data.path,
              },
            }
        setLayout((prev) => ({ ...prev, elements: [...prev.elements, element] }))
      } catch (error) {
        const msg =
          error instanceof Error
            ? error.message
            : "檔案上傳失敗，請稍後再試或聯絡管理員。"
        setMessage({ type: "error", text: msg })
      } finally {
        setUploading(false)
      }
    }

    input.click()
  }

  type MediaKind = "image" | "video"

  const parseMediaUrl = (
    url: string
  ): { kind: MediaKind; src: string; provider?: "youtube" | "vimeo" | "direct" } | null => {
    const u = url.trim()
    if (!u) return null

    // 補齊協定（若缺少）
    let normalized = u
    if (!/^https?:\/\//i.test(u)) {
      normalized = `https://${u}`
    }

    // 先判斷是否為圖片（含 GIF）
    if (/\.(jpe?g|png|webp|gif)(\?|$)/i.test(normalized)) {
      return { kind: "image", src: normalized }
    }

    // YouTube: watch, youtu.be, shorts, embed, m.youtube
    const ytWatch = normalized.match(/(?:youtube\.com\/watch\?[^#]*v=)([a-zA-Z0-9_-]{11})/)
    if (ytWatch)
      return {
        kind: "video",
        src: `https://www.youtube.com/embed/${ytWatch[1]}`,
        provider: "youtube",
      }
    const ytShort = normalized.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/i)
    if (ytShort)
      return {
        kind: "video",
        src: `https://www.youtube.com/embed/${ytShort[1]}`,
        provider: "youtube",
      }
    const ytShorts = normalized.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i)
    if (ytShorts)
      return {
        kind: "video",
        src: `https://www.youtube.com/embed/${ytShorts[1]}`,
        provider: "youtube",
      }
    const ytEmbed = normalized.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/i)
    if (ytEmbed)
      return {
        kind: "video",
        src: `https://www.youtube.com/embed/${ytEmbed[1]}`,
        provider: "youtube",
      }
    // Vimeo
    const vimeoMatch = normalized.match(/vimeo\.com\/(?:video\/)?(\d+)/i)
    if (vimeoMatch)
      return {
        kind: "video",
        src: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
        provider: "vimeo",
      }
    const vimeoPlayer = normalized.match(/player\.vimeo\.com\/video\/(\d+)/i)
    if (vimeoPlayer)
      return {
        kind: "video",
        src: `https://player.vimeo.com/video/${vimeoPlayer[1]}`,
        provider: "vimeo",
      }
    // Direct mp4 / webm / ogg
    if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(normalized)) {
      return { kind: "video", src: normalized, provider: "direct" }
    }
    // Fallback: 僅接受 http(s) 連結
    if (/^https?:\/\//i.test(normalized)) {
      return { kind: "video", src: normalized, provider: "direct" }
    }
    return null
  }

  const handleOpenVideoModal = () => {
    setVideoUrlInput("")
    setVideoModalError(null)
    setShowVideoModal(true)
  }

  const handleConfirmVideo = () => {
    const input = videoUrlInput.trim()
    if (!input) {
      setVideoModalError("請輸入圖片或影片連結")
      return
    }
    const parsed = parseMediaUrl(input)
    if (!parsed || !parsed.src) {
      setVideoModalError("無法解析此連結。請貼上完整的 YouTube、Vimeo 或 mp4 網址")
      return
    }
    const { kind, src, provider } = parsed
    const element: ProductDetailElement =
      kind === "image"
        ? {
            id: `img-${Date.now()}`,
            type: "image",
            x: 80,
            y: 80,
            width: 320,
            height: 240,
            props: { src },
          }
        : {
            id: `video-${Date.now()}`,
            type: "video",
            x: 80,
            y: 80,
            width: 560,
            height: 315,
            props: { src, provider: provider ?? "direct" },
          }
    setLayout((prev) => ({ ...prev, elements: [...prev.elements, element] }))
    setShowVideoModal(false)
    setVideoUrlInput("")
    setVideoModalError(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/upload/products?id=${product.id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          features: product.features ?? [],
          images: product.images ?? [],
          brand: product.brand,
          detailContentHtml: product.detailContentHtml ?? "",
          detailLayout: layout,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "儲存畫布失敗")
      }

      setMessage({ type: "success", text: "畫布已儲存成功，前台頁面已更新。" })
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "儲存畫布失敗，請稍後再試或聯絡管理員。"
      setMessage({ type: "error", text: msg })
    } finally {
      setIsSaving(false)
    }
  }

  const renderElementContent = (el: ProductDetailElement) => {
    if (el.type === "image") {
      const src = el.props?.src as string | undefined
      if (!src) {
        return (
          <div className="flex h-full w-full items-center justify-center text-xs text-red-400">
            圖片來源遺失
          </div>
        )
      }
      return (
        <img
          src={src}
          alt={product.name}
          className="h-full w-full object-contain"
          draggable={false}
        />
      )
    }

    if (el.type === "video") {
      const src = el.props?.src as string | undefined
      const provider = el.props?.provider as "youtube" | "vimeo" | "direct" | undefined
      if (!src) {
        return (
          <div className="flex h-full w-full items-center justify-center text-xs text-red-400">
            影片來源遺失
          </div>
        )
      }
      if (provider === "youtube" || provider === "vimeo" || src.includes("youtube.com/embed") || src.includes("vimeo.com/video")) {
        return (
          <iframe
            src={src}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="影片"
          />
        )
      }
      return (
        <video src={src} controls className="h-full w-full object-contain" playsInline>
          您的瀏覽器不支援影片播放
        </video>
      )
    }

    if (el.type === "card") {
      const { title, description, titleFontSize, descFontSize, titleColor, descColor } = el.props ?? {}
      if (editing && isAdmin) {
        return (
          <div className="canvas-no-drag h-full w-full rounded-lg border border-border/60 bg-card shadow-sm p-4 flex flex-col gap-2 overflow-hidden">
            <input type="text" aria-label="卡片標題" value={title || ""} placeholder="標題\u2026"
              onChange={(e) => updateElement(el.id, { props: { ...el.props, title: e.target.value } })}
              className="bg-transparent outline-none font-semibold leading-snug focus-visible:ring-1 focus-visible:ring-primary rounded px-1"
              style={{ fontSize: titleFontSize || 20, color: titleColor || "#ffffff" }} />
            <textarea aria-label="卡片描述" value={description || ""} placeholder="描述\u2026" rows={3}
              onChange={(e) => updateElement(el.id, { props: { ...el.props, description: e.target.value } })}
              className="bg-transparent outline-none leading-relaxed resize-none flex-1 focus-visible:ring-1 focus-visible:ring-primary rounded px-1"
              style={{ fontSize: descFontSize || 14, color: descColor || "#a1a1aa" }} />
          </div>
        )
      }
      return (
        <div className="h-full w-full rounded-lg border border-border/60 bg-card shadow-sm p-5 flex flex-col gap-2 overflow-hidden transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40">
          <h3 className="font-semibold leading-snug" style={{ fontSize: titleFontSize || 20, color: titleColor || "#ffffff" }}>{title || ""}</h3>
          <p className="leading-relaxed whitespace-pre-line" style={{ fontSize: descFontSize || 14, color: descColor || "#a1a1aa" }}>{description || ""}</p>
        </div>
      )
    }

    if (el.type === "button") {
      const { text, fontSize, color, background } = el.props ?? {}
      if (editing && isAdmin) {
        return (
          <div className="canvas-no-drag h-full w-full flex items-center justify-center">
            <input type="text" aria-label="按鈕文字" value={text || ""} placeholder="按鈕文字\u2026"
              onChange={(e) => updateElement(el.id, { props: { ...el.props, text: e.target.value } })}
              className="bg-transparent outline-none font-medium text-center rounded-md px-4 py-2 w-full focus-visible:ring-1 focus-visible:ring-primary"
              style={{ fontSize: fontSize || 16, color: color || "#ffffff", background: background || "linear-gradient(to right, hsl(221.2 83.2% 53.3%), hsl(262.1 83.3% 57.8%))", borderRadius: "0.375rem" }} />
          </div>
        )
      }
      return (
        <div className="h-full w-full flex items-center justify-center">
          <div className="inline-flex items-center justify-center rounded-md px-6 py-2 font-medium shadow-sm"
            style={{ fontSize: fontSize || 16, color: color || "#ffffff", background: background || "linear-gradient(to right, hsl(221.2 83.2% 53.3%), hsl(262.1 83.3% 57.8%))" }}>
            {text || "按鈕"}
          </div>
        </div>
      )
    }

    type ContentBlock = { text: string; fontSize?: number; color?: string; bold?: boolean; italic?: boolean; underline?: boolean }
    const content: ContentBlock[] = Array.isArray(el.props?.content)
      ? el.props.content.map((b: Partial<ContentBlock>) => ({
          text: b.text ?? "",
          fontSize: b.fontSize ?? 16,
          color: b.color ?? "#ffffff",
          bold: Boolean(b.bold),
          italic: Boolean(b.italic),
          underline: Boolean(b.underline),
        }))
      : [{
          text: el.props?.text ?? "",
          fontSize: el.props?.fontSize ?? 16,
          color: el.props?.color ?? "#ffffff",
          bold: Boolean(el.props?.bold),
          italic: Boolean(el.props?.italic),
          underline: Boolean(el.props?.underline),
        }]

    const updateContent = (next: ContentBlock[]) => {
      updateElement(el.id, { props: { ...el.props, content: next } })
    }
    const updateBlock = (index: number, partial: Partial<ContentBlock>) => {
      const next = [...content]
      next[index] = { ...next[index], ...partial }
      updateContent(next)
    }

    if (editing && isAdmin) {
      return (
        <div className="canvas-no-drag h-full w-full overflow-auto p-2 space-y-1">
          {content.map((block, idx) => (
            <div key={idx} className="flex gap-1 items-center">
              <label className="sr-only" htmlFor={`fs-${el.id}-${idx}`}>字級</label>
              <input
                id={`fs-${el.id}-${idx}`}
                type="number"
                aria-label="字級"
                min={8}
                max={72}
                value={block.fontSize}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10)
                  if (!Number.isNaN(v)) updateBlock(idx, { fontSize: Math.min(72, Math.max(8, v)) })
                }}
                className="w-12 h-6 rounded border bg-background/80 px-1 text-[10px] text-center"
              />
              <label className="sr-only" htmlFor={`txt-${el.id}-${idx}`}>文字內容</label>
              <input
                id={`txt-${el.id}-${idx}`}
                type="text"
                aria-label="文字內容"
                value={block.text}
                onChange={(e) => updateBlock(idx, { text: e.target.value })}
                onFocus={() => setActiveTextId(el.id)}
                className="flex-1 min-w-0 bg-transparent text-white outline-none text-sm focus-visible:ring-1 focus-visible:ring-primary"
                style={{
                  fontSize: block.fontSize,
                  color: block.color,
                  fontWeight: block.bold ? "700" : "400",
                  fontStyle: block.italic ? "italic" : "normal",
                  textDecoration: block.underline ? "underline" : "none",
                  letterSpacing: "0.05em",
                }}
                placeholder="輸入文字\u2026"
              />
              {content.length > 1 && (
                <button
                  type="button"
                  aria-label="刪除此行"
                  onClick={() => updateContent(content.filter((_, i) => i !== idx))}
                  className="text-red-400 hover:text-red-500 text-[10px] px-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400 rounded"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => updateContent([...content, { text: "", fontSize: 16, color: content[0]?.color ?? "#ffffff", bold: false, italic: false, underline: false }])}
            className="text-[10px] text-primary/80 hover:text-primary"
          >
            + 新增一行
          </button>
        </div>
      )
    }

    return (
      <div className="h-full w-full overflow-auto p-2 space-y-0.5">
        {content.map((block, idx) => (
          <div
            key={idx}
            className="leading-relaxed"
            style={{
              fontSize: block.fontSize,
              color: block.color,
              fontWeight: block.bold ? "700" : "400",
              fontStyle: block.italic ? "italic" : "normal",
              textDecoration: block.underline ? "underline" : "none",
              letterSpacing: "0.05em",
            }}
          >
            {block.text}
          </div>
        ))}
      </div>
    )
  }

  // 未登入訪客且尚未設定任何元素時，完全不顯示畫布區域
  if (!isAdmin && layout.elements.length === 0) {
    return null
  }

  const canvasHeight = layout.canvasHeight && layout.canvasHeight > 0 ? layout.canvasHeight : 600

  const containerClass = isAdmin
    ? "relative w-full rounded-lg border border-dashed border-primary/40 bg-muted/10 overflow-hidden"
    : "relative w-full overflow-visible"

  return (
    <div className="space-y-3">
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2 mb-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            {editing ? "關閉編輯模式" : "進入編輯模式"}
          </button>
          <button
            type="button"
            onClick={addTextBlock}
            disabled={!editing}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            <TypeIcon className="h-3 w-3" />
            文字
          </button>
          <button
            type="button"
            onClick={addCardBlock}
            disabled={!editing}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            <LayoutGrid className="h-3 w-3" />
            卡片
          </button>
          <button
            type="button"
            onClick={addButtonBlock}
            disabled={!editing}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            <RectangleHorizontal className="h-3 w-3" />
            按鈕
          </button>
          <button
            type="button"
            onClick={handleInsertImage}
            disabled={!editing || uploading}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            <ImageIcon className="h-3 w-3" />
            {uploading ? "檔案上傳中\u2026" : "上傳圖片／影片"}
          </button>
          <button
            type="button"
            onClick={handleOpenVideoModal}
            disabled={!editing}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            <Video className="h-3 w-3" />
            貼上影片連結
          </button>
          <button
            type="button"
            onClick={() => setShowGuides((v) => !v)}
            disabled={!editing}
            className={cn("inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-50", showGuides ? "bg-primary/15 border-primary/40 text-primary" : "hover:bg-muted")}
          >
            <Grid3x3 className="h-3 w-3" />
            輔助線
          </button>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <label htmlFor="canvas-height">畫布高度</label>
            <input
              id="canvas-height"
              type="number"
              min={300}
              max={10000}
              step={50}
              value={canvasHeight}
              onChange={(e) => {
                const raw = parseInt(e.target.value, 10)
                if (Number.isNaN(raw)) return
                const clamped = Math.min(Math.max(raw, 300), 10000)
                setLayout((prev) => ({
                  ...prev,
                  canvasHeight: clamped,
                }))
              }}
              className="h-7 w-20 rounded-md border bg-background px-2 text-xs"
            />
            <span>px</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>文字樣式</span>
            <button
              type="button"
              aria-label="粗體"
              disabled={!editing}
              onClick={() => {
                if (!activeTextId) return
                const target = layout.elements.find((el) => el.id === activeTextId && el.type !== "image" && el.type !== "video")
                if (!target) return
                const arr = target.props?.content
                const current = arr?.[0]?.bold ?? target.props?.bold
                const nextBold = !current
                updateElement(activeTextId, {
                  props: arr
                    ? { ...target.props, content: arr.map((b: Record<string, unknown>) => ({ ...b, bold: nextBold })) }
                    : { ...target.props, bold: nextBold },
                })
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border bg-background text-[11px] font-bold disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              B
            </button>
            <button
              type="button"
              aria-label="斜體"
              disabled={!editing}
              onClick={() => {
                if (!activeTextId) return
                const target = layout.elements.find((el) => el.id === activeTextId && el.type !== "image" && el.type !== "video")
                if (!target) return
                const arr = target.props?.content
                const current = arr?.[0]?.italic ?? target.props?.italic
                const nextItalic = !current
                updateElement(activeTextId, {
                  props: arr
                    ? { ...target.props, content: arr.map((b: Record<string, unknown>) => ({ ...b, italic: nextItalic })) }
                    : { ...target.props, italic: nextItalic },
                })
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border bg-background text-[11px] italic disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              I
            </button>
            <button
              type="button"
              aria-label="底線"
              disabled={!editing}
              onClick={() => {
                if (!activeTextId) return
                const target = layout.elements.find((el) => el.id === activeTextId && el.type !== "image" && el.type !== "video")
                if (!target) return
                const arr = target.props?.content
                const current = arr?.[0]?.underline ?? target.props?.underline
                const nextUnderline = !current
                updateElement(activeTextId, {
                  props: arr
                    ? { ...target.props, content: arr.map((b: Record<string, unknown>) => ({ ...b, underline: nextUnderline })) }
                    : { ...target.props, underline: nextUnderline },
                })
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border bg-background text-[11px] underline disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              U
            </button>
            <input
              type="color"
              aria-label="文字顏色"
              disabled={!editing}
              onChange={(e) => {
                if (!activeTextId) return
                const target = layout.elements.find((el) => el.id === activeTextId && el.type !== "image" && el.type !== "video")
                if (!target) return
                const val = e.target.value
                const arr = target.props?.content
                updateElement(activeTextId, {
                  props: arr
                    ? { ...target.props, content: arr.map((b: Record<string, unknown>) => ({ ...b, color: val })) }
                    : { ...target.props, color: val },
                })
              }}
              className="h-7 w-8 cursor-pointer rounded border bg-background p-0 disabled:opacity-40"
            />
            <input
              type="number"
              aria-label="字級大小"
              min={10}
              max={72}
              step={1}
              placeholder="字級"
              disabled={!editing}
              onChange={(e) => {
                if (!activeTextId) return
                const raw = parseInt(e.target.value, 10)
                if (Number.isNaN(raw)) return
                const size = Math.min(Math.max(raw, 10), 72)
                const target = layout.elements.find((el) => el.id === activeTextId && el.type !== "image" && el.type !== "video")
                if (!target) return
                const arr = target.props?.content
                updateElement(activeTextId, {
                  props: arr
                    ? { ...target.props, content: arr.map((b: Record<string, unknown>) => ({ ...b, fontSize: size })) }
                    : { ...target.props, fontSize: size },
                })
              }}
              className="h-7 w-16 rounded-md border bg-background px-1 text-[11px] disabled:opacity-40"
            />
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!editing || isSaving}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                儲存中\u2026
              </>
            ) : (
              <>
                <Save className="h-3 w-3" />
                儲存畫布
              </>
            )}
          </button>
        </div>
      )}

      {message && (
        <div
          className={`rounded-md border px-3 py-2 text-xs ${
            message.type === "success"
              ? "border-green-500 text-green-500"
              : "border-red-500 text-red-500"
          }`}
        >
          {message.text}
        </div>
      )}

      {showVideoModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-modal-title"
          >
            <div
              className="w-full max-w-md rounded-lg border border-border bg-white p-5 shadow-xl dark:bg-zinc-900"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="video-modal-title" className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                插入圖片 / 影片
              </h3>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                貼上圖片（含 GIF）或 YouTube / Vimeo / mp4 連結
              </p>
              <input
                type="text"
                inputMode="url"
                value={videoUrlInput}
                onChange={(e) => {
                  setVideoUrlInput(e.target.value)
                  setVideoModalError(null)
                }}
                placeholder="https://www.youtube.com/watch?v=\u2026"
                autoComplete="off"
                className="mb-2 block w-full min-h-[44px] rounded-md border-2 border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                onKeyDown={(e) => e.key === "Enter" && handleConfirmVideo()}
                autoFocus
              />
              {videoModalError && (
                <p className="mb-2 text-sm text-red-500">{videoModalError}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowVideoModal(false)
                    setVideoModalError(null)
                  }}
                  className="rounded-md border border-zinc-300 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmVideo}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  插入
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <div
        ref={canvasRef}
        className={containerClass}
        style={{ height: canvasHeight * scale, overflow: "hidden" }}
      >
        {/* Scale 放在外層，內層設計空間不套用 transform，避免 react-rnd 座標錯亂 */}
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: DESIGN_WIDTH,
            height: canvasHeight,
            transform: `scale(${scale})`,
          }}
        >
          <div
            className="relative"
            style={{ width: DESIGN_WIDTH, height: canvasHeight }}
          >
            {layout.elements.map((el) => (
              editing && isAdmin ? (
                <Suspense key={el.id} fallback={<StaticElement x={el.x} y={el.y} width={el.width} height={el.height}>{renderElementContent(el)}</StaticElement>}>
                  <LazyCanvasElementWrapper
                    x={el.x} y={el.y} width={el.width} height={el.height}
                    isEditable={true}
                    useDragHandle={el.type !== "image"}
                    scale={scale}
                    onChange={(next) => {
                      const snapped = snapPosition(el.id, next.x, next.y, next.width, next.height, layout.elements)
                      updateElement(el.id, { ...next, x: snapped.x, y: snapped.y })
                    }}
                    onRemove={() => removeElement(el.id)}
                    onCopy={() => duplicateElement(el.id)}
                  >
                    {renderElementContent(el)}
                  </LazyCanvasElementWrapper>
                </Suspense>
              ) : (
                <StaticElement key={el.id} x={el.x} y={el.y} width={el.width} height={el.height}>
                  {renderElementContent(el)}
                </StaticElement>
              )
          ))}
            {layout.elements.length === 0 && (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                {isAdmin && editing
                  ? "目前畫布是空的，請使用上方按鈕新增文字方塊或插入圖片。"
                  : "目前尚未設定產品下方內容。"}
              </div>
            )}
            {showGuides && editing && <CanvasGuideOverlay height={canvasHeight} />}
          </div>
        </div>
      </div>
    </div>
  )
}

