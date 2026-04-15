import api from './instance.js'

export const anonymousLogin = (deviceId) =>
  api.post('/auth/anonymous', { deviceId }).then((r) => r.data)

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data)

export const register = (email, password) =>
  api.post('/auth/register', { email, password }).then((r) => r.data)

export const logout = () =>
  api.post('/auth/logout').then((r) => r.data)

export const getMe = () =>
  api.get('/auth/me').then((r) => r.data)
