"use client"

import { useEffect, useRef, useState, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface AnimationWrapperProps {
  children: ReactNode
  animation?: "slide-right" | "slide-left" | "slide-up" | "fade" | "pop"
  delay?: number
  threshold?: number
  rootMargin?: string
  className?: string
}

export function AnimationWrapper({
  children,
  animation = "fade",
  delay = 0,
  threshold = 0.1,
  rootMargin = "50px",
  className,
}: AnimationWrapperProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [prefersReduced, setPrefersReduced] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPrefersReduced(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
  }, [])

  useEffect(() => {
    if (prefersReduced) {
      setIsVisible(true)
      setHasAnimated(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setTimeout(() => {
            setIsVisible(true)
            setHasAnimated(true)
          }, delay)
        }
      },
      { threshold, rootMargin }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [threshold, rootMargin, delay, hasAnimated, prefersReduced])

  const animationClasses = {
    "slide-right": isVisible
      ? "translate-x-0 opacity-100"
      : "translate-x-[-50px] opacity-0",
    "slide-left": isVisible
      ? "translate-x-0 opacity-100"
      : "translate-x-[50px] opacity-0",
    "slide-up": isVisible
      ? "translate-y-0 opacity-100"
      : "translate-y-[30px] opacity-0",
    fade: isVisible ? "opacity-100" : "opacity-0",
    pop: isVisible
      ? "scale-100 opacity-100"
      : "scale-90 opacity-0",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[transform,opacity] duration-500 ease-out motion-reduce:transition-none",
        animationClasses[animation],
        className
      )}
      style={{
        transitionDelay: prefersReduced ? "0ms" : `${delay}ms`,
        willChange: prefersReduced ? "auto" : "transform, opacity",
      }}
    >
      {children}
    </div>
  )
}
