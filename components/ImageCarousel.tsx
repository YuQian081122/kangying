"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface CarouselImage {
  src: string
  alt: string
  caption?: string
}

interface ImageCarouselProps {
  images: CarouselImage[]
  className?: string
}

export function ImageCarousel({ images, className }: ImageCarouselProps) {
  const [index, setIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [previousIndex, setPreviousIndex] = useState<number | null>(null)
  const [direction, setDirection] = useState<"next" | "prev">("next")
  const [pauseUntil, setPauseUntil] = useState<number | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenIndex, setFullscreenIndex] = useState(0)
  
  // 使用 ref 來追蹤最新狀態，避免閉包問題
  const indexRef = useRef(index)
  const isAnimatingRef = useRef(isAnimating)
  const pauseUntilRef = useRef(pauseUntil)
  
  // 同步 ref 與 state
  useEffect(() => {
    indexRef.current = index
  }, [index])
  
  useEffect(() => {
    isAnimatingRef.current = isAnimating
  }, [isAnimating])
  
  useEffect(() => {
    pauseUntilRef.current = pauseUntil
  }, [pauseUntil])

  if (!images || images.length === 0) return null

  const total = images.length

  const startTransition = (nextIndex: number, dir: "next" | "prev") => {
    if (isAnimatingRef.current || nextIndex === indexRef.current) return
    setPreviousIndex(indexRef.current)
    setIndex(nextIndex)
    setDirection(dir)
    setIsAnimating(true)
  }

  const safeNext = () => {
    const currentIndex = indexRef.current
    const next = (currentIndex + 1) % total
    startTransition(next, "next")
  }

  const safePrev = () => {
    const currentIndex = indexRef.current
    const prev = (currentIndex - 1 + total) % total
    startTransition(prev, "prev")
  }

  const goNext = () => {
    setPauseUntil(Date.now() + 10_000)
    safeNext()
  }

  const goPrev = () => {
    setPauseUntil(Date.now() + 10_000)
    safePrev()
  }

  const openFullscreen = (imageIndex: number) => {
    setFullscreenIndex(imageIndex)
    setIsFullscreen(true)
    // 防止背景滾動
    document.body.style.overflow = "hidden"
  }

  const closeFullscreen = () => {
    setIsFullscreen(false)
    document.body.style.overflow = ""
  }

  const fullscreenNext = () => {
    setFullscreenIndex((prev) => (prev + 1) % total)
  }

  const fullscreenPrev = () => {
    setFullscreenIndex((prev) => (prev - 1 + total) % total)
  }

  // ESC 鍵關閉全螢幕，方向鍵切換圖片
  useEffect(() => {
    if (!isFullscreen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeFullscreen()
      } else if (e.key === "ArrowLeft") {
        setFullscreenIndex((prev) => (prev - 1 + total) % total)
      } else if (e.key === "ArrowRight") {
        setFullscreenIndex((prev) => (prev + 1) % total)
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isFullscreen, total])

  useEffect(() => {
    if (!images || images.length <= 1) return

    const interval = setInterval(() => {
      // 檢查是否正在動畫中
      if (isAnimatingRef.current) {
        return
      }
      // 檢查是否在暫停期間
      if (pauseUntilRef.current && Date.now() < pauseUntilRef.current) {
        return
      }
      safeNext()
    }, 4000)

    return () => clearInterval(interval)
  }, [images, total])

  useEffect(() => {
    if (!isAnimating) return
    const timeout = setTimeout(() => {
      setIsAnimating(false)
      setPreviousIndex(null)
    }, 550)
    return () => clearTimeout(timeout)
  }, [isAnimating])

  // 確保組件卸載時恢復 body overflow
  useEffect(() => {
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  const current = images[index]
  const previous =
    previousIndex !== null && images[previousIndex]
      ? images[previousIndex]
      : null

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl border border-primary/30 bg-card/70 backdrop-blur group shadow-[0_0_35px_rgba(59,130,246,0.22)] hover:shadow-[0_0_45px_rgba(59,130,246,0.45)] ring-1 ring-primary/25 hover:ring-primary/55 transition-shadow",
        className
      )}
    >
      <div className="relative w-full bg-background/80">
        <div className="relative w-full aspect-video md:aspect-[16/9] lg:aspect-[16/9]">
          {/* 前一張圖片：負責滑出效果 */}
          {previous && isAnimating && (
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center z-0 pointer-events-none",
                direction === "next"
                  ? "animate-carousel-slide-out-left"
                  : "animate-carousel-slide-out-right"
              )}
            >
              <Image
                src={previous.src}
                alt={previous.alt}
                fill
                className="object-contain pointer-events-none"
                sizes="100vw"
                priority
              />
            </div>
          )}

          {/* 目前圖片：負責滑入效果 */}
          <div
            key={current.src}
            className={cn(
              "absolute inset-0 flex items-center justify-center z-[1]",
              isAnimating
                ? direction === "next"
                  ? "animate-carousel-slide-in-right"
                  : "animate-carousel-slide-in-left"
                : "opacity-100 translate-x-0"
            )}
          >
            <a
              href={current.src}
              type="image/jpeg"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              aria-label={`查看 ${current.alt} 全尺寸圖片`}
            >
              <Image
                src={current.src}
                alt={current.alt}
                fill
                className="object-contain pointer-events-none"
                sizes="100vw"
                priority
              />
            </a>
          </div>
        </div>
      </div>

      {current.caption && (
        <div className="px-4 py-2 text-xs md:text-sm text-muted-foreground bg-background/70 border-t">
          {current.caption}
        </div>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          goPrev()
        }}
        className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-background/70 text-foreground shadow-md backdrop-blur transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:scale-105 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 z-10"
        aria-label="上一張圖片"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          goNext()
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-background/70 text-foreground shadow-md backdrop-blur transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:scale-105 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 z-10"
        aria-label="下一張圖片"
      >
        ›
      </button>

      <div className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1">
        <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] md:text-xs text-muted-foreground shadow-sm">
          {index + 1} / {total}
        </span>
        <div className="flex items-center gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 w-1.5 rounded-full bg-background/70 shadow-sm",
                i === index && "bg-primary/80 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
              )}
            />
          ))}
        </div>
      </div>

      {/* 全螢幕預覽 Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={closeFullscreen}
        >
          {/* 關閉按鈕 */}
          <button
            type="button"
            onClick={closeFullscreen}
            className="absolute top-4 right-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/20 text-foreground shadow-lg backdrop-blur transition-all duration-200 hover:bg-background/40 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="關閉全螢幕"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* 左側切換按鈕 */}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  fullscreenPrev()
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-background/20 text-foreground shadow-lg backdrop-blur transition-all duration-200 hover:bg-background/40 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="上一張圖片"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>

              {/* 右側切換按鈕 */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  fullscreenNext()
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-background/20 text-foreground shadow-lg backdrop-blur transition-all duration-200 hover:bg-background/40 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="下一張圖片"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </>
          )}

          {/* 全螢幕圖片 */}
          <div
            className="relative h-full w-full flex items-center justify-center p-4 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative max-h-full max-w-full">
              <Image
                src={images[fullscreenIndex].src}
                alt={images[fullscreenIndex].alt}
                width={1920}
                height={1080}
                className="max-h-[90vh] max-w-full object-contain"
                sizes="100vw"
                priority
              />
              {/* 圖片說明 */}
              {images[fullscreenIndex].caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent px-6 py-4 text-center">
                  <p className="text-sm md:text-base text-white">
                    {images[fullscreenIndex].caption}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 頁碼指示器 */}
          {total > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
              <span className="rounded-full bg-background/20 backdrop-blur px-4 py-2 text-sm text-foreground shadow-lg">
                {fullscreenIndex + 1} / {total}
              </span>
              <div className="flex items-center gap-2">
                {Array.from({ length: total }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFullscreenIndex(i)
                    }}
                    className={cn(
                      "h-2 w-2 rounded-full transition-all duration-200",
                      i === fullscreenIndex
                        ? "bg-primary shadow-[0_0_8px_rgba(59,130,246,0.8)] scale-125"
                        : "bg-background/40 hover:bg-background/60"
                    )}
                    aria-label={`跳轉到第 ${i + 1} 張圖片`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

