import api from './instance.js'

const TYPE_ORDER = { card: 0, transfer: 1, cash: 2 }

function sortAccounts(accounts) {
  return [...accounts].sort((a, b) => {
    const typeDiff = (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9)
    if (typeDiff !== 0) return typeDiff
    return a.name.localeCompare(b.name, 'ko')
  })
}

export const getAccounts = () =>
  api.get('/accounts').then((r) => ({ ...r.data, data: sortAccounts(r.data.data) }))

export const createAccount = (data) =>
  api.post('/accounts', data).then((r) => r.data)

export const updateAccount = (id, data) =>
  api.put(`/accounts/${id}`, data).then((r) => r.data)

export const deleteAccount = (id) =>
  api.delete(`/accounts/${id}`).then((r) => r.data)
