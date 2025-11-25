# 개발 로드맵

## 프로젝트 개요

- **개발 방식**: TDD (Test-Driven Development)
- **배포 전략**: CI/CD 자동화
- **목표**: MVP 빠른 출시 → 사용자 피드백 → 기능 확장

---

## Phase 1: 프로젝트 초기 설정 (1-2일)

### 목표
개발 환경 구축 및 프로젝트 기반 설정

### 작업 내용

#### 1. Next.js 프로젝트 생성
- [ ] Next.js 14+ 프로젝트 초기화
- [ ] TypeScript 설정
- [ ] Tailwind CSS 설정
- [ ] 프로젝트 구조 설정

```bash
npx create-next-app@latest webOrder --typescript --tailwind --app
```

#### 2. 데이터베이스 설정
- [ ] Prisma 설치 및 설정
- [ ] PostgreSQL 연결 (Vercel Postgres 또는 Supabase)
- [ ] 스키마 정의 및 마이그레이션

```bash
npm install prisma @prisma/client
npx prisma init
npx prisma migrate dev --name init
```

#### 3. 인증 시스템 설정
- [ ] NextAuth.js 설치
- [ ] OAuth 프로바이더 설정 (Google, Kakao, Naver)
- [ ] 세션 관리 설정

```bash
npm install next-auth @auth/prisma-adapter
```

#### 4. 테스트 환경 구축
- [ ] Vitest 설치 및 설정
- [ ] Playwright 설치 및 설정
- [ ] React Testing Library 설정
- [ ] MSW (Mock Service Worker) 설정
- [ ] 정확도 테스트 디렉토리 구조 생성

```bash
npm install -D vitest @vitest/ui
npm install -D @playwright/test
npm install -D @testing-library/react @testing-library/jest-dom
npm install -D msw
mkdir -p tests/accuracy
```

#### 5. 코드 품질 도구 설정
- [ ] ESLint 설정
- [ ] Prettier 설정
- [ ] Husky + lint-staged 설정

```bash
npm install -D eslint prettier
npm install -D husky lint-staged
npx husky install
```

#### 6. Git 및 GitHub 설정
- [ ] .gitignore 설정
- [ ] README.md 작성
- [ ] 첫 커밋 및 푸시

---

## Phase 2: 인증 시스템 구현 (2-3일)

### 목표
공급자(발주자) 회원가입 및 로그인 구현

### TDD 사이클

#### Test 1: 소셜 로그인 (Google)
```typescript
// tests/auth/google-login.test.ts
describe('Google 로그인', () => {
  it('Google OAuth 리다이렉트', async () => {
    const response = await request(app).get('/api/auth/signin/google')
    expect(response.status).toBe(302)
    expect(response.headers.location).toContain('google.com')
  })

  it('인증 후 사용자 정보 저장', async () => {
    // Mock OAuth callback
    const user = await prisma.user.findUnique({
      where: { email: 'test@gmail.com' }
    })
    expect(user).toBeTruthy()
    expect(user.name).toBe('Test User')
  })
})
```

#### 작업 내용
- [ ] NextAuth.js 설정 파일 작성
- [ ] Google OAuth 연동
- [ ] Kakao OAuth 연동
- [ ] Naver OAuth 연동
- [ ] 세션 관리 구현
- [ ] 로그인/로그아웃 UI
- [ ] 프로필 정보 저장

#### Test 2: 프로필 관리
```typescript
describe('프로필 관리', () => {
  it('프로필 조회', async () => {
    const response = await authenticatedRequest
      .get('/api/user/profile')

    expect(response.status).toBe(200)
    expect(response.body.data.email).toBe('test@gmail.com')
  })

  it('프로필 수정', async () => {
    const response = await authenticatedRequest
      .patch('/api/user/profile')
      .send({ phone: '010-1234-5678' })

    expect(response.status).toBe(200)
  })

  it('인증 없이 프로필 조회 불가', async () => {
    const response = await request(app).get('/api/user/profile')
    expect(response.status).toBe(401)
  })
})
```

---

## Phase 3: 주문서 작성 기능 (3-4일)

### 목표
주문서 생성, 수정, 조회 기능 구현

### TDD 사이클

