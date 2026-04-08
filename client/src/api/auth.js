import api from './instance.js'

export const login = (pin) =>
  api.post('/auth/login', { pin }).then((r) => r.data)

export const logout = () =>
  api.post('/auth/logout').then((r) => r.data)

export const getMe = () =>
  api.get('/auth/me').then((r) => r.data)
