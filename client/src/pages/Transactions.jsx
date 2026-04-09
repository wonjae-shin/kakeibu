import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTransactions, deleteTransaction } from '@/api/transactions.js'
import { getCategories } from '@/api/categories.js'
import TransactionItem from '@/components/TransactionItem.jsx'
import MonthPicker from '@/components/MonthPicker.jsx'
import BottomSheet from '@/components/BottomSheet.jsx'
import EmptyState from '@/components/EmptyState.jsx'
import ErrorMessage from '@/components/ErrorMessage.jsx'
import { currentMonth, formatAmount, formatDate } from '@/utils/format.js'

export default function Transactions() {
  const navigate = useNavigate()
  const [month, setMonth] = useState(currentMonth())
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 필터
  const [filterType, setFilterType] = useState('all') // all | income | expense
  const [filterCategory, setFilterCategory] = useState('')
  const [search, setSearch] = useState('')
  const [filterSheet, setFilterSheet] = useState(false)

  // 삭제 확인
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { month }
      if (filterType !== 'all') params.type = filterType
      if (filterCategory) params.category = filterCategory
      if (search) params.search = search
      const [txRes, catRes] = await Promise.all([
        getTransactions(params),
        getCategories(),
      ])
      setTransactions(txRes.data)
      setCategories(catRes.data)
    } catch {
      setError('데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [month, filterType, filterCategory, search])

  useEffect(() => { fetchData() }, [fetchData])

  // 날짜별 그룹핑
  const grouped = transactions.reduce((acc, tx) => {
    const key = tx.date
    if (!acc[key]) acc[key] = []
    acc[key].push(tx)
    return acc
  }, {})
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  // 월 합계
  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteTransaction(deleteTarget)
      setDeleteTarget(null)
      fetchData()
    } catch {
      setDeleteTarget(null)
      setError('삭제에 실패했습니다.')
    }
  }

  const activeFilterCount = [filterType !== 'all', filterCategory !== ''].filter(Boolean).length

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white px-4 pb-3 pt-safe sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mt-2 mb-3">
          <MonthPicker month={month} onChange={(m) => { setMonth(m); setFilterType('all'); setFilterCategory('') }} />
          <button
            onClick={() => setFilterSheet(true)}
            className="relative flex items-center gap-1 text-sm text-gray-500 px-3 py-1.5 rounded-lg bg-gray-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            필터
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* 검색 */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="메모, 카테고리 검색"
            className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none"
          />
        </div>
      </div>

      {/* 내역 리스트 */}
      <div className="flex-1">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchData} />
        ) : sortedDates.length === 0 ? (
          <EmptyState message="거래 내역이 없습니다." />
        ) : (
          sortedDates.map((date) => (
            <div key={date} className="mb-2">
              {/* 날짜 헤더 */}
              <div className="px-4 py-2 bg-gray-50">
                <span className="text-xs font-medium text-gray-500">{formatDate(date)}</span>
              </div>
              {/* 거래 목록 */}
              <div className="bg-white divide-y divide-gray-50">
                {grouped[date].map((tx) => (
                  <div key={tx.id} className="flex items-center group">
                    <div className="flex-1 min-w-0">
                      <TransactionItem
                        transaction={tx}
                        onClick={() => navigate(`/transactions/${tx.id}/edit`)}
                      />
                    </div>
                    <button
                      onClick={() => setDeleteTarget(tx.id)}
                      className="flex-shrink-0 px-3 py-4 text-gray-300 hover:text-expense transition-colors"
                      aria-label="삭제"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 하단 월별 합계 */}
      <div className="sticky bg-white border-t border-gray-100 px-4 py-3 flex justify-between text-sm" style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400">수입</span>
          <span className="font-semibold text-income">+{formatAmount(income)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400">지출</span>
          <span className="font-semibold text-expense">-{formatAmount(expense)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400">잔액</span>
          <span className={`font-semibold ${income - expense >= 0 ? 'text-income' : 'text-expense'}`}>
            {(income - expense) >= 0 ? '+' : ''}{formatAmount(income - expense)}
          </span>
        </div>
      </div>

      {/* 필터 바텀 시트 */}
      <BottomSheet isOpen={filterSheet} onClose={() => setFilterSheet(false)} title="필터">
        <div className="flex flex-col gap-5">
          {/* 유형 필터 */}
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">거래 유형</p>
            <div className="flex gap-2">
              {[['all', '전체'], ['expense', '지출'], ['income', '수입']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFilterType(val)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    filterType === val
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 카테고리 필터 */}
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">카테고리</p>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setFilterCategory('')}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs ${
                  filterCategory === '' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-500'
                }`}
              >
                <span className="text-xl">🗂</span>전체
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs ${
                    filterCategory === cat.id ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-500'
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="truncate w-full text-center">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setFilterSheet(false)}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold"
          >
            적용
          </button>
        </div>
      </BottomSheet>

      {/* 삭제 확인 다이얼로그 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl mx-6 p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-2">거래 삭제</h3>
            <p className="text-sm text-gray-500 mb-5">이 거래를 삭제하시겠습니까?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-expense text-white text-sm font-semibold"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

