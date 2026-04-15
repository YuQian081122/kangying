import { NextResponse } from "next/server"
import { getBrandsData, getProductsData } from "@/lib/blob-data"

export const dynamic = "force-dynamic"

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Debug endpoint is disabled in production" },
      { status: 404 }
    )
  }

  try {
    const brands = await getBrandsData()
    const products = await getProductsData()

    return NextResponse.json({
      storage: "local-filesystem",
      dataDir: process.env.DATA_DIR || "data/",
      brands: {
        count: Array.isArray(brands) ? brands.length : 0,
      },
      products: {
        count: Array.isArray(products) ? products.length : 0,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
