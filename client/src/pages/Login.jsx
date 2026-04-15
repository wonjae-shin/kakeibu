import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore.js'

function BackIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function Spinner() {
  return (
    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
  )
}

export default function Login() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const anonymousLogin  = useAuthStore((s) => s.anonymousLogin)
  const login           = useAuthStore((s) => s.login)

  const [view, setView]         = useState('landing') // 'landing' | 'loginForm'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true })
  }, [isAuthenticated, navigate])

  // ── 바로 시작하기 ──────────────────────────────────
  const handleAnonymousStart = async () => {
    setLoading(true)
    try {
      await anonymousLogin()
    } catch {
      setLoading(false)
    }
  }

  // ── 이메일 로그인 제출 ─────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다')
      setLoading(false)
    }
  }

  // ── 로그인 폼 화면 ─────────────────────────────────
  if (view === 'loginForm') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <button
          onClick={() => { setView('landing'); setError(''); setEmail(''); setPassword('') }}
          className="flex items-center gap-1 px-4 pt-14 pb-2 text-sm text-gray-500 active:opacity-70"
          aria-label="뒤로"
        >
          <BackIcon />
          뒤로
        </button>

        <div className="flex-1 flex flex-col items-center justify-center px-8 -mt-20">
          <div className="w-full max-w-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-1">로그인</h2>
            <p className="text-sm text-gray-400 mb-8">가계부 계정으로 로그인하세요</p>

            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일"
                autoComplete="email"
                required
                className="w-full h-12 px-4 rounded-2xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-primary"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                autoComplete="current-password"
                required
                className="w-full h-12 px-4 rounded-2xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-primary"
              />

              {error && (
                <p className="text-sm text-expense px-1">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full h-12 mt-2 bg-primary text-white rounded-2xl text-sm font-semibold disabled:opacity-50 active:scale-95 transition-transform"
              >
                {loading ? <Spinner /> : '로그인'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ── 랜딩 화면 ──────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-8">
      <div className="mb-16 text-center">
        <div className="text-6xl mb-4">💰</div>
        <h1 className="text-2xl font-bold text-gray-900">가계부</h1>
        <p className="text-sm text-gray-400 mt-2">간편하게 수입과 지출을 기록하세요</p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={handleAnonymousStart}
          disabled={loading}
          className="w-full h-14 bg-primary text-white rounded-2xl text-base font-semibold shadow-sm active:scale-95 transition-transform disabled:opacity-60"
        >
          {loading ? <Spinner /> : '바로 시작하기'}
        </button>

        <button
          onClick={() => setView('loginForm')}
          disabled={loading}
          className="w-full h-14 bg-white text-gray-700 border border-gray-200 rounded-2xl text-base font-medium active:bg-gray-50 transition-colors disabled:opacity-60"
        >
          계정으로 로그인
        </button>
      </div>
    </div>
  )
}
