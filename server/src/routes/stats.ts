import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

interface MonthStat {
  month: string
  income: number
  expense: number
}

// GET /api/stats/monthly?year=YYYY — 연간 월별 수입/지출 추이
router.get('/monthly', async (req: Request, res: Response) => {
  try {
    const { year } = req.query
    if (!year) {
      res.status(400).json({ success: false, message: 'year 파라미터가 필요합니다.' })
      return
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.user.userId,
        date: { startsWith: year as string },
      },
    })

    const monthly: Record<string, MonthStat> = {}
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
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// GET /api/stats/category?month=YYYY-MM — 카테고리별 지출 비율
router.get('/category', async (req: Request, res: Response) => {
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
        type: 'expense',
      },
      include: { category: { include: { parent: true } } },
    })

    const total = transactions.reduce((sum, t) => sum + t.amount, 0)

    // 부모 기준으로 롤업
    type CatEntry = { categoryId: string; name: string; icon: string; color: string; amount: number }
    const parentMap: Record<string, CatEntry> = {}
    const childrenMap: Record<string, Record<string, CatEntry>> = {}
    for (const t of transactions) {
      const cat = t.category
      const parent = cat.parent ?? cat
      const parentId = parent.id

      if (!parentMap[parentId]) {
        parentMap[parentId] = { categoryId: parentId, name: parent.name, icon: parent.icon, color: parent.color, amount: 0 }
        childrenMap[parentId] = {}
      }
      parentMap[parentId].amount += t.amount

      // 소분류인 경우 children에 추적
      if (cat.parent) {
        if (!childrenMap[parentId][cat.id]) {
          childrenMap[parentId][cat.id] = { categoryId: cat.id, name: cat.name, icon: cat.icon, color: cat.color, amount: 0 }
        }
        childrenMap[parentId][cat.id].amount += t.amount
      }
    }

    const data = Object.values(parentMap)
      .sort((a, b) => b.amount - a.amount)
      .map((c) => {
        const children = Object.values(childrenMap[c.categoryId] || {})
          .sort((a, b) => b.amount - a.amount)
          .map((ch) => ({
            ...ch,
            ratio: c.amount > 0 ? Math.round((ch.amount / c.amount) * 100) : 0,
          }))
        return {
          ...c,
          ratio: total > 0 ? Math.round((c.amount / total) * 100) : 0,
          children,
        }
      })

    res.json({ success: true, data: { total, categories: data } })
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

export default router
