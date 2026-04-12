import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'
import { parseNotification } from '../utils/notificationParser.js'

const router = Router()
const prisma = new PrismaClient()

// POST /api/notifications/ingest
// Tasker/Macrodroid에서 JWT 토큰과 함께 알림 텍스트 전송
// Body: { text, appName }
router.post('/ingest', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId
    const { text, appName = '' } = req.body

    if (!text) {
      return res.status(400).json({ success: false, message: '알림 텍스트가 필요합니다' })
    }

    const parsed = parseNotification(text, appName)

    const notification = await prisma.notification.create({
      data: {
        raw: text,
        appName: appName || null,
        amount: parsed?.amount || null,
        merchant: parsed?.merchant || null,
        cardName: parsed?.cardName || null,
        type: parsed?.type || 'expense',
        status: 'pending',
        userId,
      },
    })

    res.json({ success: true, data: notification })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// GET /api/notifications
// 알림 목록 조회 (pending 우선)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId
    const { status } = req.query

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    res.json({ success: true, data: notifications })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// GET /api/notifications/pending-count
router.get('/pending-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId
    const count = await prisma.notification.count({
      where: { userId, status: 'pending' },
    })
    res.json({ success: true, data: { count } })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// POST /api/notifications/:id/confirm
// 알림을 거래로 확정 등록
// Body: { categoryId, accountId, amount, memo, date, type }
router.post('/:id/confirm', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    const { categoryId, accountId, amount, memo, date, type } = req.body

    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    })
    if (!notification) {
      return res.status(404).json({ success: false, message: '알림을 찾을 수 없습니다' })
    }

    // 거래 생성
    const transaction = await prisma.transaction.create({
      data: {
        type: type || notification.type,
        amount: amount || notification.amount,
        memo: memo || notification.merchant || '',
        date: date || new Date().toISOString().slice(0, 10),
        categoryId,
        accountId,
        userId,
      },
      include: { category: true, account: true },
    })

    // 알림 상태 업데이트
    await prisma.notification.update({
      where: { id },
      data: { status: 'confirmed', transactionId: transaction.id },
    })

    res.json({ success: true, data: transaction })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// PATCH /api/notifications/:id/dismiss
router.patch('/:id/dismiss', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId
    const { id } = req.params

    await prisma.notification.updateMany({
      where: { id, userId },
      data: { status: 'dismissed' },
    })

    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

export default router