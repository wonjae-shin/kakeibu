# CLAUDE.md
> Claude Code가 이 프로젝트 작업 시 항상 참고하는 파일

---

## 프로젝트 개요
개인 가계부 웹앱. 현재는 1인 사용, 추후 다중 사용자 배포 확장 목표.

## 필수 참고 문서
작업 전 반드시 읽을 것:
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

## 주의사항
- DB는 SQLite 사용 (추후 PostgreSQL 마이그레이션 고려한 Prisma 스키마 유지)
- 1단계에서 사용자는 `.env`의 하드코딩 계정 1개만 사용
- 배포 확장성을 항상 고려한 구조로 작성
