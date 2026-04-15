"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className="h-40 w-full rounded-md border border-dashed border-muted-foreground/40 bg-muted/40 animate-pulse" />
  ),
})

// 為了能使用 ref 取得 editor 實例，這裡以 any 包裝，略過型別檢查
const AnyReactQuill: any = ReactQuill

type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
  /**
   * 產品所屬品牌 ID，用於圖片上傳路徑
   */
  brandId: string
  /**
   * 產品 slug，用於圖片上傳路徑
   */
  productSlug: string
}

export function RichTextEditor({
  value,
  onChange,
  brandId,
  productSlug,
}: RichTextEditorProps) {
  const quillRef = useRef<any>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)
  const hoverTimeoutRef = useRef<number | null>(null)

  const handleImageUpload = useCallback(() => {
    setUploadError(null)

    if (!brandId || !productSlug) {
      setUploadError("請先在上方選擇公司與產品，再插入圖片。")
      return
    }

    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/jpeg,image/jpg,image/png,image/webp,image/gif"

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      setUploading(true)
      try {
        const formData = new FormData()
        formData.append("type", "product")
        formData.append("brandId", brandId)
        formData.append("productSlug", productSlug)
        formData.append("file", file)

        // #region agent log
        fetch("http://127.0.0.1:7510/ingest/9b5b52c1-3b6f-4e2a-8564-8b25a894f7e1", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "09e97b",
          },
          body: JSON.stringify({
            sessionId: "09e97b",
            runId: "upload-debug",
            hypothesisId: "H4",
            location: "components/RichTextEditor.tsx:handleImageUpload:beforeFetch",
            message: "rich editor image upload start",
            data: {
              brandId,
              productSlug,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {})
        // #endregion agent log

        const res = await fetch("/api/upload/upload-image", {
          method: "POST",
          credentials: "include",
          body: formData,
        })

        const data = await res.json()

        // #region agent log
        fetch("http://127.0.0.1:7510/ingest/9b5b52c1-3b6f-4e2a-8564-8b25a894f7e1", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "09e97b",
          },
          body: JSON.stringify({
            sessionId: "09e97b",
            runId: "upload-debug",
            hypothesisId: "H5",
            location: "components/RichTextEditor.tsx:handleImageUpload:afterFetch",
            message: "rich editor image upload response",
            data: {
              ok: res.ok,
              status: res.status,
              hasPath: !!data?.path,
              error: data?.error,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {})
        // #endregion agent log

        if (!res.ok || !data?.path) {
          throw new Error(data?.error || "圖片上傳失敗")
        }

        const editor = quillRef.current?.getEditor?.()
        if (editor) {
          const range = editor.getSelection(true)
          const index = range ? range.index : editor.getLength()
          editor.insertEmbed(index, "image", data.path)
          editor.setSelection(index + 1)
          // #region agent log
          fetch("http://127.0.0.1:7510/ingest/9b5b52c1-3b6f-4e2a-8564-8b25a894f7e1", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Debug-Session-Id": "09e97b",
            },
            body: JSON.stringify({
              sessionId: "09e97b",
              runId: "upload-debug",
              hypothesisId: "H6",
              location: "components/RichTextEditor.tsx:handleImageUpload:insertEmbed",
              message: "image inserted into editor",
              data: {
                path: data.path,
                index,
              },
              timestamp: Date.now(),
            }),
          }).catch(() => {})
          // #endregion agent log
        }
      } catch (error) {
        console.error(error)
        const message =
          error instanceof Error ? error.message : "圖片上傳失敗，請稍後再試"
        setUploadError(message)
        // #region agent log
        fetch("http://127.0.0.1:7510/ingest/9b5b52c1-3b6f-4e2a-8564-8b25a894f7e1", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "09e97b",
          },
          body: JSON.stringify({
            sessionId: "09e97b",
            runId: "upload-debug",
            hypothesisId: "H7",
            location: "components/RichTextEditor.tsx:handleImageUpload:catch",
            message: "rich editor image upload error",
            data: {
              errorMessage: message,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {})
        // #endregion agent log
      } finally {
        setUploading(false)
      }
    }

    input.click()
  }, [brandId, productSlug])

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline"],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "image"],
          ["clean"],
        ],
        handlers: {
          image: handleImageUpload,
        },
      },
      clipboard: {
        matchVisual: false,
      },
    }),
    [handleImageUpload]
  )

  const formats = useMemo(
    () => [
      "header",
      "bold",
      "italic",
      "underline",
      "color",
      "background",
      "align",
      "list",
      "bullet",
      "link",
      "image",
    ],
    []
  )

  useEffect(() => {
    const tooltipConfig: { selector: string; text: string }[] = [
      { selector: ".ql-header", text: "標題大小：選擇 1、2、3 可放大標題文字。" },
      { selector: ".ql-bold", text: "粗體：選取文字後點擊可加粗。" },
      { selector: ".ql-italic", text: "斜體：選取文字後點擊可變斜體。" },
      { selector: ".ql-underline", text: "底線：選取文字後點擊可加底線。" },
      { selector: ".ql-color", text: "文字顏色：選擇不同顏色套用到選取文字。" },
      { selector: ".ql-background", text: "背景色：替選取文字加上底色標記。" },
      { selector: ".ql-align", text: "對齊：控制文字或圖片靠左、置中或靠右。" },
      { selector: ".ql-list.ql-bullet", text: "項目清單：建立條列式說明。" },
      { selector: ".ql-list.ql-ordered", text: "編號清單：建立有順序的條列項目。" },
      { selector: ".ql-link", text: "連結：將選取文字設定為可點擊的網址。" },
      { selector: ".ql-image", text: "圖片：從電腦選擇圖片上傳並插入內容中。" },
      { selector: ".ql-clean", text: "清除格式：移除選取文字的樣式，回到一般文字。" },
    ]

    let listeners: { el: HTMLElement; enter: (e: MouseEvent) => void; leave: () => void }[] = []

    const setup = () => {
      if (typeof window === "undefined") return
      const instance = quillRef.current
      if (!instance) return

      const container: HTMLElement | null =
        instance?.container?.querySelector?.(".ql-toolbar") ??
        instance?.getEditor?.()?.getModule?.("toolbar")?.container ??
        null

      if (!container) return

      const showTooltip = (el: HTMLElement, text: string) => {
        if (typeof window === "undefined") return
        if (window.innerWidth < 768) return
        const rect = el.getBoundingClientRect()
        setTooltip({
          text,
          x: rect.left + rect.width / 2,
          y: rect.bottom + 8,
        })
      }

      const hideTooltip = () => {
        setTooltip(null)
      }

      tooltipConfig.forEach(({ selector, text }) => {
        const elements = container.querySelectorAll(selector)
        elements.forEach((node) => {
          const el = node as HTMLElement
          const onEnter = () => {
            if (hoverTimeoutRef.current != null) {
              window.clearTimeout(hoverTimeoutRef.current)
            }
            hoverTimeoutRef.current = window.setTimeout(() => {
              showTooltip(el, text)
            }, 3000)
          }
          const onLeave = () => {
            if (hoverTimeoutRef.current != null) {
              window.clearTimeout(hoverTimeoutRef.current)
              hoverTimeoutRef.current = null
            }
            hideTooltip()
          }

          el.addEventListener("mouseenter", onEnter)
          el.addEventListener("mouseleave", onLeave)
          listeners.push({ el, enter: onEnter, leave: onLeave })
        })
      })
    }

    const timer = window.setTimeout(setup, 0)

    return () => {
      window.clearTimeout(timer)
      if (hoverTimeoutRef.current != null) {
        window.clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }
      listeners.forEach(({ el, enter, leave }) => {
        el.removeEventListener("mouseenter", enter)
        el.removeEventListener("mouseleave", leave)
      })
      listeners = []
    }
  }, [modules])

  return (
    <div className="space-y-2 relative">
      <AnyReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
      />
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-md bg-black/80 px-2 py-1 text-[11px] text-white shadow"
          style={{ top: tooltip.y, left: tooltip.x, transform: "translateX(-50%)" }}
        >
          {tooltip.text}
        </div>
      )}
      {uploading && (
        <p className="text-xs text-muted-foreground">圖片上傳中，請稍候...</p>
      )}
      {uploadError && (
        <p className="text-xs text-red-500">{uploadError}</p>
      )}
    </div>
  )
}

