import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'
import { parseNotification } from '../utils/notificationParser.js'

const router = Router()
const prisma = new PrismaClient()

// POST /api/notifications/ingest
// Tasker/Macrodroid에서 JWT 토큰과 함께 알림 텍스트 전송 → 자동으로 거래 등록
// Body: { text, appName }
router.post('/ingest', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId
    const { text, appName = '' } = req.body

    if (!text) {
      return res.status(400).json({ success: false, message: '알림 텍스트가 필요합니다' })
    }

    const parsed = parseNotification(text, appName)
    if (!parsed?.amount) {
      return res.json({ success: true, data: null, message: '금액을 파싱할 수 없어 무시됨' })
    }

    // 카드명으로 계좌 매칭 (카드명 일부가 계좌명에 포함되면 매칭)
    const accounts = await prisma.account.findMany({ where: { userId } })
    const cardKeyword = parsed.cardName?.replace('카드', '').trim() || ''
    const matchedAccount =
      accounts.find((a) => cardKeyword && a.name.includes(cardKeyword)) ||
      accounts.find((a) => a.type === 'card') ||
      accounts[0]

    if (!matchedAccount) {
      return res.status(400).json({ success: false, message: '등록된 계좌가 없습니다' })
    }

    // 기본 카테고리: 지출→기타지출, 수입→기타수입
    const defaultCatName = parsed.type === 'expense' ? '기타지출' : '기타수입'
    const categories = await prisma.category.findMany({ where: { userId: null } })
    const matchedCategory =
      categories.find((c) => c.name === defaultCatName) ||
      categories.find((c) => c.type === parsed.type || c.type === 'both') ||
      categories[0]

    if (!matchedCategory) {
      return res.status(400).json({ success: false, message: '등록된 카테고리가 없습니다' })
    }

    // 거래 자동 생성
    const transaction = await prisma.transaction.create({
      data: {
        type: parsed.type,
        amount: parsed.amount,
        memo: parsed.merchant || parsed.cardName || '',
        date: new Date().toISOString().slice(0, 10),
        categoryId: matchedCategory.id,
        accountId: matchedAccount.id,
        userId,
      },
    })

    // 알림 이력 저장 (confirmed 상태)
    await prisma.notification.create({
      data: {
        raw: text,
        appName: appName || null,
        amount: parsed.amount,
        merchant: parsed.merchant || null,
        cardName: parsed.cardName || null,
        type: parsed.type,
        status: 'confirmed',
        transactionId: transaction.id,
        userId,
      },
    })

    res.json({ success: true, data: transaction })
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