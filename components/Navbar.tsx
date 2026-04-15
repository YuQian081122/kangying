"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { Menu, X, Sun, Moon, Home, Info, Package, Phone } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)

    const onScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    onScroll()
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const navItems = [
    { href: "/#top", label: "首頁", icon: Home },
    { href: "/#services", label: "服務介紹", icon: Info },
    { href: "/products", label: "產品介紹", icon: Package },
    { href: "/#footer", label: "聯絡方式", icon: Phone },
  ]

  const isActivePath = (href: string) => {
    // hash 導向只在「首頁連到頂部」時高亮，其他段落不在這裡處理 active 狀態
    if (href === "/#top") {
      return pathname === "/"
    }
    if (!href.startsWith("/#")) {
      return pathname === href
    }
    return false
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 px-4 md:px-8 lg:px-12",
        isScrolled
          ? "border-b border-border/40 bg-background/95 backdrop-blur shadow-sm"
          : "border-b border-transparent bg-background/40"
      )}
    >
      <div
        className={cn(
          "flex items-center transition-all duration-300 mx-auto max-w-5xl my-2 px-4",
          "rounded-full laser-border-container",
          isScrolled ? "h-14" : "h-16"
        )}
      >
        <div className="laser-border w-full h-full absolute inset-0 rounded-full" />

        {/* Desktop Logo */}
        <div className="mr-4 hidden md:flex relative z-10">
          <div className="w-[240px] flex-shrink-0">
            <div className="flex items-center space-x-3">
              <Link href="/#top" className="flex-shrink-0 flex items-center justify-center h-10">
                <Image
                  src="/logo.png"
                  alt="康鷹空間資訊有限公司"
                  width={40}
                  height={40}
                  className="h-full w-auto object-contain"
                />
              </Link>
              <Link href="/#top" className="font-bold text-base leading-tight">
                <span className="block whitespace-nowrap text-primary">康鷹空間資訊有限公司</span>
                <span className="block text-xs text-muted-foreground">
                  Kang Ying Enterprises Ltd.
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-1 justify-center relative z-10">
          <nav className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActivePath(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "h-10 px-4 flex items-center justify-center rounded-md text-sm whitespace-nowrap transition-all duration-200 ease-out hover:-translate-y-[1px]",
                    active
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 md:hidden mr-2 relative z-10"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          type="button"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">切換選單</span>
        </button>

        {/* Right Side Actions */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end relative z-10">
          {/* Mobile Logo */}
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <div className="mr-6 md:hidden w-[220px] flex-shrink-0">
              <div className="flex items-center space-x-3">
                <Link href="/#top" className="flex-shrink-0 flex items-center justify-center h-10">
                  <Image
                    src="/logo.png"
                    alt="康鷹空間資訊有限公司"
                    width={40}
                    height={40}
                    className="h-full w-auto object-contain"
                  />
                </Link>
                <Link href="/#top" className="font-bold text-base leading-tight">
                  <span className="block text-primary">康鷹空間資訊有限公司</span>
                  <span className="block text-[11px] text-muted-foreground">
                    測量儀器與無人機測繪
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="relative h-10 w-10 flex items-center justify-center">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 hover:-translate-y-[1px]"
              type="button"
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-[1.2rem] w-[1.2rem]" />
              ) : (
                <Moon className="h-[1.2rem] w-[1.2rem]" />
              )}
              <span className="sr-only">切換主題</span>
            </button>
          </div>

          {/* Contact Button */}
          <div className="hidden sm:block transition-all duration-500">
            <Link
              href="/#contact"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 rounded-md px-3 font-bold transition-all duration-300 bg-primary/90 text-primary-foreground hover:bg-primary"
            >
              聯絡我們
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur border-b border-border/40">
          <nav className="flex flex-col p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActivePath(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "h-10 px-4 flex items-center rounded-md transition-colors text-sm",
                    active
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}
