import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import Image from "next/image"
import { unstable_noStore } from "next/cache"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { AnimationWrapper } from "@/components/AnimationWrapper"
import { getBrandsData, getProductsData, getPageLayout } from "@/lib/blob-data"
import type { Brand, Product, ProductDetailLayout } from "@/lib/products"
import { ProductCard } from "@/components/ProductCard"
import { SectionCanvas } from "@/components/SectionCanvas"
import { cn } from "@/lib/utils"

interface Params {
  brand: string
}

export const dynamic = "force-dynamic"

export default async function BrandProductsPage({ params }: { params: Params }) {
  unstable_noStore()
  const brands = (await getBrandsData()) as Brand[]
  const products = (await getProductsData()) as Product[]
  const brand = brands.find((b) => b.id === params.brand)
  const cookieStore = await cookies()
  const isAdmin =
    cookieStore.get("__Host-upload_auth")?.value === "authenticated" ||
    cookieStore.get("upload_auth")?.value === "authenticated"

  if (!brand) {
    redirect("/products")
  }

  const onlineProducts = products.filter(
    (p) => p.brand === brand.id && p.online !== false
  )

  const headerLayout = await getPageLayout(`brand:${brand.id}:header`) as ProductDetailLayout | null

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="w-full border-b bg-gradient-to-b from-background to-background/80">
          <SectionCanvas
            sectionKey={`brand:${brand.id}:header`}
            isAdmin={isAdmin}
            initialLayout={headerLayout}
            defaultHeight={400}
            fallback={
              <div className="container px-4 md:px-8 lg:px-12 py-10 md:py-16 space-y-6">
                <AnimationWrapper animation="slide-up">
                  <p className="inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-3">
                    產品介紹
                  </p>
                  {brand.logoImage && (
                    <div className="mb-6">
                      <div className="logo-container logo-border inline-block relative p-[5px] rounded-lg">
                        <div className="bg-white rounded-lg p-8 md:p-12 shadow-sm relative">
                          <div className="relative w-64 h-32 md:w-80 md:h-40 lg:w-96 lg:h-48">
                            <Image src={brand.logoImage} alt={`${brand.name} Logo`} fill className="object-contain" priority />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
                    {brand.description}
                  </p>
                </AnimationWrapper>
              </div>
            }
          />
        </section>

        {brand.id === "Schneider" && (
          <section className="w-full py-8 md:py-12 bg-muted/40 border-b border-border/40">
            <div className="w-full px-2 md:px-4 lg:px-6">
              <AnimationWrapper animation="slide-up">
                <div className="mx-auto w-full max-w-4xl">
                  <div className="videobox w-full">
                    <video
                      src="https://www.schneider-digital.com/wp-content/downloadcenter/Tools_Ressourcen/3D-PluraView/Video_Tutorials/How-To_unpack_and_setup_27-28inch_3D-PluraVIEW.mp4"
                      className="w-full aspect-video rounded-lg border border-border/40"
                      controls preload="metadata" title="3D PluraView 產品介紹影片"
                    />
                  </div>
                </div>
              </AnimationWrapper>
            </div>
          </section>
        )}

        <section className="w-full py-10 md:py-14">
          <div className="container px-4 md:px-8 lg:px-12">
            <AnimationWrapper animation="slide-up">
              {onlineProducts.length > 0 ? (
                <div className={cn(
                  "grid gap-6 md:gap-8 items-stretch",
                  onlineProducts.length === 1 ? "grid-cols-1 max-w-md mx-auto"
                    : onlineProducts.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto"
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                )}>
                  {onlineProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} delay={80 * index} showTag isAdmin={isAdmin} />
                  ))}
                </div>
              ) : (
                <div className="max-w-2xl mx-auto text-center text-sm md:text-base text-muted-foreground">
                  <p className="mb-2">本品牌的產品內容目前尚未於網站上架或仍在整理中。</p>
                  <p>若您需要 {brand.name} 相關詳細資料，歡迎透過下方聯絡方式與我們聯繫。</p>
                </div>
              )}
            </AnimationWrapper>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
