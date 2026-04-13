import { useState, useEffect, useCallback } from 'react'
import { getTransactions, deleteTransaction as apiDeleteTransaction } from '@/api/transactions.js'
import { getCategories } from '@/api/categories.js'

export const AMOUNT_MAX_LIMIT = 5000000

/**
 * 거래 내역 데이터 및 필터 상태를 관리하는 커스텀 훅
 * @param {string} month - YYYY-MM 형식의 월
 */
export default function useTransactions(month) {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 필터 상태
  const [filterType, setFilterType] = useState('all') // 'all' | 'income' | 'expense'
  const [filterCategories, setFilterCategories] = useState(new Set())
  const [search, setSearch] = useState('')
  
  // 금액 범위 필터
  const [amountMin, setAmountMin] = useState(0)
  const [amountMax, setAmountMax] = useState(AMOUNT_MAX_LIMIT)

  // 삭제 확인 상태
  const [deleteTarget, setDeleteTarget] = useState(null)

  const toggleFilterCategory = useCallback((id) => {
    setFilterCategories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { month }
      if (filterType !== 'all') params.type = filterType
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
  }, [month, filterType, search])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const deleteTransaction = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await apiDeleteTransaction(deleteTarget)
      setDeleteTarget(null)
      fetchData()
    } catch {
      setDeleteTarget(null)
      setError('삭제에 실패했습니다.')
    }
  }, [deleteTarget, fetchData])

  // 필터 적용 (카테고리 + 금액 범위)
  const filteredTx = transactions.filter((tx) => {
    if (filterCategories.size > 0 && !filterCategories.has(tx.categoryId)) return false
    if (tx.amount < amountMin) return false
    if (amountMax < AMOUNT_MAX_LIMIT && tx.amount > amountMax) return false
    return true
  })

  // 날짜별 그룹핑 로직
  const groupedDates = filteredTx.reduce((acc, tx) => {
    const key = tx.date
    if (!acc[key]) acc[key] = []
    acc[key].push(tx)
    return acc
  }, {})
  
  const sortedDates = Object.keys(groupedDates).sort((a, b) => b.localeCompare(a))

  // 필터된 내역 기준 합계 계산
  const income = filteredTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = filteredTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return {
    // 원본 상태
    categories,
    loading,
    error,
    
    // 필터 제어
    filterType,
    setFilterType,
    filterCategories,
    setFilterCategories,
    toggleFilterCategory,
    search,
    setSearch,
    amountMin,
    setAmountMin,
    amountMax,
    setAmountMax,
    activeFilterCount: filterCategories.size,
    
    // 삭제 관련
    deleteTarget,
    setDeleteTarget,
    deleteTransaction,
    
    // 계산된 결과값들
    groupedDates,
    sortedDates,
    income,
    expense,
    
    // 데이터 새로고침
    refetch: fetchData
  }
}
