# 정확도 테스트 (Accuracy Testing)

## 개요

정확도 테스트는 시스템이 요구사항에 따라 **정확하고 일관되게** 동작하는지 검증합니다. 비즈니스 로직, 계산, 데이터 처리의 정확성을 보장하기 위한 필수 테스트입니다.

---

## 테스트 범위

### 1. 데이터 정확도
- 데이터 저장 및 조회 일관성
- 암호화/복호화 정확성
- 데이터 변환 정확성

### 2. 계산 정확도
- 수량 계산
- 날짜/시간 계산
- 통계 계산

### 3. 비즈니스 로직 정확도
- 주문 상태 전환
- 권한 검증
- 토큰 생성 및 검증

### 4. 보안 정확도
- 본인 인증 정확성
- 암호화 키 일관성
- 세션 관리 정확성

---

## 1. 데이터 정확도 테스트

### 1.1 데이터 저장 및 조회 일관성

#### 테스트 목적
저장한 데이터가 조회 시 정확하게 반환되는지 검증

```typescript
// tests/accuracy/data-consistency.test.ts
import { describe, it, expect } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('데이터 저장/조회 일관성', () => {
  it('주문서 저장 후 조회 시 모든 필드가 일치', async () => {
    const orderData = {
      userId: 'test-user-id',
      recipientName: '김철수',
      recipientBusinessName: '김철수 마트',
      recipientPhone1: '010-9876-5432',
      recipientAddress: '부산시 해운대구',
      deliveryDate: new Date('2025-02-01'),
      orderNumber: 'ORD-20250125-0001',
      token: 'test-token',
      tokenExpiresAt: new Date('2025-02-24'),
      verificationCode: 'hashed-code',
    }

    // 저장
    const created = await prisma.order.create({
      data: orderData
    })

    // 조회
    const retrieved = await prisma.order.findUnique({
      where: { id: created.id }
    })

    // 검증: 모든 필드 일치
    expect(retrieved).not.toBeNull()
    expect(retrieved!.recipientName).toBe(orderData.recipientName)
    expect(retrieved!.recipientBusinessName).toBe(orderData.recipientBusinessName)
    expect(retrieved!.recipientPhone1).toBe(orderData.recipientPhone1)
    expect(retrieved!.recipientAddress).toBe(orderData.recipientAddress)
    expect(retrieved!.deliveryDate.toISOString()).toBe(orderData.deliveryDate.toISOString())
  })

  it('여러 품목 저장 후 조회 시 순서 및 내용 일치', async () => {
    const orderId = 'test-order-id'
    const items = [
      { orderId, itemName: '사과', quantity: 10, unit: '박스', sortOrder: 0 },
      { orderId, itemName: '배', quantity: 5, unit: '박스', sortOrder: 1 },
      { orderId, itemName: '딸기', quantity: 3, unit: '박스', sortOrder: 2 },
    ]

    // 저장
    await prisma.orderItem.createMany({ data: items })

    // 조회
    const retrieved = await prisma.orderItem.findMany({
      where: { orderId },
      orderBy: { sortOrder: 'asc' }
    })

    // 검증: 개수, 순서, 내용 일치
    expect(retrieved).toHaveLength(3)
    expect(retrieved[0].itemName).toBe('사과')
    expect(retrieved[0].quantity.toNumber()).toBe(10)
    expect(retrieved[1].itemName).toBe('배')
    expect(retrieved[2].itemName).toBe('딸기')
  })
})
```

---

### 1.2 암호화/복호화 정확성

#### 테스트 목적
암호화된 데이터가 복호화 후 원본과 일치하는지 검증

