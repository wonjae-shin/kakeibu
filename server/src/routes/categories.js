import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

// GET /api/categories — 시스템 기본 + 내 카테고리
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ userId: null }, { userId: req.user.userId }],
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    })
    res.json({ success: true, data: categories })
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// POST /api/categories
router.post('/', async (req, res) => {
  try {
    const { name, type, icon, color } = req.body
    if (!name || !type || !icon || !color) {
      return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' })
    }
    const userCatCount = await prisma.category.count({ where: { userId: req.user.userId } })
    if (userCatCount >= 30) {
      return res.status(400).json({ success: false, message: '카테고리는 최대 30개까지 추가할 수 있습니다.' })
    }
    const category = await prisma.category.create({
      data: { name, type, icon, color, userId: req.user.userId },
    })
    res.status(201).json({ success: true, data: category })
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// PUT /api/categories/:id
router.put('/:id', async (req, res) => {
  try {
    const category = await prisma.category.findUnique({ where: { id: req.params.id } })
    if (!category) {
      return res.status(404).json({ success: false, message: '카테고리를 찾을 수 없습니다.' })
    }
    if (category.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: '기본 카테고리는 수정할 수 없습니다.' })
    }
    const { name, type, icon, color } = req.body
    const updated = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, type, icon, color },
    })
    res.json({ success: true, data: updated })
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
  try {
    const category = await prisma.category.findUnique({ where: { id: req.params.id } })
    if (!category) {
      return res.status(404).json({ success: false, message: '카테고리를 찾을 수 없습니다.' })
    }
    if (category.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: '기본 카테고리는 삭제할 수 없습니다.' })
    }
    await prisma.category.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: '카테고리가 삭제되었습니다.' })
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

export default router
