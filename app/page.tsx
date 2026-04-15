import { cookies } from "next/headers"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { ProductsSection } from "@/components/ProductsSection"
import { getPageLayouts } from "@/lib/blob-data"
import type { ProductDetailLayout } from "@/lib/products"
import { HomeContent } from "@/components/HomeContent"

export const dynamic = "force-dynamic"

export default async function Home() {
  const cookieStore = await cookies()
  const isAdmin =
    cookieStore.get("__Host-upload_auth")?.value === "authenticated" ||
    cookieStore.get("upload_auth")?.value === "authenticated"

  const allLayouts = await getPageLayouts() as Record<string, ProductDetailLayout>

  const sectionLayouts = {
    hero: allLayouts["home:hero"] ?? null,
    services: allLayouts["home:services"] ?? null,
    servicesExtra: allLayouts["home:services-extra"] ?? null,
    about: allLayouts["home:about"] ?? null,
  }

  const serviceTexts = (allLayouts as Record<string, unknown>)["home:serviceTexts"] as {
    heading: string; subheading: string; cards: { title: string; description: string }[]
  } | undefined

  return (
    <div className="flex min-h-screen flex-col" id="top">
      <Navbar />
      <main className="flex-1">
        <HomeContent
          isAdmin={isAdmin}
          sectionLayouts={sectionLayouts}
          initialServiceTexts={serviceTexts || undefined}
        />
        <ProductsSection />
      </main>
      <Footer />
    </div>
  )
}
