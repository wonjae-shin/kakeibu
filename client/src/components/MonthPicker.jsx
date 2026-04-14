import { useState, useRef } from 'react'
import { formatMonth, currentMonth, addMonth } from '@/utils/format.js'

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

export default function MonthPicker({ month, onChange, light = false }) {
  const [open, setOpen] = useState(false)
  const [popupStyle, setPopupStyle] = useState({})
  const triggerRef = useRef(null)
  const today = currentMonth()

  const currentYear = parseInt(month.split('-')[0])
  const currentMon = parseInt(month.split('-')[1])
  const [pickerYear, setPickerYear] = useState(currentYear)

  const select = (m) => {
    onChange(`${pickerYear}-${String(m).padStart(2, '0')}`)
    setOpen(false)
  }

  const openPicker = () => {
    setPickerYear(currentYear)
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const popupWidth = 288 // w-72
      const popupHeight = 220
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth

      let top = rect.bottom + 8
      // 아래 공간 부족하면 위로
      if (top + popupHeight > viewportHeight - 16) {
        top = rect.top - popupHeight - 8
      }
      let left = rect.left + rect.width / 2 - popupWidth / 2
      if (left < 8) left = 8
      if (left + popupWidth > viewportWidth - 8) left = viewportWidth - popupWidth - 8

      setPopupStyle({ top, left, width: popupWidth })
    }
    setOpen(true)
  }

  const navBtnClass = `p-1.5 rounded-lg transition-colors ${light ? 'text-white/70 hover:bg-white/20' : 'text-gray-400 hover:bg-gray-100'}`
  const chevron = (d) => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d={d === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
    </svg>
  )

  return (
    <div className="relative flex items-center gap-1">
      {/* 이전 달 */}
      <button onClick={() => onChange(addMonth(month, -1))} className={navBtnClass}>
        {chevron('left')}
      </button>

      {/* 월 텍스트 + 팝업 트리거 */}
      <button
        ref={triggerRef}
        onClick={openPicker}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${light ? 'hover:bg-white/20' : 'hover:bg-gray-100'}`}
      >
        <span className={`text-base font-semibold whitespace-nowrap text-center ${light ? 'text-white' : 'text-gray-900'}`}>
          {formatMonth(month)}
        </span>
      </button>

      {/* 다음 달 */}
      <button onClick={() => onChange(addMonth(month, 1))} className={navBtnClass}>
        {chevron('right')}
      </button>

      {/* 팝업 — fixed로 뷰포트 기준 위치 */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed bg-white rounded-2xl shadow-xl z-50 p-4"
            style={popupStyle}
          >
            {/* 연도 선택 */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setPickerYear((y) => y - 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-base font-bold text-gray-900">{pickerYear}년</span>
              <button
                onClick={() => setPickerYear((y) => y + 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* 월 그리드 */}
            <div className="grid grid-cols-4 gap-1.5">
              {MONTHS.map((label, i) => {
                const m = i + 1
                const isSelected = pickerYear === currentYear && m === currentMon
                return (
                  <button
                    key={m}
                    onClick={() => select(m)}
                    className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-primary text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
