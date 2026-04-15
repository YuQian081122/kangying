#!/bin/bash
# 首次取得 SSL 憑證的腳本
# 使用方式：bash scripts/init-ssl.sh
#
# 執行前須確保：
# 1. DNS 已將 kangying.com.tw 指向你的 NAS 公網 IP
# 2. 路由器已將 80/443 port 轉發到 NAS
# 3. docker-compose 已啟動 nginx 容器

set -e

DOMAIN="kangying.com.tw"
EMAIL="${1:-admin@kangying.com.tw}"

echo "=== 初始化 SSL 憑證 ==="
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"

# 先啟動 nginx（使用臨時設定，不需 SSL）
echo "1. 建立臨時 Nginx 設定（HTTP only）..."

cat > nginx/conf.d/default.conf.tmp << 'TMPEOF'
server {
    listen 80;
    server_name kangying.com.tw www.kangying.com.tw;
    location /.well-known/acme-challenge/ {
        root /var/lib/letsencrypt;
    }
    location / {
        return 200 'SSL setup in progress';
        add_header Content-Type text/plain;
    }
}
TMPEOF

cp nginx/conf.d/default.conf nginx/conf.d/default.conf.bak
cp nginx/conf.d/default.conf.tmp nginx/conf.d/default.conf

echo "2. 啟動 Nginx..."
docker compose up -d nginx

echo "3. 等待 Nginx 就緒..."
sleep 5

echo "4. 取得 SSL 憑證..."
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/lib/letsencrypt \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

echo "5. 還原正式 Nginx 設定..."
cp nginx/conf.d/default.conf.bak nginx/conf.d/default.conf
rm -f nginx/conf.d/default.conf.tmp nginx/conf.d/default.conf.bak

echo "6. 重啟所有服務..."
docker compose up -d

echo ""
echo "=== SSL 憑證初始化完成！ ==="
echo "網站將在 https://$DOMAIN 上線"
echo "Certbot 會自動每 12 小時檢查並續期憑證"
