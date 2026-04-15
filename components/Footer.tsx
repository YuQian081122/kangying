"use client"

import Link from "next/link"
import { Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer id="footer" className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 scroll-mt-20">
      <div className="container px-4 md:px-8 lg:px-12 py-10 md:py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">康鷹空間資訊有限公司</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Kang Ying Spatial Information Co., Ltd.
            </p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} 版權所有
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm">聯絡資訊</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                <a href="tel:0975715035" className="hover:text-primary transition-colors">
                  0975-715-035
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                <Link href="mailto:allen19802@gmail.com" className="hover:text-primary transition-colors">
                  allen19802@gmail.com
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm">公司據點</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary/70" />
                <div>
                  <p className="font-medium text-foreground/80">總公司</p>
                  <p>新北市新店區安興路 125-1 號 6F</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary/70" />
                <div>
                  <p className="font-medium text-foreground/80">南投辦公室</p>
                  <p>南投縣南投市向上路 9 號</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
