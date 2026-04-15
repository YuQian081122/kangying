import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { unstable_noStore } from 'next/cache'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { AnimationWrapper } from '@/components/AnimationWrapper'
import { getBrandsData, getProductsData, getPageLayout } from '@/lib/blob-data'
import type { Brand, Product, ProductDetailLayout } from '@/lib/products'
import { SectionCanvas } from '@/components/SectionCanvas'

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "產品介紹 - 合作品牌與測量設備總覽",
  description:
    "康鷹空間資訊代理之測量儀器、無人機、LiDAR 光達、立體測圖軟體、3D 顯示設備等產品品牌總覽。提供完整的空間資訊測繪解決方案。",
  openGraph: {
    title: "產品介紹 | 康鷹空間資訊",
    description:
      "瀏覽我們代理的測量儀器品牌與產品，包含無人機、LiDAR、GNSS 等專業設備。",
  },
}

export default async function ProductsPage() {
  unstable_noStore()
  const brands = (await getBrandsData()) as Brand[]
  const products = (await getProductsData()) as Product[]

  const cookieStore = await cookies()
  const isAdmin =
    cookieStore.get("__Host-upload_auth")?.value === "authenticated" ||
    cookieStore.get("upload_auth")?.value === "authenticated"

  const headerLayout = await getPageLayout("products:header") as ProductDetailLayout | null

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="w-full border-b bg-gradient-to-b from-background to-background/80">
          <SectionCanvas
            sectionKey="products:header"
            isAdmin={isAdmin}
            initialLayout={headerLayout}
            defaultHeight={300}
            fallback={
              <div className="container px-4 md:px-8 lg:px-12 py-10 md:py-16 space-y-6">
                <AnimationWrapper animation="slide-up">
                  <p className="inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-3">
                    產品介紹
                  </p>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-3">
                    合作品牌與服務公司總覽
                  </h1>
                  <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
                    我們與多家國內外專業廠商合作，提供從航空測量、無人機測繪到立體製圖的完整解決方案。
                    您可以先選擇合作品牌，再瀏覽各品牌旗下的產品與應用。
                  </p>
                </AnimationWrapper>
              </div>
            }
          />
        </section>

        <section className="w-full py-10 md:py-14">
          <div className="container px-4 md:px-8 lg:px-12">
            <AnimationWrapper animation="slide-up">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {brands.map((brand, index) => {
                  const onlineProducts = products.filter(
                    (p) => p.brand === brand.id && p.online !== false
                  )
                  const count = onlineProducts.length

                  return (
                    <Link
                      key={brand.id}
                      href={`/products/company/${brand.id}`}
                      className="group rounded-lg border bg-card text-card-foreground shadow-sm p-5 flex flex-col gap-3 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
                      style={{ transitionDelay: `${index * 60}ms` }}
                    >
                      <div className="flex flex-col items-center gap-3 flex-1 min-h-[140px]">
                        {brand.logoImage ? (
                          <div className="relative w-full h-24 md:h-28 flex items-center justify-center bg-white/5 rounded-lg p-4">
                            <Image
                              src={brand.logoImage}
                              alt={`${brand.name} Logo`}
                              fill
                              className="object-contain p-2"
                            />
                          </div>
                        ) : (
                          <h2 className="font-semibold text-base md:text-lg leading-snug text-center">
                            {brand.name}
                          </h2>
                        )}
                        <div className="flex items-center justify-center">
                          {count > 0 ? (
                            <span className="text-[11px] md:text-xs text-primary font-medium">
                              已上架 {count} 項產品
                            </span>
                          ) : (
                            <span className="text-[11px] md:text-xs text-muted-foreground">
                              產品尚未上架
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="pt-1 flex justify-end">
                        <span className="inline-flex items-center text-[11px] md:text-xs font-medium text-primary hover:text-primary/80 hover:underline underline-offset-4">
                          查看此公司產品
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </AnimationWrapper>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