```typescript
// tests/accuracy/encryption.test.ts
import { describe, it, expect } from 'vitest'
import { encrypt, decrypt } from '@/lib/encryption'

describe('암호화/복호화 정확성', () => {
  const testCases = [
    '010-1234-5678',           // 핸드폰 번호
    '123-45-67890',            // 사업자번호
    'test@example.com',        // 이메일
    '서울시 강남구 테헤란로 123', // 한글 주소
    'Hello World 123!@#',      // 영문 + 특수문자
  ]

  testCases.forEach((original) => {
    it(`"${original}" 암호화/복호화 후 원본과 일치`, () => {
      const encrypted = encrypt(original)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(original)
      expect(encrypted).not.toBe(original) // 암호화되었는지 확인
    })
  })

  it('동일한 평문을 여러 번 암호화하면 다른 결과 (IV 무작위성)', () => {
    const original = '010-1234-5678'

    const encrypted1 = encrypt(original)
    const encrypted2 = encrypt(original)
    const encrypted3 = encrypt(original)

    // 암호화 결과는 매번 다름 (IV가 무작위)
    expect(encrypted1).not.toBe(encrypted2)
    expect(encrypted2).not.toBe(encrypted3)

    // 하지만 모두 복호화하면 원본과 일치
    expect(decrypt(encrypted1)).toBe(original)
    expect(decrypt(encrypted2)).toBe(original)
    expect(decrypt(encrypted3)).toBe(original)
  })

  it('잘못된 암호화 문자열 복호화 시 에러', () => {
    expect(() => decrypt('invalid-encrypted-string')).toThrow()
  })

  it('빈 문자열 암호화/복호화', () => {
    const encrypted = encrypt('')
    const decrypted = decrypt(encrypted)

    expect(decrypted).toBe('')
  })

  it('긴 문자열 (1000자) 암호화/복호화', () => {
    const original = 'A'.repeat(1000)
    const encrypted = encrypt(original)
    const decrypted = decrypt(encrypted)

    expect(decrypted).toBe(original)
    expect(decrypted).toHaveLength(1000)
  })
})
```

---

### 1.3 데이터 변환 정확성

#### 테스트 목적
데이터 타입 변환이 정확하게 이루어지는지 검증

```typescript
// tests/accuracy/data-transformation.test.ts
import { describe, it, expect } from 'vitest'

describe('데이터 변환 정확성', () => {
  it('Decimal 타입 수량이 정확하게 변환', () => {
    const testCases = [
      { input: '10', expected: 10 },
      { input: '10.5', expected: 10.5 },
      { input: '0.01', expected: 0.01 },
      { input: '999.99', expected: 999.99 },
    ]

    testCases.forEach(({ input, expected }) => {
      const decimal = new Prisma.Decimal(input)
      expect(decimal.toNumber()).toBe(expected)
    })
  })

  it('날짜 문자열이 Date 객체로 정확히 변환', () => {
    const dateString = '2025-02-01T09:00:00.000Z'
    const date = new Date(dateString)

    expect(date.toISOString()).toBe(dateString)
    expect(date.getFullYear()).toBe(2025)
    expect(date.getMonth()).toBe(1) // 0-based (2월)
    expect(date.getDate()).toBe(1)
  })

  it('시간대(KST) 변환 정확성', () => {
    const utcDate = new Date('2025-02-01T00:00:00.000Z')
    const kstOffset = 9 * 60 * 60 * 1000 // 9시간

    const kstDate = new Date(utcDate.getTime() + kstOffset)

    expect(kstDate.getUTCHours()).toBe(9)
  })
})
```

---

## 2. 계산 정확도 테스트

### 2.1 수량 계산 정확도

