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
import PageLayout from '@/components/PageLayout.jsx'
import Card from '@/components/Card.jsx'
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
  const [catParent, setCatParent] = useState(null) // 2단계 선택 시 부모 카테고리
  const [accSheet, setAccSheet] = useState(false)
  const [amountSheet, setAmountSheet] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // id가 바뀔 때마다 폼 상태 초기화
    setAmount(0)
    setDate(today())
    setMemo('')
    setIsRecurring(false)
    setError('')

    Promise.all([getCategories(), getAccounts()]).then(([catRes, accRes]) => {
      setCategories(catRes.data)
      setAccounts(accRes.data)

      if (!isEdit) {
        // 추가 모드: 기본값 설정
        setType('expense')
        const defaultCat = catRes.data.find((c) => c.type === 'expense')
        if (defaultCat) setCategoryId(defaultCat.id)
        if (accRes.data[0]) setAccountId(accRes.data[0].id)
      } else {
        // 수정 모드: 기존 거래 불러오기
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
      }
    })
  }, [id])

  const selectedCategory = categories.find((c) => c.id === categoryId)
  const selectedAccount = accounts.find((a) => a.id === accountId)

  // 숨겨지지 않은 카테고리만
  const visibleCategories = categories.filter((c) => !c.hidden)
  // 타입에 맞는 최상위 카테고리
  const filteredTopCategories = visibleCategories.filter(
    (c) => !c.parentId && (c.type === type || c.type === 'both')
  )
  // 특정 부모의 소분류
  const subCategoriesOf = (parentId) =>
    visibleCategories.filter((c) => c.parentId === parentId && (c.type === type || c.type === 'both'))

  const openCatSheet = () => { setCatParent(null); setCatSheet(true) }

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
    <PageLayout>
      {/* 수입/지출 탭 */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        {['expense', 'income'].map((t) => (
          <button
            key={t}
            onClick={() => {
              setType(t)
              const first = categories.find((c) => c.type === t || c.type === 'both')
              if (first) setCategoryId(first.id)
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${type === t
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

      {/* 입력 필드 카드 */}
      <Card className="overflow-hidden divide-y divide-gray-100">
        {/* 금액 */}
        <button
          onClick={() => setAmountSheet(true)}
          className="w-full flex items-center justify-between px-4 py-4"
        >
          <span className="text-sm text-gray-500">금액</span>
          <div className="flex items-center gap-2">
            <span className={`text-base font-bold ${amount === 0 ? 'text-gray-300' : type === 'expense' ? 'text-expense' : 'text-income'}`}>
              {amount === 0 ? '0' : amount.toLocaleString()}원
            </span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* 카테고리 */}
        <button
          onClick={openCatSheet}
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
                  {selectedCategory.parentId
                    ? `${categories.find((c) => c.id === selectedCategory.parentId)?.name} › ${selectedCategory.name}`
                    : selectedCategory.name}
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
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-700">정기지출</span>
            <p className="text-xs text-gray-400 mt-0.5">매월 반복 거래로 등록</p>
          </div>
          <button
            onClick={() => setIsRecurring(!isRecurring)}
            className={`shrink-0 w-12 h-6 rounded-full transition-colors relative overflow-hidden ${isRecurring ? 'bg-primary' : 'bg-gray-200'
              }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isRecurring ? 'translate-x-6' : 'translate-x-0'
                }`}
            />
          </button>
        </div>
      </Card>

      {/* 에러 */}
      {error && (
        <p className="text-sm text-expense text-center py-2">{error}</p>
      )}

      {/* 저장 버튼 */}
      <button
        onClick={handleSave}
        disabled={saving || amount === 0}
        className="w-full py-4 rounded-xl bg-primary text-white font-semibold disabled:opacity-40 active:opacity-80 transition-opacity"
      >
        {saving ? '저장 중...' : '저장하기'}
      </button>

      {/* 금액 입력 바텀 시트 */}
      <BottomSheet isOpen={amountSheet} onClose={() => setAmountSheet(false)}>
        <div className="pb-2">
          <div className="text-center py-4">
            <span className={`text-4xl font-bold ${type === 'expense' ? 'text-expense' : 'text-income'}`}>
              {amount === 0 ? '0' : amount.toLocaleString()}
            </span>
            <span className="text-2xl font-bold text-gray-400 ml-1">원</span>
          </div>
          <AmountInput value={amount} onChange={setAmount} />
          <button
            onClick={() => setAmountSheet(false)}
            className="w-full mt-4 py-3.5 rounded-xl bg-primary text-white font-semibold"
          >
            확인
          </button>
        </div>
      </BottomSheet>

      {/* 카테고리 선택 바텀 시트 */}
      <BottomSheet
        isOpen={catSheet}
        onClose={() => { setCatSheet(false); setCatParent(null) }}
        title={catParent ? catParent.name : '카테고리 선택'}
      >
        {/* 카테고리 관리 버튼 — 최상단 */}
        <button
          onClick={() => { setCatSheet(false); setCatParent(null); navigate('/settings/categories') }}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors mb-3"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          카테고리 관리
        </button>
        {catParent ? (
          /* 2단계: 소분류 선택 */
          <div>
            <button
              onClick={() => setCatParent(null)}
              className="flex items-center gap-1.5 text-sm text-gray-500 mb-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              전체 카테고리
            </button>
            <div className="grid grid-cols-5 gap-1.5">
              {/* 부모 카테고리 자체도 선택 가능 */}
              <button
                onClick={() => { setCategoryId(catParent.id); setCatSheet(false); setCatParent(null) }}
                className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-colors ${categoryId === catParent.id ? 'bg-primary/10 ring-1 ring-primary' : 'bg-[#F5F3F0]'}`}
              >
                <span className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: `${catParent.color}20` }}>
                  {catParent.icon}
                </span>
                <span className="text-[10px] text-gray-500 text-center leading-tight w-full truncate">전체</span>
              </button>
              {subCategoriesOf(catParent.id).map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => { setCategoryId(sub.id); setCatSheet(false); setCatParent(null) }}
                  className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-colors ${categoryId === sub.id ? 'bg-primary/10 ring-1 ring-primary' : ''}`}
                >
                  <span className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: `${sub.color}20` }}>
                    {sub.icon}
                  </span>
                  <span className="text-[10px] text-gray-700 text-center leading-tight w-full truncate">{sub.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* 1단계: 상위 카테고리 선택 */
          <div className="grid grid-cols-5 gap-1.5">
            {filteredTopCategories.map((cat) => {
              const hasSubs = subCategoriesOf(cat.id).length > 0
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (hasSubs) {
                      setCatParent(cat)
                    } else {
                      setCategoryId(cat.id)
                      setCatSheet(false)
                    }
                  }}
                  className={`relative flex flex-col items-center gap-1 p-1.5 rounded-xl transition-colors ${categoryId === cat.id || (hasSubs && subCategoriesOf(cat.id).some((s) => s.id === categoryId)) ? 'bg-primary/10 ring-1 ring-primary' : ''}`}
                >
                  <span className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: `${cat.color}20` }}>
                    {cat.icon}
                  </span>
                  <span className="text-[10px] text-gray-700 text-center leading-tight w-full truncate">{cat.name}</span>
                  {hasSubs && (
                    <span className="absolute top-1 right-1 text-gray-400">
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </BottomSheet>

      {/* 계좌 선택 바텀 시트 */}
      <BottomSheet isOpen={accSheet} onClose={() => setAccSheet(false)} title="계좌 선택">
        <div className="flex flex-col gap-2">
          {accounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => { setAccountId(acc.id); setAccSheet(false) }}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${accountId === acc.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-100 bg-[#F5F3F0]'
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
    </PageLayout>
  )
}
