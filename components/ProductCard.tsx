"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { SquarePen, Move, Check } from "lucide-react"
import type { Product } from "@/lib/products"
import { PopInContainer } from "./PopInContainer"
import { cn } from "@/lib/utils"

interface ProductCardProps {
  product: Product
  delay?: number
  className?: string
  showTag?: boolean
  compact?: boolean
  isAdmin?: boolean
}

function FocalPointEditor({
  src, alt, productId, initialPosition, onSaved, onCancel,
}: {
  src: string; alt: string; productId: string
  initialPosition: string; onSaved: (pos: string) => void; onCancel: () => void
}) {
  const [pos, setPos] = useState(initialPosition)
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const calcPosition = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = Math.round(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)))
    const py = Math.round(Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)))
    setPos(`${px}% ${py}%`)
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
    containerRef.current?.setPointerCapture(e.pointerId)
    calcPosition(e.clientX, e.clientY)
  }
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return
    e.preventDefault()
    calcPosition(e.clientX, e.clientY)
  }
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragging) return
    setDragging(false)
    containerRef.current?.releasePointerCapture(e.pointerId)
  }

  const save = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await fetch(`/api/upload/products?id=${encodeURIComponent(productId)}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverImagePosition: pos }),
      })
      onSaved(pos)
    } catch { /* ignore */ }
  }

  const pxParts = pos.split(" ")
  const dotLeft = pxParts[0] || "50%"
  const dotTop = pxParts[1] || "50%"

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-10 cursor-crosshair select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="absolute inset-0 bg-black/30" />
      <Image src={src} alt={alt} fill className="object-cover pointer-events-none" style={{ objectPosition: pos }} sizes="100vw" />
      <div className="absolute pointer-events-none" style={{ left: dotLeft, top: dotTop, transform: "translate(-50%, -50%)" }}>
        <div className="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
        </div>
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full w-px h-4 bg-white/60" />
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-full w-px h-4 bg-white/60" />
        <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-full h-px w-4 bg-white/60" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-full h-px w-4 bg-white/60" />
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-auto">
        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCancel() }}
          className="inline-flex items-center gap-1 rounded-md bg-zinc-700 px-2.5 py-1 text-[10px] font-medium text-white shadow-lg hover:bg-zinc-600">
          取消
        </button>
        <button type="button" onClick={save}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[10px] font-medium text-primary-foreground shadow-lg hover:bg-primary/90">
          <Check className="h-3 w-3" /> 儲存焦點
        </button>
      </div>
      <div className="absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white pointer-events-none">
        {pos}
      </div>
    </div>
  )
}

export function ProductCard({
  product, delay = 0, className, showTag = true, compact = false, isAdmin = false,
}: ProductCardProps) {
  const { name, category, description, link, slug, coverImage } = product
  const [focalMode, setFocalMode] = useState(false)
  const [objPos, setObjPos] = useState(product.coverImagePosition || "center")

  const coverSrc = coverImage || product.images?.[0]

  const imageBlock = coverSrc ? (
    <div className="relative w-full h-48 md:h-56 overflow-hidden rounded-t-lg -mx-4 -mt-4 mb-1 group/img" style={{ width: "calc(100% + 2rem)" }}>
      <Image src={coverSrc} alt={`${name} 封面`} fill className="object-cover" style={{ objectPosition: objPos }} sizes="(max-width: 768px) 100vw, 33vw" />
      {isAdmin && !focalMode && (
        <button type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFocalMode(true) }}
          className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[10px] font-medium text-white shadow opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-black/90">
          <Move className="h-3 w-3" /> 調整焦點
        </button>
      )}
      {isAdmin && focalMode && (
        <FocalPointEditor
          src={coverSrc} alt={name} productId={product.id}
          initialPosition={objPos}
          onSaved={(pos) => { setObjPos(pos); setFocalMode(false) }}
          onCancel={() => setFocalMode(false)}
        />
      )}
    </div>
  ) : null

  const cardContent = (
    <>
      {imageBlock}
      <header className="space-y-1.5">
        <div className="space-y-1">
          <h3 className="font-semibold text-[15px] md:text-base leading-[1.4] break-words hyphens-auto">{name}</h3>
          <p className="text-xs text-primary/70 font-medium">{category}</p>
        </div>
      </header>
      {!compact && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1 min-h-[2.4rem]">{description}</p>
      )}
      {((link && !(isAdmin && slug)) || (!link && isAdmin && slug)) && (
        <div className="mt-auto pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-border/40">
          {!link && isAdmin && slug && (
            <Link href={`/products/${slug}#canvas`} className="inline-flex items-center gap-1 text-[11px] md:text-xs font-medium text-primary hover:text-primary/80 transition-colors">
              <SquarePen className="h-3 w-3" /> 編輯畫布
            </Link>
          )}
          {link && !(isAdmin && slug) && (
            <span className="inline-flex items-center text-[11px] md:text-xs font-medium text-primary group-hover:text-primary/80 transition-colors">
              查看詳細
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </span>
          )}
        </div>
      )}
    </>
  )

  const cardClassName = cn(
    "group rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col gap-2 h-full transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-primary/40 hover:bg-primary/5 cursor-pointer",
    className
  )

  if (focalMode) {
    return (
      <PopInContainer delay={delay}>
        <div className={cn(cardClassName, "relative")}>{cardContent}</div>
      </PopInContainer>
    )
  }

  if (link && !(isAdmin && slug)) {
    return (
      <PopInContainer delay={delay}>
        <Link href={link} className={cn(cardClassName, "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background")}>
          {cardContent}
        </Link>
      </PopInContainer>
    )
  }

  if (link && isAdmin && slug) {
    return (
      <PopInContainer delay={delay}>
        <div className={cn(cardClassName, "relative focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background")}>
          <Link href={link} className="flex flex-col gap-2 flex-1 min-w-0">
            {imageBlock}
            <header className="space-y-1.5">
              <div className="space-y-1">
                <h3 className="font-semibold text-[15px] md:text-base leading-[1.4] break-words hyphens-auto">{name}</h3>
                <p className="text-xs text-primary/70 font-medium">{category}</p>
              </div>
            </header>
            {!compact && (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1 min-h-[2.4rem]">{description}</p>
            )}
          </Link>
          <div className="mt-auto pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-border/40">
            <Link href={`/products/${slug}#canvas`} className="inline-flex items-center gap-1 text-[11px] md:text-xs font-medium text-primary hover:text-primary/80 transition-colors">
              <SquarePen className="h-3 w-3" /> 編輯畫布
            </Link>
            <Link href={link} className="inline-flex items-center text-[11px] md:text-xs font-medium text-primary hover:text-primary/80 transition-colors">
              查看詳細
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </Link>
          </div>
        </div>
      </PopInContainer>
    )
  }

  return (
    <PopInContainer delay={delay}>
      <article className={cn(
        "group rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col gap-2 h-full transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-primary/40 hover:bg-primary/5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        className
      )}>
        {cardContent}
      </article>
    </PopInContainer>
  )
}
