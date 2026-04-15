# TDD 가이드

> 이 프로젝트의 테스트 철학, 실행 방법, 패턴 모음

---

## 빠른 시작

```bash
# 루트에서 — client + server 동시 watch (파일 저장 시 자동 실행)
npm run test:watch

# 루트에서 — 전체 1회 실행 (CI / 배포 전 확인)
npm test

# 개별 실행
npm test --prefix client
npm test --prefix server
```

> **watch 모드**: 파일을 저장하는 순간 관련 테스트가 자동으로 재실행됩니다.  
> 터미널 왼쪽은 `[client]`, 오른쪽은 `[server]` 결과로 구분됩니다.

---

## TDD 사이클 (Red → Green → Refactor)

```
1. RED    테스트를 먼저 작성 → 당연히 실패
2. GREEN  테스트를 통과하는 최소한의 코드 작성
3. REFACTOR 동작을 유지하면서 코드 정리
```

### 실전 예시 — 새 API 엔드포인트 추가 시

```
1. server/src/__tests__/auth.test.ts 에 실패하는 테스트 추가
2. npm run test:watch 켜두기 (빨간 불 확인)
3. server/src/routes/auth.ts 에 엔드포인트 구현
4. 초록 불 확인 후 코드 정리
```

---

## 테스트 파일 위치

```
kakeibu/
├── client/
│   └── src/
│       ├── components/__tests__/   # React 컴포넌트 테스트
│       │   ├── Login.test.jsx
│       │   └── AmountInput.test.jsx
│       └── store/__tests__/        # Zustand 스토어 테스트
│           └── authStore.test.js
└── server/
    └── src/
        └── __tests__/              # Express API 테스트
            ├── auth.test.ts
            └── transactions.test.ts
```

### 새 테스트 파일 추가 위치 규칙

| 대상 | 위치 |
|------|------|
| 서버 API (`routes/*.ts`) | `server/src/__tests__/<이름>.test.ts` |
| Zustand 스토어 | `client/src/store/__tests__/<이름>.test.js` |
| React 페이지/컴포넌트 | `client/src/components/__tests__/<이름>.test.jsx` |

---

## 서버 API 테스트 패턴

**도구**: Vitest + Supertest + Prisma mock

```typescript
// server/src/__tests__/예시.test.ts

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

// 1) Prisma 전체 mock — DB 없이 테스트
vi.mock('@prisma/client', () => {
  const PrismaClient = vi.fn(() => ({
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  }))
  return { PrismaClient }
})

let app

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret'
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'

  const { default: router } = await import('../routes/목표라우터.js')
  app = express()
  app.use(express.json())
  app.use('/api/목표', router)
})

// 2) 각 테스트 전 mock 상태 초기화
beforeEach(() => {
  vi.clearAllMocks()
})

// 3) 테스트 케이스 — 성공 / 실패 / 인증 3가지 필수
describe('POST /api/목표', () => {
  it('정상 요청 시 200을 반환한다', async () => {
    const res = await request(app).post('/api/목표').send({ ... })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('필수 파라미터 없으면 400을 반환한다', async () => {
    const res = await request(app).post('/api/목표').send({})
    expect(res.status).toBe(400)
  })

  it('인증 없이 요청하면 401을 반환한다', async () => {
    const res = await request(app).post('/api/목표').send({ ... })
    expect(res.status).toBe(401)
  })
})
```

### 인증이 필요한 엔드포인트 테스트

```typescript
import jwt from 'jsonwebtoken'

// 테스트용 유효 토큰 생성
const validToken = jwt.sign(
  { userId: 'user-1', isAnonymous: false },
  'test-secret',
  { expiresIn: '1h' }
)

const res = await request(app)
  .get('/api/보호된라우트')
  .set('Authorization', `Bearer ${validToken}`)
```

---

## Zustand 스토어 테스트 패턴

**도구**: Vitest + 스토어 직접 호출 (렌더링 없음)

```javascript
// client/src/store/__tests__/예시.test.js

import { describe, it, expect, vi, beforeEach } from 'vitest'
import useTargetStore from '../targetStore.js'

// 1) localStorage mock
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value) }),
    removeItem: vi.fn((key) => { delete store[key] }),
    clear() { store = {} },
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// 2) API 함수 mock
vi.mock('@/api/목표.js', () => ({
  fetchSomething: vi.fn(),
}))

import * as targetApi from '@/api/목표.js'

// 3) 각 테스트 전 스토어 + mock 초기화
beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  useTargetStore.setState({ data: null, isLoading: false }) // 초기 상태로 리셋
})

describe('fetchData', () => {
  it('API 성공 시 data 상태가 설정된다', async () => {
    targetApi.fetchSomething.mockResolvedValue({ data: { id: '1' } })

    // 스토어 액션 직접 호출 (렌더링 불필요)
    await useTargetStore.getState().fetchData()

    expect(useTargetStore.getState().data).toEqual({ id: '1' })
  })
})
```

---

## React 컴포넌트 테스트 패턴

**도구**: Vitest + React Testing Library

```jsx
// client/src/components/__tests__/예시.test.jsx

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// 1) useNavigate mock
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// 2) authStore mock
const mockStoreState = { user: null, isAnonymous: true }
vi.mock('@/store/authStore.js', () => ({
  default: (selector) => selector(mockStoreState),
}))

import TargetComponent from '../../pages/TargetPage.jsx'

function renderComponent() {
  return render(
    <MemoryRouter>
      <TargetComponent />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TargetComponent', () => {
  it('정상 렌더링된다', () => {
    renderComponent()
    expect(screen.getByText('예상 텍스트')).toBeInTheDocument()
  })

  it('버튼 클릭 시 액션이 실행된다', async () => {
    renderComponent()
    fireEvent.click(screen.getByRole('button', { name: '버튼명' }))
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled()
    })
  })
})
```

---

## 테스트 작성 규칙

### 필수 커버리지

| 대상 | 필수 케이스 |
|------|-------------|
| API 엔드포인트 | ✅ 성공 / ✅ 필수값 누락 / ✅ 인증 없음 |
| 스토어 액션 | ✅ 성공 / ✅ API 실패 시 상태 |
| 컴포넌트 | ✅ 렌더링 / ✅ 인터랙션 / ✅ 에러 상태 |

### 네이밍 규칙

```
describe: 대상 + 맥락
  'POST /api/auth/anonymous'
  'initAuth'
  'Login 컴포넌트'

it: 조건 + 결과 (한국어 서술)
  ✅ '새 deviceId로 요청하면 익명 계정이 생성된다'
  ✅ '토큰이 없고 deviceId도 없으면 isLoading이 false가 된다'
  ❌ 'works correctly'
  ❌ 'test 1'
```

### 하나의 it = 하나의 동작

```javascript
// ❌ 나쁜 예 — 여러 동작을 하나에
it('로그인이 동작한다', async () => {
  // 성공 케이스
  // 실패 케이스
  // 토큰 저장 확인
})

// ✅ 좋은 예 — 각각 분리
it('성공 시 accessToken이 localStorage에 저장된다', ...)
it('실패 시 에러를 throw한다', ...)
```

---

## 자주 쓰는 명령어

```bash
# 특정 파일만 watch
cd client && npx vitest src/store/__tests__/authStore.test.js

# 특정 테스트 이름으로 필터
cd server && npx vitest --reporter=verbose -t "익명"

# 커버리지 확인
cd client && npx vitest run --coverage
cd server && npx vitest run --coverage
```
