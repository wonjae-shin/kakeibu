import { useState, useEffect, useCallback } from 'react'
import { getBudgets, createBudget, updateBudget, deleteBudget } from '@/api/budgets.js'
import { getCategories } from '@/api/categories.js'
import { getTransactionSummary, getTransactions } from '@/api/transactions.js'
import MonthPicker from '@/components/MonthPicker.jsx'
import BottomSheet from '@/components/BottomSheet.jsx'
import ErrorMessage from '@/components/ErrorMessage.jsx'
import PageLayout from '@/components/PageLayout.jsx'
import Card from '@/components/Card.jsx'
import { currentMonth, formatAmount } from '@/utils/format.js'

function ProgressBar({ ratio, amount, budgetAmount }) {
  const color =
    ratio >= 100 ? 'bg-expense' : ratio >= 90 ? 'bg-warning' : 'bg-primary'
  const textColor =
    ratio >= 100 ? 'text-expense' : ratio >= 90 ? 'text-warning' : 'text-primary'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">
          사용 <span className="font-medium text-gray-800">{formatAmount(amount)}</span>
        </span>
        <span className={`font-semibold ${textColor}`}>
          {ratio >= 100 ? '초과!' : `${ratio}%`}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(ratio, 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1 text-right">
        {ratio >= 100
          ? `${formatAmount(amount - budgetAmount)} 초과`
          : `${formatAmount(budgetAmount - amount)} 남음`}
      </p>
    </div>
  )
}

export default function Budget() {
  const [month, setMonth] = useState(currentMonth())
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [catExpenses, setCatExpenses] = useState({})   // categoryId → spent amount
  const [totalExpense, setTotalExpense] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 편집 시트
  const [editSheet, setEditSheet] = useState(false)
  const [editTarget, setEditTarget] = useState(null) // null=신규, budget 객체=수정
  const [editCategoryId, setEditCategoryId] = useState(null) // null=전체
  const [editAmount, setEditAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [budgetRes, catRes, summaryRes, txRes] = await Promise.all([
        getBudgets(month),
        getCategories(),
        getTransactionSummary(month),
        getTransactions({ month, type: 'expense' }),
      ])
      setBudgets(budgetRes.data)
      setCategories(catRes.data)
      setTotalExpense(summaryRes.data.expense)

      // 카테고리별 지출 집계
      const map = {}
      for (const tx of txRes.data) {
        map[tx.categoryId] = (map[tx.categoryId] || 0) + tx.amount
      }
      setCatExpenses(map)
    } catch {
      setError('데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { fetchData() }, [fetchData])

  const totalBudget = budgets.find((b) => !b.categoryId)
  const catBudgets = budgets.filter((b) => b.categoryId)
  const totalRatio = totalBudget
    ? Math.round((totalExpense / totalBudget.amount) * 100)
    : null

  const openEdit = (budget, categoryId = null) => {
    setEditTarget(budget)
    setEditCategoryId(categoryId)
    setEditAmount(budget ? String(budget.amount) : '')
    setEditSheet(true)
  }

  const handleSave = async () => {
    const amt = parseInt(editAmount.replace(/,/g, ''))
    if (!amt || amt <= 0) return
    setSaving(true)
    try {
      if (editTarget) {
        await updateBudget(editTarget.id, { amount: amt })
      } else {
        await createBudget({ month, amount: amt, categoryId: editCategoryId })
      }
      setEditSheet(false)
      fetchData()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteBudget(id)
      fetchData()
    } catch {
      setError('삭제에 실패했습니다.')
    }
  }

  // 예산 미설정 카테고리 목록 (지출 카테고리만)
  const setBudgetCatIds = new Set(catBudgets.map((b) => b.categoryId))
  const expenseCats = categories.filter(
    (c) => (c.type === 'expense' || c.type === 'both') && !setBudgetCatIds.has(c.id)
  )

  return (
    <PageLayout>
      {/* 헤더 카드 */}
      <Card className="px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-900">예산</h1>
          <MonthPicker month={month} onChange={setMonth} />
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchData} />
      ) : (
        <>
          {/* 전체 예산 */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-800">전체 예산</h2>
              <div className="flex items-center gap-2">
                {totalBudget && (
                  <span className="text-sm font-bold text-gray-900">
                    {formatAmount(totalBudget.amount)}
                  </span>
                )}
                <button
                  onClick={() => openEdit(totalBudget || null, null)}
                  className="text-xs text-primary font-medium px-2.5 py-1 rounded-lg bg-primary/10"
                >
                  {totalBudget ? '편집' : '+ 설정'}
                </button>
                {totalBudget && (
                  <button
                    onClick={() => handleDelete(totalBudget.id)}
                    className="text-xs text-gray-400"
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
            {totalBudget ? (
              <ProgressBar
                ratio={totalRatio}
                amount={totalExpense}
                budgetAmount={totalBudget.amount}
              />
            ) : (
              <p className="text-sm text-gray-400 text-center py-3">
                전체 예산을 설정해주세요.
              </p>
            )}
          </Card>

          {/* 카테고리별 예산 */}
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-gray-800">카테고리별 예산</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {catBudgets.map((budget) => {
                const cat = categories.find((c) => c.id === budget.categoryId)
                const spent = catExpenses[budget.categoryId] || 0
                const ratio = Math.round((spent / budget.amount) * 100)
                return (
                  <div key={budget.id} className="px-4 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                          style={{ backgroundColor: `${cat?.color}20` }}
                        >
                          {cat?.icon}
                        </span>
                        <span className="text-sm font-medium text-gray-800">{cat?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{formatAmount(budget.amount)}</span>
                        <button
                          onClick={() => openEdit(budget, budget.categoryId)}
                          className="text-xs text-primary"
                        >
                          편집
                        </button>
                        <button
                          onClick={() => handleDelete(budget.id)}
                          className="text-xs text-gray-400"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    <ProgressBar ratio={ratio} amount={spent} budgetAmount={budget.amount} />
                  </div>
                )
              })}

              {/* 카테고리 예산 추가 */}
              {expenseCats.length > 0 && (
                <div className="px-4 py-3">
                  <p className="text-xs text-gray-400 mb-2">예산 미설정 카테고리</p>
                  <div className="flex flex-wrap gap-2">
                    {expenseCats.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => openEdit(null, cat.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-xs text-gray-600 active:bg-[#F5F3F0]"
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                        <span className="text-primary font-bold">+</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {/* 예산 편집 바텀 시트 */}
      <BottomSheet
        isOpen={editSheet}
        onClose={() => setEditSheet(false)}
        title={
          editCategoryId
            ? `${categories.find((c) => c.id === editCategoryId)?.name} 예산 ${editTarget ? '수정' : '설정'}`
            : `전체 예산 ${editTarget ? '수정' : '설정'}`
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">예산 금액</label>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-primary">
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder="0"
                className="flex-1 text-lg font-semibold text-gray-900 focus:outline-none"
                autoFocus
              />
              <span className="text-gray-400 text-sm">원</span>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !editAmount}
            className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold disabled:opacity-40"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </BottomSheet>
    </PageLayout>
  )
}
