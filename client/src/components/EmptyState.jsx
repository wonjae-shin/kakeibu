export default function EmptyState({ message = '데이터가 없습니다.', icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
      {icon || (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
      <p className="text-sm">{message}</p>
    </div>
  )
}
