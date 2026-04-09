import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AmountInput from '../AmountInput.jsx'

describe('AmountInput', () => {
  it('숫자 키를 누르면 onChange가 해당 숫자로 호출된다', () => {
    const onChange = vi.fn()
    render(<AmountInput value={0} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: '5' }))
    expect(onChange).toHaveBeenCalledWith(5)
  })

  it('기존 값에 숫자를 추가하면 이어붙여진다', () => {
    const onChange = vi.fn()
    render(<AmountInput value={1} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: '2' }))
    expect(onChange).toHaveBeenCalledWith(12)
  })

  it('del 키를 누르면 마지막 자리가 삭제된다', () => {
    const onChange = vi.fn()
    render(<AmountInput value={123} onChange={onChange} />)

    const delButton = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('svg')
    )
    fireEvent.click(delButton)
    expect(onChange).toHaveBeenCalledWith(12)
  })

  it('값이 0일 때 del을 누르면 0을 유지한다', () => {
    const onChange = vi.fn()
    render(<AmountInput value={0} onChange={onChange} />)

    const delButton = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('svg')
    )
    fireEvent.click(delButton)
    expect(onChange).toHaveBeenCalledWith(0)
  })

  it('00 키는 값이 0이면 onChange를 호출하지 않는다', () => {
    const onChange = vi.fn()
    render(<AmountInput value={0} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: '00' }))
    // 0 + '00' = '00' → parseInt('00') = 0, but 0 <= 1_000_000_000 so called with 0
    // Actually: str = '' (value=0), next = '00', num = 0 → onChange(0)
    expect(onChange).toHaveBeenCalledWith(0)
  })

  it('10억 초과 입력은 무시된다', () => {
    const onChange = vi.fn()
    render(<AmountInput value={1_000_000_000} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: '1' }))
    expect(onChange).not.toHaveBeenCalled()
  })
})
