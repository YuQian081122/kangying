#!/bin/bash
# 康鷹空間資訊 - 全量備份腳本
# 備份範圍：JSON 資料 + 上傳圖片/影片 + 畫布資源
#
# 使用方式：
#   bash scripts/backup.sh                    # 預設備份
#   bash scripts/backup.sh /mnt/backup-disk   # 指定備份目的地
#
# 建議 cron 排程（每日凌晨 3 點）：
#   0 3 * * * /path/to/web/scripts/backup.sh >> /var/log/kangying-backup.log 2>&1

set -euo pipefail

DATA_DIR="${DATA_DIR:-./data}"
BACKUP_DEST="${1:-${DATA_DIR}/backups}"
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
BACKUP_NAME="backup-${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DEST}/${BACKUP_NAME}"
KEEP_DAYS=30

echo "============================================"
echo " 康鷹空間資訊 - 備份作業"
echo " 時間: $(date '+%Y-%m-%d %H:%M:%S')"
echo " 來源: ${DATA_DIR}"
echo " 目的: ${BACKUP_PATH}"
echo "============================================"

# 確保備份目錄存在
mkdir -p "${BACKUP_PATH}"

# 1. 備份 JSON 資料（含畫布配置 detailLayout）
echo "[1/4] 備份 JSON 資料..."
if [ -d "${DATA_DIR}/json" ]; then
    cp -r "${DATA_DIR}/json" "${BACKUP_PATH}/json"
    echo "  - brands.json: $(wc -c < "${DATA_DIR}/json/brands.json" 2>/dev/null || echo '0') bytes"
    echo "  - products.json: $(wc -c < "${DATA_DIR}/json/products.json" 2>/dev/null || echo '0') bytes"
else
    echo "  [警告] JSON 目錄不存在: ${DATA_DIR}/json"
fi

# 2. 備份上傳的圖片與影片（含畫布中引用的媒體）
echo "[2/4] 備份上傳檔案（增量同步）..."
if [ -d "${DATA_DIR}/uploads" ]; then
    mkdir -p "${BACKUP_PATH}/uploads"
    rsync -a --info=progress2 "${DATA_DIR}/uploads/" "${BACKUP_PATH}/uploads/" 2>/dev/null || \
        cp -r "${DATA_DIR}/uploads/." "${BACKUP_PATH}/uploads/"
    UPLOAD_COUNT=$(find "${BACKUP_PATH}/uploads" -type f 2>/dev/null | wc -l)
    echo "  - 已備份 ${UPLOAD_COUNT} 個檔案"
else
    echo "  [警告] uploads 目錄不存在: ${DATA_DIR}/uploads"
fi

# 3. 壓縮備份
echo "[3/4] 壓縮備份..."
cd "${BACKUP_DEST}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}" 2>/dev/null && {
    ARCHIVE_SIZE=$(du -sh "${BACKUP_NAME}.tar.gz" | cut -f1)
    echo "  - 壓縮檔: ${BACKUP_NAME}.tar.gz (${ARCHIVE_SIZE})"
    rm -rf "${BACKUP_NAME}"
} || {
    echo "  [警告] 壓縮失敗，保留未壓縮備份"
}

# 4. 清理舊備份
echo "[4/4] 清理 ${KEEP_DAYS} 天前的備份..."
DELETED=$(find "${BACKUP_DEST}" -name "backup-*.tar.gz" -mtime +${KEEP_DAYS} -print -delete 2>/dev/null | wc -l)
DELETED_DIR=$(find "${BACKUP_DEST}" -name "backup-*" -type d -mtime +${KEEP_DAYS} -print -exec rm -rf {} + 2>/dev/null | wc -l)
echo "  - 已清理 $((DELETED + DELETED_DIR)) 個過期備份"

echo ""
echo "============================================"
echo " 備份完成！"
echo " 時間: $(date '+%Y-%m-%d %H:%M:%S')"
TOTAL_BACKUPS=$(find "${BACKUP_DEST}" -name "backup-*" 2>/dev/null | wc -l)
echo " 目前備份數: ${TOTAL_BACKUPS}"
echo "============================================"
