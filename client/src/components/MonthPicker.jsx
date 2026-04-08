import { formatMonth, addMonth } from '@/utils/format.js'

export default function MonthPicker({ month, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(addMonth(month, -1))}
        className="p-1 text-gray-500 hover:text-gray-800"
        aria-label="이전 달"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <span className="text-base font-semibold text-gray-900 min-w-[90px] text-center">
        {formatMonth(month)}
      </span>
      <button
        onClick={() => onChange(addMonth(month, 1))}
        className="p-1 text-gray-500 hover:text-gray-800"
        aria-label="다음 달"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
