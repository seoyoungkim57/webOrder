# 보안 요구사항

## 개요

webOrder는 소상공인·소기업의 민감한 비즈니스 정보를 다루므로 강력한 보안이 필수입니다.

---

## OWASP Top 10 대응

### 1. Injection (SQL Injection, NoSQL Injection)

#### 위협
- 악의적인 SQL/쿼리 주입으로 데이터 유출 또는 조작

#### 대응 방안
- ✅ **Prisma ORM 사용**: 자동으로 파라미터화된 쿼리 생성
- ✅ **입력값 검증**: Zod 스키마로 모든 입력값 검증
- ✅ **Raw Query 금지**: Prisma의 타입 안전한 API만 사용

```typescript
// ❌ 위험: Raw Query
const result = await prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`

// ✅ 안전: Prisma Client
const user = await prisma.user.findUnique({
  where: { id: userId }
})
```

---

### 2. Broken Authentication

#### 위협
- 취약한 인증으로 계정 탈취
- 세션 하이재킹
- 무차별 대입 공격

#### 대응 방안
- ✅ **NextAuth.js 사용**: 검증된 인증 라이브러리
- ✅ **OAuth 2.0**: Google, Kakao, Naver 소셜 로그인
- ✅ **HTTPS 필수**: 모든 통신 암호화
- ✅ **세션 관리**:
  - Secure 쿠키 사용
  - HttpOnly 플래그
  - SameSite=Lax 설정
- ✅ **Rate Limiting**: 로그인 시도 제한 (5회/분)

```typescript
// NextAuth.js 설정
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true, // HTTPS only
      },
    },
  },
}
```

---

### 3. Sensitive Data Exposure

#### 위협
- 개인정보 및 민감 데이터 유출
- 평문 저장으로 인한 데이터 노출

#### 대응 방안
- ✅ **암호화 필수 필드**:
  - 사업자번호
  - 핸드폰 번호
  - 기타 개인식별정보

- ✅ **암호화 방식**:
  - AES-256-GCM 사용
  - 환경변수로 암호화 키 관리

```typescript
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY // 32 bytes
const ALGORITHM = 'aes-256-gcm'

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(text: string): string {
  const [ivHex, authTagHex, encrypted] = text.split(':')

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)

  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
```

- ✅ **해싱 (비밀번호, 인증 코드)**:
  - bcrypt 사용 (10 rounds)

```typescript
import bcrypt from 'bcrypt'

export async function hashVerificationCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10)
}

export async function verifyCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash)
}
```

- ✅ **HTTPS 필수**: 전송 중 데이터 암호화
- ✅ **데이터 마스킹**:
  - 로그에 민감정보 기록 금지
  - UI에서 일부 마스킹 (예: 010-****-5678)

---

### 4. XML External Entities (XXE)

#### 위협
- XML 파싱 시 외부 엔티티 참조로 파일 읽기

#### 대응 방안
- ✅ **JSON 사용**: XML 사용 최소화
- ✅ **XML 파서 보안 설정**: 외부 엔티티 비활성화 (필요 시)

---

### 5. Broken Access Control

#### 위협
- 권한 없는 리소스 접근
- 다른 사용자의 주문서 조회/수정

#### 대응 방안
- ✅ **서버 사이드 권한 검증**: 모든 API 요청에서 권한 확인

```typescript
// 주문서 조회 시 소유권 확인
export async function getOrder(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId }
  })

  if (!order) {
    throw new Error('주문서를 찾을 수 없습니다.')
  }

  if (order.userId !== userId) {
    throw new Error('접근 권한이 없습니다.')
  }

  return order
}
```

- ✅ **토큰 기반 접근 제어**:
  - 공급받는자는 고유 토큰으로만 접근
  - 토큰 유효기간 30일
  - 만료된 토큰 접근 차단

- ✅ **IDOR 방지**:
  - UUID 사용 (순차적 ID 금지)
  - 예측 불가능한 토큰

---

### 6. Security Misconfiguration

#### 위협
- 기본 설정 사용으로 인한 취약점
- 불필요한 기능 노출

#### 대응 방안
- ✅ **보안 헤더 설정** (helmet 사용)

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ]
  },
}
```

- ✅ **환경변수 관리**:
  - `.env.local` Git 제외
  - 프로덕션 환경변수는 Vercel/AWS Secrets Manager 사용

- ✅ **에러 메시지 제한**:
  - 프로덕션에서 상세 에러 숨김
  - 일반적인 에러 메시지만 노출

```typescript
// 프로덕션 에러 처리
if (process.env.NODE_ENV === 'production') {
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: '서버 에러가 발생했습니다.',
    }
  })
} else {
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message,
      stack: error.stack,
    }
  })
}
```

---

