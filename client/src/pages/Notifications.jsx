import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, confirmNotification, dismissNotification } from '@/api/notifications.js'
import { getCategories } from '@/api/categories.js'
import { getAccounts } from '@/api/accounts.js'
import BottomSheet from '@/components/BottomSheet.jsx'
import ErrorMessage from '@/components/ErrorMessage.jsx'
import EmptyState from '@/components/EmptyState.jsx'
import PageLayout from '@/components/PageLayout.jsx'
import Card from '@/components/Card.jsx'

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
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ categoryId: '', accountId: '', amount: '', memo: '', date: '', type: 'expense' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('pending')

  const load = useCallback(async () => {
    setError(null)
    setLoading(true)
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
    } finally {
      setLoading(false)
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
    setSaving(true)
    try {
      await confirmNotification(selected.id, form)
      setSelected(null)
      load()
    } catch {
      setError('등록에 실패했습니다')
    } finally {
      setSaving(false)
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
    <PageLayout>
      {/* 헤더 카드 */}
      <Card className="px-4 py-3">
        <div className="grid grid-cols-3 items-center mb-3">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-500">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-base font-bold text-gray-900 text-center">카드 알림</h1>
          <div />
        </div>

        {/* 탭 */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[['pending', '대기중'], ['all', '전체']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setTab(val)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                tab === val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {label}
              {val === 'pending' && pendingCount > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* 콘텐츠 */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : notifications.length === 0 ? (
        <EmptyState message={tab === 'pending' ? '대기 중인 알림이 없습니다' : '알림 내역이 없습니다'} />
      ) : (
        <Card className="overflow-hidden divide-y divide-gray-50">
          {notifications.map((n) => (
            <div key={n.id} className="p-4 flex items-start gap-3">
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
                  <p className={`text-base font-bold ${n.type === 'expense' ? 'text-expense' : 'text-income'}`}>
                    {n.type === 'expense' ? '-' : '+'}{formatAmount(n.amount)}
                  </p>
                )}
                {n.merchant && <p className="text-sm text-gray-700 font-medium">{n.merchant}</p>}
                {n.cardName && <p className="text-xs text-gray-400">{n.cardName}</p>}
                <p className="text-xs text-gray-400 mt-1 truncate">{n.raw}</p>
              </div>

              {n.status === 'pending' && (
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => openConfirm(n)}
                    className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg font-medium"
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
          ))}
        </Card>
      )}

      {/* 거래 등록 바텀시트 */}
      {selected && (
        <BottomSheet isOpen={!!selected} onClose={() => setSelected(null)} title="거래 등록">
          <div className="space-y-4 pb-4">
            {/* 금액 */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">금액</label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-primary">
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                  className="flex-1 text-lg font-semibold text-gray-900 focus:outline-none"
                />
                <span className="text-gray-400 text-sm">원</span>
              </div>
            </div>

            {/* 유형 */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">유형</label>
              <div className="flex gap-2">
                {[['expense', '지출'], ['income', '수입']].map(([t, label]) => (
                  <button
                    key={t}
                    onClick={() => setForm((f) => ({ ...f, type: t, categoryId: '' }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      form.type === t
                        ? t === 'expense'
                          ? 'bg-expense text-white border-expense'
                          : 'bg-income text-white border-income'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 메모 */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">메모</label>
              <input
                type="text"
                value={form.memo}
                onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="가맹점명 또는 메모"
              />
            </div>

            {/* 날짜 */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">날짜</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* 카테고리 */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">카테고리</label>
              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                {filteredCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setForm((f) => ({ ...f, categoryId: c.id }))}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-colors ${
                      form.categoryId === c.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-100 text-gray-500'
                    }`}
                  >
                    <span className="text-xl">{c.icon}</span>
                    <span className="truncate w-full text-center">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 계좌 */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">계좌/카드</label>
              <select
                value={form.accountId}
                onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleConfirm}
              disabled={!form.categoryId || !form.accountId || !form.amount || saving}
              className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold disabled:opacity-40"
            >
              {saving ? '등록 중...' : '거래 등록'}
            </button>
          </div>
        </BottomSheet>
      )}
    </PageLayout>
  )
}
