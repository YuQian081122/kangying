#!/bin/bash

set -euo pipefail

ENV_FILE="${ENV_FILE:-.env.local}"
HEALTH_URL="${HEALTH_URL:-http://localhost}"
HEALTH_TIMEOUT_SEC="${HEALTH_TIMEOUT_SEC:-60}"
ROLLBACK_DIR="${ROLLBACK_DIR:-./data/backups/rollback}"
ROLLBACK_TAG_BASE="${ROLLBACK_TAG_BASE:-kangying-web}"

echo "============================================"
echo " NAS 更新部署"
echo "============================================"

if [ ! -f "${ENV_FILE}" ]; then
  echo "[錯誤] 找不到 ${ENV_FILE}"
  exit 1
fi

echo "[1/6] 保存目前可回滾映像..."
mkdir -p "${ROLLBACK_DIR}"
if docker inspect kangying-web >/dev/null 2>&1; then
  current_image_id="$(docker inspect --format='{{.Image}}' kangying-web)"
  ts="$(date +%Y%m%d-%H%M%S)"
  docker tag "${current_image_id}" "${ROLLBACK_TAG_BASE}:rollback-latest"
  docker tag "${current_image_id}" "${ROLLBACK_TAG_BASE}:rollback-${ts}"
  printf "%s\n" "${current_image_id}" > "${ROLLBACK_DIR}/current-image-id.txt"
  printf "%s\n" "${ROLLBACK_TAG_BASE}:rollback-${ts}" > "${ROLLBACK_DIR}/last-tag.txt"
  echo "  - 已保存 ${ROLLBACK_TAG_BASE}:rollback-${ts}"
else
  echo "  - 找不到既有容器，略過保存（首次部署可忽略）"
fi

echo "[2/6] 拉取最新程式碼（若為 git 倉庫）..."
if [ -d ".git" ]; then
  git pull --ff-only || echo "  - git pull 失敗，請手動確認分支狀態"
else
  echo "  - 非 git 倉庫，略過"
fi

echo "[3/6] 建構新映像..."
docker compose --env-file "${ENV_FILE}" build

echo "[4/6] 啟動新版..."
docker compose --env-file "${ENV_FILE}" up -d

echo "[5/6] 健康檢查 (${HEALTH_URL})..."
start_ts="$(date +%s)"
while true; do
  if curl -fsS "${HEALTH_URL}" >/dev/null 2>&1; then
    break
  fi

  now_ts="$(date +%s)"
  elapsed="$((now_ts - start_ts))"
  if [ "${elapsed}" -ge "${HEALTH_TIMEOUT_SEC}" ]; then
    echo "[錯誤] 健康檢查逾時（${HEALTH_TIMEOUT_SEC} 秒）"
    echo "可執行 rollback：bash scripts/rollback-nas.sh"
    docker compose --env-file "${ENV_FILE}" logs --tail=120
    exit 1
  fi
  sleep 2
done

echo "[6/6] 顯示服務狀態..."
docker compose --env-file "${ENV_FILE}" ps

echo ""
echo "更新完成：${HEALTH_URL}"
echo "若需回滾：bash scripts/rollback-nas.sh"
