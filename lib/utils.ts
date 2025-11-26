// 주문번호 생성 (YYYYMMDD-XXXX 형식)
export function generateOrderNumber(): string {
  const now = new Date()
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '')
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${datePart}-${randomPart}`
}

// 인증코드 생성 (전화번호 뒷 4자리 기반)
export function generateVerificationCode(phone: string): string {
  // 숫자만 추출
  const digits = phone.replace(/\D/g, '')
  // 뒤 4자리 반환
  return digits.slice(-4)
}

// 토큰 만료일 계산 (30일 후)
export function getTokenExpiryDate(): Date {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date
}

// 전화번호 포맷팅
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  } else if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone
}

// 날짜 포맷팅 (YYYY-MM-DD)
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

// 주문 상태 한글 변환
export const ORDER_STATUS = {
  DRAFT: '임시저장',
  SENT: '발송완료',
  VIEWED: '확인됨',
  ACCEPTED: '수락',
  REJECTED: '거절',
  REVIEWING: '검토중',
  CANCELLED: '취소됨',
} as const

export type OrderStatus = keyof typeof ORDER_STATUS
