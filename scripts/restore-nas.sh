#!/bin/bash

set -euo pipefail

BACKUP_FILE="${1:-}"
DATA_DIR="${DATA_DIR:-./data}"
ENV_FILE="${ENV_FILE:-.env.local}"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

echo "============================================"
echo " NAS 備份還原"
echo "============================================"

if [ -z "${BACKUP_FILE}" ]; then
  echo "使用方式：bash scripts/restore-nas.sh <backup.tar.gz>"
  exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "[錯誤] 找不到備份檔：${BACKUP_FILE}"
  exit 1
fi

echo "[1/6] 解壓備份..."
tar -xzf "${BACKUP_FILE}" -C "${TMP_DIR}"

backup_root="$(find "${TMP_DIR}" -maxdepth 1 -type d -name "backup-*" | head -n 1)"
if [ -z "${backup_root}" ]; then
  echo "[錯誤] 備份格式不正確，找不到 backup-* 目錄"
  exit 1
fi

echo "[2/6] 檢查備份內容..."
if [ ! -d "${backup_root}/json" ]; then
  echo "[錯誤] 備份中缺少 json 目錄"
  exit 1
fi

echo "[3/6] 停止服務..."
docker compose --env-file "${ENV_FILE}" down

echo "[4/6] 還原 json 與 uploads..."
mkdir -p "${DATA_DIR}/json" "${DATA_DIR}/uploads"
rm -rf "${DATA_DIR}/json"/*
cp -r "${backup_root}/json/." "${DATA_DIR}/json/"

if [ -d "${backup_root}/uploads" ]; then
  rm -rf "${DATA_DIR}/uploads"/*
  cp -r "${backup_root}/uploads/." "${DATA_DIR}/uploads/"
fi

echo "[5/6] 重新啟動服務..."
docker compose --env-file "${ENV_FILE}" up -d

echo "[6/6] 完成，當前資料來源：${BACKUP_FILE}"
echo "建議檢查：首頁、產品列表、/upload 後台"
