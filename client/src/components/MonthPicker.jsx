import { useState } from 'react'
import { formatMonth, addMonth, currentMonth } from '@/utils/format.js'

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

export default function MonthPicker({ month, onChange, light = false }) {
  const [open, setOpen] = useState(false)
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
    setOpen(true)
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5">
        <button
          onClick={openPicker}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${light ? 'hover:bg-white/20' : 'hover:bg-gray-100'}`}
        >
          <span className={`text-base font-semibold min-w-[80px] text-center ${light ? 'text-white' : 'text-gray-900'}`}>
            {formatMonth(month)}
          </span>
          <svg className={`w-3.5 h-3.5 ${light ? 'text-white/70' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {month !== today && (
          <button
            onClick={() => onChange(today)}
            className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${light ? 'text-white bg-white/20 hover:bg-white/30' : 'text-primary bg-primary/10 hover:bg-primary/20'}`}
          >
            이번 달 보기
          </button>
        )}
      </div>

      {/* 팝업 */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-2xl shadow-xl z-50 w-72 p-4">
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
