"use client"

import { useState } from "react"
import type { ProductDetailLayout, ProductDetailElement } from "@/lib/products"
import { SectionCanvas } from "@/components/SectionCanvas"
import { Pencil, Check, X as XIcon } from "lucide-react"

type ServiceData = { title: string; description: string }

type HomeContentProps = {
  isAdmin: boolean
  sectionLayouts: {
    hero: ProductDetailLayout | null
    services: ProductDetailLayout | null
    servicesExtra: ProductDetailLayout | null
    about: ProductDetailLayout | null
  }
  initialServiceTexts?: {
    heading: string
    subheading: string
    cards: ServiceData[]
  }
}

function EditableServiceCard({ data, isEditing, onChange }: {
  data: ServiceData; isEditing: boolean; onChange: (d: ServiceData) => void
}) {
  if (isEditing) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col gap-2 p-5 overflow-hidden border-primary/40">
        <input type="text" value={data.title} onChange={(e) => onChange({ ...data, title: e.target.value })}
          className="font-semibold text-base md:text-lg bg-transparent outline-none border-b border-primary/30 pb-1 focus-visible:border-primary" />
        <textarea value={data.description} onChange={(e) => onChange({ ...data, description: e.target.value })} rows={3}
          className="text-xs md:text-sm text-muted-foreground bg-transparent outline-none resize-none focus-visible:ring-1 focus-visible:ring-primary rounded" />
      </div>
    )
  }
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col gap-2 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40 focus-within:ring-2 focus-within:ring-primary/50 motion-reduce:transition-none overflow-hidden">
      <div className="p-5 flex flex-col gap-2">
        <h3 className="font-semibold text-base md:text-lg">{data.title}</h3>
        <p className="text-xs md:text-sm text-muted-foreground">{data.description}</p>
      </div>
    </div>
  )
}

const defaultServiceTexts = {
  heading: "服務介紹",
  subheading: "提供從測量規劃、數據採集到成果製作的一站式專業服務，協助客戶提升作業效率與精度。",
  cards: [
    { title: "航空測量", description: "運用航空攝影與影像測量技術，快速取得大範圍高精度地形與影像資料。" },
    { title: "RTK 測量", description: "結合高精度 GNSS 設備與 RTK 技術，提供即時定位與控制點測量服務。" },
    { title: "無人機測繪", description: "以專業無人機與軟體流程，進行地形、工程、農業等多元應用之測繪作業。" },
    { title: "立體製圖", description: "透過立體觀測與專業軟體，製作精確的等高線、地形圖與三維模型。" },
  ],
}

function ServicesSection({ isAdmin, initialTexts }: {
  isAdmin: boolean
  initialTexts: typeof defaultServiceTexts
}) {
  const [texts, setTexts] = useState(initialTexts)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [backup] = useState(() => JSON.parse(JSON.stringify(initialTexts)))

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch("/api/upload/page-layouts?key=home:serviceTexts", {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout: texts }),
      })
      setEditing(false)
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const handleDiscard = () => {
    setTexts(JSON.parse(JSON.stringify(backup)))
    setEditing(false)
  }

  return (
    <div className="container px-4 md:px-8 lg:px-12 relative group">
      {isAdmin && !editing && (
        <button type="button" onClick={() => setEditing(true)}
          className="absolute top-0 right-4 z-20 inline-flex items-center gap-1.5 rounded-md bg-primary/90 px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-lg hover:bg-primary opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil className="h-3 w-3" /> 編輯文字
        </button>
      )}
      {isAdmin && editing && (
        <div className="flex items-center gap-2 mb-4">
          <button type="button" onClick={handleDiscard} className="inline-flex items-center gap-1 rounded-md border border-red-400/60 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20">
            <XIcon className="h-3 w-3" /> 取消
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            <Check className="h-3 w-3" /> {saving ? "儲存中\u2026" : "儲存文字"}
          </button>
        </div>
      )}
      <div className="max-w-2xl mx-auto text-center mb-8 md:mb-10">
        {editing ? (
          <>
            <input type="text" value={texts.heading} onChange={(e) => setTexts((p) => ({ ...p, heading: e.target.value }))}
              className="text-2xl md:text-3xl font-bold mb-2 bg-transparent outline-none text-center w-full border-b border-primary/30 pb-1 focus-visible:border-primary" />
            <input type="text" value={texts.subheading} onChange={(e) => setTexts((p) => ({ ...p, subheading: e.target.value }))}
              className="text-sm md:text-base text-muted-foreground bg-transparent outline-none text-center w-full focus-visible:ring-1 focus-visible:ring-primary rounded" />
          </>
        ) : (
          <>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">{texts.heading}</h2>
            <p className="text-sm md:text-base text-muted-foreground">{texts.subheading}</p>
          </>
        )}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {texts.cards.map((card, i) => (
          <EditableServiceCard key={i} data={card} isEditing={editing}
            onChange={(d) => setTexts((p) => ({ ...p, cards: p.cards.map((c, j) => j === i ? d : c) }))} />
        ))}
      </div>
    </div>
  )
}

