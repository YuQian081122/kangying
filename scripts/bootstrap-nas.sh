#!/bin/bash

set -euo pipefail

ENV_FILE="${ENV_FILE:-.env.local}"
DATA_DIR="${DATA_DIR:-./data}"

echo "============================================"
echo " NAS 初始化 (bootstrap)"
echo "============================================"

echo "[1/4] 建立必要目錄..."
mkdir -p "${DATA_DIR}/json" "${DATA_DIR}/uploads" "${DATA_DIR}/backups"

echo "[2/4] 檢查 .env.local ..."
if [ ! -f "${ENV_FILE}" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example "${ENV_FILE}"
    echo "  - 已由 .env.example 建立 ${ENV_FILE}"
  else
    echo "[錯誤] 找不到 .env.example，無法自動建立 ${ENV_FILE}"
    exit 1
  fi
else
  echo "  - ${ENV_FILE} 已存在，略過建立"
fi

echo "[3/4] 檢查 scripts 可執行權限..."
chmod +x scripts/*.sh || true

echo "[4/4] 顯示下一步..."
echo ""
echo "請編輯 ${ENV_FILE}，至少確認："
echo "  ADMIN_PASSWORD=..."
echo "  DATA_DIR=/data"
echo "  DATA_PATH=/volume1/docker/kangying/data"
echo ""
echo "接著執行："
echo "  npm run nas:doctor"
echo "  npm run nas:deploy"
