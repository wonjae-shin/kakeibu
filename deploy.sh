#!/bin/bash
# EC2 배포 스크립트
# 사용법: bash deploy.sh
# 전제: EC2에서 실행, /var/www/kakeibu 에 코드가 있어야 함

set -e

DEPLOY_DIR="/var/www/kakeibu"

echo "====== 가계부 배포 시작 ======"

# 코드 업데이트
echo "[1/4] 코드 업데이트..."
cd $DEPLOY_DIR
git pull origin main

# 클라이언트 빌드
echo "[2/4] 클라이언트 빌드..."
cd $DEPLOY_DIR/client
npm install --include=dev
npm run build

# 서버 빌드 (Spring Boot JAR)
echo "[3/4] 서버 빌드..."
cd $DEPLOY_DIR/server
mvn clean package -DskipTests

# PM2 재시작
echo "[4/4] 서버 재시작..."
mkdir -p /var/log/kakeibu
pm2 startOrRestart ecosystem.config.cjs --env production
pm2 save

echo "====== 배포 완료 ======"
pm2 status
