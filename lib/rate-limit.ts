/**
 * Rate Limiting 미들웨어
 * 메모리 기반 Rate Limiter (서버 재시작 시 초기화)
 * 프로덕션에서는 Redis 사용 권장
 */

interface RateLimitRecord {
  count: number
  resetTime: number
  blocked: boolean
  blockExpires?: number
}

// 메모리 저장소
const rateLimitStore: Map<string, RateLimitRecord> = new Map()

// 주기적으로 만료된 기록 정리 (5분마다)
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime < now && (!record.blockExpires || record.blockExpires < now)) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

interface RateLimitConfig {
  // 시간 윈도우 (밀리초)
  windowMs: number
  // 윈도우 내 최대 요청 수
  maxRequests: number
  // 차단 시 대기 시간 (밀리초, 선택)
  blockDurationMs?: number
  // 식별자 프리픽스 (여러 리미터 구분용)
  keyPrefix?: string
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  blocked: boolean
  retryAfter?: number
}

/**
 * Rate Limit 체크
 * @param identifier - 클라이언트 식별자 (IP 주소 등)
 * @param config - Rate Limit 설정
 * @returns RateLimitResult
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const key = `${config.keyPrefix || 'default'}:${identifier}`
  const record = rateLimitStore.get(key)

  // 차단 상태 확인
  if (record?.blocked && record.blockExpires && record.blockExpires > now) {
    return {
      success: false,
      remaining: 0,
      resetTime: record.blockExpires,
      blocked: true,
      retryAfter: Math.ceil((record.blockExpires - now) / 1000),
    }
  }

  // 새로운 윈도우 시작 또는 첫 요청
  if (!record || record.resetTime < now) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + config.windowMs,
      blocked: false,
    }
    rateLimitStore.set(key, newRecord)

    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: newRecord.resetTime,
      blocked: false,
    }
  }

  // 기존 윈도우 내 요청
  record.count++

  // 제한 초과
  if (record.count > config.maxRequests) {
    if (config.blockDurationMs) {
      record.blocked = true
      record.blockExpires = now + config.blockDurationMs
    }

    return {
      success: false,
      remaining: 0,
      resetTime: record.resetTime,
      blocked: record.blocked,
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    }
  }

  return {
    success: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
    blocked: false,
  }
}

/**
 * 클라이언트 IP 주소 추출
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Vercel 등 프록시 환경
  const cfIP = request.headers.get('cf-connecting-ip')
  if (cfIP) {
    return cfIP
  }

  return 'unknown'
}

// === 사전 정의된 Rate Limiter 설정 ===

/**
 * 일반 API용 (분당 100회)
 */
export const generalApiLimit: RateLimitConfig = {
  windowMs: 60 * 1000, // 1분
  maxRequests: 100,
  keyPrefix: 'api',
}

/**
 * 인증 API용 (분당 5회, 30분 차단)
 */
export const authApiLimit: RateLimitConfig = {
  windowMs: 60 * 1000, // 1분
  maxRequests: 5,
  blockDurationMs: 30 * 60 * 1000, // 30분
  keyPrefix: 'auth',
}

/**
 * 회원가입 API용 (분당 3회, 1시간 차단)
 */
export const signupApiLimit: RateLimitConfig = {
  windowMs: 60 * 1000, // 1분
  maxRequests: 3,
  blockDurationMs: 60 * 60 * 1000, // 1시간
  keyPrefix: 'signup',
}

/**
 * 인증코드 확인용 (분당 5회, 30분 차단)
 */
export const verificationApiLimit: RateLimitConfig = {
  windowMs: 60 * 1000, // 1분
  maxRequests: 5,
  blockDurationMs: 30 * 60 * 1000, // 30분
  keyPrefix: 'verify',
}

/**
 * 주문 생성용 (분당 20회)
 */
export const orderCreateLimit: RateLimitConfig = {
  windowMs: 60 * 1000, // 1분
  maxRequests: 20,
  keyPrefix: 'order-create',
}
