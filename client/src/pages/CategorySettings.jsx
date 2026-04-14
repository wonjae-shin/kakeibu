import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  restoreCategory, reorderCategories,
} from '@/api/categories.js'
import BottomSheet from '@/components/BottomSheet.jsx'
import PageLayout from '@/components/PageLayout.jsx'
import Card from '@/components/Card.jsx'

const ICONS = [
  // 식비 (12)
  '🍽','🍜','🍱','🍔','🍕','🍣','🥗','☕','🧋','🥤','🍺','🛒',
  // 교통 (12)
  '🚌','🚗','🚕','🚲','🛵','🏍','✈️','🚂','⛽','🚢','🚁','🛞',
  // 쇼핑 (12)
  '🛍','👔','👗','👟','👜','💄','🧴','💍','🕶️','⌚','🎒','🧢',
  // 주거/생활 (12)
  '🏠','🔑','🛏','💡','🔌','🧹','🧺','🪴','🛁','🪑','🛋','🔧',
  // 의료/건강 (12)
  '💊','🏥','🩺','🦷','🩹','🧬','🏋️','🧘','🏃','🚴','🥗','👓',
  // 문화/여가 (12)
  '🎬','🎮','🎵','🎸','🎨','📚','⚽','🏀','🎾','🎯','🎲','🎤',
  // 여행 (12)
  '🏖','🏔','🗺','🧳','🏕','🗼','🎡','🏨','🗽','🌏','🛂','📸',
  // 교육 (12)
  '🎓','📝','💻','📖','🔬','🔭','✏️','📐','🖥','📡','🏫','📓',
  // 반려동물 (12)
  '🐶','🐱','🐰','🐹','🐟','🦜','🐾','🦴','🏠','💉','🛁','🪺',
  // 경조사/선물 (12)
  '🎁','🎀','🎊','🎉','💐','💒','👶','🤝','🥂','🎂','💌','🪄',
  // 수입/금융 (12)
  '💰','💳','🏦','📈','📊','💼','👛','💸','🪙','💎','🤑','📉',
  // 기타 (12)
  '📦','🧾','⚙️','🔐','🛡','📌','🗂','📥','📤','💡','❓','🔖',
]
const COLORS = ['#EF4444','#F97316','#F59E0B','#22C55E','#10B981','#14B8A6','#3B82F6','#6366F1','#8B5CF6','#EC4899','#6B7280','#78716C']
const EMPTY_FORM = { name: '', type: 'expense', icon: '📦', color: '#6B7280' }

// 드래그 핸들 아이콘
function DragHandle(props) {
  return (
    <span
      {...props}
      className="flex-shrink-0 p-1 cursor-grab active:cursor-grabbing touch-none text-gray-300 hover:text-gray-400"
      style={{ userSelect: 'none' }}
    >
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="5" cy="4" r="1.2" /><circle cx="11" cy="4" r="1.2" />
        <circle cx="5" cy="8" r="1.2" /><circle cx="11" cy="8" r="1.2" />
        <circle cx="5" cy="12" r="1.2" /><circle cx="11" cy="12" r="1.2" />
      </svg>
    </span>
  )
}

// 소트 가능한 행 wrapper
function SortableRow({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        position: 'relative',
        zIndex: isDragging ? 10 : 'auto',
      }}
    >
      {children({ dragHandleProps: { ...attributes, ...listeners } })}
    </div>
  )
}

