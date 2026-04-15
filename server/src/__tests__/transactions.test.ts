import { describe, it, expect, vi, beforeAll } from 'vitest'
import request from 'supertest'
import express, { Express } from 'express'
import jwt from 'jsonwebtoken'

vi.mock('@prisma/client', () => {
  const PrismaClient = vi.fn(() => ({
    transaction: {
      findMany: vi.fn(async () => []),
      findUnique: vi.fn(async () => null),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'tx-1',
        ...data,
        category: {},
        account: {},
      })),
    },
  }))
  return { PrismaClient }
})

let app: Express
let validToken: string

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret'

  validToken = jwt.sign(
    { userId: 'user-1', email: 'admin@test.com' },
    'test-secret',
    { expiresIn: '1h' }
  )

  const { default: transactionsRouter } = await import('../routes/transactions.js')
  app = express()
  app.use(express.json())
  app.use('/api/transactions', transactionsRouter)
})

describe('GET /api/transactions', () => {
  it('인증 없이 요청하면 401을 반환한다', async () => {
    const res = await request(app).get('/api/transactions')
    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('유효한 토큰으로 요청하면 거래 목록을 반환한다', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${validToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
  })
})

describe('POST /api/transactions', () => {
  it('인증 없이 요청하면 401을 반환한다', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .send({ type: 'expense', amount: 1000, date: '2024-01-01', categoryId: 'cat-1', accountId: 'acc-1' })

    expect(res.status).toBe(401)
  })

  it('필수 필드 누락 시 400을 반환한다', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ type: 'expense' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('유효한 데이터로 거래를 생성하면 201을 반환한다', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        type: 'expense',
        amount: 10000,
        date: '2024-01-01',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        memo: '점심',
      })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.id).toBeDefined()
  })
})
