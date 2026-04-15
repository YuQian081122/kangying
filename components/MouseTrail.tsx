"use client"

import { useEffect, useRef } from "react"

interface TrailPoint {
  x: number
  y: number
  life: number
}

export function MouseTrail() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pointsRef = useRef<TrailPoint[]>([])
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const prefersFinePointer =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(pointer: fine)").matches
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (!prefersFinePointer || prefersReduced) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      const points = pointsRef.current
      points.push({ x, y, life: 1 })
      if (points.length > 36) {
        points.shift()
      }
    }

    const draw = () => {
      const points = pointsRef.current
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < points.length; i++) {
        const p = points[i]
        const radius = 10 * p.life
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius)
        gradient.addColorStop(0, "hsla(190, 90%, 70%, 0.9)")
        gradient.addColorStop(1, "hsla(190, 90%, 70%, 0)")
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
        ctx.fill()

        // life 衰減，數值越小尾巴越長
        p.life -= 0.025
      }

      // 移除生命值耗盡的點
      pointsRef.current = points.filter((p) => p.life > 0)
      rafRef.current = requestAnimationFrame(draw)
    }

    window.addEventListener("pointermove", handleMove)
    window.addEventListener("resize", resize)
    rafRef.current = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("resize", resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[55]"
      aria-hidden="true"
    />
  )
}

