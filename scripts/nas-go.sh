#!/bin/bash

set -euo pipefail

ENV_FILE="${ENV_FILE:-.env.local}"
HEALTH_URL="${HEALTH_URL:-http://localhost}"
AUTO_BACKUP="${AUTO_BACKUP:-1}"

echo "============================================"
echo " NAS 一鍵更新 (go)"
echo "============================================"

rollback_on_error() {
  echo "[失敗] 更新流程中斷，準備自動回滾..."
  if bash scripts/rollback-nas.sh; then
    echo "[完成] 已自動回滾到上一版"
  else
    echo "[嚴重] 自動回滾失敗，請手動執行：bash scripts/rollback-nas.sh"
  fi
}

trap rollback_on_error ERR

echo "[1/4] 前置檢查..."
bash scripts/nas-doctor.sh

if [ "${AUTO_BACKUP}" = "1" ]; then
  echo "[2/4] 先做一次備份..."
  bash scripts/backup.sh
else
  echo "[2/4] 略過備份（AUTO_BACKUP=${AUTO_BACKUP}）..."
fi

echo "[3/4] 執行更新部署..."
bash scripts/update-nas.sh

echo "[4/4] 核對網站可存取..."
if curl -fsS "${HEALTH_URL}" >/dev/null 2>&1; then
  echo "[OK] 網站正常：${HEALTH_URL}"
else
  echo "[錯誤] 網站健康檢查失敗：${HEALTH_URL}"
  exit 1
fi

trap - ERR
echo "--------------------------------------------"
echo "一鍵更新成功完成"
