# 가계부

개인 수입/지출 관리 웹앱. 모바일 퍼스트 PWA.

## 기술 스택

| 구분 | 기술 |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS 3, Zustand, React Router 6, Recharts |
| Backend | Node.js 18+, Express 4, Prisma 5, SQLite |
| 인증 | JWT (Access 1h + Refresh 7d) |
| 배포 | AWS EC2 + Nginx + PM2 |

## 로컬 실행

### 사전 요구사항
- Node.js 18+

### 백엔드
```bash
cd server
npm install
cp .env.example .env   # .env 편집 후 사용
npx prisma migrate dev
node prisma/seed.js
npm run dev            # http://localhost:4000
```

### 프론트엔드
```bash
cd client
npm install
npm run dev            # http://localhost:5173
```

로그인: `.env`의 `ADMIN_EMAIL` / `ADMIN_PASSWORD`

---

## EC2 배포

### 1. EC2 서버 초기 설정 (Ubuntu 22.04)

```bash
# Node.js 20 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Nginx, PM2 설치
sudo apt install -y nginx
sudo npm install -g pm2

# 로그 디렉토리
sudo mkdir -p /var/log/kakeibu
sudo chown $USER:$USER /var/log/kakeibu
```

### 2. 코드 배포

```bash
sudo mkdir -p /var/www/kakeibu
sudo chown $USER:$USER /var/www/kakeibu
cd /var/www/kakeibu
git clone <repo-url> .

# .env 설정 (프로덕션 값으로 변경)
cd server
cp .env .env.production
nano .env.production
```

`.env` 프로덕션 필수 변경 항목:
```
JWT_SECRET=<강력한 랜덤 문자열>
JWT_REFRESH_SECRET=<강력한 랜덤 문자열>
ADMIN_EMAIL=<실제 이메일>
ADMIN_PASSWORD=<강력한 비밀번호>
NODE_ENV=production
```

### 3. 빌드 및 시작

```bash
# 배포 스크립트 실행
bash /var/www/kakeibu/deploy.sh
```

또는 수동:
```bash
# 클라이언트 빌드
cd /var/www/kakeibu/client && npm ci && npm run build

# 서버 DB 마이그레이션 + 시드
cd /var/www/kakeibu/server && npm ci
npx prisma migrate deploy
node prisma/seed.js

# PM2 시작
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # 부팅 시 자동 시작 설정
```

### 4. Nginx 설정

```bash
sudo cp /var/www/kakeibu/nginx/default.conf /etc/nginx/sites-available/kakeibu
sudo ln -s /etc/nginx/sites-available/kakeibu /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

`nginx/default.conf`에서 `your-domain.duckdns.org`를 실제 도메인으로 변경.

### 5. HTTPS (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.duckdns.org
```

### 6. AWS 보안 그룹 포트
- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)

---

## 주요 기능

- 거래 추가/수정/삭제 (수입/지출 분류)
- 커스텀 숫자 키패드
- 카테고리 / 계좌 관리
- 월별 거래 내역 (날짜 그룹, 검색, 필터)
- 대시보드 (요약, 예산 진행률, TOP3, 최근 거래)
- 통계 (월별 바 차트, 카테고리 도넛 차트, 전월 대비)
- 예산 설정 (전체 / 카테고리별)
- CSV 내보내기
- PWA (홈 화면 설치)

## 폴더 구조

```
kakeibu/
├── client/          # React 프론트엔드
├── server/          # Express 백엔드
│   └── prisma/      # DB 스키마 및 마이그레이션
├── nginx/           # Nginx 설정
├── scripts/         # 유틸리티 스크립트
├── deploy.sh        # EC2 배포 스크립트
└── docs/            # 설계 문서
```
