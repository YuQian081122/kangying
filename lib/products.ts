export type ProductCategory =
  | "航空測量"
  | "RTK 測量"
  | "無人機測繪"
  | "立體製圖"

export type ProductType =
  | "uav"
  | "software"
  | "integration"
  | "platform"
  | "lidar"
  | "camera"
  | "stereo_equipment"

export type BrandId =
  | "AgEagle"
  | "DATEM"
  | "SHARE"
  | "XGRIDS"
  | "Schneider"

export type CanvasElementType = "title" | "paragraph" | "image" | "video" | "featureList" | "card" | "button"

export interface ProductDetailElement {
  id: string
  type: CanvasElementType
  x: number
  y: number
  width: number
  height: number
  zIndex?: number
  props: Record<string, any>
}

export interface ProductDetailLayout {
  elements: ProductDetailElement[]
  /**
   * 畫布高度（px），可由後台調整；未設定時使用預設值
   */
  canvasHeight?: number
}

export interface Brand {
  id: BrandId
  name: string
  description: string
  shortDescription?: string
  productFeatures?: string
  logoImage?: string
}

export interface Product {
  id: string
  name: string
  category: ProductCategory
  type: ProductType
  description: string
  /**
   * 產品詳細內容（HTML），用於產品頁底部的富文字區塊
   */
  detailContentHtml?: string
  /**
   * 產品詳細畫布布局，用於產品頁下方畫布編輯器
   */
  detailLayout?: ProductDetailLayout
   /**
   * 路由識別（/products/[slug]）
   * 例如 /products/AgEagle
   */
  slug: string
  /**
   * 所屬品牌 / 公司
   */
  brand: BrandId
  /**
   * 本站圖片路徑，放在 public/products/<slug>/ 底下
   * 例如 /products/ageagle/main.jpg
   */
  coverImage?: string
  coverImagePosition?: string
  images?: string[]
  /**
   * 產品重點特色（選填，用於詳細頁 bullet list）
   */
  features?: string[]
  /**
   * 是否已在網站上正式上架
   * 預設為 true，未上架產品請標記為 false
   */
  online?: boolean
  tags?: string[]
  link?: string
  highlight?: boolean
}

import brandsData from "./brands.json"
import productsData from "./products.json"

export const BRANDS: Brand[] = brandsData as Brand[]

export const PRODUCTS: Product[] = productsData as Product[]

