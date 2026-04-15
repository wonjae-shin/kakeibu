import { describe, it, expect, vi, beforeEach } from 'vitest'
import useAuthStore from '../authStore.js'

// --- localStorage mock ---
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

// --- uuid mock ---
vi.mock('uuid', () => ({ v4: () => 'mock-uuid-0000' }))

// --- API mocks ---
vi.mock('@/api/auth.js', () => ({
  anonymousLogin: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getMe: vi.fn(),
}))
vi.mock('@/api/transactions.js', () => ({
  generateRecurring: vi.fn(),
}))

import * as authApi from '@/api/auth.js'

const ANON_USER = { id: 'anon-1', email: null, isAnonymous: true, createdAt: new Date().toISOString() }
const REG_USER = { id: 'reg-1', email: 'user@test.com', isAnonymous: false, createdAt: new Date().toISOString() }

function resetStore() {
  useAuthStore.setState({ user: null, isAnonymous: false, isAuthenticated: false, isLoading: true })
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  resetStore()
})

// ─────────────────────────────────────────
// initAuth
// ─────────────────────────────────────────
describe('initAuth', () => {
  it('유효한 토큰이 있으면 /me를 호출해 상태를 복원한다', async () => {
    localStorageMock.getItem.mockImplementation((key) =>
      key === 'accessToken' ? 'valid-token' : null
    )
    authApi.getMe.mockResolvedValue({ data: REG_USER })

    await useAuthStore.getState().initAuth()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.isAnonymous).toBe(false)
    expect(state.user).toEqual(REG_USER)
    expect(state.isLoading).toBe(false)
  })

  it('토큰 없고 deviceId 있으면 anonymousLogin을 자동 실행한다', async () => {
    localStorageMock.getItem.mockImplementation((key) =>
      key === 'deviceId' ? 'existing-device-id' : null
    )
    authApi.anonymousLogin.mockResolvedValue({ data: { accessToken: 'tok', refreshToken: 'ref' } })
    authApi.getMe.mockResolvedValue({ data: ANON_USER })

    await useAuthStore.getState().initAuth()

    expect(authApi.anonymousLogin).toHaveBeenCalledWith('existing-device-id')
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.isAnonymous).toBe(true)
  })

  it('토큰 없고 deviceId도 없으면 isLoading을 false로 설정한다 (랜딩 페이지)', async () => {
    localStorageMock.getItem.mockReturnValue(null)

    await useAuthStore.getState().initAuth()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isLoading).toBe(false)
    expect(authApi.anonymousLogin).not.toHaveBeenCalled()
  })

  it('토큰이 유효하지 않으면 토큰을 제거하고 deviceId로 fallback한다', async () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'accessToken') return 'expired-token'
      if (key === 'deviceId') return 'my-device'
      return null
    })
    authApi.getMe.mockRejectedValueOnce(new Error('401'))
    authApi.anonymousLogin.mockResolvedValue({ data: { accessToken: 'new', refreshToken: 'ref' } })
    authApi.getMe.mockResolvedValueOnce({ data: ANON_USER })

    await useAuthStore.getState().initAuth()

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken')
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken')
    expect(authApi.anonymousLogin).toHaveBeenCalledWith('my-device')
  })
})

// ─────────────────────────────────────────
// anonymousLogin
// ─────────────────────────────────────────
describe('anonymousLogin', () => {
  it('deviceId가 없으면 UUID를 생성해 저장하고 API를 호출한다', async () => {
    localStorageMock.getItem.mockReturnValue(null)
    authApi.anonymousLogin.mockResolvedValue({ data: { accessToken: 'tok', refreshToken: 'ref' } })
    authApi.getMe.mockResolvedValue({ data: ANON_USER })

    await useAuthStore.getState().anonymousLogin()

    expect(localStorageMock.setItem).toHaveBeenCalledWith('deviceId', 'mock-uuid-0000')
    expect(authApi.anonymousLogin).toHaveBeenCalledWith('mock-uuid-0000')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().isAnonymous).toBe(true)
  })

  it('기존 deviceId가 있으면 그대로 사용한다', async () => {
    localStorageMock.getItem.mockImplementation((key) =>
      key === 'deviceId' ? 'stored-device' : null
    )
    authApi.anonymousLogin.mockResolvedValue({ data: { accessToken: 'tok', refreshToken: 'ref' } })
    authApi.getMe.mockResolvedValue({ data: ANON_USER })

    await useAuthStore.getState().anonymousLogin()

    expect(authApi.anonymousLogin).toHaveBeenCalledWith('stored-device')
  })
})

// ─────────────────────────────────────────
// login (이메일/비밀번호)
// ─────────────────────────────────────────
describe('login', () => {
  it('성공 시 토큰을 저장하고 deviceId를 제거한다 (Policy A)', async () => {
    authApi.login.mockResolvedValue({ data: { accessToken: 'tok', refreshToken: 'ref', email: 'user@test.com' } })
    authApi.getMe.mockResolvedValue({ data: REG_USER })

    await useAuthStore.getState().login('user@test.com', 'password123')

    expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'tok')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', 'ref')
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('deviceId')
    expect(useAuthStore.getState().isAnonymous).toBe(false)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('실패 시 예외를 전파한다', async () => {
    authApi.login.mockRejectedValue(new Error('401'))
    await expect(useAuthStore.getState().login('bad@test.com', 'wrong')).rejects.toThrow()
  })
})

// ─────────────────────────────────────────
// register (익명 → 등록 업그레이드)
// ─────────────────────────────────────────
describe('register', () => {
  it('성공 시 새 토큰을 저장하고 deviceId를 제거한다', async () => {
    authApi.register.mockResolvedValue({ data: { accessToken: 'new-tok', refreshToken: 'new-ref', email: 'new@test.com' } })
    authApi.getMe.mockResolvedValue({ data: REG_USER })

    await useAuthStore.getState().register('new@test.com', 'mypassword')

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('deviceId')
    expect(useAuthStore.getState().isAnonymous).toBe(false)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })
})

// ─────────────────────────────────────────
// logout
// ─────────────────────────────────────────
describe('logout', () => {
  it('토큰을 제거하고 상태를 초기화한다', async () => {
    useAuthStore.setState({ user: REG_USER, isAnonymous: false, isAuthenticated: true })
    authApi.logout.mockResolvedValue({})

    await useAuthStore.getState().logout()

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken')
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken')
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isAnonymous).toBe(false)
  })
})
