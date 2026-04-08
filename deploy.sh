#!/bin/bash
# EC2 배포 스크립트
# 사용법: bash deploy.sh
# 전제: EC2에서 실행, /var/www/kakeibu 에 코드가 있어야 함

set -e

DEPLOY_DIR="/var/www/kakeibu"
LOG_DIR="/var/log/kakeibu"

echo "====== 가계부 배포 시작 ======"

# 로그 디렉토리 생성
mkdir -p $LOG_DIR

# 코드 업데이트
echo "[1/5] 코드 업데이트..."
cd $DEPLOY_DIR
git pull origin main

# 클라이언트 빌드
echo "[2/5] 클라이언트 빌드..."
cd $DEPLOY_DIR/client
npm ci --production=false
npm run build

# 서버 의존성 설치
echo "[3/5] 서버 의존성 설치..."
cd $DEPLOY_DIR/server
npm ci --production

# Prisma 마이그레이션
echo "[4/5] DB 마이그레이션..."
npx prisma migrate deploy

# PM2 재시작
echo "[5/5] 서버 재시작..."
cd $DEPLOY_DIR/server
pm2 startOrRestart ecosystem.config.cjs --env production
pm2 save

echo "====== 배포 완료 ======"
pm2 status