const heroDefaultElements: ProductDetailElement[] = [
  { id: "hero-badge", type: "paragraph", x: 40, y: 30, width: 400, height: 40, props: { text: "空間資訊與無人機測繪專業團隊", fontSize: 14, color: "#60a5fa", background: "rgba(59,130,246,0.08)", borderRadius: "9999px", padding: "4px 16px", border: true } },
  { id: "hero-title", type: "paragraph", x: 40, y: 80, width: 800, height: 80, props: { text: "康鷹空間資訊有限公司", fontSize: 48, color: "#ffffff", bold: true } },
  { id: "hero-desc", type: "paragraph", x: 40, y: 180, width: 700, height: 100, props: { text: "自民國 78 年成立以來，致力於測量儀器軟體、硬體之銷售與服務，並提供航空測量、RTK 測量、無人機測繪及立體製圖等整合型空間資訊解決方案。", fontSize: 16, color: "#a1a1aa" } },
  { id: "hero-btn1", type: "button", x: 40, y: 300, width: 180, height: 48, props: { text: "查看服務介紹", fontSize: 16, color: "#ffffff" } },
  { id: "hero-btn2", type: "button", x: 240, y: 300, width: 180, height: 48, props: { text: "瞭解產品訊息", fontSize: 16, color: "#60a5fa", background: "transparent" } },
]

const aboutDefaultElements: ProductDetailElement[] = [
  { id: "about-badge", type: "paragraph", x: 450, y: 20, width: 300, height: 30, props: { text: "關於我們", fontSize: 14, color: "#60a5fa", background: "rgba(59,130,246,0.08)", borderRadius: "9999px", padding: "4px 16px", border: true } },
  { id: "about-title", type: "paragraph", x: 400, y: 60, width: 400, height: 50, props: { text: "公司介紹", fontSize: 32, color: "#ffffff", bold: true } },
  { id: "about-p1", type: "paragraph", x: 150, y: 130, width: 900, height: 70, props: { text: "康鷹空間資訊有限公司自民國 78 年成立以來，致力於測量儀器軟體、硬體之銷售與服務，並提供航空測量、RTK 測量、無人機測繪及立體製圖等整合型空間資訊解決方案。", fontSize: 16, color: "#a1a1aa" } },
  { id: "about-p2", type: "paragraph", x: 150, y: 210, width: 900, height: 70, props: { text: "我們與多家國內外專業廠商合作，代理優質的測量儀器與軟體產品，包括固定翼無人機、LiDAR 光達掃描系統、立體測圖軟體、3D 顯示設備等，為客戶提供完整的測繪解決方案。", fontSize: 16, color: "#a1a1aa" } },
  { id: "about-p3", type: "paragraph", x: 150, y: 290, width: 900, height: 70, props: { text: "憑藉多年的專業經驗與技術服務，我們協助政府機關、工程顧問公司、測量公司等各類客戶完成各項測量與製圖專案，致力於提供最專業、可靠的產品與服務。", fontSize: 16, color: "#a1a1aa" } },
]

