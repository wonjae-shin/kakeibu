import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

const defaultCategories = [
  // 지출
  { name: '식비', type: 'expense', icon: '🍽', color: '#EF4444' },
  { name: '카페/간식', type: 'expense', icon: '☕', color: '#F97316' },
  { name: '교통', type: 'expense', icon: '🚌', color: '#3B82F6' },
  { name: '쇼핑', type: 'expense', icon: '🛍', color: '#8B5CF6' },
  { name: '문화/여가', type: 'expense', icon: '🎬', color: '#EC4899' },
  { name: '의료/건강', type: 'expense', icon: '💊', color: '#10B981' },
  { name: '통신', type: 'expense', icon: '📱', color: '#6366F1' },
  { name: '구독', type: 'expense', icon: '📺', color: '#14B8A6' },
  { name: '월세/관리비', type: 'expense', icon: '🏠', color: '#F59E0B' },
  { name: '기타', type: 'expense', icon: '📦', color: '#6B7280' },
  // 수입
  { name: '월급', type: 'income', icon: '💰', color: '#22C55E' },
  { name: '부수입', type: 'income', icon: '💵', color: '#16A34A' },
  { name: '용돈', type: 'income', icon: '🎁', color: '#4ADE80' },
  { name: '이자', type: 'income', icon: '🏦', color: '#86EFAC' },
  { name: '환급', type: 'income', icon: '↩️', color: '#BBF7D0' },
  { name: '기타수입', type: 'income', icon: '📥', color: '#6B7280' },
]

async function main() {
  console.log('시드 데이터 삽입 시작...')

  // 기본 카테고리 생성 (userId null = 시스템 기본)
  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: {
        id: `default-${cat.name}`,
      },
      update: {},
      create: {
        id: `default-${cat.name}`,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        isDefault: true,
        userId: null,
      },
    })
  }
  console.log(`기본 카테고리 ${defaultCategories.length}개 생성 완료`)

  // 관리자 계정 생성
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPin = process.env.ADMIN_PIN

  if (!adminEmail || !adminPin) {
    console.error('.env에 ADMIN_EMAIL, ADMIN_PIN이 없습니다.')
    return
  }

  const hashed = await bcrypt.hash(adminPin, 10)
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashed },
    create: {
      email: adminEmail,
      password: hashed,
    },
  })
  console.log(`관리자 계정 생성/업데이트 완료: ${admin.email}`)

  // 관리자 기본 계좌 생성
  const existingAccounts = await prisma.account.count({ where: { userId: admin.id } })
  if (existingAccounts === 0) {
    await prisma.account.createMany({
      data: [
        { name: '현금', type: 'cash', balance: 0, userId: admin.id },
        { name: '체크카드', type: 'card', balance: 0, userId: admin.id },
      ],
    })
    console.log('기본 계좌 2개 생성 완료')
  }

  console.log('시드 데이터 삽입 완료!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
