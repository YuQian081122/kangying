#!/bin/bash

set -euo pipefail

ENV_FILE="${ENV_FILE:-.env.local}"
HEALTH_URL="${HEALTH_URL:-http://localhost}"
HEALTH_TIMEOUT_SEC="${HEALTH_TIMEOUT_SEC:-60}"
ROLLBACK_TAG="${1:-kangying-web:rollback-latest}"

echo "============================================"
echo " NAS 版本回滾"
echo "============================================"
echo "使用回滾映像：${ROLLBACK_TAG}"

if [ ! -f "${ENV_FILE}" ]; then
  echo "[錯誤] 找不到 ${ENV_FILE}"
  exit 1
fi

if ! docker image inspect "${ROLLBACK_TAG}" >/dev/null 2>&1; then
  echo "[錯誤] 找不到回滾映像 ${ROLLBACK_TAG}"
  echo "提示：先執行 bash scripts/update-nas.sh 以建立 rollback tag"
  exit 1
fi

project_name="${COMPOSE_PROJECT_NAME:-$(basename "$(pwd)" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9' '-')}"
target_tag="${project_name}-nextjs:latest"

echo "[1/4] 將回滾映像指向 compose 預設標籤..."
docker tag "${ROLLBACK_TAG}" "${target_tag}"

echo "[2/4] 重新建立 nextjs 服務..."
docker compose --env-file "${ENV_FILE}" up -d --no-deps --force-recreate nextjs

echo "[3/4] 健康檢查 (${HEALTH_URL})..."
start_ts="$(date +%s)"
while true; do
  if curl -fsS "${HEALTH_URL}" >/dev/null 2>&1; then
    break
  fi

  now_ts="$(date +%s)"
  elapsed="$((now_ts - start_ts))"
  if [ "${elapsed}" -ge "${HEALTH_TIMEOUT_SEC}" ]; then
    echo "[錯誤] 回滾後健康檢查失敗"
    docker compose --env-file "${ENV_FILE}" logs --tail=120
    exit 1
  fi
  sleep 2
done

echo "[4/4] 顯示服務狀態..."
docker compose --env-file "${ENV_FILE}" ps

echo ""
echo "回滾完成：${HEALTH_URL}"
