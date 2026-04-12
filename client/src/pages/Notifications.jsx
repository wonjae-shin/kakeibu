import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, confirmNotification, dismissNotification } from '@/api/notifications.js'
import { getCategories } from '@/api/categories.js'
import { getAccounts } from '@/api/accounts.js'
import BottomSheet from '@/components/BottomSheet.jsx'
import ErrorMessage from '@/components/ErrorMessage.jsx'
import EmptyState from '@/components/EmptyState.jsx'

function formatAmount(n) {
  return n?.toLocaleString('ko-KR') + '원'
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}

export default function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null) // 확정할 알림
  const [form, setForm] = useState({ categoryId: '', accountId: '', amount: '', memo: '', date: '', type: 'expense' })
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('pending') // 'pending' | 'all'

  const load = useCallback(async () => {
    try {
      const [nRes, cRes, aRes] = await Promise.all([
        getNotifications(tab === 'pending' ? { status: 'pending' } : {}),
        getCategories(),
        getAccounts(),
      ])
      setNotifications(nRes.data || [])
      setCategories(cRes.data || [])
      setAccounts(aRes.data || [])
    } catch {
      setError('알림을 불러오지 못했습니다')
    }
  }, [tab])

  useEffect(() => { load() }, [load])

  function openConfirm(n) {
    setSelected(n)
    setForm({
      categoryId: '',
      accountId: accounts[0]?.id || '',
      amount: n.amount || '',
      memo: n.merchant || '',
      date: new Date().toISOString().slice(0, 10),
      type: n.type || 'expense',
    })
  }

  async function handleConfirm() {
    if (!form.categoryId || !form.accountId || !form.amount) return
    setLoading(true)
    try {
      await confirmNotification(selected.id, form)
      setSelected(null)
      load()
    } catch {
      setError('등록에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  async function handleDismiss(id) {
    try {
      await dismissNotification(id)
      load()
    } catch {
      setError('처리에 실패했습니다')
    }
  }

  const filteredCategories = categories.filter(
    (c) => c.type === form.type || c.type === 'both'
  )

  const pendingCount = notifications.filter((n) => n.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-50 pb-nav">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-violet-600 to-violet-800 px-4 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="text-white/80">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-white text-xl font-bold">카드 알림</h1>
        </div>

        {/* 탭 */}
        <div className="flex bg-white/20 rounded-xl p-1">
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'pending' ? 'bg-white text-violet-700' : 'text-white'}`}
            onClick={() => setTab('pending')}
          >
            대기중 {pendingCount > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 rounded-full">{pendingCount}</span>}
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'all' ? 'bg-white text-violet-700' : 'text-white'}`}
            onClick={() => setTab('all')}
          >
            전체
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        <ErrorMessage message={error} />

        {notifications.length === 0 ? (
          <EmptyState message={tab === 'pending' ? '대기 중인 알림이 없습니다' : '알림 내역이 없습니다'} />
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      n.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      n.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {n.status === 'pending' ? '대기' : n.status === 'confirmed' ? '등록완료' : '무시'}
                    </span>
                    <span className="text-xs text-gray-400">{timeAgo(n.createdAt)}</span>
                  </div>

                  {n.amount && (
                    <p className={`text-lg font-bold ${n.type === 'expense' ? 'text-red-500' : 'text-blue-500'}`}>
                      {n.type === 'expense' ? '-' : '+'}{formatAmount(n.amount)}
                    </p>
                  )}
                  {n.merchant && <p className="text-sm text-gray-700 font-medium">{n.merchant}</p>}
                  {n.cardName && <p className="text-xs text-gray-400">{n.cardName}</p>}
                  <p className="text-xs text-gray-400 mt-1 truncate">{n.raw}</p>
                </div>

                {n.status === 'pending' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => openConfirm(n)}
                      className="bg-violet-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium"
                    >
                      등록
                    </button>
                    <button
                      onClick={() => handleDismiss(n.id)}
                      className="bg-gray-100 text-gray-500 text-xs px-3 py-1.5 rounded-lg font-medium"
                    >
                      무시
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 거래 등록 바텀시트 */}
      {selected && (
        <BottomSheet onClose={() => setSelected(null)} title="거래 등록">
          <div className="space-y-4 pb-4">
            {/* 금액 */}
            <div>
              <label className="text-sm text-gray-600 mb-1 block">금액</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right text-lg font-bold"
              />
            </div>

            {/* 유형 */}
            <div>
              <label className="text-sm text-gray-600 mb-1 block">유형</label>
              <div className="flex gap-2">
                {['expense', 'income'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm((f) => ({ ...f, type: t, categoryId: '' }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      form.type === t
                        ? t === 'expense' ? 'bg-red-500 text-white border-red-500' : 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {t === 'expense' ? '지출' : '수입'}
                  </button>
                ))}
              </div>
            </div>

            {/* 메모 */}
            <div>
              <label className="text-sm text-gray-600 mb-1 block">메모</label>
              <input
                type="text"
                value={form.memo}
                onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3"
                placeholder="가맹점명 또는 메모"
              />
            </div>

            {/* 날짜 */}
            <div>
              <label className="text-sm text-gray-600 mb-1 block">날짜</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3"
              />
            </div>

            {/* 카테고리 */}
            <div>
              <label className="text-sm text-gray-600 mb-1 block">카테고리</label>
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {filteredCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setForm((f) => ({ ...f, categoryId: c.id }))}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border transition-colors ${
                      form.categoryId === c.id
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {c.icon} {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 계좌 */}
            <div>
              <label className="text-sm text-gray-600 mb-1 block">계좌/카드</label>
              <select
                value={form.accountId}
                onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleConfirm}
              disabled={!form.categoryId || !form.accountId || !form.amount || loading}
              className="w-full bg-violet-600 text-white py-3.5 rounded-2xl font-bold disabled:opacity-50"
            >
              {loading ? '등록 중...' : '거래 등록'}
            </button>
          </div>
        </BottomSheet>
      )}
    </div>
  )
}