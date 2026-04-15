import { Router, Request, Response } from 'express'
import { PrismaClient, Prisma } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

// POST /api/transactions/generate-recurring?month=YYYY-MM
// 해당 월에 아직 복사되지 않은 isRecurring 거래를 이전 달에서 복사 생성
router.post('/generate-recurring', async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7)

    const [year, mon] = month.split('-').map(Number)
    const prevDate = new Date(year, mon - 2, 1)
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

    const prevRecurring = await prisma.transaction.findMany({
      where: {
        userId,
        isRecurring: true,
        date: { startsWith: prevMonth },
      },
    })

    if (prevRecurring.length === 0) {
      res.json({ success: true, data: [], message: '복사할 정기 거래가 없습니다.' })
      return
    }

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
      res.json({ success: true, data: [], message: '이미 생성된 정기 거래입니다.' })
      return
    }

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
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// GET /api/transactions/summary?month=YYYY-MM
// summary는 /:id 보다 앞에 등록해야 라우팅 충돌 없음
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { month } = req.query
    if (!month) {
      res.status(400).json({ success: false, message: 'month 파라미터가 필요합니다.' })
      return
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.user.userId,
        date: { startsWith: month as string },
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
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// GET /api/transactions?month=YYYY-MM&category=&type=
router.get('/', async (req: Request, res: Response) => {
  try {
    const { month, category, type, search } = req.query
    const where: Prisma.TransactionWhereInput = { userId: req.user.userId }

    if (month) {
      where.date = { startsWith: month as string }
    }
    if (category) {
      where.categoryId = category as string
    }
    if (type && ['income', 'expense'].includes(type as string)) {
      where.type = type as string
    }
    if (search) {
      where.OR = [
        { memo: { contains: search as string } },
        { category: { name: { contains: search as string } } },
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
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// GET /api/transactions/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: { category: true, account: true },
    })
    if (!transaction || transaction.userId !== req.user.userId) {
      res.status(404).json({ success: false, message: '거래를 찾을 수 없습니다.' })
      return
    }
    res.json({ success: true, data: transaction })
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// POST /api/transactions
router.post('/', async (req: Request, res: Response) => {
  try {
    const { type, amount, memo, date, categoryId, accountId, isRecurring } = req.body as {
      type: string
      amount: number | string
      memo?: string
      date: string
      categoryId: string
      accountId: string
      isRecurring?: boolean
    }
    if (!type || !amount || !date || !categoryId || !accountId) {
      res.status(400).json({ success: false, message: '필수 필드가 누락되었습니다.' })
      return
    }
    const transaction = await prisma.transaction.create({
      data: {
        type,
        amount: parseInt(String(amount)),
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
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// PUT /api/transactions/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const transaction = await prisma.transaction.findUnique({ where: { id: req.params.id } })
    if (!transaction || transaction.userId !== req.user.userId) {
      res.status(404).json({ success: false, message: '거래를 찾을 수 없습니다.' })
      return
    }
    const { type, amount, memo, date, categoryId, accountId, isRecurring } = req.body as {
      type?: string
      amount?: number | string
      memo?: string
      date?: string
      categoryId?: string
      accountId?: string
      isRecurring?: boolean
    }
    const updated = await prisma.transaction.update({
      where: { id: req.params.id },
      data: {
        type,
        amount: amount !== undefined ? parseInt(String(amount)) : undefined,
        memo,
        date,
        categoryId,
        accountId,
        isRecurring,
      },
      include: { category: true, account: true },
    })
    res.json({ success: true, data: updated })
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// DELETE /api/transactions/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const transaction = await prisma.transaction.findUnique({ where: { id: req.params.id } })
    if (!transaction || transaction.userId !== req.user.userId) {
      res.status(404).json({ success: false, message: '거래를 찾을 수 없습니다.' })
      return
    }
    await prisma.transaction.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: '거래가 삭제되었습니다.' })
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

export default router
