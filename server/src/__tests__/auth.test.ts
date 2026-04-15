import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'
import express, { Express } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

// --- Mock DB 상태 ---
interface MockUser {
  id: string
  email: string | null
  password: string | null
  isAnonymous: boolean
  deviceId: string | null
  createdAt: Date
}

const db: { users: MockUser[] } = { users: [] }

function findByDeviceId(deviceId: string) {
  return db.users.find((u) => u.deviceId === deviceId) ?? null
}
function findByEmail(email: string) {
  return db.users.find((u) => u.email === email) ?? null
}
function findById(id: string) {
  return db.users.find((u) => u.id === id) ?? null
}

vi.mock('@prisma/client', () => {
  const PrismaClient = vi.fn(() => ({
    user: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string; email?: string; deviceId?: string } }) => {
        if (where.id) return findById(where.id)
        if (where.email) return findByEmail(where.email)
        if (where.deviceId) return findByDeviceId(where.deviceId)
        return null
      }),
      create: vi.fn(async ({ data }: { data: Partial<MockUser> }) => {
        const user: MockUser = {
          id: `user-${db.users.length + 1}`,
          email: data.email ?? null,
          password: data.password ?? null,
          isAnonymous: data.isAnonymous ?? true,
          deviceId: data.deviceId ?? null,
          createdAt: new Date(),
        }
        db.users.push(user)
        return user
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<MockUser> }) => {
        const idx = db.users.findIndex((u) => u.id === where.id)
        if (idx === -1) return null
        db.users[idx] = { ...db.users[idx], ...data }
        return db.users[idx]
      }),
    },
  }))
  return { PrismaClient }
})

let app: Express

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret'
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'

  const { default: authRouter } = await import('../routes/auth.js')
  app = express()
  app.use(express.json())
  app.use('/api/auth', authRouter)
})

beforeEach(() => {
  db.users = []
})

// ─────────────────────────────────────────
// POST /api/auth/anonymous
// ─────────────────────────────────────────
describe('POST /api/auth/anonymous', () => {
  it('새 deviceId로 요청하면 익명 계정이 생성되고 토큰을 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/anonymous')
      .send({ deviceId: 'device-abc' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.accessToken).toBeDefined()
    expect(res.body.data.refreshToken).toBeDefined()
    expect(db.users).toHaveLength(1)
    expect(db.users[0].isAnonymous).toBe(true)
  })

  it('기존 deviceId로 요청하면 같은 계정 토큰을 반환한다 (중복 생성 없음)', async () => {
    await request(app).post('/api/auth/anonymous').send({ deviceId: 'device-abc' })
    const res = await request(app).post('/api/auth/anonymous').send({ deviceId: 'device-abc' })

    expect(res.status).toBe(200)
    expect(db.users).toHaveLength(1)
  })

  it('deviceId 없이 요청하면 400을 반환한다', async () => {
    const res = await request(app).post('/api/auth/anonymous').send({})

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})

// ─────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────
describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    db.users.push({
      id: 'registered-1',
      email: 'user@test.com',
      password: await bcrypt.hash('password123', 10),
      isAnonymous: false,
      deviceId: null,
      createdAt: new Date(),
    })
  })

  it('올바른 이메일/비밀번호로 로그인하면 토큰을 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'password123' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.accessToken).toBeDefined()
    expect(res.body.data.email).toBe('user@test.com')

    const decoded = jwt.verify(res.body.data.accessToken, 'test-secret') as { isAnonymous: boolean }
    expect(decoded.isAnonymous).toBe(false)
  })

  it('잘못된 비밀번호로 로그인하면 401을 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'wrong' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('존재하지 않는 이메일로 로그인하면 401을 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' })

    expect(res.status).toBe(401)
  })

  it('이메일 또는 비밀번호 없이 요청하면 400을 반환한다', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'user@test.com' })

    expect(res.status).toBe(400)
  })
})

// ─────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────
describe('POST /api/auth/register', () => {
  let anonymousToken: string

  beforeEach(() => {
    db.users.push({
      id: 'anon-1',
      email: null,
      password: null,
      isAnonymous: true,
      deviceId: 'device-xyz',
      createdAt: new Date(),
    })
    anonymousToken = jwt.sign({ userId: 'anon-1', isAnonymous: true }, 'test-secret', { expiresIn: '1h' })
  })

  it('익명 유저가 이메일/비밀번호로 등록하면 계정이 업그레이드되고 토큰을 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${anonymousToken}`)
      .send({ email: 'new@test.com', password: 'mypassword' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.email).toBe('new@test.com')

    const decoded = jwt.verify(res.body.data.accessToken, 'test-secret') as { isAnonymous: boolean }
    expect(decoded.isAnonymous).toBe(false)

    expect(db.users[0].isAnonymous).toBe(false)
    expect(db.users[0].deviceId).toBeNull()
  })

  it('이미 등록된 이메일을 사용하면 409를 반환한다', async () => {
    db.users.push({
      id: 'registered-2',
      email: 'taken@test.com',
      password: 'hashed',
      isAnonymous: false,
      deviceId: null,
      createdAt: new Date(),
    })

    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${anonymousToken}`)
      .send({ email: 'taken@test.com', password: 'mypassword' })

    expect(res.status).toBe(409)
  })

  it('이미 등록된 유저가 /register를 호출하면 400을 반환한다', async () => {
    const registeredToken = jwt.sign({ userId: 'registered-2', isAnonymous: false }, 'test-secret', { expiresIn: '1h' })
    db.users.push({
      id: 'registered-2',
      email: 'already@test.com',
      password: 'hashed',
      isAnonymous: false,
      deviceId: null,
      createdAt: new Date(),
    })

    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${registeredToken}`)
      .send({ email: 'new@test.com', password: 'mypassword' })

    expect(res.status).toBe(400)
  })

  it('인증 토큰 없이 요청하면 401을 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@test.com', password: 'mypassword' })

    expect(res.status).toBe(401)
  })
})

// ─────────────────────────────────────────
// POST /api/auth/refresh
// ─────────────────────────────────────────
describe('POST /api/auth/refresh', () => {
  it('유효한 refreshToken으로 새 accessToken을 반환한다', async () => {
    db.users.push({
      id: 'user-r1',
      email: null,
      password: null,
      isAnonymous: true,
      deviceId: 'device-r1',
      createdAt: new Date(),
    })
    const refreshToken = jwt.sign({ userId: 'user-r1' }, 'test-refresh-secret', { expiresIn: '7d' })

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken })

    expect(res.status).toBe(200)
    expect(res.body.data.accessToken).toBeDefined()
  })

  it('유효하지 않은 refreshToken이면 401을 반환한다', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'invalid' })

    expect(res.status).toBe(401)
  })
})