```typescript
// tests/accuracy/quantity-calculation.test.ts
import { describe, it, expect } from 'vitest'

describe('수량 계산 정확도', () => {
  it('품목 개수 정확히 계산', () => {
    const items = [
      { quantity: 10 },
      { quantity: 5 },
      { quantity: 3 },
    ]

    const total = items.reduce((sum, item) => sum + item.quantity, 0)
    expect(total).toBe(18)
  })

  it('소수점 수량 계산', () => {
    const items = [
      { quantity: 10.5 },
      { quantity: 5.25 },
      { quantity: 3.75 },
    ]

    const total = items.reduce((sum, item) => sum + item.quantity, 0)
    expect(total).toBe(19.5)
  })

  it('매우 작은 수량 계산 (정밀도)', () => {
    const quantity1 = 0.1
    const quantity2 = 0.2

    // JavaScript 부동소수점 이슈 회피
    const total = Math.round((quantity1 + quantity2) * 100) / 100
    expect(total).toBe(0.3)
  })
})
```

---

### 2.2 날짜/시간 계산 정확도

```typescript
// tests/accuracy/date-calculation.test.ts
import { describe, it, expect } from 'vitest'

describe('날짜/시간 계산 정확도', () => {
  it('토큰 만료일 계산 (생성일 + 30일)', () => {
    const createdAt = new Date('2025-01-25T00:00:00.000Z')
    const expiresAt = new Date(createdAt)
    expiresAt.setDate(expiresAt.getDate() + 30)

    expect(expiresAt.toISOString()).toBe('2025-02-24T00:00:00.000Z')
  })

  it('만료 여부 정확히 판단', () => {
    const now = new Date('2025-02-01T00:00:00.000Z')
    const expiresAt1 = new Date('2025-02-24T00:00:00.000Z') // 미래
    const expiresAt2 = new Date('2025-01-24T00:00:00.000Z') // 과거

    expect(expiresAt1 > now).toBe(true)  // 만료 안 됨
    expect(expiresAt2 < now).toBe(true)  // 만료됨
  })

  it('D-Day 계산 정확도', () => {
    const today = new Date('2025-01-25T00:00:00.000Z')
    const targetDate = new Date('2025-02-24T00:00:00.000Z')

    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    expect(diffDays).toBe(30)
  })

  it('월말/월초 날짜 계산', () => {
    const date1 = new Date('2025-01-31T00:00:00.000Z')
    date1.setDate(date1.getDate() + 1)

    expect(date1.getMonth()).toBe(1) // 2월
    expect(date1.getDate()).toBe(1)
  })
})
```

---

### 2.3 통계 계산 정확도

```typescript
// tests/accuracy/statistics.test.ts
import { describe, it, expect } from 'vitest'

describe('통계 계산 정확도', () => {
  it('주문 수락률 정확히 계산', () => {
    const totalOrders = 100
    const acceptedOrders = 85

    const acceptanceRate = (acceptedOrders / totalOrders) * 100
    expect(acceptanceRate).toBe(85)
  })

  it('소수점 포함 수락률 (반올림)', () => {
    const totalOrders = 70
    const acceptedOrders = 60

    const acceptanceRate = Math.round((acceptedOrders / totalOrders) * 1000) / 10
    expect(acceptanceRate).toBe(85.7)
  })

  it('0으로 나누기 방지', () => {
    const totalOrders = 0
    const acceptedOrders = 0

    const acceptanceRate = totalOrders === 0 ? 0 : (acceptedOrders / totalOrders) * 100
    expect(acceptanceRate).toBe(0)
  })
})
```

---

## 3. 비즈니스 로직 정확도 테스트

### 3.1 주문 상태 전환 정확도

