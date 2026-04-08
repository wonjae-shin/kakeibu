import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

// GET /api/stats/monthly?year=YYYY — 연간 월별 수입/지출 추이
router.get('/monthly', async (req, res) => {
  try {
    const { year } = req.query
    if (!year) {
      return res.status(400).json({ success: false, message: 'year 파라미터가 필요합니다.' })
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.user.userId,
        date: { startsWith: year },
      },
    })

    const monthly = {}
    for (let m = 1; m <= 12; m++) {
      const key = `${year}-${String(m).padStart(2, '0')}`
      monthly[key] = { month: key, income: 0, expense: 0 }
    }

    for (const t of transactions) {
      const key = t.date.slice(0, 7)
      if (monthly[key]) {
        if (t.type === 'income') monthly[key].income += t.amount
        else monthly[key].expense += t.amount
      }
    }

    res.json({ success: true, data: Object.values(monthly) })
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// GET /api/stats/category?month=YYYY-MM — 카테고리별 지출 비율
router.get('/category', async (req, res) => {
  try {
    const { month } = req.query
    if (!month) {
      return res.status(400).json({ success: false, message: 'month 파라미터가 필요합니다.' })
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.user.userId,
        date: { startsWith: month },
        type: 'expense',
      },
      include: { category: true },
    })

    const total = transactions.reduce((sum, t) => sum + t.amount, 0)

    const categoryMap = {}
    for (const t of transactions) {
      const { id, name, icon, color } = t.category
      if (!categoryMap[id]) {
        categoryMap[id] = { categoryId: id, name, icon, color, amount: 0 }
      }
      categoryMap[id].amount += t.amount
    }

    const data = Object.values(categoryMap)
      .sort((a, b) => b.amount - a.amount)
      .map((c) => ({
        ...c,
        ratio: total > 0 ? Math.round((c.amount / total) * 100) : 0,
      }))

    res.json({ success: true, data: { total, categories: data } })
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

export default router
