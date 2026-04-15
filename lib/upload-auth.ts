import { cookies } from "next/headers"

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const newCookie = cookieStore.get("__Host-upload_auth")
  const legacyCookie = cookieStore.get("upload_auth")
  return (
    newCookie?.value === "authenticated" ||
    legacyCookie?.value === "authenticated"
  )
}

export async function requireAuth() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    throw new Error("未授權")
  }
}
