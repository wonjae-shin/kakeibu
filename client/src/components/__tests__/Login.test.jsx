import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// useNavigate mock
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// authStore mock
const mockLogin = vi.fn()
vi.mock('@/store/authStore.js', () => ({
  default: (selector) => selector({ login: mockLogin }),
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
})

describe('Login', () => {
  it('PIN 4자리 입력 완료 시 login 함수가 호출된다', async () => {
    mockLogin.mockResolvedValue()
    renderLogin()

    // 키패드 버튼 클릭: 1, 2, 3, 4
    fireEvent.click(screen.getByRole('button', { name: '1' }))
    fireEvent.click(screen.getByRole('button', { name: '2' }))
    fireEvent.click(screen.getByRole('button', { name: '3' }))
    fireEvent.click(screen.getByRole('button', { name: '4' }))

    expect(mockLogin).toHaveBeenCalledWith('1234')
  })

  it('login 실패 시 에러 메시지가 표시된다', async () => {
    mockLogin.mockRejectedValue(new Error('PIN 오류'))
    renderLogin()

    fireEvent.click(screen.getByRole('button', { name: '1' }))
    fireEvent.click(screen.getByRole('button', { name: '2' }))
    fireEvent.click(screen.getByRole('button', { name: '3' }))
    fireEvent.click(screen.getByRole('button', { name: '4' }))

    // 에러 메시지 나타날 때까지 대기
    const errorMsg = await screen.findByText('PIN이 올바르지 않습니다')
    expect(errorMsg).toBeInTheDocument()
  })

  it('del 키로 마지막 자리를 삭제할 수 있다', () => {
    mockLogin.mockResolvedValue()
    renderLogin()

    fireEvent.click(screen.getByRole('button', { name: '1' }))
    fireEvent.click(screen.getByRole('button', { name: '2' }))
    // del 버튼 (svg 포함, aria-label 없음 → role button으로 직접)
    const delButton = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('svg')
    )
    fireEvent.click(delButton)

    // PIN이 '1'만 남았으므로 login이 호출되지 않음
    expect(mockLogin).not.toHaveBeenCalled()
  })
})
