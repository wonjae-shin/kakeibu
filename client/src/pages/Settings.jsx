import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore.js'
import { getAccounts, createAccount, updateAccount, deleteAccount } from '@/api/accounts.js'
import { getTransactions } from '@/api/transactions.js'
import BottomSheet from '@/components/BottomSheet.jsx'
import PageLayout from '@/components/PageLayout.jsx'
import Card from '@/components/Card.jsx'

export default function Settings() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  // 섹션 토글
  const [openSection, setOpenSection] = useState(null)

  // 계좌
  const [accounts, setAccounts] = useState([])
  const [accSheet, setAccSheet] = useState(false)
  const [editAcc, setEditAcc] = useState(null)
  const [accForm, setAccForm] = useState({ name: '', type: 'cash' })

  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { kind, id, name }

  useEffect(() => {
    getAccounts().then((r) => setAccounts(r.data))
  }, [])

  const refreshAccounts = () => getAccounts().then((r) => setAccounts(r.data))

  // 계좌 저장
  const saveAcc = async () => {
    if (!accForm.name.trim()) return
    setSaving(true)
    try {
      if (editAcc) {
        await updateAccount(editAcc.id, accForm)
      } else {
        await createAccount(accForm)
      }
      setAccSheet(false)
      refreshAccounts()
    } finally {
      setSaving(false)
    }
  }

  // 삭제
  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteAccount(deleteConfirm.id)
      refreshAccounts()
      setDeleteConfirm(null)
    } catch {
      setDeleteConfirm(null)
    }
  }

  // CSV 내보내기
  const handleExport = async () => {
    const res = await getTransactions({})
    const rows = [
      ['날짜', '유형', '금액', '카테고리', '계좌', '메모'],
      ...res.data.map((t) => [
        t.date,
        t.type === 'income' ? '수입' : '지출',
        t.amount,
        t.category?.name || '',
        t.account?.name || '',
        t.memo || '',
      ]),
    ]
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `가계부_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <PageLayout>
      {/* 헤더 카드 */}
      <Card className="px-4 py-3">
        <h1 className="text-base font-bold text-gray-900">설정</h1>
      </Card>

      <div className="flex flex-col gap-3">
        {/* 계정 */}
        <Card className="overflow-hidden">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3.5 text-left text-sm text-expense font-medium"
          >
            로그아웃
          </button>
        </Card>

        {/* 카테고리 관리 */}
        <Card className="overflow-hidden !p-0">
          <button
            onClick={() => navigate('/settings/categories')}
            className="w-full flex items-center justify-between px-4 py-3.5"
          >
            <span className="text-sm font-semibold text-gray-800">카테고리 관리</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </Card>

        {/* 계좌 관리 */}
        <Card className="overflow-hidden">
          <button
            onClick={() => setOpenSection(openSection === 'acc' ? null : 'acc')}
            className="w-full flex items-center justify-between px-4 py-3.5"
          >
            <span className="text-sm font-semibold text-gray-800">계좌 관리</span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${openSection === 'acc' ? 'rotate-90' : ''}`}
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {openSection === 'acc' && (
            <div className="border-t border-gray-50 px-4 py-2">
              {accounts.length === 0 ? (
                <p className="text-xs text-gray-300 mb-2">계좌가 없습니다.</p>
              ) : (
                <div className="flex flex-col gap-1 mb-2">
                  {accounts.map((acc) => (
                    <div key={acc.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {acc.type === 'cash' ? '💵' : acc.type === 'card' ? '💳' : '🏦'}
                        </span>
                        <div>
                          <p className="text-sm text-gray-800">{acc.name}</p>
                          <p className="text-xs text-gray-400">{acc.type === 'cash' ? '현금' : acc.type === 'card' ? '카드' : '은행'}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => { setEditAcc(acc); setAccForm({ name: acc.name, type: acc.type }); setAccSheet(true) }}
                          className="text-xs text-primary"
                        >수정</button>
                        <button
                          onClick={() => setDeleteConfirm({ kind: 'account', id: acc.id, name: acc.name })}
                          className="text-xs text-gray-400"
                        >삭제</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => { setEditAcc(null); setAccForm({ name: '', type: 'cash' }); setAccSheet(true) }}
                className="flex items-center gap-1.5 text-sm text-primary font-medium py-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                계좌 추가
              </button>
            </div>
          )}
        </Card>

        {/* 예산 관리 링크 */}
        <Card className="overflow-hidden !p-0">
          <button
            onClick={() => navigate('/budget')}
            className="w-full flex items-center justify-between px-4 py-3.5"
          >
            <span className="text-sm font-semibold text-gray-800">예산 관리</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </Card>

        {/* 데이터 */}
        <Card className="overflow-hidden !p-0">
          <p className="px-4 pt-3.5 pb-1 text-xs text-gray-400 font-medium">데이터</p>
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-between px-4 py-3.5 border-t border-gray-50"
          >
            <span className="text-sm text-gray-800">CSV 내보내기</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </Card>

        {/* 앱 정보 */}
        <Card className="px-4 py-3.5">
          <p className="text-xs text-gray-400">앱 정보</p>
          <p className="text-sm text-gray-500 mt-0.5">버전 1.0.0</p>
        </Card>
      </div>

      {/* 계좌 추가/수정 바텀 시트 */}
      <BottomSheet
        isOpen={accSheet}
        onClose={() => setAccSheet(false)}
        title={editAcc ? '계좌 수정' : '계좌 추가'}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">계좌명</label>
            <input
              type="text"
              value={accForm.name}
              onChange={(e) => setAccForm({ ...accForm, name: e.target.value })}
              placeholder="예: 신한카드, 현금"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">유형</label>
            <div className="flex gap-2">
              {[['cash', '💵 현금'], ['card', '💳 카드'], ['bank', '🏦 은행']].map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setAccForm({ ...accForm, type: v })}
                  className={`flex-1 py-2.5 rounded-xl text-sm border transition-colors ${
                    accForm.type === v ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-gray-200 text-gray-500'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={saveAcc}
            disabled={saving || !accForm.name.trim()}
            className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold disabled:opacity-40"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </BottomSheet>

      {/* 삭제 확인 */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl mx-6 p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-2">삭제 확인</h3>
            <p className="text-sm text-gray-500 mb-5">
              <span className="font-medium text-gray-800">&quot;{deleteConfirm.name}&quot;</span>을(를) 삭제하시겠습니까?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">취소</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-expense text-white text-sm font-semibold">삭제</button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
