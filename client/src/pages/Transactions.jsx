import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import TransactionItem from '@/components/TransactionItem.jsx'
import MonthPicker from '@/components/MonthPicker.jsx'
import BottomSheet from '@/components/BottomSheet.jsx'
import EmptyState from '@/components/EmptyState.jsx'
import ErrorMessage from '@/components/ErrorMessage.jsx'
import PageLayout from '@/components/PageLayout.jsx'
import Card from '@/components/Card.jsx'
import { currentMonth, formatAmount, formatDate } from '@/utils/format.js'
import useTransactions, { AMOUNT_MAX_LIMIT } from '@/hooks/useTransactions.js'

export default function Transactions() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [month, setMonth] = useState(searchParams.get('month') || currentMonth())

  const changeMonth = (m) => {
    setMonth(m)
    setSearchParams({ month: m }, { replace: true })
  }

  const [filterSheet, setFilterSheet] = useState(false)

  // 커스텀 훅을 통해 비즈니스 로직 캡슐화
  const {
    categories, loading, error,
    filterType, setFilterType,
    filterCategories, setFilterCategories, toggleFilterCategory,
    search, setSearch,
    amountMin, setAmountMin,
    amountMax, setAmountMax,
    activeFilterCount,
    deleteTarget, setDeleteTarget, deleteTransaction,
    groupedDates, sortedDates, income, expense,
    refetch
  } = useTransactions(month)

  return (
    <PageLayout className="!pt-0">
      {/* 헤더 카드 */}
      <div className="pt-4">
        <Card className="px-4 py-3">
          <div className="grid grid-cols-3 items-center mb-3">
            <div />
            <div className="flex justify-center">
              <MonthPicker
                month={month}
                onChange={(m) => {
                  changeMonth(m);
                  setFilterType('all');
                  setFilterCategories(new Set());
                }}
              />
            </div>
            <div className="flex justify-end">
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
        </Card>
      </div>

      {/* 내역 리스트 */}
      <div className="flex-1 flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <ErrorMessage message={error} onRetry={refetch} />
        ) : sortedDates.length === 0 ? (
          <EmptyState message="거래 내역이 없습니다." />
        ) : (
          sortedDates.map((date) => (
            <div key={date}>
              {/* 날짜 레이블 */}
              <p className="text-xs font-medium text-gray-400 mb-1.5 px-1">{formatDate(date)}</p>
              {/* 거래 카드 */}
              <Card className="overflow-hidden divide-y divide-gray-50">
                {groupedDates[date].map((tx) => (
                  <div key={tx.id} className="flex items-center">
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
              </Card>
            </div>
          ))
        )}
      </div>

      {/* 필터 바텀 시트 */}
      <BottomSheet isOpen={filterSheet} onClose={() => setFilterSheet(false)} title="필터">
        <div className="flex flex-col gap-5 pb-6">
          {/* 유형 필터 */}
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">거래 유형</p>
            <div className="flex gap-2">
              {[['expense', '지출'], ['income', '수입']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => {
                    setFilterType(filterType === val ? 'all' : val)
                    setFilterCategories(new Set())
                    setAmountMin(0)
                    setAmountMax(AMOUNT_MAX_LIMIT)
                  }}
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

          {/* 금액 범위 필터 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-400">금액 범위</p>
              {(amountMin > 0 || amountMax < AMOUNT_MAX_LIMIT) && (
                <button
                  onClick={() => { setAmountMin(0); setAmountMax(AMOUNT_MAX_LIMIT) }}
                  className="text-xs text-gray-400 underline"
                >
                  초기화
                </button>
              )}
            </div>
            {/* 금액 표시 */}
            <div className="flex justify-between text-xs font-medium text-gray-700 mb-4">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg">{formatAmount(amountMin)}</span>
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg">{amountMax >= AMOUNT_MAX_LIMIT ? '제한 없음' : formatAmount(amountMax)}</span>
            </div>
            {/* 듀얼 슬라이더 */}
            <div className="relative h-5 flex items-center">
              {/* 트랙 배경 */}
              <div className="absolute left-0 right-0 h-1.5 bg-gray-200 rounded-full" />
              {/* 선택 구간 하이라이트 */}
              <div
                className="absolute h-1.5 bg-primary rounded-full"
                style={{
                  left: `${(amountMin / AMOUNT_MAX_LIMIT) * 100}%`,
                  right: `${100 - (amountMax / AMOUNT_MAX_LIMIT) * 100}%`,
                }}
              />
              {/* 최소 핸들 */}
              <input
                type="range"
                min={0}
                max={AMOUNT_MAX_LIMIT}
                step={10000}
                value={amountMin}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setAmountMin(Math.min(v, amountMax - 10000))
                }}
                className="absolute w-full appearance-none bg-transparent cursor-pointer"
                style={{ WebkitAppearance: 'none' }}
              />
              {/* 최대 핸들 */}
              <input
                type="range"
                min={0}
                max={AMOUNT_MAX_LIMIT}
                step={10000}
                value={amountMax}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setAmountMax(Math.max(v, amountMin + 10000))
                }}
                className="absolute w-full appearance-none bg-transparent cursor-pointer"
                style={{ WebkitAppearance: 'none' }}
              />
            </div>
          </div>

          {/* 카테고리 필터 — 다중선택 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-400">카테고리 (복수 선택 가능)</p>
              {filterCategories.size > 0 && (
                <button
                  onClick={() => setFilterCategories(new Set())}
                  className="text-xs text-gray-400 underline"
                >
                  초기화
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-0.5 custom-scrollbar">
              {categories.filter((c) =>
                filterType === 'all' || c.type === filterType || c.type === 'both'
              ).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleFilterCategory(cat.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-colors ${
                    filterCategories.has(cat.id)
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-100 text-gray-500'
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
                onClick={deleteTransaction}
                className="flex-1 py-2.5 rounded-xl bg-expense text-white text-sm font-semibold"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