export function HomeContent({ isAdmin, sectionLayouts, initialServiceTexts }: HomeContentProps) {
  const serviceTexts = initialServiceTexts || defaultServiceTexts

  return (
    <>
      {/* Hero */}
      <section className="w-full border-b bg-gradient-to-b from-background to-background/80">
        <SectionCanvas
          sectionKey="home:hero"
          isAdmin={isAdmin}
          initialLayout={sectionLayouts.hero}
          defaultHeight={400}
          defaultElements={heroDefaultElements}
          fallback={
            <div className="container px-4 md:px-8 lg:px-12 py-12 md:py-20 flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1 space-y-4 text-center md:text-left">
                <p className="inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-2">
                  空間資訊與無人機測繪專業團隊
                </p>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                  康鷹空間資訊有限公司
                </h1>
                <p className="text-muted-foreground text-sm md:text-base max-w-xl md:max-w-2xl mx-auto md:mx-0">
                  自民國 78 年成立以來，致力於測量儀器軟體、硬體之銷售與服務，
                  並提供航空測量、RTK 測量、無人機測繪及立體製圖等整合型空間資訊解決方案。
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                  <a href="#services"
                    className="relative inline-flex items-center justify-center rounded-md bg-gradient-to-r from-primary to-secondary text-primary-foreground text-sm font-medium h-11 px-6 transition-[transform,box-shadow] duration-300 ease-out hover:shadow-[0_0_22px_rgba(59,130,246,0.7)] hover:-translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none">
                    查看服務介紹
                  </a>
                  <a href="#products"
                    className="relative inline-flex items-center justify-center rounded-md border border-primary/40 bg-background text-sm font-medium h-11 px-6 text-primary transition-[transform,box-shadow,background-color,color] duration-300 ease-out hover:bg-primary/5 hover:text-primary hover:shadow-[0_0_18px_rgba(59,130,246,0.5)] hover:-translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none">
                    瞭解產品訊息
                  </a>
                </div>
              </div>
            </div>
          }
        />
      </section>

      {/* Services - inline editable text, NOT canvas */}
      <section id="services" className="w-full py-12 md:py-16 bg-muted/40">
        <ServicesSection isAdmin={isAdmin} initialTexts={serviceTexts} />
      </section>

      {/* Extra canvas below services */}
      <section className="w-full py-8 md:py-12">
        <div className="container px-4 md:px-8 lg:px-12">
          <SectionCanvas
            sectionKey="home:services-extra"
            isAdmin={isAdmin}
            initialLayout={sectionLayouts.servicesExtra}
            defaultHeight={400}
            fallback={null}
          />
        </div>
      </section>

      {/* Company Introduction */}
      <section id="about" className="w-full py-12 md:py-16">
        <SectionCanvas
          sectionKey="home:about"
          isAdmin={isAdmin}
          initialLayout={sectionLayouts.about}
          defaultHeight={400}
          defaultElements={aboutDefaultElements}
          fallback={
            <div className="container px-4 md:px-8 lg:px-12">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8 md:mb-10">
                  <p className="inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-3">
                    關於我們
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">公司介紹</h2>
                </div>
                <div className="space-y-4 text-sm md:text-base text-muted-foreground leading-relaxed">
                  <p>康鷹空間資訊有限公司自民國 78 年成立以來，致力於測量儀器軟體、硬體之銷售與服務，並提供航空測量、RTK 測量、無人機測繪及立體製圖等整合型空間資訊解決方案。</p>
                  <p>我們與多家國內外專業廠商合作，代理優質的測量儀器與軟體產品，包括固定翼無人機、LiDAR 光達掃描系統、立體測圖軟體、3D 顯示設備等，為客戶提供完整的測繪解決方案。</p>
                  <p>憑藉多年的專業經驗與技術服務，我們協助政府機關、工程顧問公司、測量公司等各類客戶完成各項測量與製圖專案，致力於提供最專業、可靠的產品與服務。</p>
                </div>
              </div>
            </div>
          }
        />
      </section>
    </>
  )
}
