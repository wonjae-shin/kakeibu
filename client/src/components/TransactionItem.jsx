import { formatAmount } from '@/utils/format.js'

export default function TransactionItem({ transaction, onClick }) {
  const { type, amount, memo, category, account } = transaction
  const isIncome = type === 'income'

  return (
    <button
      onClick={() => onClick?.(transaction)}
      className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
    >
      {/* 카테고리 아이콘 */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
        style={{ backgroundColor: `${category?.color}20` }}
      >
        {category?.icon}
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium text-gray-900 truncate">
          {memo || category?.name}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {category?.name} · {account?.name}
        </p>
      </div>

      {/* 금액 */}
      <span
        className={`text-sm font-semibold flex-shrink-0 ${
          isIncome ? 'text-income' : 'text-expense'
        }`}
      >
        {isIncome ? '+' : '-'}{formatAmount(amount)}
      </span>
    </button>
  )
}
