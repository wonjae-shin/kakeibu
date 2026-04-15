import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// useNavigate mock
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// authStore mock
const mockAnonymousLogin = vi.fn()
const mockLogin = vi.fn()
const mockStoreState = {
  isAuthenticated: false,
  anonymousLogin: mockAnonymousLogin,
  login: mockLogin,
}

vi.mock('@/store/authStore.js', () => ({
  default: (selector) => selector(mockStoreState),
}))

import Login from '../../pages/Login.jsx'

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockStoreState.isAuthenticated = false
})

describe('Landing 화면', () => {
  it('"바로 시작하기"와 "계정으로 로그인" 버튼이 렌더링된다', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: '바로 시작하기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '계정으로 로그인' })).toBeInTheDocument()
  })

  it('"바로 시작하기" 클릭 시 anonymousLogin이 호출된다', async () => {
    mockAnonymousLogin.mockResolvedValue()
    renderLogin()

    fireEvent.click(screen.getByRole('button', { name: '바로 시작하기' }))

    await waitFor(() => {
      expect(mockAnonymousLogin).toHaveBeenCalledTimes(1)
    })
  })

  it('isAuthenticated가 true가 되면 "/"로 이동한다', async () => {
    mockAnonymousLogin.mockImplementation(() => {
      mockStoreState.isAuthenticated = true
      return Promise.resolve()
    })
    renderLogin()

    // 이미 isAuthenticated인 경우 useEffect에서 navigate 호출
    mockStoreState.isAuthenticated = true
    const { rerender } = renderLogin()
    rerender(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })
  })
})

describe('로그인 폼 화면', () => {
  it('"계정으로 로그인" 클릭 시 로그인 폼이 표시된다', () => {
    renderLogin()

    fireEvent.click(screen.getByRole('button', { name: '계정으로 로그인' }))

    expect(screen.getByPlaceholderText('이메일')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('비밀번호')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
  })

  it('이메일/비밀번호 입력 후 제출하면 login이 호출된다', async () => {
    mockLogin.mockResolvedValue()
    renderLogin()

    fireEvent.click(screen.getByRole('button', { name: '계정으로 로그인' }))
    fireEvent.change(screen.getByPlaceholderText('이메일'), { target: { value: 'user@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('비밀번호'), { target: { value: 'password123' } })
    fireEvent.submit(screen.getByRole('button', { name: '로그인' }).closest('form'))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@test.com', 'password123')
    })
  })

  it('로그인 실패 시 에러 메시지가 표시된다', async () => {
    mockLogin.mockRejectedValue(new Error('401'))
    renderLogin()

    fireEvent.click(screen.getByRole('button', { name: '계정으로 로그인' }))
    fireEvent.change(screen.getByPlaceholderText('이메일'), { target: { value: 'bad@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('비밀번호'), { target: { value: 'wrong' } })
    fireEvent.submit(screen.getByRole('button', { name: '로그인' }).closest('form'))

    await waitFor(() => {
      expect(screen.getByText('이메일 또는 비밀번호가 올바르지 않습니다')).toBeInTheDocument()
    })
  })

  it('"뒤로" 클릭 시 랜딩 화면으로 돌아간다', () => {
    renderLogin()

    fireEvent.click(screen.getByRole('button', { name: '계정으로 로그인' }))
    expect(screen.getByPlaceholderText('이메일')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '뒤로' }))
    expect(screen.getByRole('button', { name: '바로 시작하기' })).toBeInTheDocument()
  })
})
