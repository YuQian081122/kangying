# NAS 部署檢查清單

## 部署前

- [ ] `.env.local` 已設定強密碼 `ADMIN_PASSWORD`
- [ ] `DATA_PATH` 指向 NAS 持久化磁碟路徑
- [ ] DNS 設定 `kangying.com.tw` / `www` 指向 NAS
- [ ] 路由器已轉發 80 / 443
- [ ] `data/json`, `data/uploads`, `data/backups` 目錄存在

## 首次上線

- [ ] 執行 `npm run nas:deploy`
- [ ] 首次 SSL 申請（若尚未做）：`bash scripts/init-ssl.sh your-email@example.com`
- [ ] 瀏覽 `https://kangying.com.tw` 正常
- [ ] `/upload` 可登入
- [ ] 產品頁圖片、影片正常載入

## 每次更新

- [ ] 優先執行 `npm run nas:go`（一鍵檢查 + 備份 + 更新 + 失敗自動回滾）
- [ ] 或手動執行 `npm run nas:update`
- [ ] 首頁可開啟
- [ ] 產品列表可開啟
- [ ] 產品內頁可開啟
- [ ] 後台 `/upload` 可登入與儲存

## 備份與還原驗證（每月）

- [ ] `npm run backup` 可成功產生壓縮檔
- [ ] 抽樣檢查備份包含 `json/` 與 `uploads/`
- [ ] 測試 `npm run nas:restore -- <backup.tar.gz>`
- [ ] 還原後首頁與產品資料正確

## 故障處理

- [ ] 先看 `docker compose logs --tail=200`
- [ ] 部署故障時執行 `npm run nas:rollback`
- [ ] 無法回滾時，改走備份還原流程
