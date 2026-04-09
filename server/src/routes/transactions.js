import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

// POST /api/transactions/generate-recurring?month=YYYY-MM
// 해당 월에 아직 복사되지 않은 isRecurring 거래를 이전 달에서 복사 생성
router.post('/generate-recurring', async (req, res) => {
  try {
    const userId = req.user.userId
    // month 파라미터 없으면 현재 월 사용
    const month = req.query.month || new Date().toISOString().slice(0, 7)

    // 이전 달 계산
    const [year, mon] = month.split('-').map(Number)
    const prevDate = new Date(year, mon - 2, 1)
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

    // 이전 달의 isRecurring 거래 조회
    const prevRecurring = await prisma.transaction.findMany({
      where: {
        userId,
        isRecurring: true,
        date: { startsWith: prevMonth },
      },
    })

    if (prevRecurring.length === 0) {
      return res.json({ success: true, data: [], message: '복사할 정기 거래가 없습니다.' })
    }

    // 현재 월에 이미 생성된 정기 거래 확인 (date + categoryId + accountId + amount 조합으로 중복 방지)
    const existingRecurring = await prisma.transaction.findMany({
      where: {
        userId,
        isRecurring: true,
        date: { startsWith: month },
      },
    })

    const existingKeys = new Set(
      existingRecurring.map((t) => `${t.categoryId}-${t.accountId}-${t.amount}-${t.type}`)
    )

    const toCreate = prevRecurring.filter((t) => {
      const key = `${t.categoryId}-${t.accountId}-${t.amount}-${t.type}`
      return !existingKeys.has(key)
    })

    if (toCreate.length === 0) {
      return res.json({ success: true, data: [], message: '이미 생성된 정기 거래입니다.' })
    }

    // 날짜: 이전 달의 일(day)을 그대로 유지하되, 현재 월로 변경 (말일 초과 시 말일로)
    const daysInMonth = new Date(year, mon, 0).getDate()
    const created = await Promise.all(
      toCreate.map((t) => {
        const originalDay = parseInt(t.date.split('-')[2])
        const day = Math.min(originalDay, daysInMonth)
        const newDate = `${month}-${String(day).padStart(2, '0')}`
        return prisma.transaction.create({
          data: {
            type: t.type,
            amount: t.amount,
            memo: t.memo,
            date: newDate,
            categoryId: t.categoryId,
            accountId: t.accountId,
            isRecurring: true,
            userId,
          },
        })
      })
    )

    res.json({ success: true, data: created, message: `${created.length}건의 정기 거래가 생성되었습니다.` })
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// GET /api/transactions/summary?month=YYYY-MM
// summary는 /transactions/:id 보다 앞에 등록해야 라우팅 충돌 없음
router.get('/summary', async (req, res) => {
  try {
    const { month } = req.query
    if (!month) {
      return res.status(400).json({ success: false, message: 'month 파라미터가 필요합니다.' })
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.user.userId,
        date: { startsWith: month },
      },
    })

    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    res.json({
      success: true,
      data: { month, income, expense, balance: income - expense },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// GET /api/transactions?month=YYYY-MM&category=&type=
router.get('/', async (req, res) => {
  try {
    const { month, category, type, search } = req.query
    const where = { userId: req.user.userId }

    if (month) {
      where.date = { startsWith: month }
    }
    if (category) {
      where.categoryId = category
    }
    if (type && ['income', 'expense'].includes(type)) {
      where.type = type
    }
    if (search) {
      where.OR = [
        { memo: { contains: search } },
        { category: { name: { contains: search } } },
      ]
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
        account: true,
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    })

    res.json({ success: true, data: transactions })
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// GET /api/transactions/:id
router.get('/:id', async (req, res) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: { category: true, account: true },
    })
    if (!transaction || transaction.userId !== req.user.userId) {
      return res.status(404).json({ success: false, message: '거래를 찾을 수 없습니다.' })
    }
    res.json({ success: true, data: transaction })
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// POST /api/transactions
router.post('/', async (req, res) => {
  try {
    const { type, amount, memo, date, categoryId, accountId, isRecurring } = req.body
    if (!type || !amount || !date || !categoryId || !accountId) {
      return res.status(400).json({ success: false, message: '필수 필드가 누락되었습니다.' })
    }
    const transaction = await prisma.transaction.create({
      data: {
        type,
        amount: parseInt(amount),
        memo,
        date,
        categoryId,
        accountId,
        isRecurring: isRecurring ?? false,
        userId: req.user.userId,
      },
      include: { category: true, account: true },
    })
    res.status(201).json({ success: true, data: transaction })
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// PUT /api/transactions/:id
router.put('/:id', async (req, res) => {
  try {
    const transaction = await prisma.transaction.findUnique({ where: { id: req.params.id } })
    if (!transaction || transaction.userId !== req.user.userId) {
      return res.status(404).json({ success: false, message: '거래를 찾을 수 없습니다.' })
    }
    const { type, amount, memo, date, categoryId, accountId, isRecurring } = req.body
    const updated = await prisma.transaction.update({
      where: { id: req.params.id },
      data: {
        type,
        amount: amount !== undefined ? parseInt(amount) : undefined,
        memo,
        date,
        categoryId,
        accountId,
        isRecurring,
      },
      include: { category: true, account: true },
    })
    res.json({ success: true, data: updated })
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// DELETE /api/transactions/:id
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await prisma.transaction.findUnique({ where: { id: req.params.id } })
    if (!transaction || transaction.userId !== req.user.userId) {
      return res.status(404).json({ success: false, message: '거래를 찾을 수 없습니다.' })
    }
    await prisma.transaction.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: '거래가 삭제되었습니다.' })
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

export default router
