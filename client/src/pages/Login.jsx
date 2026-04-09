import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore.js'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleKey = (key) => {
    if (loading) return
    if (key === 'del') {
      setPin((p) => p.slice(0, -1))
      setError(false)
      return
    }
    if (key === '') return
    if (pin.length >= 4) return
    const next = pin + key
    setPin(next)
    setError(false)
    if (next.length === 4) {
      submitPin(next)
    }
  }

  const submitPin = async (value) => {
    setLoading(true)
    try {
      await login(value)
      navigate('/', { replace: true })
    } catch {
      setError(true)
      setShake(true)
      setTimeout(() => {
        setShake(false)
        setPin('')
        setError(false)
        setLoading(false)
      }, 600)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 select-none">
      {/* 로고 */}
      <div className="mb-12 text-center">
        <div className="text-5xl mb-3">💰</div>
        <h1 className="text-2xl font-bold text-gray-900">가계부</h1>
        <p className="text-sm text-gray-400 mt-1">PIN을 입력해주세요</p>
      </div>

      {/* PIN 도트 */}
      <div className={`flex gap-5 mb-12 ${shake ? 'animate-shake' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
              error
                ? 'bg-expense border-expense'
                : pin.length > i
                ? 'bg-primary border-primary scale-110'
                : 'bg-transparent border-gray-300'
            }`}
          />
        ))}
      </div>

      {/* 에러 메시지 */}
      <div className="h-5 mb-6">
        {error && (
          <p className="text-sm text-expense text-center">PIN이 올바르지 않습니다</p>
        )}
      </div>

      {/* 키패드 */}
      <div className="grid grid-cols-3 gap-3 w-72">
        {KEYS.map((key, i) => (
          <button
            key={i}
            onClick={() => handleKey(key)}
            disabled={key === ''}
            className={`h-16 rounded-2xl text-2xl font-medium transition-all active:scale-95 ${
              key === ''
                ? 'invisible'
                : key === 'del'
                ? 'bg-gray-100 text-gray-500 active:bg-gray-200'
                : 'bg-white shadow-sm text-gray-900 active:bg-gray-100'
            }`}
          >
            {key === 'del' ? (
              <span className="flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                </svg>
              </span>
            ) : key}
          </button>
        ))}
      </div>
    </div>
  )
}