### 7. Cross-Site Scripting (XSS)

#### 위협
- 악의적인 스크립트 삽입으로 세션 탈취, 페이지 조작

#### 대응 방안
- ✅ **React 자동 이스케이프**: React는 기본적으로 XSS 방어
- ✅ **dangerouslySetInnerHTML 금지**: HTML 직접 삽입 금지
- ✅ **입력값 검증**: Zod로 모든 입력값 검증 및 sanitize

```typescript
import { z } from 'zod'

const OrderSchema = z.object({
  recipientName: z.string().min(1).max(100).trim(),
  memo: z.string().max(1000).trim().optional(),
  // HTML 태그 제거
  recipientBusinessName: z.string().min(1).max(200).trim()
    .transform(val => val.replace(/<[^>]*>/g, '')),
})
```

- ✅ **Content Security Policy (CSP)**: 인라인 스크립트 차단

---

### 8. Insecure Deserialization

#### 위협
- 직렬화된 객체 조작으로 원격 코드 실행

#### 대응 방안
- ✅ **JSON만 사용**: 복잡한 직렬화 형식 사용 안 함
- ✅ **타입 검증**: Zod로 역직렬화된 데이터 검증

---

### 9. Using Components with Known Vulnerabilities

#### 위협
- 취약점이 있는 라이브러리 사용

#### 대응 방안
- ✅ **정기적인 업데이트**: npm audit 정기 실행
- ✅ **Dependabot 활성화**: GitHub 자동 보안 업데이트
- ✅ **CI/CD 보안 검사**: GitHub Actions에서 취약점 스캔

```yaml
# .github/workflows/security.yml
name: Security Check
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run npm audit
        run: npm audit --audit-level=moderate
      - name: Run Snyk
        run: npx snyk test
```

---

### 10. Insufficient Logging & Monitoring

#### 위협
- 공격 탐지 실패
- 보안 사고 원인 파악 어려움

#### 대응 방안
- ✅ **Sentry 통합**: 에러 및 예외 추적
- ✅ **주요 이벤트 로깅**:
  - 로그인 시도 (성공/실패)
  - 주문서 생성/수정/삭제
  - 상태 변경
  - 본인 인증 시도 (성공/실패)
  - API Rate Limit 초과

```typescript
// 로깅 예시
import * as Sentry from '@sentry/nextjs'

export async function logSecurityEvent(event: {
  type: 'LOGIN_ATTEMPT' | 'VERIFICATION_ATTEMPT' | 'ORDER_ACCESS'
  userId?: string
  success: boolean
  ipAddress: string
  userAgent: string
  details?: any
}) {
  await prisma.securityLog.create({
    data: event
  })

  if (!event.success) {
    Sentry.captureMessage(`Security Event: ${event.type}`, {
      level: 'warning',
      extra: event
    })
  }
}
```

---

## 추가 보안 조치

### 1. Rate Limiting

#### API Rate Limiting
```typescript
import rateLimit from 'express-rate-limit'

// 일반 API
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: 100, // 100 요청
  message: '요청 횟수를 초과했습니다.',
})

// 본인 인증 API
export const verificationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true, // 성공 시 카운트 안 함
  message: '인증 시도 횟수를 초과했습니다.',
})

// 주문서 생성 API
export const orderCreationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: '주문서 생성 횟수를 초과했습니다.',
})
```

#### 본인 인증 시도 제한
- 5회 실패 시 30분 잠금
- IP 주소 기반 추가 제한 (10회/시간)

```typescript
export async function checkVerificationAttempts(token: string, ipAddress: string) {
  const attempts = await prisma.verificationAttempt.count({
    where: {
      token,
      ipAddress,
      createdAt: {
        gte: new Date(Date.now() - 30 * 60 * 1000) // 30분
      }
    }
  })

  if (attempts >= 5) {
    throw new Error('인증 시도 횟수를 초과했습니다. 30분 후 다시 시도해주세요.')
  }
}
```

---

### 2. CORS 설정

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.ALLOWED_ORIGIN || 'https://weborder.vercel.app',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ]
  },
}
```

---

### 3. CSRF 보호

- NextAuth.js 자동 CSRF 토큰 관리
- 모든 상태 변경 요청에 CSRF 토큰 검증

---

### 4. 입력값 검증

모든 API 요청에 Zod 스키마 적용:

```typescript
import { z } from 'zod'