```typescript
// tests/accuracy/order-status.test.ts
import { describe, it, expect } from 'vitest'

describe('주문 상태 전환 정확도', () => {
  it('유효한 상태 전환만 허용', () => {
    const validTransitions = {
      'DRAFT': ['SENT'],
      'SENT': ['REJECTED', 'REVIEWING', 'ACCEPTED'],
      'REVIEWING': ['REJECTED', 'ACCEPTED'],
      'REJECTED': ['COMPLETED'],
      'ACCEPTED': ['COMPLETED'],
    }

    function canTransition(from: string, to: string): boolean {
      return validTransitions[from]?.includes(to) ?? false
    }

    // 유효한 전환
    expect(canTransition('DRAFT', 'SENT')).toBe(true)
    expect(canTransition('SENT', 'ACCEPTED')).toBe(true)
    expect(canTransition('REVIEWING', 'ACCEPTED')).toBe(true)

    // 무효한 전환
    expect(canTransition('DRAFT', 'ACCEPTED')).toBe(false)
    expect(canTransition('COMPLETED', 'SENT')).toBe(false)
    expect(canTransition('ACCEPTED', 'REJECTED')).toBe(false)
  })

  it('상태 이력이 정확히 기록', async () => {
    const histories = [
      { status: 'DRAFT', createdAt: new Date('2025-01-25T10:00:00Z') },
      { status: 'SENT', createdAt: new Date('2025-01-25T10:05:00Z') },
      { status: 'REVIEWING', createdAt: new Date('2025-01-26T09:00:00Z') },
      { status: 'ACCEPTED', createdAt: new Date('2025-01-26T11:00:00Z') },
    ]

    // 시간순 정렬 확인
    const sortedHistories = [...histories].sort((a, b) =>
      a.createdAt.getTime() - b.createdAt.getTime()
    )

    expect(sortedHistories[0].status).toBe('DRAFT')
    expect(sortedHistories[3].status).toBe('ACCEPTED')
  })
})
```

---

### 3.2 권한 검증 정확도

```typescript
// tests/accuracy/authorization.test.ts
import { describe, it, expect } from 'vitest'

describe('권한 검증 정확도', () => {
  it('주문서 소유자만 수정 가능', () => {
    const order = { userId: 'user-123' }
    const currentUser = { id: 'user-123' }
    const otherUser = { id: 'user-456' }

    function canEdit(order: any, user: any): boolean {
      return order.userId === user.id
    }

    expect(canEdit(order, currentUser)).toBe(true)
    expect(canEdit(order, otherUser)).toBe(false)
  })

  it('토큰 검증 정확도', () => {
    const validToken = 'valid-token-uuid'
    const expiredToken = 'expired-token-uuid'

    const tokens = {
      [validToken]: { expiresAt: new Date('2025-12-31') },
      [expiredToken]: { expiresAt: new Date('2024-01-01') },
    }

    function isTokenValid(token: string): boolean {
      const tokenData = tokens[token]
      if (!tokenData) return false
      return tokenData.expiresAt > new Date()
    }

    expect(isTokenValid(validToken)).toBe(true)
    expect(isTokenValid(expiredToken)).toBe(false)
    expect(isTokenValid('non-existent')).toBe(false)
  })
})
```

---

### 3.3 토큰 생성 및 검증 정확도

```typescript
// tests/accuracy/token-generation.test.ts
import { describe, it, expect } from 'vitest'
import { randomUUID } from 'crypto'

describe('토큰 생성 정확도', () => {
  it('UUID 형식 토큰 생성', () => {
    const token = randomUUID()
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    expect(uuidRegex.test(token)).toBe(true)
  })

  it('생성된 토큰이 고유함', () => {
    const tokens = new Set()
    for (let i = 0; i < 1000; i++) {
      tokens.add(randomUUID())
    }

    expect(tokens.size).toBe(1000) // 모두 고유함
  })

  it('토큰 길이 일관성', () => {
    const token1 = randomUUID()
    const token2 = randomUUID()
    const token3 = randomUUID()

    expect(token1.length).toBe(36)
    expect(token2.length).toBe(36)
    expect(token3.length).toBe(36)
  })
})
```

---

## 4. 보안 정확도 테스트

### 4.1 본인 인증 정확도

