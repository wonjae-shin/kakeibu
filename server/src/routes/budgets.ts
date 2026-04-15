import { Router, Request, Response } from 'express'
import { PrismaClient, Prisma } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

// GET /api/budgets?month=YYYY-MM
router.get('/', async (req: Request, res: Response) => {
  try {
    const { month } = req.query
    const where: Prisma.BudgetWhereInput = { userId: req.user.userId }
    if (month) where.month = month as string

    const budgets = await prisma.budget.findMany({
      where,
      include: { category: true },
      orderBy: { categoryId: 'asc' },
    })
    res.json({ success: true, data: budgets })
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// POST /api/budgets
router.post('/', async (req: Request, res: Response) => {
  try {
    const { month, amount, categoryId } = req.body as {
      month: string
      amount: number | string
      categoryId?: string
    }
    if (!month || !amount) {
      res.status(400).json({ success: false, message: 'month와 amount는 필수입니다.' })
      return
    }
    const budget = await prisma.budget.create({
      data: {
        month,
        amount: parseInt(String(amount)),
        categoryId: categoryId ?? null,
        userId: req.user.userId,
      },
      include: { category: true },
    })
    res.status(201).json({ success: true, data: budget })
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// PUT /api/budgets/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const budget = await prisma.budget.findUnique({ where: { id: req.params.id } })
    if (!budget || budget.userId !== req.user.userId) {
      res.status(404).json({ success: false, message: '예산을 찾을 수 없습니다.' })
      return
    }
    const { amount } = req.body as { amount: number | string }
    const updated = await prisma.budget.update({
      where: { id: req.params.id },
      data: { amount: parseInt(String(amount)) },
      include: { category: true },
    })
    res.json({ success: true, data: updated })
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// DELETE /api/budgets/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const budget = await prisma.budget.findUnique({ where: { id: req.params.id } })
    if (!budget || budget.userId !== req.user.userId) {
      res.status(404).json({ success: false, message: '예산을 찾을 수 없습니다.' })
      return
    }
    await prisma.budget.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: '예산이 삭제되었습니다.' })
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

export default router
