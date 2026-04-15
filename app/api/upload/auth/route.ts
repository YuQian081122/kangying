import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ""
const BCRYPT_ROUNDS = 10

const loginAttempts = new Map<string, { count: number; lockedUntil: number }>()
const MAX_ATTEMPTS = 5
const LOCK_DURATION_MS = 15 * 60 * 1000

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}

function isLocked(ip: string): boolean {
  const record = loginAttempts.get(ip)
  if (!record) return false
  if (Date.now() > record.lockedUntil) {
    loginAttempts.delete(ip)
    return false
  }
  return record.count >= MAX_ATTEMPTS
}

function recordFailure(ip: string): void {
  const record = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 }
  record.count += 1
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCK_DURATION_MS
  }
  loginAttempts.set(ip, record)
}

function clearFailures(ip: string): void {
  loginAttempts.delete(ip)
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)

    if (isLocked(ip)) {
      return NextResponse.json(
        { error: "登入嘗試次數過多，請 15 分鐘後再試" },
        { status: 429 }
      )
    }

    if (!ADMIN_PASSWORD) {
      console.error("ADMIN_PASSWORD environment variable is not set")
      return NextResponse.json(
        { error: "伺服器設定錯誤" },
        { status: 500 }
      )
    }

    const { password } = await request.json()

    const isHashed = ADMIN_PASSWORD.startsWith("$2a$") || ADMIN_PASSWORD.startsWith("$2b$")
    let isValid = false

    if (isHashed) {
      isValid = await bcrypt.compare(password, ADMIN_PASSWORD)
    } else {
      isValid = password === ADMIN_PASSWORD
    }

    if (isValid) {
      clearFailures(ip)
      const cookieStore = await cookies()
      cookieStore.set("__Host-upload_auth", "authenticated", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 24,
        path: "/",
      })

      return NextResponse.json({ success: true })
    } else {
      recordFailure(ip)
      return NextResponse.json(
        { error: "密碼錯誤" },
        { status: 401 }
      )
    }
  } catch {
    return NextResponse.json(
      { error: "伺服器錯誤" },
      { status: 500 }
    )
  }
}

export async function GET() {
  const cookieStore = await cookies()
  const authCookie =
    cookieStore.get("__Host-upload_auth") || cookieStore.get("upload_auth")

  return NextResponse.json({
    authenticated: authCookie?.value === "authenticated",
  })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete("__Host-upload_auth")
  cookieStore.delete("upload_auth")

  return NextResponse.json({ success: true })
}
