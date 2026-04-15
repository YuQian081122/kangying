"use client"

const DESIGN_WIDTH = 1200
const COL_COUNT = 12
const COL_WIDTH = DESIGN_WIDTH / COL_COUNT
const ROW_SPACING = 50

export function CanvasGuideOverlay({ height }: { height: number }) {
  const rows = Math.ceil(height / ROW_SPACING)

  return (
    <div className="absolute inset-0 pointer-events-none z-[5]" aria-hidden="true">
      {Array.from({ length: COL_COUNT + 1 }, (_, i) => {
        const x = i * COL_WIDTH
        const isMid = i === COL_COUNT / 2
        return (
          <div
            key={`v${i}`}
            className="absolute top-0 bottom-0"
            style={{
              left: x,
              width: 1,
              backgroundColor: isMid
                ? "rgba(59, 130, 246, 0.3)"
                : "rgba(59, 130, 246, 0.12)",
            }}
          />
        )
      })}
      {Array.from({ length: rows + 1 }, (_, i) => {
        const y = i * ROW_SPACING
        const isMid = y === Math.round(height / 2 / ROW_SPACING) * ROW_SPACING
        return (
          <div
            key={`h${i}`}
            className="absolute left-0 right-0"
            style={{
              top: y,
              height: 1,
              backgroundColor: isMid
                ? "rgba(59, 130, 246, 0.3)"
                : "rgba(59, 130, 246, 0.12)",
            }}
          />
        )
      })}
    </div>
  )
}
