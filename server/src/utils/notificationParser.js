/**
 * 한국 카드사 알림 텍스트 파서
 * 지원: 신한, 국민, 현대, 삼성, 롯데, 하나, 우리, BC, 농협
 */

const CARD_PATTERNS = [
  // 신한카드: "신한카드 승인 홍길동 30,000원 스타벅스 01/15 14:30"
  {
    name: '신한카드',
    pattern: /신한카드[^\d]*([\d,]+)원[^\d]*([가-힣a-zA-Z0-9\s&]+?)(?:\s*\d{2}\/\d{2}|\s*잔액|$)/,
    amountIdx: 1,
    merchantIdx: 2,
  },
  // 국민카드: "KB국민카드(1234) 15,000원 결제 GS25강남점"
  {
    name: '국민카드',
    pattern: /KB국민카드(?:\([^)]+\))?[^\d]*([\d,]+)원[^\s]*\s+([가-힣a-zA-Z0-9\s&]+?)(?:\s*\d{2}\/\d{2}|\s*잔액|$)/,
    amountIdx: 1,
    merchantIdx: 2,
  },
  // 현대카드: "현대카드 승인 20,000원 올리브영"
  {
    name: '현대카드',
    pattern: /현대카드[^\d]*([\d,]+)원[^\d]*([가-힣a-zA-Z0-9\s&]+?)(?:\s*\d{2}\/\d{2}|\s*잔액|$)/,
    amountIdx: 1,
    merchantIdx: 2,
  },
  // 삼성카드: "삼성카드 [승인] 12,500원 이마트"
  {
    name: '삼성카드',
    pattern: /삼성카드[^\d]*([\d,]+)원[^\d]*([가-힣a-zA-Z0-9\s&]+?)(?:\s*\d{2}\/\d{2}|\s*잔액|$)/,
    amountIdx: 1,
    merchantIdx: 2,
  },
  // 롯데카드: "롯데카드 8,900원 승인 롯데리아"
  {
    name: '롯데카드',
    pattern: /롯데카드[^\d]*([\d,]+)원[^\d]*([가-힣a-zA-Z0-9\s&]+?)(?:\s*\d{2}\/\d{2}|\s*잔액|$)/,
    amountIdx: 1,
    merchantIdx: 2,
  },
  // 하나카드: "하나카드 승인 5,500원 편의점"
  {
    name: '하나카드',
    pattern: /하나카드[^\d]*([\d,]+)원[^\d]*([가-힣a-zA-Z0-9\s&]+?)(?:\s*\d{2}\/\d{2}|\s*잔액|$)/,
    amountIdx: 1,
    merchantIdx: 2,
  },
  // 우리카드: "우리카드 3,300원 승인 투썸플레이스"
  {
    name: '우리카드',
    pattern: /우리카드[^\d]*([\d,]+)원[^\d]*([가-힣a-zA-Z0-9\s&]+?)(?:\s*\d{2}\/\d{2}|\s*잔액|$)/,
    amountIdx: 1,
    merchantIdx: 2,
  },
  // BC카드
  {
    name: 'BC카드',
    pattern: /BC카드[^\d]*([\d,]+)원[^\d]*([가-힣a-zA-Z0-9\s&]+?)(?:\s*\d{2}\/\d{2}|\s*잔액|$)/,
    amountIdx: 1,
    merchantIdx: 2,
  },
  // 농협카드: "NH농협카드 12,000원 승인 마트"
  {
    name: '농협카드',
    pattern: /NH농협카드[^\d]*([\d,]+)원[^\d]*([가-힣a-zA-Z0-9\s&]+?)(?:\s*\d{2}\/\d{2}|\s*잔액|$)/,
    amountIdx: 1,
    merchantIdx: 2,
  },
  // 범용 패턴: "XXX카드 N,NNN원 승인 가맹점"
  {
    name: null,
    pattern: /([가-힣a-zA-Z]+카드)[^\d]*([\d,]+)원[^\d]*([가-힣a-zA-Z0-9\s&]+?)(?:\s*\d{2}\/\d{2}|\s*잔액|$)/,
    cardNameIdx: 1,
    amountIdx: 2,
    merchantIdx: 3,
  },
]

// 취소/환불 패턴
const CANCEL_KEYWORDS = ['취소', '환불', '취소승인', '결제취소']

// 금액 문자열 → 숫자
function parseAmount(str) {
  return parseInt(str.replace(/,/g, ''), 10)
}

// 가맹점명 정리
function cleanMerchant(str) {
  return str.trim().replace(/\s+/g, ' ').slice(0, 30)
}

/**
 * @param {string} text 알림 텍스트
 * @param {string} [appName] 앱 패키지명 또는 앱 이름
 * @returns {{ amount, merchant, cardName, type, raw }}
 */
export function parseNotification(text, appName = '') {
  const raw = text

  // 취소/환불이면 income으로 처리
  const isCancel = CANCEL_KEYWORDS.some((k) => text.includes(k))
  const type = isCancel ? 'income' : 'expense'

  for (const rule of CARD_PATTERNS) {
    const m = text.match(rule.pattern)
    if (!m) continue

    const cardName = rule.name || (rule.cardNameIdx ? m[rule.cardNameIdx] : appName)
    const amount = parseAmount(m[rule.amountIdx])
    const merchant = cleanMerchant(m[rule.merchantIdx] || '')

    if (!amount || isNaN(amount)) continue

    return { amount, merchant, cardName, type, raw }
  }

  // 패턴 불일치 시 금액만 추출 시도
  const amountMatch = text.match(/([\d,]+)원/)
  if (amountMatch) {
    return {
      amount: parseAmount(amountMatch[1]),
      merchant: '',
      cardName: appName || '카드',
      type,
      raw,
    }
  }

  return null
}