"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import type { Brand, Product } from "@/lib/products"

export function ProductsSection() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [bRes, pRes] = await Promise.all([
          fetch(`/api/upload/brands?t=${Date.now()}`, { cache: "no-store" }),
          fetch(`/api/upload/products?t=${Date.now()}`, { cache: "no-store" }),
        ])
        const [bData, pData] = await Promise.all([bRes.json(), pRes.json()])
        setBrands(bData.brands ?? [])
        setProducts(pData.products ?? [])
      } catch {
        setBrands([])
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <section id="products" className="w-full py-12 md:py-16">
        <div className="container px-4 md:px-8 lg:px-12">
          <div className="max-w-2xl mx-auto text-center mb-8 md:mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">產品介紹</h2>
            <p className="text-sm md:text-base text-muted-foreground">
              載入中\u2026
            </p>
          </div>
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="products" className="w-full py-12 md:py-16">
      <div className="container px-4 md:px-8 lg:px-12">
        <div className="max-w-2xl mx-auto text-center mb-8 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">產品介紹</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            代理多家國內外專業品牌，提供可靠穩定的測量儀器與軟體解決方案。
            請先選擇合作公司，再進一步瀏覽該公司旗下的產品與應用。
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
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
                    <h3 className="font-semibold text-base md:text-lg leading-snug text-center">
                      {brand.name}
                    </h3>
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
        <div className="flex justify-center">
          <Link
            href="/products"
            className="relative inline-flex items-center justify-center rounded-md bg-gradient-to-r from-primary to-secondary text-primary-foreground text-sm font-medium h-11 px-6 transition-all duration-300 ease-out hover:shadow-[0_0_22px_rgba(59,130,246,0.7)] hover:-translate-y-[2px]"
          >
            查看所有產品介紹
          </Link>
        </div>
      </div>
    </section>
  )
}
