import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import {
  anonymousLogin as apiAnonymousLogin,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  getMe,
} from '@/api/auth.js'
import { generateRecurring } from '@/api/transactions.js'

const useAuthStore = create((set, get) => ({
  user: null,
  isAnonymous: false,
  isAuthenticated: false,
  isLoading: true,

  // 앱 초기화 시 인증 상태 복원
  initAuth: async () => {
    const token = localStorage.getItem('accessToken')

    if (token) {
      try {
        const meRes = await getMe()
        set({
          user: meRes.data,
          isAnonymous: meRes.data.isAnonymous,
          isAuthenticated: true,
          isLoading: false,
        })
        try { await generateRecurring() } catch { /* ignore */ }
        return
      } catch {
        // 토큰 무효 → 토큰 제거 후 fallback
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      }
    }

    // 토큰 없음: deviceId 있으면 익명 자동 로그인, 없으면 랜딩 페이지
    const deviceId = localStorage.getItem('deviceId')
    if (deviceId) {
      await get().anonymousLogin()
    } else {
      set({ isLoading: false })
    }
  },

  // 익명 로그인 (바로 시작하기 또는 자동 복원)
  anonymousLogin: async () => {
    try {
      let deviceId = localStorage.getItem('deviceId')
      if (!deviceId) {
        deviceId = uuidv4()
        localStorage.setItem('deviceId', deviceId)
      }

      const res = await apiAnonymousLogin(deviceId)
      localStorage.setItem('accessToken', res.data.accessToken)
      localStorage.setItem('refreshToken', res.data.refreshToken)

      const meRes = await getMe()
      set({
        user: meRes.data,
        isAnonymous: true,
        isAuthenticated: true,
        isLoading: false,
      })
      try { await generateRecurring() } catch { /* ignore */ }
    } catch {
      set({ isLoading: false })
    }
  },

  // 이메일/비밀번호 로그인 (Policy A: 기존 익명 deviceId 제거)
  login: async (email, password) => {
    const res = await apiLogin(email, password)
    localStorage.setItem('accessToken', res.data.accessToken)
    localStorage.setItem('refreshToken', res.data.refreshToken)
    localStorage.removeItem('deviceId') // Policy A

    const meRes = await getMe()
    set({ user: meRes.data, isAnonymous: false, isAuthenticated: true })
    try { await generateRecurring() } catch { /* ignore */ }
  },

  // 익명 계정을 이메일 계정으로 업그레이드
  register: async (email, password) => {
    const res = await apiRegister(email, password)
    localStorage.setItem('accessToken', res.data.accessToken)
    localStorage.setItem('refreshToken', res.data.refreshToken)
    localStorage.removeItem('deviceId') // 등록 완료 신호

    const meRes = await getMe()
    set({ user: meRes.data, isAnonymous: false, isAuthenticated: true })
  },

  logout: async () => {
    try { await apiLogout() } catch { /* ignore */ }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({ user: null, isAnonymous: false, isAuthenticated: false })
  },
}))

export default useAuthStore
