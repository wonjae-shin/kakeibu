import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCategories } from '@/api/categories.js'
import { getAccounts } from '@/api/accounts.js'
import {
  createTransaction,
  updateTransaction,
  getTransaction,
} from '@/api/transactions.js'
import AmountInput from '@/components/AmountInput.jsx'
import BottomSheet from '@/components/BottomSheet.jsx'
import { today } from '@/utils/format.js'

export default function TransactionForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState(0)
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [date, setDate] = useState(today())
  const [memo, setMemo] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)

  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [catSheet, setCatSheet] = useState(false)
  const [accSheet, setAccSheet] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getCategories(), getAccounts()]).then(([catRes, accRes]) => {
      setCategories(catRes.data)
      setAccounts(accRes.data)
      // 수정 모드가 아닐 때 기본값 설정
      if (!isEdit) {
        const defaultCat = catRes.data.find((c) => c.type === 'expense')
        if (defaultCat) setCategoryId(defaultCat.id)
        if (accRes.data[0]) setAccountId(accRes.data[0].id)
      }
    })
  }, [])

  // 수정 모드: 기존 거래 불러오기
  useEffect(() => {
    if (!isEdit) return
    getTransaction(id).then((res) => {
      const tx = res.data
      setType(tx.type)
      setAmount(tx.amount)
      setCategoryId(tx.categoryId)
      setAccountId(tx.accountId)
      setDate(tx.date)
      setMemo(tx.memo || '')
      setIsRecurring(tx.isRecurring)
    }).catch(() => setError('거래 정보를 불러오지 못했습니다.'))
  }, [id])

  const selectedCategory = categories.find((c) => c.id === categoryId)
  const selectedAccount = accounts.find((a) => a.id === accountId)
  const filteredCategories = categories.filter(
    (c) => c.type === type || c.type === 'both'
  )

  const handleSave = async () => {
    if (amount === 0) return setError('금액을 입력해주세요.')
    if (!categoryId) return setError('카테고리를 선택해주세요.')
    if (!accountId) return setError('계좌를 선택해주세요.')
    setError('')
    setSaving(true)
    try {
      const payload = { type, amount, categoryId, accountId, date, memo, isRecurring }
      if (isEdit) {
        await updateTransaction(id, payload)
      } else {
        await createTransaction(payload)
      }
      navigate(-1)
    } catch (err) {
      setError(err.response?.data?.message || '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-gray-50">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-white sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-base font-semibold">{isEdit ? '거래 수정' : '거래 추가'}</h1>
        <div className="w-10" />
      </div>

      {/* 수입/지출 탭 */}
      <div className="flex mx-4 mt-2 bg-gray-100 rounded-xl p-1">
        {['expense', 'income'].map((t) => (
          <button
            key={t}
            onClick={() => {
              setType(t)
              // 탭 바꾸면 카테고리 초기화
              const first = categories.find((c) => c.type === t || c.type === 'both')
              if (first) setCategoryId(first.id)
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              type === t
                ? t === 'expense'
                  ? 'bg-white text-expense shadow-sm'
                  : 'bg-white text-income shadow-sm'
                : 'text-gray-400'
            }`}
          >
            {t === 'expense' ? '지출' : '수입'}
          </button>
        ))}
      </div>

      {/* 금액 표시 */}
      <div className="text-center py-6">
        <span
          className={`text-4xl font-bold ${
            type === 'expense' ? 'text-expense' : 'text-income'
          }`}
        >
          {amount === 0 ? '0' : amount.toLocaleString()}
        </span>
        <span className="text-2xl font-bold text-gray-400 ml-1">원</span>
      </div>

      {/* 키패드 */}
      <div className="bg-white pb-2">
        <AmountInput value={amount} onChange={setAmount} />
      </div>

      {/* 입력 필드 */}
      <div className="bg-white mt-2 divide-y divide-gray-100">
        {/* 카테고리 */}
        <button
          onClick={() => setCatSheet(true)}
          className="w-full flex items-center justify-between px-4 py-4"
        >
          <span className="text-sm text-gray-500">카테고리</span>
          <div className="flex items-center gap-2">
            {selectedCategory && (
              <>
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                  style={{ backgroundColor: `${selectedCategory.color}20` }}
                >
                  {selectedCategory.icon}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedCategory.name}
                </span>
              </>
            )}
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* 계좌 */}
        <button
          onClick={() => setAccSheet(true)}
          className="w-full flex items-center justify-between px-4 py-4"
        >
          <span className="text-sm text-gray-500">계좌</span>
          <div className="flex items-center gap-2">
            {selectedAccount && (
              <span className="text-sm font-medium text-gray-900">
                {selectedAccount.name}
              </span>
            )}
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* 날짜 */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-gray-500">날짜</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-sm font-medium text-gray-900 bg-transparent text-right focus:outline-none"
          />
        </div>

        {/* 메모 */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-gray-500">메모</span>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="메모 (선택)"
            className="text-sm text-gray-900 bg-transparent text-right flex-1 ml-4 focus:outline-none placeholder:text-gray-300"
          />
        </div>

        {/* 정기지출 */}
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <span className="text-sm text-gray-700">정기지출</span>
            <p className="text-xs text-gray-400 mt-0.5">매월 반복 거래로 등록</p>
          </div>
          <button
            onClick={() => setIsRecurring(!isRecurring)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              isRecurring ? 'bg-primary' : 'bg-gray-200'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                isRecurring ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 에러 */}
      {error && (
        <p className="text-sm text-expense text-center py-2">{error}</p>
      )}

      {/* 저장 버튼 */}
      <div className="p-4 bg-white border-t border-gray-100 mt-2">
        <button
          onClick={handleSave}
          disabled={saving || amount === 0}
          className="w-full py-4 rounded-xl bg-primary text-white font-semibold disabled:opacity-40 active:opacity-80 transition-opacity"
        >
          {saving ? '저장 중...' : '저장하기'}
        </button>
      </div>

      {/* 카테고리 선택 바텀 시트 */}
      <BottomSheet isOpen={catSheet} onClose={() => setCatSheet(false)} title="카테고리 선택">
        <div className="grid grid-cols-4 gap-3">
          {filteredCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setCategoryId(cat.id); setCatSheet(false) }}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${
                categoryId === cat.id ? 'bg-primary/10 ring-1 ring-primary' : ''
              }`}
            >
              <span
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                style={{ backgroundColor: `${cat.color}20` }}
              >
                {cat.icon}
              </span>
              <span className="text-xs text-gray-700 text-center leading-tight">{cat.name}</span>
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* 계좌 선택 바텀 시트 */}
      <BottomSheet isOpen={accSheet} onClose={() => setAccSheet(false)} title="계좌 선택">
        <div className="flex flex-col gap-2">
          {accounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => { setAccountId(acc.id); setAccSheet(false) }}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${
                accountId === acc.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-100 bg-gray-50'
              }`}
            >
              <span className="text-xl">
                {acc.type === 'cash' ? '💵' : acc.type === 'card' ? '💳' : '🏦'}
              </span>
              <span className="text-sm font-medium text-gray-900">{acc.name}</span>
              {accountId === acc.id && (
                <svg className="w-4 h-4 text-primary ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  )
}
