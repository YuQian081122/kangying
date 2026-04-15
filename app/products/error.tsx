"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Products route error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-md rounded-lg border border-red-500/50 bg-red-500/10 p-6 text-center">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">頁面載入錯誤</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || "發生未知錯誤"}
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-muted-foreground">Digest: {error.digest}</p>
        )}
        <div className="mt-4 flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            重試
          </button>
          <Link
            href="/"
            className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
          >
            返回首頁
          </Link>
        </div>
      </div>
    </div>
  )
}
