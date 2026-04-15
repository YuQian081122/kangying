import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { AnimationWrapper } from "@/components/AnimationWrapper"
import { getProductsData } from "@/lib/blob-data"
import type { Product } from "@/lib/products"
import { ImageCarousel } from "@/components/ImageCarousel"
import { ProductCanvas } from "@/components/ProductCanvas"

type Params = {
  slug: string
}

export const dynamic = "force-dynamic"

export async function generateStaticParams() {
  const products = (await getProductsData()) as Product[]
  return products.filter((p) => p?.slug).map((product) => ({
    slug: product.slug,
  }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const products = (await getProductsData()) as Product[]
  const product = products.find((p) => p.slug === params.slug)
  if (!product) {
    return {
      title: "產品未找到",
    }
  }

  const brandLabel = product.brand ? ` - ${product.brand}` : ""
  const featuresText = product.features?.slice(0, 3).join("、") || ""
  const desc = featuresText
    ? `${product.description} 特色：${featuresText}`
    : product.description

  return {
    title: `${product.name}${brandLabel}`,
    description: desc,
    openGraph: {
      title: `${product.name} | 康鷹空間資訊`,
      description: desc,
      type: "article",
      images: product.images?.[0] ? [{ url: product.images[0], alt: product.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: desc,
      images: product.images?.[0] ? [product.images[0]] : [],
    },
  }
}

export default async function ProductDetailPage({ params }: { params: Params }) {
  const products = (await getProductsData()) as Product[]
  const product = products.find((p) => p.slug === params.slug)

  if (!product) {
    return notFound()
  }

  const { name, category, description, images, features, detailContentHtml } = product

  const cookieStore = await cookies()
  const isAdmin =
    cookieStore.get("__Host-upload_auth")?.value === "authenticated" ||
    cookieStore.get("upload_auth")?.value === "authenticated"

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="w-full border-b bg-gradient-to-b from-background to-background/80">
          <div className="container px-4 md:px-8 lg:px-12 py-10 md:py-16 grid gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
            <AnimationWrapper animation="slide-up">
              <p className="inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-3">
                {category}
              </p>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-4">
                {name}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6">
                {description}
              </p>

              {features && features.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-sm md:text-base font-semibold">產品重點特色</h2>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs md:text-sm text-muted-foreground">
                    {features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AnimationWrapper>

            <AnimationWrapper animation="slide-up" delay={120}>
              <div className="w-full rounded-xl border bg-card/80 backdrop-blur-sm shadow-md overflow-hidden">
                {images && images.length > 0 ? (
                  <ImageCarousel
                    images={images.map((src, idx) => ({
                      src,
                      alt:
                        idx === 0
                          ? `${name} 產品主視覺`
                          : `${name} 產品圖片 ${idx + 1}`,
                    }))}
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center text-xs md:text-sm text-muted-foreground">
                    此產品圖片尚未設定，請稍後再試。
                  </div>
                )}
              </div>
            </AnimationWrapper>
          </div>
        </section>

        <section id="canvas" className="w-full bg-background py-10 md:py-16 scroll-mt-24">
          <div className="w-full px-3 md:px-6">
            <ProductCanvas product={product} isAdmin={isAdmin} scrollToCanvasIfHash />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