#### Test 1: 주문서 생성
```typescript
describe('주문서 생성', () => {
  it('주문서 생성 성공', async () => {
    const orderData = {
      recipientName: '김철수',
      recipientBusinessName: '김철수 마트',
      recipientPhone1: '010-9876-5432',
      deliveryDate: '2025-02-01',
      items: [
        { itemName: '사과', quantity: 10, unit: '박스' }
      ]
    }

    const response = await authenticatedRequest
      .post('/api/orders')
      .send(orderData)

    expect(response.status).toBe(201)
    expect(response.body.data.orderNumber).toMatch(/^ORD-/)
    expect(response.body.data.token).toBeTruthy()
    expect(response.body.data.url).toContain('/order/')
  })

  it('필수 필드 누락 시 실패', async () => {
    const response = await authenticatedRequest
      .post('/api/orders')
      .send({ recipientName: '김철수' })

    expect(response.status).toBe(422)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('품목 없이 생성 불가', async () => {
    const orderData = {
      recipientName: '김철수',
      items: []
    }

    const response = await authenticatedRequest
      .post('/api/orders')
      .send(orderData)

    expect(response.status).toBe(422)
  })
})
```

#### 작업 내용
- [ ] 주문서 생성 API
- [ ] 주문서 생성 UI (폼)
- [ ] 품목 동적 추가/삭제
- [ ] 입력값 검증 (Zod)
- [ ] URL 토큰 생성
- [ ] 본인 인증 코드 생성 (핸드폰 뒷자리 해싱)

#### Test 2: 주문서 목록 조회
```typescript
describe('주문서 목록', () => {
  it('내 주문서 목록 조회', async () => {
    const response = await authenticatedRequest
      .get('/api/orders')

    expect(response.status).toBe(200)
    expect(response.body.data.orders).toBeInstanceOf(Array)
    expect(response.body.data.pagination.total).toBeGreaterThan(0)
  })

  it('상태별 필터링', async () => {
    const response = await authenticatedRequest
      .get('/api/orders?status=SENT')

    expect(response.status).toBe(200)
    expect(response.body.data.orders.every(o => o.status === 'SENT')).toBe(true)
  })

  it('페이지네이션', async () => {
    const response = await authenticatedRequest
      .get('/api/orders?page=1&limit=10')

    expect(response.status).toBe(200)
    expect(response.body.data.orders.length).toBeLessThanOrEqual(10)
  })
})
```

#### Test 3: 주문서 상세 조회
```typescript
describe('주문서 상세', () => {
  it('주문서 상세 조회', async () => {
    const response = await authenticatedRequest
      .get(`/api/orders/${orderId}`)

    expect(response.status).toBe(200)
    expect(response.body.data.items).toBeInstanceOf(Array)
    expect(response.body.data.histories).toBeInstanceOf(Array)
  })

  it('다른 사용자 주문서 조회 불가', async () => {
    const response = await otherUserRequest
      .get(`/api/orders/${orderId}`)

    expect(response.status).toBe(403)
  })
})
```

---

## Phase 4: 공급받는자 기능 (2-3일)

### 목표
URL 접근, 본인 인증, 상태 변경 기능 구현

### TDD 사이클

#### Test 1: 주문서 조회 (공개)
```typescript
describe('공급받는자 주문서 조회', () => {
  it('유효한 토큰으로 조회', async () => {
    const response = await request(app)
      .get(`/api/public/orders/${token}`)

    expect(response.status).toBe(200)
    expect(response.body.data.requiresVerification).toBe(true)
  })

  it('만료된 토큰 조회 불가', async () => {
    const response = await request(app)
      .get(`/api/public/orders/${expiredToken}`)

    expect(response.status).toBe(404)
  })

  it('존재하지 않는 토큰', async () => {
    const response = await request(app)
      .get(`/api/public/orders/invalid-token`)

    expect(response.status).toBe(404)
  })
})
```

