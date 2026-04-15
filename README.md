# DawnGS 個人網站

這是重建的 DawnGS 關於我頁面，完全複製了原始網站的框架和視覺效果。

## 技術棧

- **Next.js 14** - React 框架（App Router）
- **TypeScript** - 類型安全
- **Tailwind CSS** - 樣式框架
- **next-themes** - 主題切換
- **Lucide React** - 圖標庫

## 功能特性

- ✅ 響應式設計（移動端和桌面端）
- ✅ 深色/淺色主題切換
- ✅ 粒子背景動畫效果
- ✅ 滑入、淡入等動畫效果
- ✅ 經驗標籤頁切換
- ✅ 完整的個人資料展示

## 開始使用

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

打開 [http://localhost:3000](http://localhost:3000) 查看網站。

### 構建生產版本

```bash
npm run build
npm start
```

## 項目結構

```
.
├── app/
│   ├── about/
│   │   └── page.tsx          # 關於我頁面
│   ├── layout.tsx             # 根布局
│   ├── page.tsx               # 首頁
│   └── globals.css            # 全局樣式
├── components/
│   ├── AboutContent.tsx        # 關於我內容
│   ├── AnimationWrapper.tsx   # 動畫包裝器
│   ├── ExperienceTabs.tsx     # 經驗標籤頁
│   ├── Footer.tsx             # 頁腳
│   ├── Navbar.tsx             # 導航欄
│   ├── ParticleBackground.tsx # 粒子背景
│   ├── PopInContainer.tsx     # 彈出動畫容器
│   ├── ProfileCard.tsx        # 個人資料卡片
│   ├── SkillsCard.tsx        # 技術專長卡片
│   ├── SlideInContainer.tsx   # 滑入動畫容器
│   └── ThemeProvider.tsx      # 主題提供者
└── lib/
    └── utils.ts               # 工具函數
```

## 樣式說明

網站使用 Tailwind CSS 進行樣式設計，主要顏色為紫色（primary），支持深色和淺色主題切換。

## 授權

© 2025 DawnGS➤All rights reserved.
