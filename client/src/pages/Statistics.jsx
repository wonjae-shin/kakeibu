import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts'
import { getMonthlyStats, getCategoryStats } from '@/api/stats.js'
import { getTransactionSummary } from '@/api/transactions.js'
import MonthPicker from '@/components/MonthPicker.jsx'
import ErrorMessage from '@/components/ErrorMessage.jsx'
import { currentMonth, formatAmount, addMonth } from '@/utils/format.js'

const YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 10 }, (_, i) => YEAR - i)

export default function Statistics() {
  const [year, setYear] = useState(YEAR)
  const [yearOpen, setYearOpen] = useState(false)
  const [month, setMonth] = useState(currentMonth())
  const [monthly, setMonthly] = useState([])
  const [catStats, setCatStats] = useState({ total: 0, categories: [] })
  const [prevSummary, setPrevSummary] = useState(null)
  const [currSummary, setCurrSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  const expenseDiff = currSummary && prevSummary
    ? currSummary.expense - prevSummary.expense
    : null

  // 도넛 차트 색상
  const pieData = catStats.categories.map((c) => ({
    name: c.name,
    value: c.amount,
    color: c.color,
    icon: c.icon,
  }))

  return (
    <div className="pb-4">
      {/* 헤더 */}
      <div className="bg-white px-4 pb-3 pt-safe sticky top-0 z-10 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-900 mt-2">통계</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchData} />
      ) : (
        <div className="px-4 mt-4 flex flex-col gap-4">
          {/* 연간 월별 수입/지출 바 차트 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-800">월별 수입/지출 추이</h2>
              <div className="relative">
                <button
                  onClick={() => setYearOpen((o) => !o)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700">{year}년</span>
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {yearOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setYearOpen(false)} />
                    <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-xl z-50 w-40 p-2">
                      {YEARS.map((y) => (
                        <button
                          key={y}
                          onClick={() => {
                            setYear(y)
                            setMonth(`${y}-${month.split('-')[1]}`)
                            setYearOpen(false)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                            y === year ? 'bg-primary text-white font-semibold' : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          {y}년
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
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
          </div>

          {/* 이번 달 지출 분석 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-800">이번 달 지출 분석</h2>
              <div className="flex items-center gap-2">
                <MonthPicker
                  month={month}
                  onChange={(newMonth) => {
                    setMonth(newMonth)
                    setYear(parseInt(newMonth.split('-')[0]))
                  }}
                />
              </div>
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
                  {catStats.categories.map((cat) => (
                    <div key={cat.categoryId} className="flex items-center gap-2">
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                        style={{ backgroundColor: `${cat.color}20` }}
                      >
                        {cat.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs text-gray-700 truncate">{cat.name}</span>
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
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 전월 대비 */}
          {expenseDiff !== null && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">전월 대비</h2>
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    expenseDiff > 0 ? 'bg-red-50' : expenseDiff < 0 ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  {expenseDiff > 0 ? (
                    <svg className="w-5 h-5 text-expense" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  ) : expenseDiff < 0 ? (
                    <svg className="w-5 h-5 text-income" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">지출</p>
                  <p className={`text-base font-bold ${expenseDiff > 0 ? 'text-expense' : expenseDiff < 0 ? 'text-income' : 'text-gray-500'}`}>
                    {expenseDiff > 0 ? '+' : ''}{formatAmount(expenseDiff)} {expenseDiff > 0 ? '증가' : expenseDiff < 0 ? '감소' : '변동 없음'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
