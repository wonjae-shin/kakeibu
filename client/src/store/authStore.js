import { create } from 'zustand'
import { login as apiLogin, logout as apiLogout, getMe } from '@/api/auth.js'

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const res = await apiLogin(email, password)
    const { accessToken, refreshToken } = res.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    const meRes = await getMe()
    set({ user: meRes.data, isAuthenticated: true })
  },

  logout: async () => {
    try {
      await apiLogout()
    } catch {}
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({ user: null, isAuthenticated: false })
  },

  // 앱 초기 진입 시 토큰으로 자동 로그인 복원
  initAuth: async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      set({ isLoading: false })
      return
    }
    try {
      const res = await getMe()
      set({ user: res.data, isAuthenticated: true, isLoading: false })
    } catch {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      set({ isLoading: false })
    }
  },
}))

export default useAuthStore
