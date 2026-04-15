"use client"

import { useEffect, useState } from "react"

interface Ripple {
  id: number
  x: number
  y: number
  size: number
}

export function ClickEffect() {
  const [ripples, setRipples] = useState<Ripple[]>([])

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) return

    let id = 0
    const handlePointerDown = (event: PointerEvent) => {
      // 只在左鍵或觸控時產生波紋
      if (event.button !== 0 && event.pointerType !== "touch") return

      // 直接使用視窗座標，避免額外位移造成偏差
      const x = event.clientX
      const y = event.clientY

      const newRipple: Ripple = { id: id++, x, y, size: 128 }
      setRipples((prev) => [...prev, newRipple].slice(-12)) // 最多保留 12 個

      // 自動移除
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id))
      }, 800)
    }

    window.addEventListener("pointerdown", handlePointerDown)
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none absolute rounded-full bg-primary/40 blur-sm animate-click-ripple"
          style={{
            width: ripple.size,
            height: ripple.size,
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
          }}
        />
      ))}
    </div>
  )
}

