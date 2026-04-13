import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function runSeed() {
  const user = await prisma.user.findFirst()
  if (!user) {
    console.log('사용자가 없습니다. 테스트 계정으로 로그인 후 다시 시도하세요.')
    return
  }

  console.log(`사용자(${user.email})에 테스트 데이터를 생성합니다...`)

  // 계좌 한 개 가져오거나 생성
  let account = await prisma.account.findFirst({ where: { userId: user.id } })
  if (!account) {
    account = await prisma.account.create({
      data: { name: '테스트카드', type: 'card', userId: user.id }
    })
  }

  // 지출, 수입 카테고리 준비
  const expenseCats = await prisma.category.findMany({
    where: { OR: [{ type: 'expense' }, { type: 'both' }] }
  })
  const incomeCats = await prisma.category.findMany({
    where: { OR: [{ type: 'income' }, { type: 'both' }] }
  })

  if (expenseCats.length === 0 || incomeCats.length === 0) {
    console.log('카테고리가 충분하지 않습니다.')
    return
  }

  const txs = []
  
  // 랜덤 유틸
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
  function randomElement(arr) {
    return arr[randomInt(0, arr.length - 1)]
  }

  // 데이터 생성: 3월과 4월
  const months = ['03', '04']
  for (const mm of months) {
    const daysInMonth = mm === '04' ? 30 : 31
    const targetDateStr = mm === '04' ? 15 : daysInMonth // 4월 15일까지만 생성 혹은 적절히 

    // 수입 (월 1~2건 보통 월급)
    txs.push({
      userId: user.id,
      accountId: account.id,
      categoryId: incomeCats.find(c => c.name === '급여')?.id || incomeCats[0].id,
      type: 'income',
      amount: randomInt(300, 500) * 10000,
      date: `2026-${mm}-10`,
      memo: '정기 급여'
    })

    // 지출 (매일 1~3건 정도)
    for (let day = 1; day <= targetDateStr; day++) {
      const dd = String(day).padStart(2, '0')
      const cnt = randomInt(0, 3)

      for (let i = 0; i < cnt; i++) {
        const cat = randomElement(expenseCats)
        let amt = 0
        if (cat.name.includes('커피') || cat.name.includes('카페') || cat.icon === '☕') {
          amt = randomInt(2, 6) * 1000
        } else if (cat.name.includes('식사') || cat.icon === '🍜' || cat.icon === '🍔') {
          amt = randomInt(8, 25) * 1000
        } else if (cat.name.includes('교통') || cat.icon === '🚌') {
          amt = randomInt(10, 50) * 100
        } else {
          amt = randomInt(5, 50) * 1000
        }

        txs.push({
          userId: user.id,
          accountId: account.id,
          categoryId: cat.id,
          type: 'expense',
          amount: amt,
          date: `2026-${mm}-${dd}`,
          memo: `랜덤 테스트 지출 - ${randomInt(1,100)}`
        })
      }
    }
  }

  // 일괄 저장
  await prisma.transaction.createMany({
    data: txs.map(t => ({
      ...t,
      isRecurring: false,
    }))
  })

  console.log(`성공적으로 ${txs.length}건의 테스트 데이터를 추가했습니다!`)
}
