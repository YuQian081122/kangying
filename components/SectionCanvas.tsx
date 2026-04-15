"use client"

import { useState, useRef, useEffect, lazy, Suspense, type ReactNode } from "react"
import { createPortal } from "react-dom"
import type { ProductDetailLayout, ProductDetailElement } from "@/lib/products"
import { Loader2, Save, Type as TypeIcon, Image as ImageIcon, Video, Pencil, X, Grid3x3, LayoutGrid, RectangleHorizontal, Undo2, Redo2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { CanvasGuideOverlay } from "@/components/canvas/CanvasGuideOverlay"

const LazyCanvasElementWrapper = lazy(() =>
  import("@/components/canvas/CanvasElementWrapper").then((m) => ({ default: m.CanvasElementWrapper }))
)

const DESIGN_WIDTH = 1200

function StaticElement({ x, y, width, height, children }: {
  x: number; y: number; width: number; height: number; children: ReactNode
}) {
  return <div className="absolute" style={{ left: x, top: y, width, height }}>{children}</div>
}

type SectionCanvasProps = {
  sectionKey: string
  isAdmin: boolean
  fallback?: ReactNode
  initialLayout?: ProductDetailLayout | null
  defaultHeight?: number
  defaultElements?: ProductDetailElement[]
  uploadContext?: { type: string; brandId: string; productSlug: string }
}

function createEmptyLayout(height = 600): ProductDetailLayout {
  return { elements: [], canvasHeight: height }
}

function renderElementContentStatic(el: ProductDetailElement) {
  if (el.type === "image") {
    const src = el.props?.src as string | undefined
    if (!src) return <div className="flex h-full w-full items-center justify-center text-xs text-red-400">圖片來源遺失</div>
    return <img src={src} alt="" className="h-full w-full object-contain" draggable={false} />
  }
  if (el.type === "video") {
    const src = el.props?.src as string | undefined
    const provider = el.props?.provider as string | undefined
    if (!src) return <div className="flex h-full w-full items-center justify-center text-xs text-red-400">影片來源遺失</div>
    if (provider === "youtube" || provider === "vimeo" || src.includes("youtube.com/embed") || src.includes("vimeo.com/video")) {
      return <iframe src={src} className="h-full w-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="影片" />
    }
    return <video src={src} controls className="h-full w-full object-contain" playsInline>您的瀏覽器不支援影片播放</video>
  }
  if (el.type === "card") {
    const { title, description, titleFontSize, descFontSize, titleColor, descColor } = el.props ?? {}
    return (
      <div className="h-full w-full rounded-lg border border-border/60 bg-card shadow-sm p-5 flex flex-col gap-2 overflow-hidden transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40">
        <h3 className="font-semibold leading-snug" style={{ fontSize: titleFontSize || 20, color: titleColor || "#ffffff" }}>{title || ""}</h3>
        <p className="leading-relaxed whitespace-pre-line" style={{ fontSize: descFontSize || 14, color: descColor || "#a1a1aa" }}>{description || ""}</p>
      </div>
    )
  }
  if (el.type === "button") {
    const { text, fontSize, color, background } = el.props ?? {}
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
    ? el.props.content.map((b: Partial<ContentBlock>) => ({ text: b.text ?? "", fontSize: b.fontSize ?? 24, color: b.color ?? "#ffffff", bold: Boolean(b.bold), italic: Boolean(b.italic), underline: Boolean(b.underline) }))
    : [{ text: el.props?.text ?? "", fontSize: el.props?.fontSize ?? 24, color: el.props?.color ?? "#ffffff", bold: Boolean(el.props?.bold), italic: Boolean(el.props?.italic), underline: Boolean(el.props?.underline) }]

  const wrapStyle: React.CSSProperties = {}
  if (el.props?.background) wrapStyle.background = el.props.background
  if (el.props?.borderRadius) wrapStyle.borderRadius = el.props.borderRadius
  if (el.props?.padding) wrapStyle.padding = el.props.padding
  if (el.props?.border) { wrapStyle.border = "1px solid hsl(240 3.7% 15.9%)"; wrapStyle.borderRadius = wrapStyle.borderRadius || "0.5rem" }

  return (
    <div className="h-full w-full overflow-auto p-2 space-y-0.5" style={wrapStyle}>
      {content.map((block, idx) => (
        <div key={idx} className="leading-relaxed"
          style={{ fontSize: block.fontSize, color: block.color, fontWeight: block.bold ? "700" : "400", fontStyle: block.italic ? "italic" : "normal", textDecoration: block.underline ? "underline" : "none" }}>
          {block.text}
        </div>
      ))}
    </div>
  )
}

function ReadOnlyCanvas({ layout, defaultHeight, canvasRef, scale }: {
  layout: ProductDetailLayout; defaultHeight: number; canvasRef: React.RefObject<HTMLDivElement>; scale: number
}) {
  const h = layout.canvasHeight || defaultHeight
  return (
    <div ref={canvasRef} className="relative w-full overflow-hidden" style={{ height: h * scale }}>
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: DESIGN_WIDTH, height: h, transform: `scale(${scale})` }}>
        <div className="relative" style={{ width: DESIGN_WIDTH, height: h }}>
          {layout.elements.map((el) => (
            <StaticElement key={el.id} x={el.x} y={el.y} width={el.width} height={el.height}>
              {renderElementContentStatic(el)}
            </StaticElement>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SectionCanvas({
  sectionKey, isAdmin, fallback, initialLayout, defaultHeight = 600, defaultElements, uploadContext,
}: SectionCanvasProps) {
  const [layout, setLayout] = useState<ProductDetailLayout>(initialLayout ?? createEmptyLayout(defaultHeight))
  const [editing, setEditing] = useState(false)
  const [scale, setScale] = useState(1)
  const canvasRef = useRef<HTMLDivElement>(null)
  const hasCanvasContent = layout.elements.length > 0

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setScale(el.offsetWidth / DESIGN_WIDTH))
    ro.observe(el)
    setScale(el.offsetWidth / DESIGN_WIDTH)
    return () => ro.disconnect()
  }, [editing, hasCanvasContent])

  const handleStartEditing = () => {
    if (!hasCanvasContent && defaultElements && defaultElements.length > 0) {
      setLayout((prev) => ({ ...prev, elements: defaultElements }))
    }
    setEditing(true)
  }

  if (!isAdmin && !hasCanvasContent) return <>{fallback}</>

  if (!editing) {
    return (
      <div className="relative group">
        {hasCanvasContent
          ? <ReadOnlyCanvas layout={layout} defaultHeight={defaultHeight} canvasRef={canvasRef} scale={scale} />
          : fallback}
        {isAdmin && (
          <button type="button" onClick={handleStartEditing}
            className="absolute top-2 right-2 z-20 inline-flex items-center gap-1.5 rounded-md bg-primary/90 px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-lg hover:bg-primary opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <Pencil className="h-3 w-3" /> 編輯此區段
          </button>
        )}
      </div>
    )
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}>
      <SectionCanvasEditor
        sectionKey={sectionKey} layout={layout} setLayout={setLayout}
        setEditing={setEditing} canvasRef={canvasRef} scale={scale}
        defaultHeight={defaultHeight} uploadContext={uploadContext}
        fallback={fallback}
      />
    </Suspense>
  )
}

function SectionCanvasEditor({ sectionKey, layout, setLayout, setEditing, canvasRef, scale, defaultHeight, uploadContext, fallback }: {
  sectionKey: string
  layout: ProductDetailLayout
  setLayout: React.Dispatch<React.SetStateAction<ProductDetailLayout>>
  setEditing: (v: boolean) => void
  canvasRef: React.RefObject<HTMLDivElement>
  scale: number
  defaultHeight: number
  uploadContext?: { type: string; brandId: string; productSlug: string }
  fallback?: ReactNode
}) {
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [activeTextId, setActiveTextId] = useState<string | null>(null)
  const [showGuides, setShowGuides] = useState(false)
  const showGuidesRef = useRef(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [videoUrlInput, setVideoUrlInput] = useState("")
  const [videoModalError, setVideoModalError] = useState<string | null>(null)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  const initialLayoutRef = useRef<ProductDetailLayout>(JSON.parse(JSON.stringify(layout)))
  const historyRef = useRef<ProductDetailLayout[]>([JSON.parse(JSON.stringify(layout))])
  const historyIndexRef = useRef(0)
  const [, forceRender] = useState(0)
  const skipHistoryRef = useRef(false)

  useEffect(() => { showGuidesRef.current = showGuides }, [showGuides])

  const pushHistory = (next: ProductDetailLayout) => {
    if (skipHistoryRef.current) { skipHistoryRef.current = false; return }
    const h = historyRef.current
    const idx = historyIndexRef.current
    historyRef.current = [...h.slice(0, idx + 1), JSON.parse(JSON.stringify(next))].slice(-50)
    historyIndexRef.current = historyRef.current.length - 1
  }

  useEffect(() => { pushHistory(layout) }, [layout])

  const undo = () => {
    if (historyIndexRef.current <= 0) return
    historyIndexRef.current -= 1
    skipHistoryRef.current = true
    setLayout(JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current])))
    forceRender((n) => n + 1)
  }
  const redo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return
    historyIndexRef.current += 1
    skipHistoryRef.current = true
    setLayout(JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current])))
    forceRender((n) => n + 1)
  }
  const canUndo = historyIndexRef.current > 0
  const canRedo = historyIndexRef.current < historyRef.current.length - 1

  const handleCloseRequest = () => setShowCloseConfirm(true)
  const handleDiscardClose = () => {
    setLayout(JSON.parse(JSON.stringify(initialLayoutRef.current)))
    setShowCloseConfirm(false)
    setEditing(false)
  }
  const handleSaveClose = async () => {
    await handleSave()
    setShowCloseConfirm(false)
    setEditing(false)
  }

  const updateElement = (id: string, partial: Partial<ProductDetailElement>) => {
    setLayout((prev) => ({ ...prev, elements: prev.elements.map((el) => (el.id === id ? { ...el, ...partial } : el)) }))
  }
  const removeElement = (id: string) => {
    setLayout((prev) => ({ ...prev, elements: prev.elements.filter((el) => el.id !== id) }))
  }

  const SNAP_THRESHOLD = 8
  const GRID_X = 100
  const GRID_Y = 50

  const snapPosition = (currentId: string, x: number, y: number, width: number, height: number, elements: ProductDetailElement[]) => {
    let bestX = x, bestY = y, bestDistX = SNAP_THRESHOLD + 1, bestDistY = SNAP_THRESHOLD + 1
    const myR = x + width, myB = y + height, myCX = x + width / 2, myCY = y + height / 2
    const trySnapX = (s: number, d: number) => { if (d <= SNAP_THRESHOLD && d < bestDistX) { bestDistX = d; bestX = s } }
    const trySnapY = (s: number, d: number) => { if (d <= SNAP_THRESHOLD && d < bestDistY) { bestDistY = d; bestY = s } }

    for (const el of elements) {
      if (el.id === currentId) continue
      const oL = el.x, oR = el.x + el.width, oT = el.y, oB = el.y + el.height, oCX = el.x + el.width / 2, oCY = el.y + el.height / 2
      trySnapX(oL, Math.abs(x - oL)); trySnapX(oR - width, Math.abs(x - oR))
      trySnapX(oL - width, Math.abs(myR - oL)); trySnapX(oR - width, Math.abs(myR - oR))
      trySnapX(oCX - width / 2, Math.abs(myCX - oCX))
      trySnapY(oT, Math.abs(y - oT)); trySnapY(oB - height, Math.abs(y - oB))
      trySnapY(oT - height, Math.abs(myB - oT)); trySnapY(oB - height, Math.abs(myB - oB))
      trySnapY(oCY - height / 2, Math.abs(myCY - oCY))
    }

    if (showGuidesRef.current) {
      for (let gx = 0; gx <= DESIGN_WIDTH; gx += GRID_X) {
        trySnapX(gx, Math.abs(x - gx)); trySnapX(gx - width, Math.abs(myR - gx)); trySnapX(gx - width / 2, Math.abs(myCX - gx))
      }
      const ch = layout.canvasHeight || defaultHeight
      for (let gy = 0; gy <= ch; gy += GRID_Y) {
        trySnapY(gy, Math.abs(y - gy)); trySnapY(gy - height, Math.abs(myB - gy)); trySnapY(gy - height / 2, Math.abs(myCY - gy))
      }
    }
    return { x: bestDistX <= SNAP_THRESHOLD ? bestX : x, y: bestDistY <= SNAP_THRESHOLD ? bestY : y }
  }

  const duplicateElement = (id: string) => {
    const source = layout.elements.find((el) => el.id === id)
    if (!source) return
    const prefix = source.type === "image" ? "img" : source.type === "video" ? "video" : "text"
    setLayout((prev) => ({ ...prev, elements: [...prev.elements, { ...JSON.parse(JSON.stringify(source)), id: `${prefix}-${Date.now()}`, x: source.x + 20, y: source.y + 20 }] }))
  }
  const addTextBlock = () => {
    setLayout((prev) => ({ ...prev, elements: [...prev.elements, { id: `text-${Date.now()}`, type: "paragraph" as const, x: 40, y: 40, width: 500, height: 180, props: { text: "雙擊編輯文字", fontSize: 24, color: "#ffffff" } }] }))
  }
  const addCardBlock = () => {
    setLayout((prev) => ({ ...prev, elements: [...prev.elements, { id: `card-${Date.now()}`, type: "card" as const, x: 40, y: 40, width: 280, height: 180, props: { title: "標題", description: "在此輸入描述內容", titleFontSize: 20, descFontSize: 14, titleColor: "#ffffff", descColor: "#a1a1aa" } }] }))
  }
  const addButtonBlock = () => {
    setLayout((prev) => ({ ...prev, elements: [...prev.elements, { id: `btn-${Date.now()}`, type: "button" as const, x: 40, y: 40, width: 200, height: 50, props: { text: "按鈕文字", fontSize: 16, color: "#ffffff" } }] }))
  }
  const handleInsertImage = async () => {
    const ctx = uploadContext ?? { type: "product", brandId: "page", productSlug: sectionKey.replace(/:/g, "_") }
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/jpeg,image/jpg,image/png,image/webp,image/gif,video/mp4"
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      setUploading(true); setMessage(null)
      try {
        const fd = new FormData(); fd.append("type", ctx.type); fd.append("brandId", ctx.brandId); fd.append("productSlug", ctx.productSlug); fd.append("file", file)
        const res = await fetch("/api/upload/upload-image", { method: "POST", credentials: "include", body: fd })
        const data = await res.json()
        if (!res.ok || !data?.path) throw new Error(data?.error || "上傳失敗")
        const isVideo = file.type.startsWith("video/")
        const el: ProductDetailElement = isVideo
          ? { id: `video-${Date.now()}`, type: "video", x: 80, y: 80, width: 560, height: 315, props: { src: data.path, provider: "direct" } }
          : { id: `img-${Date.now()}`, type: "image", x: 80, y: 80, width: 320, height: 240, props: { src: data.path } }
        setLayout((prev) => ({ ...prev, elements: [...prev.elements, el] }))
      } catch (e) { setMessage({ type: "error", text: e instanceof Error ? e.message : "上傳失敗" }) }
      finally { setUploading(false) }
    }
    input.click()
  }
  const parseMediaUrl = (url: string) => {
    const u = url.trim(); if (!u) return null
    let n = !/^https?:\/\//i.test(u) ? `https://${u}` : u
    if (/\.(jpe?g|png|webp|gif)(\?|$)/i.test(n)) return { kind: "image" as const, src: n }
    const yt = n.match(/(?:youtube\.com\/watch\?[^#]*v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
    if (yt) return { kind: "video" as const, src: `https://www.youtube.com/embed/${yt[1]}`, provider: "youtube" as const }
    const vm = n.match(/vimeo\.com\/(?:video\/)?(\d+)/i)
    if (vm) return { kind: "video" as const, src: `https://player.vimeo.com/video/${vm[1]}`, provider: "vimeo" as const }
    if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(n)) return { kind: "video" as const, src: n, provider: "direct" as const }
    if (/^https?:\/\//i.test(n)) return { kind: "video" as const, src: n, provider: "direct" as const }
    return null
  }
  const handleConfirmVideo = () => {
    const input = videoUrlInput.trim()
    if (!input) { setVideoModalError("請輸入連結"); return }
    const parsed = parseMediaUrl(input)
    if (!parsed?.src) { setVideoModalError("無法解析此連結"); return }
    const el: ProductDetailElement = parsed.kind === "image"
      ? { id: `img-${Date.now()}`, type: "image", x: 80, y: 80, width: 320, height: 240, props: { src: parsed.src } }
      : { id: `video-${Date.now()}`, type: "video", x: 80, y: 80, width: 560, height: 315, props: { src: parsed.src, provider: parsed.provider ?? "direct" } }
    setLayout((prev) => ({ ...prev, elements: [...prev.elements, el] }))
    setShowVideoModal(false); setVideoUrlInput(""); setVideoModalError(null)
  }
  const handleSave = async () => {
    setIsSaving(true); setMessage(null)
    try {
      const res = await fetch(`/api/upload/page-layouts?key=${encodeURIComponent(sectionKey)}`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ layout }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "儲存失敗")
      setMessage({ type: "success", text: "區段畫布已儲存" })
    } catch (e) { setMessage({ type: "error", text: e instanceof Error ? e.message : "儲存失敗" }) }
    finally { setIsSaving(false) }
  }

  const renderEditContent = (el: ProductDetailElement) => {
    if (el.type === "image" || el.type === "video") return renderElementContentStatic(el)

    if (el.type === "card") {
      const { title, description, titleFontSize, descFontSize, titleColor, descColor } = el.props ?? {}
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

    if (el.type === "button") {
      const { text, fontSize, color, background } = el.props ?? {}
      return (
        <div className="canvas-no-drag h-full w-full flex items-center justify-center">
          <input type="text" aria-label="按鈕文字" value={text || ""} placeholder="按鈕文字\u2026"
            onChange={(e) => updateElement(el.id, { props: { ...el.props, text: e.target.value } })}
            className="bg-transparent outline-none font-medium text-center rounded-md px-4 py-2 w-full focus-visible:ring-1 focus-visible:ring-primary"
            style={{ fontSize: fontSize || 16, color: color || "#ffffff", background: background || "linear-gradient(to right, hsl(221.2 83.2% 53.3%), hsl(262.1 83.3% 57.8%))", borderRadius: "0.375rem" }} />
        </div>
      )
    }
    type CB = { text: string; fontSize?: number; color?: string; bold?: boolean; italic?: boolean; underline?: boolean }
    const content: CB[] = Array.isArray(el.props?.content)
      ? el.props.content.map((b: Partial<CB>) => ({ text: b.text ?? "", fontSize: b.fontSize ?? 24, color: b.color ?? "#ffffff", bold: Boolean(b.bold), italic: Boolean(b.italic), underline: Boolean(b.underline) }))
      : [{ text: el.props?.text ?? "", fontSize: el.props?.fontSize ?? 24, color: el.props?.color ?? "#ffffff", bold: Boolean(el.props?.bold), italic: Boolean(el.props?.italic), underline: Boolean(el.props?.underline) }]
    const updateContent = (next: CB[]) => updateElement(el.id, { props: { ...el.props, content: next } })
    const updateBlock = (i: number, p: Partial<CB>) => { const n = [...content]; n[i] = { ...n[i], ...p }; updateContent(n) }
    return (
      <div className="canvas-no-drag h-full w-full overflow-auto p-3 space-y-2">
        {content.map((block, idx) => (
          <div key={idx} className="flex gap-1.5 items-center min-h-[32px]">
            <input type="number" aria-label="字級" min={8} max={72} value={block.fontSize}
              onChange={(e) => { const v = parseInt(e.target.value, 10); if (!Number.isNaN(v)) updateBlock(idx, { fontSize: Math.min(72, Math.max(8, v)) }) }}
              className="w-14 h-8 rounded border bg-background/80 px-1 text-xs text-center" />
            <input type="text" aria-label="文字內容" value={block.text}
              onChange={(e) => updateBlock(idx, { text: e.target.value })} onFocus={() => setActiveTextId(el.id)}
              className="flex-1 min-w-0 min-h-[32px] bg-transparent text-white outline-none focus-visible:ring-1 focus-visible:ring-primary rounded px-1"
              style={{ fontSize: Math.max(14, block.fontSize || 24), color: block.color, fontWeight: block.bold ? "700" : "400", fontStyle: block.italic ? "italic" : "normal", textDecoration: block.underline ? "underline" : "none" }}
              placeholder="輸入文字\u2026" />
            {content.length > 1 && (
              <button type="button" aria-label="刪除此行" onClick={() => updateContent(content.filter((_, i) => i !== idx))}
                className="text-red-400 hover:text-red-500 text-xs px-1 rounded">×</button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => updateContent([...content, { text: "", fontSize: 24, color: content[0]?.color ?? "#ffffff", bold: false, italic: false, underline: false }])}
          className="text-xs text-primary/80 hover:text-primary">+ 新增一行</button>
      </div>
    )
  }

  const canvasHeight = layout.canvasHeight && layout.canvasHeight > 0 ? layout.canvasHeight : defaultHeight

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2 mb-2">
        <button type="button" onClick={handleCloseRequest} className="inline-flex items-center gap-1 rounded-md border border-red-400/60 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20">
          <X className="h-3 w-3" /> 關閉
        </button>
        <div className="flex items-center gap-0.5 border-r border-border pr-2 mr-1">
          <button type="button" onClick={undo} disabled={!canUndo} className="inline-flex h-7 w-7 items-center justify-center rounded-md border hover:bg-muted disabled:opacity-30" aria-label="上一步" title="上一步">
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={redo} disabled={!canRedo} className="inline-flex h-7 w-7 items-center justify-center rounded-md border hover:bg-muted disabled:opacity-30" aria-label="下一步" title="下一步">
            <Redo2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <button type="button" onClick={addTextBlock} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted">
          <TypeIcon className="h-3 w-3" /> 文字
        </button>
        <button type="button" onClick={addCardBlock} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted">
          <LayoutGrid className="h-3 w-3" /> 卡片
        </button>
        <button type="button" onClick={addButtonBlock} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted">
          <RectangleHorizontal className="h-3 w-3" /> 按鈕
        </button>
        <button type="button" onClick={handleInsertImage} disabled={uploading} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50">
          <ImageIcon className="h-3 w-3" /> {uploading ? "上傳中\u2026" : "圖片"}
        </button>
        <button type="button" onClick={() => { setVideoUrlInput(""); setVideoModalError(null); setShowVideoModal(true) }} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted">
          <Video className="h-3 w-3" /> 連結
        </button>
        <button type="button" onClick={() => setShowGuides((v) => !v)}
          className={cn("inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium", showGuides ? "bg-primary/15 border-primary/40 text-primary" : "hover:bg-muted")}>
          <Grid3x3 className="h-3 w-3" /> 輔助線
        </button>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <label htmlFor={`ch-${sectionKey}`}>高度</label>
          <input id={`ch-${sectionKey}`} type="number" min={200} max={10000} step={50} value={canvasHeight}
            onChange={(e) => { const v = parseInt(e.target.value, 10); if (!Number.isNaN(v)) setLayout((p) => ({ ...p, canvasHeight: Math.min(Math.max(v, 200), 10000) })) }}
            className="h-7 w-20 rounded-md border bg-background px-2 text-xs" />
          <span>px</span>
        </div>
        <button type="button" onClick={handleSave} disabled={isSaving} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {isSaving ? <><Loader2 className="h-3 w-3 animate-spin" /> 儲存中\u2026</> : <><Save className="h-3 w-3" /> 儲存</>}
        </button>
      </div>
      {message && <div className={`rounded-md border px-3 py-2 text-xs ${message.type === "success" ? "border-green-500 text-green-500" : "border-red-500 text-red-500"}`}>{message.text}</div>}
      {showCloseConfirm && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-lg border border-border bg-white p-5 shadow-xl dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">關閉編輯</h3>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">是否要儲存目前的變更？</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowCloseConfirm(false)}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800">
                繼續編輯
              </button>
              <button type="button" onClick={handleDiscardClose}
                className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30">
                不儲存
              </button>
              <button type="button" onClick={handleSaveClose}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                儲存並關閉
              </button>
            </div>
          </div>
        </div>, document.body
      )}
      {showVideoModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-lg border border-border bg-white p-5 shadow-xl dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">插入圖片 / 影片</h3>
            <input type="text" inputMode="url" value={videoUrlInput} onChange={(e) => { setVideoUrlInput(e.target.value); setVideoModalError(null) }}
              placeholder="https://www.youtube.com/watch?v=\u2026" autoComplete="off"
              className="mb-2 block w-full min-h-[44px] rounded-md border-2 border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              onKeyDown={(e) => e.key === "Enter" && handleConfirmVideo()} autoFocus />
            {videoModalError && <p className="mb-2 text-sm text-red-500">{videoModalError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setShowVideoModal(false); setVideoModalError(null) }} className="rounded-md border border-zinc-300 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">取消</button>
              <button type="button" onClick={handleConfirmVideo} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">插入</button>
            </div>
          </div>
        </div>, document.body
      )}
      <div ref={canvasRef} className="relative w-full rounded-lg border border-dashed border-primary/40 bg-muted/10 overflow-hidden" style={{ height: canvasHeight * scale }}>
        <div className="absolute left-0 top-0 origin-top-left" style={{ width: DESIGN_WIDTH, height: canvasHeight, transform: `scale(${scale})` }}>
          <div className="relative" style={{ width: DESIGN_WIDTH, height: canvasHeight }}>
            {layout.elements.map((el) => (
              <LazyCanvasElementWrapper key={el.id} x={el.x} y={el.y} width={el.width} height={el.height}
                isEditable={true} useDragHandle={el.type !== "image"}
                scale={scale}
                onChange={(next) => { const snapped = snapPosition(el.id, next.x, next.y, next.width, next.height, layout.elements); updateElement(el.id, { ...next, x: snapped.x, y: snapped.y }) }}
                onRemove={() => removeElement(el.id)} onCopy={() => duplicateElement(el.id)}>
                {renderEditContent(el)}
              </LazyCanvasElementWrapper>
            ))}
            {layout.elements.length === 0 && <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">畫布是空的，請使用上方工具列新增內容。</div>}
            {showGuides && <CanvasGuideOverlay height={canvasHeight} />}
          </div>
        </div>
      </div>
    </div>
  )
}
