import api from './instance.js'

export const getBudgets = (month) =>
  api.get('/budgets', { params: { month } }).then((r) => r.data)

export const createBudget = (data) =>
  api.post('/budgets', data).then((r) => r.data)

export const updateBudget = (id, data) =>
  api.put(`/budgets/${id}`, data).then((r) => r.data)

export const deleteBudget = (id) =>
  api.delete(`/budgets/${id}`).then((r) => r.data)