// 주문서 생성 스키마
export const CreateOrderSchema = z.object({
  recipientName: z.string().min(1, '이름을 입력해주세요').max(100),
  recipientBusinessName: z.string().min(1).max(200),
  recipientPhone1: z.string().regex(/^\d{3}-\d{4}-\d{4}$/, '올바른 전화번호 형식이 아닙니다'),
  recipientPhone2: z.string().regex(/^\d{2,3}-\d{3,4}-\d{4}$/).optional(),
  deliveryDate: z.date().min(new Date(), '과거 날짜는 선택할 수 없습니다'),
  items: z.array(z.object({
    itemName: z.string().min(1).max(200),
    quantity: z.number().positive().max(999999),
    unit: z.string().min(1).max(50),
  })).min(1, '최소 1개의 품목이 필요합니다').max(100, '최대 100개까지 입력 가능합니다'),
})

// API에서 사용
export async function createOrder(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validated = CreateOrderSchema.parse(req.body)
    // ... 주문서 생성
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '입력값이 올바르지 않습니다.',
          details: error.errors
        }
      })
    }
  }
}
```

---

### 5. SQL Injection 방지

- Prisma ORM의 파라미터화된 쿼리 사용
- Raw Query 사용 금지

---

### 6. 파일 업로드 보안 (Phase 2 - 첨부파일 기능)

```typescript
// 파일 타입 검증
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function validateFile(file: File): boolean {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error('허용되지 않는 파일 형식입니다.')
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('파일 크기가 너무 큽니다. (최대 5MB)')
  }

  return true
}

// 파일명 sanitize
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255)
}
```

---

### 7. 데이터베이스 보안

- ✅ **최소 권한 원칙**: 애플리케이션 DB 계정은 필요한 권한만 부여
- ✅ **정기 백업**: 일일 자동 백업 (Vercel/AWS)
- ✅ **암호화**: 데이터베이스 암호화 활성화
- ✅ **감사 로그**: 중요 작업 로깅

---

### 8. 세션 관리

```typescript
// 세션 타임아웃
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30일

// 세션 갱신 (활동 시마다)
export async function refreshSession(sessionToken: string) {
  await prisma.session.update({
    where: { sessionToken },
    data: {
      expires: new Date(Date.now() + SESSION_MAX_AGE * 1000)
    }
  })
}

// 세션 무효화 (로그아웃)
export async function invalidateSession(sessionToken: string) {
  await prisma.session.delete({
    where: { sessionToken }
  })
}
```

---

## 보안 테스트

### 1. 자동화된 보안 테스트

```typescript
// tests/security.test.ts
describe('보안 테스트', () => {
  it('SQL Injection 방어', async () => {
    const maliciousInput = "'; DROP TABLE users; --"
    const response = await request(app)
      .post('/api/orders')
      .send({ recipientName: maliciousInput })

    expect(response.status).toBe(422)
  })

  it('XSS 방어', async () => {
    const xssPayload = '<script>alert("XSS")</script>'
    const response = await request(app)
      .post('/api/orders')
      .send({ memo: xssPayload })

    const order = await prisma.order.findUnique({
      where: { id: response.body.data.id }
    })

    expect(order.memo).not.toContain('<script>')
  })

  it('인증 없이 주문서 수정 불가', async () => {
    const response = await request(app)
      .patch('/api/orders/some-order-id')
      .send({ status: 'COMPLETED' })

    expect(response.status).toBe(401)
  })
})
```

### 2. 수동 보안 테스트

- [ ] OWASP ZAP 스캔
- [ ] Burp Suite 테스트
- [ ] 침투 테스트 (Penetration Testing)

---

## 컴플라이언스

### 개인정보보호법 준수

- ✅ **개인정보 수집 최소화**: 필요한 정보만 수집
- ✅ **동의 획득**: 개인정보 수집·이용 동의
- ✅ **암호화**: 민감정보 암호화 저장
- ✅ **보존기간**: 목적 달성 후 즉시 파기 또는 1년 보관
- ✅ **열람·정정·삭제 권리**: 사용자 요청 시 처리

---

## 보안 체크리스트

### 배포 전 필수 확인사항

- [ ] 모든 환경변수 설정 완료
- [ ] HTTPS 적용
- [ ] 보안 헤더 설정
- [ ] Rate Limiting 적용
- [ ] CORS 설정
- [ ] Sentry 통합
- [ ] 암호화 키 생성 및 설정
- [ ] 데이터베이스 백업 설정
- [ ] npm audit 통과
- [ ] 보안 테스트 완료
- [ ] 개인정보처리방침 작성
- [ ] 이용약관 작성

---

## 사고 대응 계획

### 보안 사고 발생 시

1. **즉시 조치**
   - 영향받은 시스템 격리
   - 공격 경로 차단

2. **조사**
   - 로그 분석
   - 영향 범위 파악

3. **복구**
   - 백업에서 복원
   - 보안 패치 적용

4. **통보**
   - 영향받은 사용자에게 통지
   - 관련 기관 신고 (필요 시)

5. **재발 방지**
   - 취약점 분석 및 보완
   - 보안 정책 업데이트
