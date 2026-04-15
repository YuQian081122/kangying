import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/upload"],
      },
    ],
    sitemap: "https://kangying.com.tw/sitemap.xml",
  }
}