```typescript
// tests/accuracy/verification.test.ts
import { describe, it, expect } from 'vitest'
import bcrypt from 'bcrypt'

describe('본인 인증 정확도', () => {
  it('올바른 인증 코드는 통과', async () => {
    const originalCode = '5432'
    const hashedCode = await bcrypt.hash(originalCode, 10)

    const isValid = await bcrypt.compare(originalCode, hashedCode)
    expect(isValid).toBe(true)
  })

  it('잘못된 인증 코드는 실패', async () => {
    const originalCode = '5432'
    const hashedCode = await bcrypt.hash(originalCode, 10)

    const isValid = await bcrypt.compare('0000', hashedCode)
    expect(isValid).toBe(false)
  })

  it('핸드폰 번호 뒷자리 추출 정확도', () => {
    const testCases = [
      { phone: '010-1234-5678', expected: '5678' },
      { phone: '01012345678', expected: '5678' },
      { phone: '010-9876-5432', expected: '5432' },
    ]

    function extractLastDigits(phone: string): string {
      return phone.replace(/\D/g, '').slice(-4)
    }

    testCases.forEach(({ phone, expected }) => {
      expect(extractLastDigits(phone)).toBe(expected)
    })
  })
})
```

---

### 4.2 암호화 키 일관성

```typescript
// tests/accuracy/encryption-key.test.ts
import { describe, it, expect } from 'vitest'

describe('암호화 키 일관성', () => {
  it('환경변수에서 로드한 키가 일관됨', () => {
    const key1 = process.env.ENCRYPTION_KEY
    const key2 = process.env.ENCRYPTION_KEY

    expect(key1).toBe(key2)
    expect(key1).toBeDefined()
  })

  it('암호화 키 길이 검증 (32 bytes)', () => {
    const key = process.env.ENCRYPTION_KEY

    expect(key).toBeDefined()
    expect(Buffer.from(key!, 'hex').length).toBe(32)
  })
})
```

---

### 4.3 세션 관리 정확도

```typescript
// tests/accuracy/session-management.test.ts
import { describe, it, expect } from 'vitest'

describe('세션 관리 정확도', () => {
  it('세션 만료 시간 정확히 계산', () => {
    const now = new Date('2025-01-25T00:00:00.000Z')
    const maxAge = 30 * 24 * 60 * 60 // 30일 (초)
    const expiresAt = new Date(now.getTime() + maxAge * 1000)

    expect(expiresAt.toISOString()).toBe('2025-02-24T00:00:00.000Z')
  })

  it('세션 유효성 판단', () => {
    const now = new Date('2025-02-01T00:00:00.000Z')
    const session1 = { expires: new Date('2025-02-24T00:00:00.000Z') }
    const session2 = { expires: new Date('2025-01-24T00:00:00.000Z') }

    function isSessionValid(session: any, currentTime: Date): boolean {
      return session.expires > currentTime
    }

    expect(isSessionValid(session1, now)).toBe(true)
    expect(isSessionValid(session2, now)).toBe(false)
  })
})
```

---

## 5. 통합 정확도 테스트

### 5.1 전체 주문 플로우 정확도

```typescript
// tests/accuracy/order-flow.test.ts
import { describe, it, expect } from 'vitest'

describe('전체 주문 플로우 정확도', () => {
  it('주문서 생성부터 수락까지 데이터 정확성', async () => {
    // 1. 주문서 생성
    const orderData = {
      recipientName: '김철수',
      recipientPhone1: '010-9876-5432',
      items: [
        { itemName: '사과', quantity: 10, unit: '박스' }
      ]
    }

    const createdOrder = await createOrder(orderData)

    // 검증: 생성된 데이터 정확성
    expect(createdOrder.recipientName).toBe(orderData.recipientName)
    expect(createdOrder.items).toHaveLength(1)
    expect(createdOrder.items[0].quantity).toBe(10)
    expect(createdOrder.status).toBe('SENT')
    expect(createdOrder.token).toBeTruthy()

    // 2. 공급받는자가 조회
    const retrievedOrder = await getOrderByToken(createdOrder.token)

    // 검증: 조회된 데이터 일치
    expect(retrievedOrder.recipientName).toBe(orderData.recipientName)
    expect(retrievedOrder.items[0].itemName).toBe('사과')

    // 3. 본인 인증
    const verified = await verifyOrder(createdOrder.token, '5432')

    // 검증: 인증 성공
    expect(verified).toBe(true)

    // 4. 상태 변경 (수락)
    const updatedOrder = await updateOrderStatus(createdOrder.id, 'ACCEPTED')

    // 검증: 상태 변경 정확
    expect(updatedOrder.status).toBe('ACCEPTED')

    // 5. 이력 확인
    const histories = await getOrderHistories(createdOrder.id)

    // 검증: 이력 정확히 기록
    expect(histories).toHaveLength(2) // SENT, ACCEPTED
    expect(histories[0].status).toBe('SENT')
    expect(histories[1].status).toBe('ACCEPTED')
  })
})
```

