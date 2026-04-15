#!/bin/bash

set -euo pipefail

ENV_FILE="${ENV_FILE:-.env.local}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"

ok() { echo "[OK] $1"; }
warn() { echo "[警告] $1"; }
err() { echo "[錯誤] $1"; }

echo "============================================"
echo " NAS 部署前檢查 (doctor)"
echo "============================================"

if [ ! -f "${COMPOSE_FILE}" ]; then
  err "找不到 ${COMPOSE_FILE}"
  exit 1
fi
ok "找到 ${COMPOSE_FILE}"

if [ ! -f "${ENV_FILE}" ]; then
  err "找不到 ${ENV_FILE}，請先由 .env.example 建立"
  exit 1
fi
ok "找到 ${ENV_FILE}"

if command -v docker >/dev/null 2>&1; then
  ok "docker 可使用"
else
  err "docker 不可用"
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  ok "docker compose 可使用"
else
  err "docker compose 不可用"
  exit 1
fi

if grep -q "^ADMIN_PASSWORD=" "${ENV_FILE}"; then
  ok "ADMIN_PASSWORD 已設定"
else
  err "ADMIN_PASSWORD 未設定"
  exit 1
fi

if grep -q "^DATA_PATH=" "${ENV_FILE}"; then
  ok "DATA_PATH 已設定"
else
  warn "DATA_PATH 未設定，將使用預設 ./data"
fi

mkdir -p ./data/json ./data/uploads ./data/backups
ok "data 目錄結構可用"

if docker compose --env-file "${ENV_FILE}" config >/dev/null 2>&1; then
  ok "docker compose 設定檔語法正常"
else
  err "docker compose 設定有誤，請檢查"
  exit 1
fi

echo "--------------------------------------------"
echo "檢查完成：可部署"
