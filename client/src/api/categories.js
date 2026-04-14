import api from './instance.js'

export const getCategories = () =>
  api.get('/categories').then((r) => r.data)

export const createCategory = (data) =>
  api.post('/categories', data).then((r) => r.data)

export const updateCategory = (id, data) =>
  api.put(`/categories/${id}`, data).then((r) => r.data)

export const deleteCategory = (id) =>
  api.delete(`/categories/${id}`).then((r) => r.data)

export const restoreCategory = (id) =>
  api.post(`/categories/hidden/${id}/restore`).then((r) => r.data)

export const reorderCategories = (items) =>
  api.patch('/categories/reorder', { items }).then((r) => r.data)
