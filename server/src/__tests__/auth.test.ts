import { describe, it, expect, vi, beforeAll } from 'vitest'
import request from 'supertest'
import express, { Express } from 'express'
import bcrypt from 'bcrypt'

interface MockUser {
  id: string
  email: string
  password: string
}

const mockState: { user: MockUser | null } = {
  user: null,
}

vi.mock('@prisma/client', () => {
  const PrismaClient = vi.fn(() => ({
    user: {
      findUnique: vi.fn(async ({ where }: { where: { email?: string } }) => {
        if (where.email === mockState.user?.email) return mockState.user
        return null
      }),
    },
  }))
  return { PrismaClient }
})

let app: Express

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret'
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'
  process.env.ADMIN_EMAIL = 'admin@test.com'

  const hashedPin = await bcrypt.hash('1234', 10)
  mockState.user = {
    id: 'user-1',
    email: 'admin@test.com',
    password: hashedPin,
  }

  const { default: authRouter } = await import('../routes/auth.js')
  app = express()
  app.use(express.json())
  app.use('/api/auth', authRouter)
})

describe('POST /api/auth/login', () => {
  it('올바른 PIN으로 로그인하면 토큰을 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ pin: '1234' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.accessToken).toBeDefined()
    expect(res.body.data.refreshToken).toBeDefined()
  })

  it('잘못된 PIN으로 로그인하면 401을 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ pin: '9999' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('PIN 없이 요청하면 400을 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})
