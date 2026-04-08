# ARCHITECTURE.md
> 기술 스택 및 시스템 설계

---

## 1. 기술 스택

### Frontend
| 항목 | 기술 | 버전 |
|---|---|---|
| 프레임워크 | React | 18 |
| 빌드 도구 | Vite | 5 |
| 스타일 | Tailwind CSS | 3 |
| 상태관리 | Zustand | 4 |
| 라우팅 | React Router | 6 |
| 차트 | Recharts | 2 |
| 날짜 | date-fns | 3 |
| HTTP 클라이언트 | Axios | 1 |
| PWA | vite-plugin-pwa | - |

### Backend
| 항목 | 기술 | 버전 |
|---|---|---|
| 런타임 | Node.js | 20 LTS |
| 프레임워크 | Express | 4 |
| ORM | Prisma | 5 |
| DB (1단계) | SQLite | - |
| DB (2단계) | PostgreSQL | - |
| 인증 | JWT (jsonwebtoken) | - |
| 비밀번호 | bcrypt | - |
| 환경변수 | dotenv | - |

### 인프라
| 항목 | 기술 |
|---|---|
| 서버 | AWS EC2 t2.micro |
| 웹서버 | Nginx |
| 프로세스 관리 | PM2 |
| HTTPS | Let's Encrypt (DuckDNS 연동) |

---

## 2. 폴더 구조

```
project-root/
├── client/                     # 프론트엔드
│   ├── public/
│   │   ├── icons/              # PWA 아이콘
│   │   └── manifest.json
│   ├── src/
│   │   ├── api/                # Axios API 호출 함수
│   │   │   ├── auth.js
│   │   │   ├── transactions.js
│   │   │   ├── categories.js
│   │   │   ├── budgets.js
│   │   │   └── accounts.js
│   │   ├── components/         # 공통 컴포넌트
│   │   │   ├── Layout.jsx
│   │   │   ├── BottomNav.jsx
│   │   │   ├── TransactionItem.jsx
│   │   │   ├── CategoryIcon.jsx
│   │   │   └── AmountInput.jsx
│   │   ├── pages/              # 페이지 컴포넌트
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Transactions.jsx
│   │   │   ├── TransactionForm.jsx
│   │   │   ├── Statistics.jsx
│   │   │   ├── Budget.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── Login.jsx
│   │   ├── store/              # Zustand 스토어
│   │   │   ├── authStore.js
│   │   │   ├── transactionStore.js
│   │   │   └── categoryStore.js
│   │   ├── hooks/              # 커스텀 훅
│   │   ├── utils/              # 유틸 함수 (포맷, 계산 등)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # 백엔드
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js             # 기본 카테고리 시드 데이터
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── transactions.js
│   │   │   ├── categories.js
│   │   │   ├── budgets.js
│   │   │   └── accounts.js
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT 검증 미들웨어
│   │   │   └── errorHandler.js
│   │   ├── controllers/        # 비즈니스 로직
│   │   └── app.js
│   ├── .env
│   └── package.json
│
├── nginx/
│   └── default.conf
└── README.md
```

---

## 3. 데이터베이스 스키마 (Prisma)

```prisma
model User {
  id           String        @id @default(cuid())
  email        String        @unique
  password     String
  createdAt    DateTime      @default(now())
  transactions Transaction[]
  categories   Category[]
  accounts     Account[]
  budgets      Budget[]
}

model Transaction {
  id          String   @id @default(cuid())
  type        String   // "income" | "expense"
  amount      Int      // 원 단위 정수
  memo        String?
  date        String   // "YYYY-MM-DD"
  isRecurring Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  userId      String
  categoryId  String
  accountId   String
  user        User     @relation(fields: [userId], references: [id])
  category    Category @relation(fields: [categoryId], references: [id])
  account     Account  @relation(fields: [accountId], references: [id])
}

model Category {
  id           String        @id @default(cuid())
  name         String
  type         String        // "income" | "expense" | "both"
  icon         String
  color        String
  isDefault    Boolean       @default(false)
  userId       String?       // null이면 시스템 기본 카테고리
  transactions Transaction[]
  budgets      Budget[]
  user         User?         @relation(fields: [userId], references: [id])
}

model Account {
  id           String        @id @default(cuid())
  name         String        // "신한카드", "현금" 등
  type         String        // "card" | "cash" | "bank"
  balance      Int           @default(0)
  userId       String
  transactions Transaction[]
  user         User          @relation(fields: [userId], references: [id])
}

model Budget {
  id         String   @id @default(cuid())
  month      String   // "YYYY-MM"
  amount     Int
  userId     String
  categoryId String?  // null이면 전체 예산
  user       User     @relation(fields: [userId], references: [id])
  category   Category? @relation(fields: [categoryId], references: [id])
}

model RecurringTransaction {
  id         String  @id @default(cuid())
  type       String
  amount     Int
  memo       String?
  dayOfMonth Int     // 매월 몇 일
  categoryId String
  accountId  String
  userId     String
  isActive   Boolean @default(true)
}
```

---

## 4. API 설계

### 인증
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### 거래
```
GET    /api/transactions?month=YYYY-MM&category=&type=
POST   /api/transactions
PUT    /api/transactions/:id
DELETE /api/transactions/:id
GET    /api/transactions/summary?month=YYYY-MM   # 월별 요약
```

### 카테고리
```
GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id
```

### 계좌
```
GET    /api/accounts
POST   /api/accounts
PUT    /api/accounts/:id
DELETE /api/accounts/:id
```

### 예산
```
GET    /api/budgets?month=YYYY-MM
POST   /api/budgets
PUT    /api/budgets/:id
DELETE /api/budgets/:id
```

### 통계
```
GET    /api/stats/monthly?year=YYYY         # 월별 수입/지출 추이
GET    /api/stats/category?month=YYYY-MM    # 카테고리별 비율
```

---

## 5. 인증 흐름

```
로그인 요청
    ↓
서버에서 JWT 발급 (Access Token 1h + Refresh Token 7d)
    ↓
클라이언트 localStorage 저장
    ↓
모든 API 요청 헤더에 Bearer 토큰 포함
    ↓
만료 시 Refresh Token으로 재발급
```

> 1단계에서는 .env에 하드코딩된 admin 계정 1개만 사용

---

## 6. Nginx 설정 방향

```nginx
server {
    listen 80;
    # HTTP → HTTPS 리다이렉트 (DuckDNS 설정 후)

    location /api {
        proxy_pass http://localhost:4000;
    }

    location / {
        root /var/www/household/client/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 7. 확장 경로 (2단계 배포 시)

| 항목 | 변경 내용 |
|---|---|
| DB | SQLite → AWS RDS PostgreSQL (Prisma 설정만 변경) |
| 인증 | 하드코딩 계정 → 회원가입 API 추가 |
| 소셜 로그인 | Passport.js Google OAuth 추가 |
| 도메인 | DuckDNS → 구매 도메인 교체 |
| 파일 저장 | 영수증 이미지 등 S3 연동 가능 |