---

## 정확도 테스트 실행

### 테스트 실행 명령어

```bash
# 모든 정확도 테스트 실행
npm run test:accuracy

# 특정 카테고리 테스트
npm run test:accuracy -- data-consistency
npm run test:accuracy -- encryption
npm run test:accuracy -- calculation

# 커버리지 포함 실행
npm run test:accuracy -- --coverage
```

### package.json 스크립트 추가

```json
{
  "scripts": {
    "test:accuracy": "vitest run tests/accuracy",
    "test:accuracy:watch": "vitest tests/accuracy"
  }
}
```

---

## CI/CD 통합

### GitHub Actions 워크플로우에 추가

```yaml
# .github/workflows/accuracy-test.yml
name: Accuracy Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  accuracy-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run accuracy tests
        run: npm run test:accuracy

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: accuracy-test-results
          path: coverage/
```

---

## 정확도 테스트 체크리스트

### 배포 전 필수 확인

- [ ] 데이터 저장/조회 일관성 테스트 통과
- [ ] 암호화/복호화 100% 정확도
- [ ] 모든 계산 정확도 테스트 통과
- [ ] 주문 상태 전환 로직 정확성 검증
- [ ] 권한 검증 100% 정확도
- [ ] 본인 인증 정확성 검증
- [ ] 토큰 생성 고유성 보장
- [ ] 전체 플로우 통합 테스트 통과

---

## 정확도 기준 (SLA)

### 목표 정확도

- **데이터 정확도**: 100% (데이터 손실/변조 0건)
- **계산 정확도**: 100% (오차 허용 범위 0)
- **인증 정확도**: 100% (False Positive 0%, False Negative 0%)
- **상태 전환 정확도**: 100% (무효한 전환 0건)

### 허용 불가 오류

- 금액/수량 계산 오류
- 개인정보 암호화 실패
- 권한 없는 접근 허용
- 주문 상태 불일치
- 데이터 손실

---

## 정확도 모니터링

### 프로덕션 모니터링

```typescript
// lib/accuracy-monitor.ts
export async function monitorDataAccuracy() {
  // 1. 데이터 일관성 체크
  const inconsistencies = await checkDataConsistency()

  if (inconsistencies.length > 0) {
    await alertTeam('데이터 불일치 발견', inconsistencies)
  }

  // 2. 계산 정확도 샘플링
  const calculationErrors = await validateCalculations()

  if (calculationErrors.length > 0) {
    await alertTeam('계산 오류 발견', calculationErrors)
  }
}

// 크론 작업으로 매일 실행
```

---

## 요약

정확도 테스트는 **비즈니스 신뢰성의 핵심**입니다.

### 핵심 원칙
1. **100% 정확도 목표**: 오차 허용 범위 없음
2. **자동화된 검증**: 모든 배포 전 자동 테스트 실행
3. **지속적인 모니터링**: 프로덕션 환경에서도 정확도 추적
4. **빠른 대응**: 정확도 이슈 발견 시 즉시 수정

정확도 테스트를 통해 사용자는 시스템을 신뢰하고 안심하고 사용할 수 있습니다.