#### Test 2: 본인 인증
```typescript
describe('본인 인증', () => {
  it('올바른 인증 코드', async () => {
    const response = await request(app)
      .post(`/api/public/orders/${token}/verify`)
      .send({ verificationCode: '5432' })

    expect(response.status).toBe(200)
    expect(response.body.data.verified).toBe(true)
    expect(response.body.data.sessionToken).toBeTruthy()
  })

  it('잘못된 인증 코드', async () => {
    const response = await request(app)
      .post(`/api/public/orders/${token}/verify`)
      .send({ verificationCode: '0000' })

    expect(response.status).toBe(401)
  })

  it('인증 시도 횟수 제한', async () => {
    // 5회 실패
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post(`/api/public/orders/${token}/verify`)
        .send({ verificationCode: '0000' })
    }

    // 6번째 시도
    const response = await request(app)
      .post(`/api/public/orders/${token}/verify`)
      .send({ verificationCode: '5432' })

    expect(response.status).toBe(429)
  })
})
```

#### Test 3: 상태 변경
```typescript
describe('주문 상태 변경', () => {
  it('수락 처리', async () => {
    const response = await request(app)
      .post(`/api/public/orders/${token}/status`)
      .set('X-Verification-Token', verificationToken)
      .send({ status: 'ACCEPTED' })

    expect(response.status).toBe(200)
    expect(response.body.data.status).toBe('ACCEPTED')
  })

  it('반려 처리 (사유 포함)', async () => {
    const response = await request(app)
      .post(`/api/public/orders/${token}/status`)
      .set('X-Verification-Token', verificationToken)
      .send({
        status: 'REJECTED',
        reason: '재고 부족'
      })

    expect(response.status).toBe(200)
    expect(response.body.data.status).toBe('REJECTED')
  })

  it('인증 없이 상태 변경 불가', async () => {
    const response = await request(app)
      .post(`/api/public/orders/${token}/status`)
      .send({ status: 'ACCEPTED' })

    expect(response.status).toBe(401)
  })
})
```

#### 작업 내용
- [ ] 공개 주문서 조회 API
- [ ] 본인 인증 API
- [ ] 상태 변경 API
- [ ] 주문서 조회 UI (공급받는자용)
- [ ] 본인 인증 UI
- [ ] 상태 변경 UI
- [ ] Rate Limiting 적용

---

## Phase 5: 편의 기능 구현 (2-3일)

### 목표
도착지 저장, 최근 품목 불러오기, 대시보드

### 작업 내용

#### 1. 도착지 관리
- [ ] 도착지 저장 API
- [ ] 도착지 목록 조회 API
- [ ] 도착지 수정/삭제 API
- [ ] 도착지 선택 UI
- [ ] 즐겨찾기 기능

#### 2. 최근 품목
- [ ] 최근 품목 자동 저장
- [ ] 최근 품목 조회 API
- [ ] 자동완성 UI

#### 3. 대시보드
- [ ] 통계 API
- [ ] 진행 중인 주문 표시
- [ ] 만료 임박 주문 알림
- [ ] 차트 및 그래프

---

## Phase 6: 알림 기능 (2-3일)

### 목표
카카오톡 알림 연동

### 작업 내용
- [ ] 카카오톡 비즈니스 API 연동
- [ ] 알림 템플릿 작성
- [ ] 상태 변경 시 알림 발송
- [ ] 만료 임박 알림 (크론 작업)
- [ ] 알림 실패 시 재시도 로직

---

## Phase 7: 보안 강화 (1-2일)

### 목표
OWASP Top 10 대응 및 보안 테스트

### 작업 내용
- [ ] 입력값 검증 강화
- [ ] Rate Limiting 세분화
- [ ] 보안 헤더 설정
- [ ] CORS 설정
- [ ] 암호화 구현 (민감정보)
- [ ] 보안 테스트 (OWASP ZAP)
- [ ] 침투 테스트

---

## Phase 8: CI/CD 및 배포 (1-2일)

### 목표
자동화된 배포 파이프라인 구축

### 작업 내용

