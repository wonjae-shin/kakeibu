import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTransactionSummary, getTransactions } from '@/api/transactions.js'
import { getBudgets } from '@/api/budgets.js'
import TransactionItem from '@/components/TransactionItem.jsx'
import MonthPicker from '@/components/MonthPicker.jsx'
import Card from '@/components/Card.jsx'
import PageLayout from '@/components/PageLayout.jsx'
import { currentMonth, formatAmount } from '@/utils/format.js'

export default function Dashboard() {
  const navigate = useNavigate()
  const [month, setMonth] = useState(currentMonth())
  const [summary, setSummary] = useState({ income: 0, expense: 0 })
  const [budgets, setBudgets] = useState([])
  const [recentTx, setRecentTx] = useState([])
  const [categoryTops, setCategoryTops] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [sumRes, txRes, budgetRes] = await Promise.all([
        getTransactionSummary(month),
        getTransactions({ month }),
        getBudgets(month),
      ])

      setSummary(sumRes.data)
      setBudgets(budgetRes.data)

      const all = txRes.data
      // 최근 5건
      setRecentTx(all.slice(0, 5))

      // 카테고리별 TOP3 지출
      const expenseTx = all.filter((t) => t.type === 'expense')
      const catMap = {}
      for (const tx of expenseTx) {
        const { id, name, icon, color } = tx.category
        if (!catMap[id]) catMap[id] = { id, name, icon, color, amount: 0 }
        catMap[id].amount += tx.amount
      }
      const tops = Object.values(catMap)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3)
      setCategoryTops(tops)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { fetchData() }, [fetchData])

  // 전체 예산 (categoryId가 null인 것)
  const totalBudget = budgets.find((b) => !b.categoryId)
  const budgetRatio = totalBudget
    ? Math.min(Math.round((summary.expense / totalBudget.amount) * 100), 100)
    : null
  const budgetColor =
    budgetRatio === null ? 'bg-primary'
      : budgetRatio >= 100 ? 'bg-expense'
        : budgetRatio >= 90 ? 'bg-warning'
          : 'bg-primary'

  const maxCatAmount = categoryTops[0]?.amount || 1

  const balance = summary.income - summary.expense

  return (
    <PageLayout>
      {/* 헤더 카드 */}
      <Card className="px-4 py-3">
        <div className="grid grid-cols-3 items-center">
          <div />
          <div className="flex justify-center">
            <MonthPicker month={month} onChange={setMonth} />
          </div>
          <div className="flex justify-end">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center justify-center w-8 h-8 text-gray-500 rounded-lg bg-gray-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          </div>
        </div>
      </Card>

      {/* 이번달 요약 카드 */}
      <Card className="px-4 pb-5 pt-4">
        {loading ? (
          <div className="h-24 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="mb-5">
              <p className="text-gray-400 text-xs font-medium tracking-widest uppercase mb-2">이번달 지출</p>
              <p className="text-gray-900 text-4xl font-bold tracking-tight">
                {formatAmount(summary.expense)}
              </p>
            </div>

            {/* 수입 / 잔액 차트 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
                <p className="text-gray-400 text-xs mb-1.5">수입</p>
                <p className="text-emerald-500 font-semibold text-base">+{formatAmount(summary.income)}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
                <p className="text-gray-400 text-xs mb-1.5">잔액</p>
                <p className={`font-semibold text-base ${balance >= 0 ? 'text-gray-800' : 'text-rose-500'}`}>
                  {balance >= 0 ? '+' : ''}{formatAmount(balance)}
                </p>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* 예산 진행바 */}
      {totalBudget && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800">예산 사용률</h2>
            <span className={`text-sm font-bold ${budgetRatio >= 100 ? 'text-expense' : budgetRatio >= 90 ? 'text-warning' : 'text-primary'}`}>
              {budgetRatio}%
            </span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all ${budgetColor}`}
              style={{ width: `${budgetRatio}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>사용 {formatAmount(summary.expense)}</span>
            <span>남은 {formatAmount(Math.max(totalBudget.amount - summary.expense, 0))}</span>
          </div>
        </Card>
      )}

      {/* 카테고리별 TOP3 */}
      {categoryTops.length > 0 && (
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">카테고리별 TOP 3</h2>
          <div className="flex flex-col gap-3">
            {categoryTops.map((cat) => {
              const ratio = Math.round((cat.amount / maxCatAmount) * 100)
              return (
                <div key={cat.id} className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                    style={{ backgroundColor: `${cat.color}20` }}
                  >
                    {cat.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">{cat.name}</span>
                      <span className="text-xs font-semibold text-gray-800">{formatAmount(cat.amount)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${ratio}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* 최근 거래 */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-800">최근 거래</h2>
          <button
            onClick={() => navigate(`/transactions?month=${month}`)}
            className="text-xs text-primary font-medium"
          >
            전체 보기
          </button>
        </div>
        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentTx.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">거래 내역이 없습니다.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentTx.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onClick={() => navigate(`/transactions/${tx.id}/edit`)}
              />
            ))}
          </div>
        )}
      </Card>
    </PageLayout>
  )
}
