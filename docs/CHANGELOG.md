# 작업 기록 (CHANGELOG)

## 2026-04-12

### 기능 추가
- 정기거래 자동생성: 로그인/앱진입 시 전달의 `isRecurring=true` 거래를 현재 달로 자동 복사
- 예산 탭 네비게이션 추가 (하단 탭: 홈 / 내역 / + / 통계 / 예산)
- 대시보드 헤더에 설정 아이콘 버튼 추가 (기어 아이콘)
- 카드 알림 자동 거래 등록 기능 (MacroDroid → POST /api/notifications/ingest → 거래 자동 생성)
  - 한국 카드사 알림 텍스트 파서 구현 (신한/국민/현대/삼성/롯데/하나/우리/BC/농협)
  - 카드명으로 계좌 자동 매칭, 기본 카테고리(기타지출/기타수입) 자동 배정
  - GET /api/notifications, GET /api/notifications/pending-count API 추가
- 거래 추가/수정 페이지 저장 버튼 하단 고정 (BottomNav 위에 항상 노출)
- 계좌 정렬: 카드 → 계좌이체 → 현금 순, 동일 타입 내 한글 오름차순

### UI 수정
- MonthPicker 팝업 fixed 포지션으로 변경 → 앱 환경에서 뷰포트 밖 잘림 수정
- 하단 네비게이션에서 설정 탭 제거, 통계 탭 복원 (홈/내역/+/통계/예산)
- 전체 색상 웜톤으로 전환 (primary: #EA580C, 배경: #F5F3F0)
- 대시보드 헤더 리디자인 (다크 배경 #1A0F00, 대형 지출 금액, 수입/잔액 카드)
- 설정 페이지 이모지 아이콘 확장 (~130개, 카테고리별 그룹)
- 카테고리 이모지 적절한 것으로 교체

### 버그 수정
- 카드 알림 파서 merchant 추출 로직 수정 (정규식 버그 → 위치 기반 파싱으로 변경)
- EC2 root PM2 데몬이 포트 4000 점유하던 문제 해결
- Express에서 React 빌드 정적 파일 서빙 누락 수정 (SPA 라우팅 fallback 추가)
- Prisma binaryTargets에 rhel-openssl-3.0.x 추가 (EC2 Linux 호환)
- Vite HMR WebSocket 포트 설정 추가

### 인프라
- EC2 배포 (15.165.159.251) — `/var/www/kakeibu`
- 로컬 DB → EC2 DB 동기화 (scp)
- PM2 ecosystem.config.cjs: exec_mode fork, kill_timeout/restart_delay 설정
- SSH 접속 사용자명 ec2-user 확인 (ubuntu 아님)

### 데이터
- 카테고리 구조를 가계부_2026.xlsx 엑셀 파일 기준으로 재편
  - 지출: 식비, 주거비, 생활용품, 펫, 의류미용, 교육, 문화여가, 의료건강, 교통, 통신, 경조사, 용돈, 저축, 기타지출
  - 수입: 급여, 기타수입, 이자, 기타수입(etc)
- 3월/4월 개인 가계부 내역 DB 마이그레이션 (가계부_2026.xlsx → SQLite)

---

## 2026-03 ~ 2026-04 초 (Phase 0)

### 초기 세팅
- 프로젝트 기술 스택 확정: React + Vite, Express, Prisma + SQLite, TailwindCSS
- EC2 인스턴스 구성 및 PM2로 서버 운영
- 기본 인증(PIN), 계좌, 카테고리, 거래 CRUD API 구현
- 통계 페이지, 거래 내역 필터/검색 구현
- 다중 카테고리 필터 지원