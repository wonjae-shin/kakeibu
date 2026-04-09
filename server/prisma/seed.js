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

  // 기본 카테고리 생성
  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { id: `default-${cat.name}` },
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
    create: { email: adminEmail, password: hashed },
  })
  console.log(`관리자 계정 생성/업데이트 완료: ${admin.email}`)

  // ── 계좌 생성 ──────────────────────────────────────────
  const accountDefs = [
    { id: 'acc-cash',    name: '현금',       type: 'cash', balance: 150000 },
    { id: 'acc-check',   name: '체크카드',    type: 'card', balance: 1230000 },
    { id: 'acc-credit',  name: '신용카드',    type: 'card', balance: 0 },
    { id: 'acc-bank',    name: '카카오뱅크',  type: 'bank', balance: 3800000 },
    { id: 'acc-bank2',   name: '토스뱅크',    type: 'bank', balance: 520000 },
    { id: 'acc-bank3',   name: '신한은행',    type: 'bank', balance: 1200000 },
    { id: 'acc-card2',   name: '삼성카드',    type: 'card', balance: 0 },
    { id: 'acc-card3',   name: '현대카드',    type: 'card', balance: 0 },
    { id: 'acc-card4',   name: '롯데카드',    type: 'card', balance: 0 },
    { id: 'acc-bank4',   name: '하나은행',    type: 'bank', balance: 750000 },
    { id: 'acc-bank5',   name: '국민은행',    type: 'bank', balance: 200000 },
    { id: 'acc-cash2',   name: '여행용 현금', type: 'cash', balance: 80000 },
  ]
  for (const acc of accountDefs) {
    await prisma.account.upsert({
      where: { id: acc.id },
      update: { balance: acc.balance },
      create: { id: acc.id, name: acc.name, type: acc.type, balance: acc.balance, userId: admin.id },
    })
  }
  console.log(`계좌 ${accountDefs.length}개 생성 완료`)

  // ── 사용자 커스텀 카테고리 ──────────────────────────────
  const customCategories = [
    { id: 'cat-pet',      name: '반려동물',   type: 'expense', icon: '🐶', color: '#F59E0B' },
    { id: 'cat-beauty',   name: '뷰티/미용',  type: 'expense', icon: '💇', color: '#EC4899' },
    { id: 'cat-fitness',  name: '운동/헬스',  type: 'expense', icon: '🏋️', color: '#10B981' },
    { id: 'cat-travel',   name: '여행',       type: 'expense', icon: '✈️', color: '#3B82F6' },
    { id: 'cat-edu',      name: '교육/도서',  type: 'expense', icon: '🎓', color: '#8B5CF6' },
    { id: 'cat-game',     name: '게임',       type: 'expense', icon: '🎮', color: '#6366F1' },
    { id: 'cat-drink',    name: '술/유흥',    type: 'expense', icon: '🍺', color: '#EF4444' },
    { id: 'cat-car',      name: '자동차',     type: 'expense', icon: '🚗', color: '#6B7280' },
    { id: 'cat-gift',     name: '선물/경조사', type: 'expense', icon: '🎀', color: '#F97316' },
    { id: 'cat-invest',   name: '투자',       type: 'income',  icon: '📈', color: '#22C55E' },
    { id: 'cat-rental',   name: '임대수입',   type: 'income',  icon: '🏢', color: '#14B8A6' },
    { id: 'cat-baby',     name: '육아',       type: 'expense', icon: '👶', color: '#FCA5A5' },
    { id: 'cat-home',     name: '가구/인테리어', type: 'expense', icon: '🛋️', color: '#A78BFA' },
    { id: 'cat-snack',    name: '야식',       type: 'expense', icon: '🍜', color: '#FBBF24' },
  ]
  for (const cat of customCategories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {},
      create: { ...cat, isDefault: false, userId: admin.id },
    })
  }
  console.log(`커스텀 카테고리 ${customCategories.length}개 생성 완료`)

  // ── 거래 내역 ──────────────────────────────────────────
  // 기존 거래 삭제 후 재생성 (중복 방지)
  await prisma.transaction.deleteMany({ where: { userId: admin.id } })

  const cat = (name) => `default-${name}`

  const transactions = [
    // ── 2025년 1월 ──
    { type: 'income', amount: 3500000, memo: '1월 월급', date: '2025-01-25', categoryId: cat('월급'), accountId: 'acc-bank' },
    { type: 'expense', amount: 550000, memo: '1월 월세', date: '2025-01-02', categoryId: cat('월세/관리비'), accountId: 'acc-bank', isRecurring: true },
    { type: 'expense', amount: 65000, memo: '관리비', date: '2025-01-05', categoryId: cat('월세/관리비'), accountId: 'acc-bank' },
    { type: 'expense', amount: 55000, memo: '핸드폰 요금', date: '2025-01-10', categoryId: cat('통신'), accountId: 'acc-bank', isRecurring: true },
    { type: 'expense', amount: 17900, memo: '넷플릭스', date: '2025-01-12', categoryId: cat('구독'), accountId: 'acc-credit', isRecurring: true },
    { type: 'expense', amount: 9900, memo: '유튜브 프리미엄', date: '2025-01-12', categoryId: cat('구독'), accountId: 'acc-credit', isRecurring: true },
    { type: 'expense', amount: 38500, memo: '마트 장보기', date: '2025-01-04', categoryId: cat('식비'), accountId: 'acc-check' },
    { type: 'expense', amount: 12000, memo: '점심 — 칼국수', date: '2025-01-06', categoryId: cat('식비'), accountId: 'acc-cash' },
    { type: 'expense', amount: 9500, memo: '스타벅스', date: '2025-01-07', categoryId: cat('카페/간식'), accountId: 'acc-credit' },
    { type: 'expense', amount: 14500, memo: '저녁 — 삼겹살', date: '2025-01-08', categoryId: cat('식비'), accountId: 'acc-check' },
    { type: 'expense', amount: 6500, memo: '편의점', date: '2025-01-09', categoryId: cat('카페/간식'), accountId: 'acc-cash' },
    { type: 'expense', amount: 42000, memo: '택시 (신년 모임)', date: '2025-01-01', categoryId: cat('교통'), accountId: 'acc-cash' },
    { type: 'expense', amount: 1650, memo: '버스 교통카드', date: '2025-01-13', categoryId: cat('교통'), accountId: 'acc-check' },
    { type: 'expense', amount: 89000, memo: '패딩 세일', date: '2025-01-15', categoryId: cat('쇼핑'), accountId: 'acc-credit' },
    { type: 'expense', amount: 22000, memo: '영화 — 오펜하이머', date: '2025-01-18', categoryId: cat('문화/여가'), accountId: 'acc-credit' },
    { type: 'expense', amount: 35000, memo: '병원 진료비', date: '2025-01-20', categoryId: cat('의료/건강'), accountId: 'acc-check' },
    { type: 'expense', amount: 7500, memo: '약국', date: '2025-01-21', categoryId: cat('의료/건강'), accountId: 'acc-cash' },
    { type: 'income', amount: 200000, memo: '프리랜서 작업비', date: '2025-01-28', categoryId: cat('부수입'), accountId: 'acc-bank' },
    { type: 'expense', amount: 18000, memo: '점심 — 회사 근처', date: '2025-01-29', categoryId: cat('식비'), accountId: 'acc-check' },
    { type: 'expense', amount: 5500, memo: '카페 라떼', date: '2025-01-30', categoryId: cat('카페/간식'), accountId: 'acc-check' },

    // ── 2025년 2월 ──
    { type: 'income', amount: 3500000, memo: '2월 월급', date: '2025-02-25', categoryId: cat('월급'), accountId: 'acc-bank' },
    { type: 'expense', amount: 550000, memo: '2월 월세', date: '2025-02-02', categoryId: cat('월세/관리비'), accountId: 'acc-bank', isRecurring: true },
    { type: 'expense', amount: 62000, memo: '관리비', date: '2025-02-05', categoryId: cat('월세/관리비'), accountId: 'acc-bank' },
    { type: 'expense', amount: 55000, memo: '핸드폰 요금', date: '2025-02-10', categoryId: cat('통신'), accountId: 'acc-bank', isRecurring: true },
    { type: 'expense', amount: 17900, memo: '넷플릭스', date: '2025-02-12', categoryId: cat('구독'), accountId: 'acc-credit', isRecurring: true },
    { type: 'expense', amount: 9900, memo: '유튜브 프리미엄', date: '2025-02-12', categoryId: cat('구독'), accountId: 'acc-credit', isRecurring: true },
    { type: 'expense', amount: 45000, memo: '마트 장보기', date: '2025-02-01', categoryId: cat('식비'), accountId: 'acc-check' },
    { type: 'expense', amount: 13000, memo: '점심 — 돈까스', date: '2025-02-03', categoryId: cat('식비'), accountId: 'acc-cash' },
    { type: 'expense', amount: 8500, memo: '메가커피', date: '2025-02-04', categoryId: cat('카페/간식'), accountId: 'acc-check' },
    { type: 'expense', amount: 29000, memo: '설날 선물', date: '2025-02-06', categoryId: cat('쇼핑'), accountId: 'acc-credit' },
    { type: 'income', amount: 100000, memo: '설날 용돈', date: '2025-02-07', categoryId: cat('용돈'), accountId: 'acc-cash' },
    { type: 'expense', amount: 52000, memo: '귀성 고속버스', date: '2025-02-07', categoryId: cat('교통'), accountId: 'acc-check' },
    { type: 'expense', amount: 24000, memo: '저녁 — 고기집', date: '2025-02-14', categoryId: cat('식비'), accountId: 'acc-credit' },
    { type: 'expense', amount: 15000, memo: '발렌타인데이 초콜릿', date: '2025-02-14', categoryId: cat('쇼핑'), accountId: 'acc-cash' },
    { type: 'expense', amount: 68000, memo: '운동화 구매', date: '2025-02-17', categoryId: cat('쇼핑'), accountId: 'acc-credit' },
    { type: 'expense', amount: 11000, memo: '점심 — 비빔밥', date: '2025-02-19', categoryId: cat('식비'), accountId: 'acc-cash' },
    { type: 'expense', amount: 6200, memo: '지하철 충전', date: '2025-02-20', categoryId: cat('교통'), accountId: 'acc-check' },
    { type: 'expense', amount: 33000, memo: '공연 티켓', date: '2025-02-22', categoryId: cat('문화/여가'), accountId: 'acc-credit' },
    { type: 'income', amount: 5200, memo: '이자 수익', date: '2025-02-28', categoryId: cat('이자'), accountId: 'acc-bank' },

    // ── 2025년 3월 ──
    { type: 'income', amount: 3500000, memo: '3월 월급', date: '2025-03-25', categoryId: cat('월급'), accountId: 'acc-bank' },
    { type: 'expense', amount: 550000, memo: '3월 월세', date: '2025-03-02', categoryId: cat('월세/관리비'), accountId: 'acc-bank', isRecurring: true },
    { type: 'expense', amount: 68000, memo: '관리비', date: '2025-03-05', categoryId: cat('월세/관리비'), accountId: 'acc-bank' },
    { type: 'expense', amount: 55000, memo: '핸드폰 요금', date: '2025-03-10', categoryId: cat('통신'), accountId: 'acc-bank', isRecurring: true },
    { type: 'expense', amount: 17900, memo: '넷플릭스', date: '2025-03-12', categoryId: cat('구독'), accountId: 'acc-credit', isRecurring: true },
    { type: 'expense', amount: 9900, memo: '유튜브 프리미엄', date: '2025-03-12', categoryId: cat('구독'), accountId: 'acc-credit', isRecurring: true },
    { type: 'expense', amount: 41000, memo: '마트 장보기', date: '2025-03-01', categoryId: cat('식비'), accountId: 'acc-check' },
    { type: 'expense', amount: 8800, memo: '카페인 충전', date: '2025-03-03', categoryId: cat('카페/간식'), accountId: 'acc-check' },
    { type: 'expense', amount: 15500, memo: '점심 — 파스타', date: '2025-03-04', categoryId: cat('식비'), accountId: 'acc-credit' },
    { type: 'expense', amount: 120000, memo: '봄옷 쇼핑', date: '2025-03-08', categoryId: cat('쇼핑'), accountId: 'acc-credit' },
    { type: 'expense', amount: 4500, memo: '편의점 간식', date: '2025-03-11', categoryId: cat('카페/간식'), accountId: 'acc-cash' },
    { type: 'expense', amount: 27000, memo: '저녁 — 초밥', date: '2025-03-13', categoryId: cat('식비'), accountId: 'acc-credit' },
    { type: 'expense', amount: 48000, memo: '헬스장 1개월', date: '2025-03-15', categoryId: cat('의료/건강'), accountId: 'acc-check' },
    { type: 'expense', amount: 1650, memo: '버스', date: '2025-03-17', categoryId: cat('교통'), accountId: 'acc-check' },
    { type: 'expense', amount: 22000, memo: '영화 — 위키드', date: '2025-03-20', categoryId: cat('문화/여가'), accountId: 'acc-credit' },
    { type: 'expense', amount: 9200, memo: '배달 — 치킨', date: '2025-03-21', categoryId: cat('식비'), accountId: 'acc-check' },
    { type: 'expense', amount: 35000, memo: '친구 생일 선물', date: '2025-03-24', categoryId: cat('쇼핑'), accountId: 'acc-credit' },
    { type: 'income', amount: 150000, memo: '중고거래 수익', date: '2025-03-26', categoryId: cat('부수입'), accountId: 'acc-cash' },
    { type: 'expense', amount: 19000, memo: '점심 — 냉면', date: '2025-03-27', categoryId: cat('식비'), accountId: 'acc-cash' },
    { type: 'expense', amount: 7800, memo: '편의점', date: '2025-03-28', categoryId: cat('카페/간식'), accountId: 'acc-cash' },
    { type: 'expense', amount: 11500, memo: '약국 — 비타민', date: '2025-03-29', categoryId: cat('의료/건강'), accountId: 'acc-check' },
    { type: 'income', amount: 5100, memo: '이자 수익', date: '2025-03-31', categoryId: cat('이자'), accountId: 'acc-bank' },

    // ── 2025년 4월 ──
    { type: 'income', amount: 3500000, memo: '4월 월급', date: '2025-04-25', categoryId: cat('월급'), accountId: 'acc-bank' },
    { type: 'expense', amount: 550000, memo: '4월 월세', date: '2025-04-02', categoryId: cat('월세/관리비'), accountId: 'acc-bank', isRecurring: true },
    { type: 'expense', amount: 55000, memo: '핸드폰 요금', date: '2025-04-10', categoryId: cat('통신'), accountId: 'acc-bank', isRecurring: true },
    { type: 'expense', amount: 17900, memo: '넷플릭스', date: '2025-04-12', categoryId: cat('구독'), accountId: 'acc-credit', isRecurring: true },
    { type: 'expense', amount: 9900, memo: '유튜브 프리미엄', date: '2025-04-12', categoryId: cat('구독'), accountId: 'acc-credit', isRecurring: true },
    { type: 'expense', amount: 52000, memo: '마트 장보기', date: '2025-04-03', categoryId: cat('식비'), accountId: 'acc-check' },
    { type: 'expense', amount: 10500, memo: '아메리카노 2잔', date: '2025-04-04', categoryId: cat('카페/간식'), accountId: 'acc-check' },
    { type: 'expense', amount: 13000, memo: '점심 — 국밥', date: '2025-04-07', categoryId: cat('식비'), accountId: 'acc-cash' },
    { type: 'expense', amount: 320000, memo: '항공권 (여름 여행)', date: '2025-04-08', categoryId: cat('문화/여가'), accountId: 'acc-credit' },
    { type: 'expense', amount: 24000, memo: '저녁 — 야키토리', date: '2025-04-09', categoryId: cat('식비'), accountId: 'acc-credit' },
  ]

  await prisma.transaction.createMany({
    data: transactions.map((t) => ({
      ...t,
      isRecurring: t.isRecurring ?? false,
      userId: admin.id,
    })),
  })
  console.log(`거래 내역 ${transactions.length}건 생성 완료`)

  // ── 예산 설정 ──────────────────────────────────────────
  await prisma.budget.deleteMany({ where: { userId: admin.id } })
  const budgets = [
    { month: '2025-04', amount: 800000, categoryId: cat('식비') },
    { month: '2025-04', amount: 100000, categoryId: cat('카페/간식') },
    { month: '2025-04', amount: 150000, categoryId: cat('교통') },
    { month: '2025-04', amount: 200000, categoryId: cat('쇼핑') },
    { month: '2025-04', amount: 100000, categoryId: cat('문화/여가') },
    { month: '2025-04', amount: 50000, categoryId: cat('의료/건강') },
    { month: '2025-04', amount: 30000, categoryId: cat('구독') },
    { month: '2025-04', amount: 620000, categoryId: cat('월세/관리비') },
  ]
  await prisma.budget.createMany({
    data: budgets.map((b) => ({ ...b, userId: admin.id })),
  })
  console.log(`예산 ${budgets.length}개 설정 완료`)

  console.log('\n✅ 시드 데이터 삽입 완료!')
  console.log(`   카테고리: ${defaultCategories.length}개`)
  console.log(`   계좌: ${accountDefs.length}개 (현금, 체크카드, 신용카드, 카카오뱅크)`)
  console.log(`   거래 내역: ${transactions.length}건 (2025년 1~4월)`)
  console.log(`   예산: ${budgets.length}개 (2025년 4월 기준)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
