/**
 * 한국 카드사 알림 텍스트 파서
 * 지원: 신한, 국민, 현대, 삼성, 롯데, 하나, 우리, BC, 농협
 */

interface ParsedNotification {
  amount: number
  merchant: string
  cardName: string
  type: 'income' | 'expense'
  raw: string
}

// 취소/환불 패턴
const CANCEL_KEYWORDS = ['취소', '환불', '취소승인', '결제취소']

// 금액 문자열 → 숫자
function parseAmount(str: string): number {
  return parseInt(str.replace(/,/g, ''), 10)
}

// 가맹점명 정리
function cleanMerchant(str: string): string {
  if (!str) return ''
  return str
    .replace(/잔액.*$/, '')      // "잔액 xxx원" 이후 제거
    .replace(/\d{2}\/\d{2}.*$/, '') // 날짜 이후 제거
    .replace(/\d{2}:\d{2}.*$/, '')  // 시간 이후 제거
    .replace(/결제$/, '')         // 마지막 "결제" 제거
    .trim()
}

/**
 * 알림 텍스트에서 금액과 가맹점을 추출
 * 전략: "N원" 기준으로 앞에서 카드명, 뒤에서 가맹점 추출
 */
export function parseNotification(text: string, appName: string = ''): ParsedNotification | null {
  const raw = text
  const isCancel = CANCEL_KEYWORDS.some((k) => text.includes(k))
  const type: 'income' | 'expense' = isCancel ? 'income' : 'expense'

  // 금액 추출 (첫 번째 "N,NNN원" 패턴)
  const amountMatch = text.match(/([\d,]+)원/)
  if (!amountMatch) return null

  const amount = parseAmount(amountMatch[1])
  if (!amount || isNaN(amount)) return null

  // 카드명 추출 (금액 앞부분에서)
  const matchIndex = amountMatch.index ?? 0
  const beforeAmount = text.slice(0, matchIndex)
  const cardNameMatch = beforeAmount.match(/([가-힣a-zA-Z]+카드)/)
  const cardName = cardNameMatch ? cardNameMatch[1] : appName || '카드'

  // 가맹점 추출 (금액 뒷부분에서)
  const afterAmount = text.slice(matchIndex + amountMatch[0].length)
  // 불필요한 키워드 제거 후 첫 번째 의미있는 단어 추출
  const merchantRaw = afterAmount
    .replace(/^[\s승인결제처리완료]+/, '') // 앞쪽 동사 제거
  const merchant = cleanMerchant(merchantRaw)

  return { amount, merchant, cardName, type, raw }
}
