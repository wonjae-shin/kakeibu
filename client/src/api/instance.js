import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 요청 인터셉터 — Authorization 헤더 자동 첨부
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 응답 인터셉터 — 401 처리
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const isAuthEndpoint = original.url?.startsWith('/auth/')
    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true

      // 1) refresh 토큰으로 accessToken 갱신 시도
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken })
          const newToken = data.data.accessToken
          localStorage.setItem('accessToken', newToken)
          original.headers.Authorization = `Bearer ${newToken}`
          return api(original)
        } catch {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        }
      }

      // 2) refresh 실패 or 없음: 익명 유저면 재로그인, 등록 유저면 랜딩으로
      const deviceId = localStorage.getItem('deviceId')
      if (deviceId) {
        try {
          const { data } = await axios.post('/api/auth/anonymous', { deviceId })
          localStorage.setItem('accessToken', data.data.accessToken)
          localStorage.setItem('refreshToken', data.data.refreshToken)
          original.headers.Authorization = `Bearer ${data.data.accessToken}`
          return api(original)
        } catch {
          window.location.href = '/'
        }
      } else {
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

export default api