#### 1. GitHub Actions 워크플로우
```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Unit tests
        run: npm test

      - name: E2E tests
        run: npm run test:e2e

      - name: Security audit
        run: npm audit --audit-level=moderate

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

#### 2. Vercel 배포
- [ ] Vercel 프로젝트 생성
- [ ] 환경변수 설정
- [ ] 도메인 연결
- [ ] 프리뷰 배포 설정

#### 3. 모니터링
- [ ] Sentry 통합
- [ ] Vercel Analytics 활성화
- [ ] 에러 알림 설정

---

## Phase 9: MVP 출시 (1일)

### 목표
첫 배포 및 사용자 피드백 수집

### 작업 내용
- [ ] 프로덕션 배포
- [ ] 사용자 매뉴얼 작성
- [ ] 개인정보처리방침 작성
- [ ] 이용약관 작성
- [ ] 베타 테스터 모집
- [ ] 피드백 수집 채널 오픈

---

## Phase 10: 피드백 반영 및 개선 (지속)

### 목표
사용자 피드백 기반 개선

### 예상 개선사항
- [ ] UI/UX 개선
- [ ] 성능 최적화
- [ ] 추가 기능 구현
- [ ] 버그 수정

---

## Phase 11: 고급 기능 (Phase 2)

### 주문서 템플릿
- [ ] 템플릿 저장/불러오기
- [ ] 템플릿 기반 주문서 생성

### 엑셀 내보내기
- [ ] 주문서 엑셀 다운로드
- [ ] 통계 엑셀 다운로드

### 일괄 주문서 생성
- [ ] 엑셀 업로드로 여러 주문서 생성
- [ ] CSV 임포트

### 첨부파일
- [ ] 이미지 첨부
- [ ] PDF 첨부

### 모바일 앱
- [ ] React Native 앱 개발
- [ ] 푸시 알림

---

## 예상 일정 (총 15-20일)

| Phase | 일정 | 상태 |
|-------|------|------|
| Phase 1: 프로젝트 초기 설정 | 1-2일 | ⏳ 대기 |
| Phase 2: 인증 시스템 | 2-3일 | ⏳ 대기 |
| Phase 3: 주문서 작성 | 3-4일 | ⏳ 대기 |
| Phase 4: 공급받는자 기능 | 2-3일 | ⏳ 대기 |
| Phase 5: 편의 기능 | 2-3일 | ⏳ 대기 |
| Phase 6: 알림 기능 | 2-3일 | ⏳ 대기 |
| Phase 7: 보안 강화 | 1-2일 | ⏳ 대기 |
| Phase 8: CI/CD 및 배포 | 1-2일 | ⏳ 대기 |
| Phase 9: MVP 출시 | 1일 | ⏳ 대기 |
| Phase 10: 피드백 반영 | 지속 | ⏳ 대기 |

---

## TDD 개발 프로세스

모든 기능은 다음 순서로 개발:

1. **Red**: 실패하는 테스트 작성
2. **Green**: 테스트를 통과하는 최소한의 코드 작성
3. **Refactor**: 코드 리팩토링 및 최적화

```
┌─────────────┐
│  Write Test │
│   (Red)     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Write Code │
│   (Green)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Refactor   │
└──────┬──────┘
       │
       └──────► Repeat
```

---

## 성공 지표 (KPI)

### MVP 출시 후 1개월
- [ ] 가입자 수: 50명
- [ ] 주문서 생성 수: 200건
- [ ] 주문 수락률: 80% 이상
- [ ] 버그 리포트: 5건 이하
- [ ] 평균 응답 시간: 200ms 이하

### 3개월 후
- [ ] 가입자 수: 200명
- [ ] 월간 활성 사용자: 100명
- [ ] 주문서 생성 수: 1,000건
- [ ] 사용자 만족도: 4.5/5 이상

---

## 리스크 관리

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|-----------|
| 카카오톡 API 연동 지연 | 중 | Phase 2로 미루고 이메일 알림 우선 |
| 데이터베이스 성능 이슈 | 높음 | 인덱싱 최적화, 캐싱 적용 |
| 보안 취약점 발견 | 높음 | 즉시 패치, 보안 테스트 강화 |
| OAuth 제공자 장애 | 중 | 다중 OAuth 제공자 지원 |
| 사용자 피드백 부정적 | 중 | 빠른 개선 및 커뮤니케이션 |

---

## 다음 단계

현재 완료된 작업:
- ✅ 개발문서 작성
- ✅ Git 저장소 생성

다음 작업:
- [ ] Phase 1 시작: 프로젝트 초기 설정

프로젝트를 시작하시겠습니까?
