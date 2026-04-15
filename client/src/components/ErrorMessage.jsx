export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 px-6">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
        <svg className="w-6 h-6 text-expense" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-sm text-gray-500 text-center">{message || '오류가 발생했습니다.'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-primary font-medium px-4 py-2 rounded-lg bg-primary/10"
        >
          다시 시도
        </button>
      )}
    </div>
  )
}
