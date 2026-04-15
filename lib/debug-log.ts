import { appendFileSync } from "fs"
import { join } from "path"

export function debugLog(
  location: string,
  message: string,
  data: object,
  hypothesisId: string
) {
  try {
    const payload =
      JSON.stringify({
        sessionId: "ee9d73",
        location,
        message,
        data,
        timestamp: Date.now(),
        hypothesisId,
      }) + "\n"
    appendFileSync(join(process.cwd(), "debug-ee9d73.log"), payload)
  } catch {}
}
