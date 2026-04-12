import api from './instance.js'

export const getNotifications = (params) =>
  api.get('/notifications', { params }).then((r) => r.data)

export const getPendingCount = () =>
  api.get('/notifications/pending-count').then((r) => r.data)

export const confirmNotification = (id, data) =>
  api.post(`/notifications/${id}/confirm`, data).then((r) => r.data)

export const dismissNotification = (id) =>
  api.patch(`/notifications/${id}/dismiss`).then((r) => r.data)