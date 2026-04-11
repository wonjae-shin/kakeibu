# CLAUDE.md
> Claude Code가 이 프로젝트 작업 시 항상 참고하는 파일

---

## 프로젝트 개요
개인 가계부 웹앱. 현재는 1인 사용, 추후 다중 사용자 배포 확장 목표.

## 필수 참고 문서
작업 유형에 따라 해당 파일만 읽을 것:

| 작업 유형 | 읽어야 할 파일 |
|-----------|---------------|
| 새 기능 구현 | `docs/PRD.md`, `docs/TASKS.md`, `docs/ARCHITECTURE.md` |
| UI/화면 수정 | `docs/UI_FLOW.md` |
| API/DB 수정 | `docs/ARCHITECTURE.md` |
| 버그 수정 | 해당 파일만 직접 확인 (docs 불필요) |
| 배포 | `docs/ARCHITECTURE.md` |
| 작업 계획 확인 | `docs/TASKS.md` |

- `docs/PRD.md` — 기능 요구사항 및 우선순위
- `docs/ARCHITECTURE.md` — 기술 스택, 폴더 구조, DB 스키마, API 설계
- `docs/UI_FLOW.md` — 화면 구조 및 페이지 스펙
- `docs/TASKS.md` — 작업 단계 및 체크리스트

## 기술 스택 요약
- **Frontend**: React + Vite + Tailwind CSS + Zustand + React Router
- **Backend**: Node.js + Express + Prisma + SQLite
- **인증**: JWT
- **배포**: AWS EC2 + Nginx + PM2

## 폴더 구조
- `client/` — 프론트엔드
- `server/` — 백엔드
- `docs/` — 설계 문서
- `nginx/` — Nginx 설정

## 코딩 규칙
- 언어: JavaScript (TypeScript 미사용)
- 컴포넌트: 함수형 + React Hooks
- API 응답 형식: `{ success, data, message }`
- 에러 처리: try/catch 필수, 사용자에게 명확한 에러 메시지
- 금액: 원 단위 정수로 저장, 표시 시 `toLocaleString()` 사용
- 날짜: `YYYY-MM-DD` 문자열로 저장

## 현재 개발 단계
`docs/TASKS.md`의 체크리스트 기준으로 진행.
작업 완료 시 해당 항목 `[x]`로 업데이트할 것.

## 테스트 규칙
- 테스트 프레임워크: Vitest (client + server 공통)
- 테스트 실행: `npm run test` (client/, server/ 각 폴더에서)
- pre-push hook으로 lint + 테스트 자동 실행 (`.git/hooks/pre-push`)
- 새 기능 추가 시 관련 단위 테스트 필수 작성
- API 엔드포인트는 인증/성공/실패 케이스 모두 커버

## 주의사항
- DB는 SQLite 사용 (추후 PostgreSQL 마이그레이션 고려한 Prisma 스키마 유지)
- 1단계에서 사용자는 `.env`의 하드코딩 계정 1개만 사용
- 배포 확장성을 항상 고려한 구조로 작성

## 클로드 코드 작업 규칙
- 한 번의 대화에는 하나의 기능 구현 또는 버그 수정만 수행한다.
- 수정한 후에는 반드시 관련 테스트를 실행하여 Side Effect가 없는지 확인한다.
- 코드를 대량으로 수정하기 전에, 수정 계획을 먼저 요약해서 보고하고 승인을 받는다.
- 각 작업이 끝나면 `docs/TASKS.md`를 업데이트하여 진행 상황을 공유한다.