import { Router, Request, Response } from 'express'
import { PrismaClient, Category } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

type CategoryWithHidden = Category & { hidden: boolean }

// GET /api/categories — 시스템 기본 + 내 카테고리 (숨김 제외, hidden 플래그 포함)
router.get('/', async (req: Request, res: Response) => {
  try {
    const hidden = await prisma.hiddenCategory.findMany({
      where: { userId: req.user.userId },
    })
    const hiddenIds = new Set(hidden.map((h) => h.categoryId))

    const categories = await prisma.category.findMany({
      where: {
        OR: [{ userId: null }, { userId: req.user.userId }],
      },
      orderBy: [{ order: 'asc' }, { isDefault: 'desc' }, { name: 'asc' }],
    })

    const result: CategoryWithHidden[] = categories.map((c) => ({
      ...c,
      hidden: hiddenIds.has(c.id),
    }))

    res.json({ success: true, data: result })
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// PATCH /api/categories/reorder — 순서 일괄 저장
router.patch('/reorder', async (req: Request, res: Response) => {
  try {
    const { items } = req.body as { items: Array<{ id: string; order: number }> }
    if (!Array.isArray(items)) {
      res.status(400).json({ success: false, message: '잘못된 요청입니다.' })
      return
    }
    await Promise.all(
      items.map(({ id, order }) =>
        prisma.category.update({ where: { id }, data: { order } })
      )
    )
    res.json({ success: true })
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// POST /api/categories
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, type, icon, color, parentId } = req.body as {
      name: string
      type: string
      icon: string
      color: string
      parentId?: string
    }
    if (!name || !type || !icon || !color) {
      res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' })
      return
    }
    const userCatCount = await prisma.category.count({ where: { userId: req.user.userId } })
    if (userCatCount >= 50) {
      res.status(400).json({ success: false, message: '카테고리는 최대 50개까지 추가할 수 있습니다.' })
      return
    }
    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } })
      if (!parent) {
        res.status(400).json({ success: false, message: '상위 카테고리를 찾을 수 없습니다.' })
        return
      }
      if (parent.parentId) {
        res.status(400).json({ success: false, message: '소분류는 2단계까지만 지원합니다.' })
        return
      }
    }
    const category = await prisma.category.create({
      data: { name, type, icon, color, userId: req.user.userId, parentId: parentId || null },
    })
    res.status(201).json({ success: true, data: category })
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// PUT /api/categories/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const category = await prisma.category.findUnique({ where: { id: req.params.id } })
    if (!category) {
      res.status(404).json({ success: false, message: '카테고리를 찾을 수 없습니다.' })
      return
    }
    if (category.userId !== req.user.userId) {
      res.status(403).json({ success: false, message: '기본 카테고리는 수정할 수 없습니다.' })
      return
    }
    const { name, type, icon, color } = req.body as {
      name: string
      type: string
      icon: string
      color: string
    }
    const updated = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, type, icon, color },
    })
    res.json({ success: true, data: updated })
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// DELETE /api/categories/:id
// - 내 카테고리: 실제 삭제 (소분류 포함)
// - 기본 카테고리: 이 사용자에게 숨김 처리
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const category = await prisma.category.findUnique({ where: { id: req.params.id } })
    if (!category) {
      res.status(404).json({ success: false, message: '카테고리를 찾을 수 없습니다.' })
      return
    }

    if (category.userId !== req.user.userId) {
      // 기본 카테고리 → 숨김 처리
      const userChildren = await prisma.category.findMany({
        where: { parentId: category.id, userId: req.user.userId },
      })
      if (userChildren.length > 0) {
        await prisma.category.deleteMany({
          where: { parentId: category.id, userId: req.user.userId },
        })
      }
      await prisma.hiddenCategory.upsert({
        where: { userId_categoryId: { userId: req.user.userId, categoryId: category.id } },
        create: { userId: req.user.userId, categoryId: category.id },
        update: {},
      })
      res.json({ success: true, message: '카테고리가 숨겨졌습니다.' })
      return
    }

    // 내 카테고리 → 소분류 먼저 삭제 후 본체 삭제
    await prisma.category.deleteMany({ where: { parentId: category.id } })
    await prisma.category.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: '카테고리가 삭제되었습니다.' })
  } catch (err) {
    if ((err as NodeJS.ErrnoException & { code?: string }).code === 'P2003') {
      res.status(400).json({ success: false, message: '이 카테고리를 사용하는 거래 내역이 있어 삭제할 수 없습니다.' })
      return
    }
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// POST /api/categories/hidden/:id/restore — 숨긴 기본 카테고리 복원
router.post('/hidden/:id/restore', async (req: Request, res: Response) => {
  try {
    await prisma.hiddenCategory.deleteMany({
      where: { userId: req.user.userId, categoryId: req.params.id },
    })
    res.json({ success: true, message: '카테고리가 복원되었습니다.' })
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

export default router
