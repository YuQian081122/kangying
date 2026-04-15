# NAS 維運手冊（Runbook）

本文件提供康鷹網站在 NAS 的日常部署、更新、回滾、還原操作流程。

## 0) 前置需求

- NAS 已安裝 Docker / Docker Compose
- DNS 已指向 NAS 公網 IP
- 路由器已轉發 80 / 443
- 專案目錄已有 `.env.local`

## 1) 首次部署

```bash
npm run nas:deploy
```

等同：

```bash
bash scripts/deploy-nas.sh
```

## 2) 日常更新（標準流程）

```bash
npm run nas:update
```

更新腳本會自動：
- 保存目前可回滾映像（`kangying-web:rollback-*`）
- （若是 git 倉庫）嘗試 `git pull --ff-only`
- 建構並重啟容器
- 做健康檢查

### 更簡單：一鍵全流程（建議日常使用）

```bash
npm run nas:go
```

`nas:go` 會做：
- 部署前檢查（doctor）
- 先備份
- 更新部署
- 最終健康檢查
- 任一步失敗時自動回滾

## 3) 快速回滾

回滾到上一版：

```bash
npm run nas:rollback
```

指定特定回滾標籤：

```bash
bash scripts/rollback-nas.sh kangying-web:rollback-YYYYMMDD-HHMMSS
```

## 4) 資料備份與還原

手動備份：

```bash
npm run backup
```

從備份檔還原：

```bash
npm run nas:restore -- ./data/backups/backup-2026-04-14_030000.tar.gz
```

## 5) 排程建議（crontab）

每日凌晨 3 點備份：

```cron
0 3 * * * cd /path/to/web && bash scripts/backup.sh >> /var/log/kangying-backup.log 2>&1
```

## 6) 常見故障排查

### A. 網站打不開
1. `docker compose ps`
2. `docker compose logs --tail=200`
3. 確認 80 / 443 未被其他服務占用

### D. 先做環境健檢

```bash
npm run nas:doctor
```

### B. 後台登入失敗
1. 確認 `.env.local` 的 `ADMIN_PASSWORD`
2. 檢查 `middleware`/Nginx 是否有 IP 限制
3. 查看 `docker compose logs --tail=200 nextjs`

### C. 上傳檔案讀不到
1. 確認 `DATA_PATH` 掛載正確
2. 檢查 `data/uploads` 是否存在檔案
3. 檢查 `nginx/conf.d/default.conf` 的 `/api/uploads/` 設定
