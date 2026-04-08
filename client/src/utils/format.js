// 금액을 "1,234,567원" 형식으로 포맷
export const formatAmount = (amount) =>
  `${Math.abs(amount).toLocaleString()}원`

// 날짜 "YYYY-MM-DD" → "M월 D일 요일"
export const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${days[date.getDay()]}요일`
}

// "YYYY-MM" → "YYYY년 M월"
export const formatMonth = (monthStr) => {
  const [year, month] = monthStr.split('-')
  return `${year}년 ${parseInt(month)}월`
}

// 오늘 날짜 "YYYY-MM-DD"
export const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 이번달 "YYYY-MM"
export const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// 이전/다음 달 계산
export const addMonth = (monthStr, delta) => {
  const [year, month] = monthStr.split('-').map(Number)
  const d = new Date(year, month - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
