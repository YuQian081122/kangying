# 康鷹空間資訊 - NAS 部署指南

## 系統需求

- NAS（Synology / QNAP 或任何支援 Docker 的設備）
- Docker + Docker Compose
- 網域：kangying.com.tw（DNS 已設定指向 NAS 公網 IP）
- 路由器已將 80 與 443 port 轉發到 NAS

---

## 快速部署

### 1. 設定環境變數

```bash
cp .env.example .env.local
```

編輯 `.env.local`：

```env
ADMIN_PASSWORD=請設定強密碼
DATA_DIR=/data
DATA_PATH=/volume1/docker/kangying/data   # 改為 NAS 實際路徑
```

**產生 bcrypt 密碼雜湊（建議）：**

```bash
node -e "const b=require('bcryptjs');b.hash('你的密碼',10).then(h=>console.log(h))"
```

將產生的雜湊值設為 `ADMIN_PASSWORD`。

### 2. 初始化資料目錄

```bash
mkdir -p data/json data/uploads data/backups
```

### 3. 建構與啟動

```bash
docker compose build
docker compose up -d
```

### 4. 取得 SSL 憑證（首次）

```bash
bash scripts/init-ssl.sh your-email@example.com
```

### 5. 驗證

瀏覽 `https://kangying.com.tw` 確認網站正常運作。

---

## 安全架構（5 層防護）

| 層級 | 防護措施 | 設定位置 |
|------|---------|---------|
| 第 1 層 - 網路 | 路由器防火牆，僅開放 443 | 路由器設定 |
| 第 2 層 - 傳輸 | TLS 1.2/1.3 + HSTS + OCSP | `nginx/conf.d/default.conf` |
| 第 3 層 - 應用 | Rate Limit + IP 白名單 | `nginx/nginx.conf` |
| 第 4 層 - 程式 | bcrypt 認證 + 安全標頭 + 登入鎖定 | `middleware.ts` + `auth/route.ts` |
| 第 5 層 - 資料 | 檔案權限 + 加密備份 | `backup.sh` |

### 啟用管理後台 IP 白名單

編輯 `nginx/conf.d/default.conf`，取消註解 IP 白名單：

```nginx
location /api/upload/ {
    allow 192.168.1.0/24;    # 公司內網
    allow YOUR_PUBLIC_IP;     # 特定公網 IP
    deny all;
    ...
}
```

---

## 備份機制

### 自動備份（建議設定 cron）

```bash
# 每日凌晨 3 點執行全量備份
0 3 * * * /path/to/web/scripts/backup.sh >> /var/log/kangying-backup.log 2>&1
```

### 備份範圍

- `data/json/brands.json` - 品牌資料
- `data/json/products.json` - 產品資料（含 detailLayout 畫布配置）
- `data/uploads/` - 所有上傳的圖片與影片（含畫布引用的媒體）

### 手動備份

```bash
bash scripts/backup.sh                    # 預設備份到 data/backups/
bash scripts/backup.sh /mnt/external-hdd  # 備份到外接硬碟
```

### 還原

```bash
# 預覽（dry-run）
node scripts/recover-products-from-backup.mjs --file data/backups/backup-2026-04-14/json/products.json

# 執行還原（含畫布資料）
node scripts/recover-products-from-backup.mjs --file data/backups/backup-2026-04-14/ --apply --restore-uploads
```

---

## 常用指令

```bash
# 啟動
docker compose up -d

# 停止
docker compose down

# 查看日誌
docker compose logs -f

# 重建（程式碼更新後）
docker compose build && docker compose up -d

# 備份
bash scripts/backup.sh

# SSL 手動續期
docker compose run --rm certbot renew
```

---

## DNS 設定

在你的域名管理面板（kangying.com.tw）設定：

| 類型 | 名稱 | 值 |
|------|------|---|
| A | @ | NAS 的公網 IP |
| A | www | NAS 的公網 IP |

如果公網 IP 會變動，建議使用 DDNS 服務（如 Cloudflare DNS API）自動更新。

---

## 本地開發

```bash
# 安裝依賴
npm install

# 設定環境變數
echo "ADMIN_PASSWORD=dev123" > .env.local

# 啟動開發伺服器
npm run dev
```

本地開發時資料存放在 `./data/` 目錄，無需 Docker。
