#!/bin/bash

set -euo pipefail

ENV_FILE="${ENV_FILE:-.env.local}"
DATA_DIR="${DATA_DIR:-./data}"
HEALTH_URL="${HEALTH_URL:-http://localhost}"
HEALTH_TIMEOUT_SEC="${HEALTH_TIMEOUT_SEC:-60}"

echo "============================================"
echo " NAS 首次/完整部署"
echo "============================================"

if [ ! -f "${ENV_FILE}" ]; then
  echo "[錯誤] 找不到 ${ENV_FILE}"
  echo "請先從 .env.example 建立：cp .env.example ${ENV_FILE}"
  exit 1
fi

echo "[1/5] 建立資料目錄..."
mkdir -p "${DATA_DIR}/json" "${DATA_DIR}/uploads" "${DATA_DIR}/backups"

echo "[2/5] 建構映像..."
docker compose --env-file "${ENV_FILE}" build

echo "[3/5] 啟動服務..."
docker compose --env-file "${ENV_FILE}" up -d

echo "[4/5] 健康檢查 (${HEALTH_URL})..."
start_ts="$(date +%s)"
while true; do
  if curl -fsS "${HEALTH_URL}" >/dev/null 2>&1; then
    break
  fi

  now_ts="$(date +%s)"
  elapsed="$((now_ts - start_ts))"
  if [ "${elapsed}" -ge "${HEALTH_TIMEOUT_SEC}" ]; then
    echo "[錯誤] 健康檢查逾時（${HEALTH_TIMEOUT_SEC} 秒）"
    docker compose --env-file "${ENV_FILE}" logs --tail=120
    exit 1
  fi
  sleep 2
done

echo "[5/5] 顯示服務狀態..."
docker compose --env-file "${ENV_FILE}" ps

echo ""
echo "部署完成：${HEALTH_URL}"
