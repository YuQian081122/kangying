import type { MetadataRoute } from "next"
import { getBrandsData, getProductsData } from "@/lib/blob-data"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://kangying.com.tw"

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ]

  const brands = (await getBrandsData()) as { id?: string }[]
  const brandPages: MetadataRoute.Sitemap = brands
    .filter((b) => b.id)
    .map((brand) => ({
      url: `${baseUrl}/products/company/${brand.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))

  const products = (await getProductsData()) as { slug?: string }[]
  const productPages: MetadataRoute.Sitemap = products
    .filter((p) => p.slug)
    .map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))

  return [...staticPages, ...brandPages, ...productPages]
}
