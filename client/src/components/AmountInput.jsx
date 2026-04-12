// 커스텀 숫자 키패드 컴포넌트
// value: number(원 단위), onChange: (number) => void

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'del']

export default function AmountInput({ value, onChange }) {
  const handleKey = (key) => {
    const str = String(value === 0 ? '' : value)
    if (key === 'del') {
      const next = str.slice(0, -1)
      onChange(next === '' ? 0 : parseInt(next))
    } else {
      const next = str + key
      const num = parseInt(next)
      // 최대 10억 제한
      if (num <= 1_000_000_000) onChange(num)
    }
  }

  return (
    <div className="grid grid-cols-3 gap-1 px-2">
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => handleKey(key)}
          className={`h-14 rounded-xl text-xl font-medium transition-colors
            ${key === 'del'
              ? 'bg-gray-100 text-gray-600 active:bg-gray-200'
              : 'bg-[#F5F3F0] text-gray-900 active:bg-gray-200'
            }`}
        >
          {key === 'del' ? (
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
              </svg>
            </span>
          ) : key}
        </button>
      ))}
    </div>
  )
}
