import api from './instance.js'

export const getMonthlyStats = (year) =>
  api.get('/stats/monthly', { params: { year } }).then((r) => r.data)

export const getCategoryStats = (month) =>
  api.get('/stats/category', { params: { month } }).then((r) => r.data)