export default function CategorySettings() {
  const navigate = useNavigate()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const [categories, setCategories] = useState([])
  const [tab, setTab] = useState('expense')
  const [showHidden, setShowHidden] = useState(false)
  const [showAllDefault, setShowAllDefault] = useState({ expense: false, income: false })
  const [showAllUser, setShowAllUser] = useState({ expense: false, income: false })
  const PREVIEW_COUNT = 5

  const [sheet, setSheet] = useState(false)
  const [editCat, setEditCat] = useState(null)
  const [parentCat, setParentCat] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const [expandedIds, setExpandedIds] = useState(new Set())
  const toggleExpand = (id) => setExpandedIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    getCategories().then((r) => setCategories(r.data))
  }, [])

  const refresh = () => getCategories().then((r) => setCategories(r.data))

  const openAdd = (parent = null) => {
    setEditCat(null)
    setParentCat(parent)
    setForm(parent ? { name: '', type: parent.type, icon: parent.icon, color: parent.color } : EMPTY_FORM)
    setSheet(true)
  }
  const openEdit = (cat) => { setEditCat(cat); setParentCat(null); setForm({ name: cat.name, type: cat.type, icon: cat.icon, color: cat.color }); setSheet(true) }

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true); setErrorMsg('')
    try {
      if (editCat) await updateCategory(editCat.id, form)
      else await createCategory({ ...form, parentId: parentCat?.id || null })
      setSheet(false); refresh()
    } catch (e) {
      setErrorMsg(e?.response?.data?.message || '저장에 실패했습니다.')
    } finally { setSaving(false) }
  }

  const confirmDelete = (cat) => setDeleteConfirm({ id: cat.id, name: cat.name, isDefault: !cat.userId })

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setErrorMsg('')
    try {
      await deleteCategory(deleteConfirm.id); refresh()
    } catch (e) {
      setErrorMsg(e?.response?.data?.message || '삭제에 실패했습니다.')
    } finally { setDeleteConfirm(null) }
  }

  const handleRestore = async (id) => { await restoreCategory(id); refresh() }

  // 드래그 종료 — 그룹 내 순서 업데이트
  const handleDragEnd = (event, groupItems) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = groupItems.findIndex((c) => c.id === active.id)
    const newIdx = groupItems.findIndex((c) => c.id === over.id)
    const newList = arrayMove(groupItems, oldIdx, newIdx)
    const updates = newList.map((c, i) => ({ id: c.id, order: i }))
    setCategories((prev) =>
      prev.map((c) => {
        const u = updates.find((x) => x.id === c.id)
        return u ? { ...c, order: u.order } : c
      })
    )
    reorderCategories(updates)
  }

  // 계층 구조
  const byOrder = (a, b) => (a.order ?? 999) - (b.order ?? 999)
  const visible = categories.filter((c) => !c.hidden)
  const hidden = categories.filter((c) => c.hidden)
  const topLevel = visible.filter((c) => !c.parentId).sort(byOrder)
  const defaultTop = topLevel.filter((c) => !c.userId && c.type === tab)
  const userTop = topLevel.filter((c) => c.userId && c.type === tab)
  const childrenOf = (parentId) => visible.filter((c) => c.parentId === parentId).sort(byOrder)

  // 카테고리 행 렌더링 (공통)
  const renderRow = (cat, dragHandleProps, isDefault) => {
    const subs = childrenOf(cat.id)
    return (
      <div key={cat.id}>
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-1">
            <DragHandle {...dragHandleProps} />
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-base ml-1" style={{ backgroundColor: `${cat.color}20` }}>
              {cat.icon}
            </span>
            <span className="text-sm text-gray-800 ml-1.5">{cat.name}</span>
            <span className="text-xs text-gray-400 ml-1">{cat.type === 'income' ? '수입' : cat.type === 'expense' ? '지출' : '공통'}</span>
            {subs.length > 0 && (
              <button onClick={() => toggleExpand(cat.id)} className="flex items-center gap-0.5 ml-1.5 px-1.5 py-0.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                <span className="text-xs text-gray-500">{subs.length}</span>
                <svg className={`w-2.5 h-2.5 text-gray-400 transition-transform ${expandedIds.has(cat.id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button onClick={() => openAdd(cat)} className="text-xs text-primary">+ 소분류</button>
            {!isDefault && <button onClick={() => openEdit(cat)} className="text-xs text-primary">수정</button>}
            <button onClick={() => confirmDelete(cat)} className="text-xs text-gray-400">{isDefault ? '숨기기' : '삭제'}</button>
          </div>
        </div>
        {/* 소분류 토글 */}
        {subs.length > 0 && (
          <>
            {expandedIds.has(cat.id) && (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, subs)}>
                <SortableContext items={subs.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  {subs.map((sub) => (
                    <SortableRow key={sub.id} id={sub.id}>
                      {({ dragHandleProps: subDrag }) => (
                        <div className="flex items-center justify-between py-2 pl-4">
                          <div className="flex items-center gap-1">
                            <DragHandle {...subDrag} />
                            <span className="text-gray-300 text-xs ml-1">└</span>
                            <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm ml-1" style={{ backgroundColor: `${sub.color}20` }}>
                              {sub.icon}
                            </span>
                            <span className="text-sm text-gray-700 ml-1">{sub.name}</span>
                          </div>
                          <div className="flex gap-3">
                            <button onClick={() => openEdit(sub)} className="text-xs text-primary">수정</button>
                            <button onClick={() => confirmDelete(sub)} className="text-xs text-gray-400">삭제</button>
                          </div>
                        </div>
                      )}
                    </SortableRow>
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <PageLayout>
      {/* 헤더 */}
      <Card className="px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/settings')} className="p-1 -ml-1 rounded-lg hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-900">카테고리 관리</h1>
      </Card>

      {/* 탭 */}
      <Card className="p-1 flex gap-1">
        {[{ key: 'expense', label: '지출' }, { key: 'income', label: '수입' }].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            {label}
          </button>
        ))}
      </Card>

      {/* 기본 카테고리 */}
      {defaultTop.length > 0 && (
        <Card className="px-4 py-3">
          <p className="text-xs text-gray-400 mb-2">기본 카테고리</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, defaultTop)}>
            <SortableContext items={defaultTop.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col divide-y divide-gray-50">
                {(showAllDefault[tab] ? defaultTop : defaultTop.slice(0, PREVIEW_COUNT)).map((cat) => (
                  <SortableRow key={cat.id} id={cat.id}>
                    {({ dragHandleProps }) => renderRow(cat, dragHandleProps, true)}
                  </SortableRow>
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {defaultTop.length > PREVIEW_COUNT && (
            <button onClick={() => setShowAllDefault((v) => ({ ...v, [tab]: !v[tab] }))} className="w-full mt-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
              {showAllDefault[tab] ? '접기 ▲' : `${defaultTop.length - PREVIEW_COUNT}개 더보기 ▼`}
            </button>
          )}
        </Card>
      )}

      {/* 내 카테고리 */}
      <Card className="px-4 py-3">
        <p className="text-xs text-gray-400 mb-2">내 카테고리</p>
        {userTop.length === 0 ? (
          <p className="text-xs text-gray-300 mb-3">추가된 카테고리가 없습니다.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, userTop)}>
            <SortableContext items={userTop.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col divide-y divide-gray-50">
                {(showAllUser[tab] ? userTop : userTop.slice(0, PREVIEW_COUNT)).map((cat) => (
                  <SortableRow key={cat.id} id={cat.id}>
                    {({ dragHandleProps }) => renderRow(cat, dragHandleProps, false)}
                  </SortableRow>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
        {userTop.length > PREVIEW_COUNT && (
          <button onClick={() => setShowAllUser((v) => ({ ...v, [tab]: !v[tab] }))} className="w-full mt-2 mb-1 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            {showAllUser[tab] ? '접기 ▲' : `${userTop.length - PREVIEW_COUNT}개 더보기 ▼`}
          </button>
        )}
        <button onClick={() => openAdd(null)} className="flex items-center gap-1.5 text-sm text-primary font-medium py-1 mt-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          카테고리 추가
        </button>
      </Card>

      {/* 숨긴 카테고리 */}
      {hidden.length > 0 && (
        <Card className="px-4 py-3">
          <button onClick={() => setShowHidden((v) => !v)} className="w-full flex items-center justify-between">
            <p className="text-xs text-gray-400">숨긴 카테고리 ({hidden.length})</p>
            <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showHidden ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showHidden && (
            <div className="flex flex-col divide-y divide-gray-50 mt-2">
              {hidden.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5 opacity-40">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{ backgroundColor: `${cat.color}20` }}>{cat.icon}</span>
                    <span className="text-sm text-gray-800">{cat.name}</span>
                  </div>
                  <button onClick={() => handleRestore(cat.id)} className="text-xs text-primary">복원</button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* 추가/수정 바텀시트 */}
      <BottomSheet isOpen={sheet} onClose={() => setSheet(false)} title={editCat ? '카테고리 수정' : parentCat ? `${parentCat.name} — 소분류 추가` : '카테고리 추가'}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">이름</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="카테고리 이름" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">유형</label>
            <div className="flex gap-2">
              {[['expense', '지출'], ['income', '수입'], ['both', '공통']].map(([v, l]) => (
                <button key={v} onClick={() => setForm({ ...form, type: v })} className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${form.type === v ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-gray-200 text-gray-500'}`}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">아이콘 <span className="text-gray-400">— 현재: {form.icon}</span></label>
            <div className="grid grid-cols-8 gap-1.5 max-h-52 overflow-y-auto pr-1">
              {ICONS.map((icon, i) => (
                <button key={`${icon}-${i}`} onClick={() => setForm({ ...form, icon })} className={`h-10 rounded-xl text-xl flex items-center justify-center transition-colors ${form.icon === icon ? 'bg-primary/10 ring-1 ring-primary' : 'bg-[#F5F3F0]'}`}>{icon}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">색상</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button key={color} onClick={() => setForm({ ...form, color })} className={`w-8 h-8 rounded-full transition-transform ${form.color === color ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''}`} style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
          {errorMsg && <p className="text-xs text-expense">{errorMsg}</p>}
          <button onClick={save} disabled={saving || !form.name.trim()} className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold disabled:opacity-40">{saving ? '저장 중...' : '저장'}</button>
        </div>
      </BottomSheet>

      {/* 삭제/숨기기 확인 */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl mx-6 p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-2">{deleteConfirm.isDefault ? '숨기기 확인' : '삭제 확인'}</h3>
            <p className="text-sm text-gray-500 mb-1">
              <span className="font-medium text-gray-800">&quot;{deleteConfirm.name}&quot;</span>
              {deleteConfirm.isDefault ? '을(를) 숨기시겠습니까? 설정에서 언제든 복원할 수 있습니다.' : '을(를) 삭제하시겠습니까?'}
            </p>
            {errorMsg && <p className="text-xs text-expense mb-3">{errorMsg}</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={() => { setDeleteConfirm(null); setErrorMsg('') }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">취소</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-expense text-white text-sm font-semibold">{deleteConfirm.isDefault ? '숨기기' : '삭제'}</button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
