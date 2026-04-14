import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts'
import { getMonthlyStats, getCategoryStats } from '@/api/stats.js'
import { getTransactionSummary } from '@/api/transactions.js'
import MonthPicker from '@/components/MonthPicker.jsx'
import ErrorMessage from '@/components/ErrorMessage.jsx'
import PageLayout from '@/components/PageLayout.jsx'
import Card from '@/components/Card.jsx'
import { currentMonth, formatAmount, addMonth } from '@/utils/format.js'

export default function Statistics() {
  const [month, setMonth] = useState(currentMonth())
  const year = parseInt(month.split('-')[0])
  const [monthly, setMonthly] = useState([])
  const [catStats, setCatStats] = useState({ total: 0, categories: [] })
  const [prevSummary, setPrevSummary] = useState(null)
  const [currSummary, setCurrSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedCatId, setExpandedCatId] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const prevMonth = addMonth(month, -1)
      const [monthlyRes, catRes, currRes, prevRes] = await Promise.all([
        getMonthlyStats(String(year)),
        getCategoryStats(month),
        getTransactionSummary(month),
        getTransactionSummary(prevMonth),
      ])
      setMonthly(monthlyRes.data)
      setCatStats(catRes.data)
      setCurrSummary(currRes.data)
      setPrevSummary(prevRes.data)
    } catch {
      setError('데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { fetchData() }, [fetchData])

  const barData = monthly.map((m) => ({
    name: `${parseInt(m.month.split('-')[1])}월`,
    수입: m.income,
    지출: m.expense,
  }))

  const expenseDiff = currSummary && prevSummary ? currSummary.expense - prevSummary.expense : null
  const incomeDiff  = currSummary && prevSummary ? currSummary.income  - prevSummary.income  : null

  // 도넛 차트 색상
  const pieData = catStats.categories.map((c) => ({
    name: c.name,
    value: c.amount,
    color: c.color,
    icon: c.icon,
  }))

  return (
    <PageLayout>
      {/* 헤더 카드 */}
      <Card className="px-4 py-3 flex justify-center">
        <MonthPicker month={month} onChange={setMonth} />
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchData} />
      ) : (
        <>
          {/* 전월 대비 */}
          {expenseDiff !== null && incomeDiff !== null && (
            <Card className="p-4">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">전월 대비</h2>
              <div className="flex gap-4">
                {[
                  { label: '지출', diff: expenseDiff, upBad: true },
                  { label: '수입', diff: incomeDiff,  upBad: false },
                ].map(({ label, diff, upBad }) => (
                  <div key={label} className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      diff > 0 ? (upBad ? 'bg-red-50' : 'bg-green-50') : diff < 0 ? (upBad ? 'bg-green-50' : 'bg-red-50') : 'bg-[#F5F3F0]'
                    }`}>
                      {diff > 0 ? (
                        <svg className={`w-5 h-5 ${upBad ? 'text-expense' : 'text-income'}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                      ) : diff < 0 ? (
                        <svg className={`w-5 h-5 ${upBad ? 'text-income' : 'text-expense'}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-500">{label}</p>
                      <p className={`text-base font-bold ${
                        diff > 0 ? (upBad ? 'text-expense' : 'text-income') : diff < 0 ? (upBad ? 'text-income' : 'text-expense') : 'text-gray-500'
                      }`}>
                        {diff > 0 ? '+' : ''}{formatAmount(diff)}
                      </p>
                      <p className={`text-xs ${
                        diff > 0 ? (upBad ? 'text-expense' : 'text-income') : diff < 0 ? (upBad ? 'text-income' : 'text-expense') : 'text-gray-400'
                      }`}>
                        {diff > 0 ? '증가' : diff < 0 ? '감소' : '변동 없음'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 연간 월별 수입/지출 바 차트 */}
          {/* <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-800">월별 수입/지출 추이</h2>
              <span className="text-xs text-gray-400">{year}년</span>
            </div>
            <div className="flex gap-3 mb-3">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-income inline-block" />수입
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-expense inline-block" />지출
              </span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} barSize={10} barGap={2}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(v) => `${v.toLocaleString()}원`}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="수입" fill="#22C55E" radius={[3, 3, 0, 0]} />
                <Bar dataKey="지출" fill="#EF4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card> */}

          {/* 지출 분석 */}
          <Card className="p-4">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-gray-800">{month.split('-')[1]}월 지출 분석</h2>
            </div>

            {catStats.total === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">지출 내역이 없습니다.</p>
            ) : (
              <>
                {/* 도넛 차트 */}
                <div className="flex items-center gap-4 mb-4">
                  <ResponsiveContainer width={130} height={130}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={58}
                        dataKey="value"
                        strokeWidth={2}
                        stroke="#fff"
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-0.5">총 지출</p>
                    <p className="text-base font-bold text-gray-900">{formatAmount(catStats.total)}</p>
                  </div>
                </div>

                {/* 카테고리 목록 */}
                <div className="flex flex-col gap-2.5">
                  {catStats.categories.map((cat) => {
                    const isExpanded = expandedCatId === cat.categoryId
                    const hasChildren = cat.children && cat.children.length > 0
                    return (
                      <div key={cat.categoryId}>
                        <div
                          className={`flex items-center gap-2 ${hasChildren ? 'cursor-pointer' : ''}`}
                          onClick={() => hasChildren && setExpandedCatId(isExpanded ? null : cat.categoryId)}
                        >
                          <span
                            className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                            style={{ backgroundColor: `${cat.color}20` }}
                          >
                            {cat.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <div className="flex items-center gap-1 min-w-0">
                                <span className="text-xs text-gray-700 truncate">{cat.name}</span>
                                {hasChildren && (
                                  <svg
                                    className={`w-3 h-3 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                <span className="text-xs text-gray-400">{cat.ratio}%</span>
                                <span className="text-xs font-semibold text-gray-800">{formatAmount(cat.amount)}</span>
                              </div>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${cat.ratio}%`, backgroundColor: cat.color }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* 소분류 드릴다운 */}
                        {isExpanded && hasChildren && (
                          <div className="mt-2 flex flex-col gap-2 pl-9">
                            {cat.children.map((child) => (
                              <div key={child.categoryId} className="flex items-center gap-2">
                                <span
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                                  style={{ backgroundColor: `${child.color}20` }}
                                >
                                  {child.icon}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-xs text-gray-500 truncate">{child.name}</span>
                                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                      <span className="text-[10px] text-gray-400">{child.ratio}%</span>
                                      <span className="text-xs font-medium text-gray-700">{formatAmount(child.amount)}</span>
                                    </div>
                                  </div>
                                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{ width: `${child.ratio}%`, backgroundColor: child.color }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </Card>

        </>
      )}
    </PageLayout>
  )
}
