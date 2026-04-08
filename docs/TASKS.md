# TASKS.md
> 작업 순서 및 진행 체크리스트

---

## 진행 규칙
- `[ ]` 미완료 / `[x]` 완료
- 각 Phase 완료 후 다음 단계로 진행
- Claude Code에 넘길 때 해당 Phase 설명과 함께 `PRD.md`, `ARCHITECTURE.md` 참고 지시

---

## Phase 0. 프로젝트 초기화

### 환경 세팅
- [x] 모노레포 구조 생성 (`client/`, `server/`)
- [x] **Client**: Vite + React + Tailwind CSS 초기화
- [x] **Client**: React Router, Zustand, Axios, Recharts, date-fns 설치
- [x] **Client**: vite-plugin-pwa 설치 및 기본 설정
- [x] **Client**: 절대경로 alias 설정 (`@/` → `src/`)
- [x] **Server**: Node.js + Express 초기화
- [x] **Server**: Prisma + SQLite 설치 및 초기화
- [x] **Server**: JWT, bcrypt, dotenv, cors 설치
- [x] **Server**: `.env` 파일 생성 (JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD)
- [x] Prisma 스키마 작성 (`ARCHITECTURE.md` 참고)
- [x] `prisma migrate dev` 실행
- [x] 기본 카테고리 시드 데이터 작성 및 실행

---

## Phase 1. 백엔드 API

### 인증
- [x] `POST /api/auth/login` — 로그인 (하드코딩 1계정)
- [x] `GET /api/auth/me` — 내 정보 조회
- [x] JWT 미들웨어 작성
- [x] 모든 API에 JWT 미들웨어 적용

### 카테고리 API
- [x] `GET /api/categories`
- [x] `POST /api/categories`
- [x] `PUT /api/categories/:id`
- [x] `DELETE /api/categories/:id`

### 계좌 API
- [x] `GET /api/accounts`
- [x] `POST /api/accounts`
- [x] `PUT /api/accounts/:id`
- [x] `DELETE /api/accounts/:id`

### 거래 API
- [x] `GET /api/transactions` (월별 필터, 카테고리 필터)
- [x] `POST /api/transactions`
- [x] `PUT /api/transactions/:id`
- [x] `DELETE /api/transactions/:id`
- [x] `GET /api/transactions/summary` (월별 수입/지출 합계)

### 예산 API
- [x] `GET /api/budgets`
- [x] `POST /api/budgets`
- [x] `PUT /api/budgets/:id`
- [x] `DELETE /api/budgets/:id`

### 통계 API
- [x] `GET /api/stats/monthly` (연간 월별 추이)
- [x] `GET /api/stats/category` (카테고리별 비율)

---

## Phase 2. 프론트 기반 작업

### 공통
- [x] Axios 인스턴스 설정 (baseURL, 토큰 인터셉터)
- [x] Zustand authStore 작성 (로그인 상태, 토큰 관리)
- [x] 레이아웃 컴포넌트 (`Layout.jsx`, `BottomNav.jsx`)
- [x] 라우터 설정 (보호 라우트 포함)
- [x] 공통 컴포넌트: `AmountInput`, `BottomSheet`, `MonthPicker`, `EmptyState`

### 로그인 화면
- [x] 로그인 UI 구현
- [x] 로그인 API 연동
- [x] 자동 로그인 처리

---

## Phase 3. 핵심 기능 구현

### 거래 추가/수정 화면
- [x] 수입/지출 탭 전환
- [x] 커스텀 숫자 키패드
- [x] 카테고리 선택 (BottomSheet)
- [x] 계좌 선택 (BottomSheet)
- [x] 날짜 선택
- [x] 메모 입력
- [x] 정기지출 토글 및 반복일 설정
- [x] 저장 API 연동
- [x] 수정 모드 (기존 데이터 불러오기)

### 거래 내역 화면
- [x] 월별 리스트 렌더링
- [x] 날짜 그룹핑
- [x] 필터 (전체/수입/지출/카테고리)
- [x] 검색 기능
- [x] 항목 클릭 → 수정 화면 이동
- [x] 스와이프 삭제 (또는 삭제 버튼)
- [x] 하단 월별 합계 표시

---

## Phase 4. 대시보드 및 통계

### 홈 대시보드
- [x] 월 선택 컴포넌트
- [x] 수입/지출 요약 카드
- [x] 전체 예산 진행바
- [x] 카테고리별 TOP3 지출
- [x] 최근 거래 5건

### 통계 화면
- [x] 월별 수입/지출 바 차트 (Recharts)
- [x] 카테고리별 도넛 차트
- [x] 카테고리 목록 (비율 + 금액)
- [x] 전월 대비 비교

---

## Phase 5. 예산 및 설정

### 예산 관리
- [x] 전체 월 예산 설정
- [x] 카테고리별 예산 설정
- [x] 예산 진행바 (경고 색상 포함)
- [x] 초과 시 빨간색 표시

### 설정 화면
- [x] 카테고리 관리 (추가/수정/삭제)
- [x] 계좌 관리 (추가/수정/삭제)
- [x] CSV 내보내기
- [x] 로그아웃

---

## Phase 6. PWA 및 배포

### PWA 설정
- [x] `manifest.json` 작성 (앱 이름, 아이콘, 색상)
- [x] Service Worker 설정 (수동 sw.js — vite-plugin-pwa는 Node 20+ 필요)
- [x] 오프라인 대응 (캐시 전략: app shell 캐시, API 제외)
- [x] 앱 아이콘 생성 (SVG 192x192, 512x512)

### EC2 배포
- [ ] EC2 Node.js 20 설치  ← 서버 직접 작업 필요
- [x] Nginx 설치 및 설정 (`nginx/default.conf`)
- [x] PM2 설치 및 서버 실행 (`server/ecosystem.config.cjs`)
- [x] `npm run build` → `/var/www` 배포 스크립트 작성 (`deploy.sh`)
- [ ] DuckDNS 무료 도메인 연결  ← 서버 직접 작업 필요
- [ ] Let's Encrypt HTTPS 인증서 발급  ← 서버 직접 작업 필요
- [ ] 보안 그룹 포트 설정 (80, 443)  ← AWS 콘솔 직접 작업 필요

---

## Phase 7. 마무리 및 품질

- [ ] 모바일 실기기 테스트  ← 직접 테스트 필요
- [ ] 홈 화면 설치 (PWA) 확인  ← 직접 테스트 필요
- [x] 주요 엣지 케이스 처리 (빈 데이터, 네트워크 오류 — ErrorMessage 컴포넌트)
- [x] 로딩 스피너 및 에러 메시지 통일
- [x] `README.md` 작성

---

## 2단계 확장 (배포 준비 시)

- [ ] 회원가입 API 추가
- [ ] 회원가입 UI 추가
- [ ] SQLite → PostgreSQL 마이그레이션
- [ ] 이메일 인증 추가
- [ ] Google 소셜 로그인 (Passport.js)
- [ ] 도메인 구매 및 교체

---

## Claude Code 사용 팁

각 Phase 시작 시 아래 형식으로 지시:

```
docs/PRD.md, docs/ARCHITECTURE.md, docs/UI_FLOW.md 를 읽고
Phase N의 [작업명]을 구현해줘.
현재까지 완성된 파일 구조는 다음과 같아: ...
```
