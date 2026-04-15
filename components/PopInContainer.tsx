"use client"

import { ReactNode } from "react"
import { AnimationWrapper } from "./AnimationWrapper"

interface PopInContainerProps {
  children: ReactNode
  delay?: number
}

export function PopInContainer({ children, delay = 0 }: PopInContainerProps) {
  return (
    <AnimationWrapper animation="pop" delay={delay} className="h-full">
      {children}
    </AnimationWrapper>
  )
}
