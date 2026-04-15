import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/ThemeProvider"
import { ClickEffect } from "@/components/ClickEffect"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL("https://kangying.com.tw"),
  title: {
    default: "康鷹空間資訊有限公司 | 測量儀器與無人機測繪專家",
    template: "%s | 康鷹空間資訊",
  },
  description:
    "康鷹空間資訊有限公司成立於民國78年，專精於測量儀器軟硬體銷售與服務、航空測量、RTK 測量、無人機測繪及立體製圖等整合型空間資訊服務，致力提供專業可靠的解決方案。",
  keywords: [
    "康鷹", "康鷹空間資訊", "KangYing",
    "測量儀器", "測量設備", "測量儀器銷售", "測量儀器維修",
    "GNSS 接收器", "全站儀", "水準儀", "經緯儀", "測距儀",
    "航空測量", "航空攝影測量", "空中三角測量", "航拍測量服務", "航測影像處理",
    "RTK 測量", "RTK 定位", "即時動態定位", "GNSS RTK", "高精度測量", "控制點測量",
    "無人機測繪", "無人機航測", "UAV 測量", "無人機 LiDAR", "無人機正射影像",
    "固定翼無人機測量", "多旋翼無人機", "無人機 3D 建模", "空拍測量",
    "立體製圖", "立體測圖", "數值地形模型 DTM", "數位高程模型 DEM",
    "等高線製作", "3D 地形模型", "GIS 空間資訊", "正射影像圖",
    "LiDAR", "光達掃描", "空載光達", "地面光達", "點雲資料處理",
    "工程測量", "地籍測量", "水利測量", "道路測量", "營建測量",
    "環境監測", "國土測繪", "地形測量",
    "台灣測量公司", "新北測量服務", "南投測量服務",
  ],
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: "https://kangying.com.tw",
    siteName: "康鷹空間資訊有限公司",
    title: "康鷹空間資訊有限公司 | 測量儀器與無人機測繪專家",
    description:
      "專精測量儀器銷售、航空測量、RTK 測量、無人機測繪及立體製圖，提供整合型空間資訊解決方案。",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "康鷹空間資訊有限公司",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "康鷹空間資訊有限公司",
    description:
      "專精測量儀器銷售、航空測量、RTK 測量、無人機測繪及立體製圖服務。",
    images: ["/logo.png"],
  },
  alternates: {
    canonical: "https://kangying.com.tw",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "康鷹空間資訊有限公司",
    url: "https://kangying.com.tw",
    logo: "https://kangying.com.tw/logo.png",
    description:
      "專精於測量儀器軟硬體銷售與服務、航空測量、RTK 測量、無人機測繪及立體製圖等整合型空間資訊服務。",
    foundingDate: "1989",
    address: [
      {
        "@type": "PostalAddress",
        streetAddress: "安興路 125-1 號 6F",
        addressLocality: "新店區",
        addressRegion: "新北市",
        addressCountry: "TW",
      },
      {
        "@type": "PostalAddress",
        streetAddress: "向上路 9 號",
        addressLocality: "南投市",
        addressRegion: "南投縣",
        addressCountry: "TW",
      },
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+886-975-715-035",
      email: "allen19802@gmail.com",
      contactType: "customer service",
      availableLanguage: "zh-TW",
    },
    sameAs: [],
    knowsAbout: [
      "測量儀器", "航空測量", "RTK 測量", "無人機測繪", "立體製圖",
      "LiDAR 光達掃描", "GIS 空間資訊", "GNSS 定位",
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        <OrganizationJsonLd />
      </head>
      <body className={`${inter.className} min-h-screen bg-background font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ClickEffect />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
