"use client"

import { GripVertical, Copy } from "lucide-react"
import { Rnd } from "react-rnd"

type CanvasElementWrapperProps = {
  x: number
  y: number
  width: number
  height: number
  isEditable: boolean
  onChange: (next: { x: number; y: number; width: number; height: number }) => void
  onRemove?: () => void
  onCopy?: () => void
  useDragHandle?: boolean
  scale?: number
  children: React.ReactNode
}

export function CanvasElementWrapper({
  x, y, width, height, isEditable, onChange, onRemove, onCopy,
  useDragHandle = true, scale = 1, children,
}: CanvasElementWrapperProps) {
  if (!isEditable) {
    return (
      <div className="absolute" style={{ left: x, top: y, width, height }}>
        {children}
      </div>
    )
  }

  return (
    <Rnd
      scale={scale}
      bounds="parent"
      cancel=".canvas-no-drag"
      dragHandleClassName={useDragHandle ? "canvas-drag-handle" : undefined}
      enableResizing={{
        bottomRight: true,
        bottom: false, bottomLeft: false, right: false,
        top: false, topRight: false, topLeft: false, left: false,
      }}
      size={{ width, height }}
      position={{ x, y }}
      onDragStop={(_, d) => onChange({ x: d.x, y: d.y, width, height })}
      onResizeStop={(_e, _dir, ref, _delta, position) =>
        onChange({ x: position.x, y: position.y, width: ref.offsetWidth, height: ref.offsetHeight })
      }
      className="absolute border border-dashed border-primary/40 bg-background/60 backdrop-blur-sm shadow-sm"
    >
      {useDragHandle && (
        <div
          className="canvas-drag-handle absolute -left-3 top-1 z-10 flex h-6 w-6 cursor-grab items-center justify-center rounded-full bg-primary/80 text-primary-foreground shadow-sm active:cursor-grabbing hover:bg-primary"
          title="拖曳移動"
        >
          <GripVertical className="h-3 w-3" />
        </div>
      )}
      <div className="absolute -right-2 -top-2 z-10 flex gap-0.5">
        {onCopy && (
          <button type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onCopy() }}
            className="canvas-no-drag inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/80 text-[10px] text-primary-foreground shadow hover:bg-primary"
            title="複製" aria-label="複製">
            <Copy className="h-2.5 w-2.5" />
          </button>
        )}
        {onRemove && (
          <button type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="canvas-no-drag inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow hover:bg-red-600"
            aria-label="刪除">
            ×
          </button>
        )}
      </div>
      {children}
    </Rnd>
  )
}
