# 기술 스택

## 선정 기준
- ✅ 유지보수 용이성
- ✅ 클린 코드 작성 가능
- ✅ 웹 취약점 및 보안 대응
- ✅ 모던 웹 기반
- ✅ 클라우드 CI/CD 지원
- ✅ TDD 방식 개발 가능

---

## 프론트엔드

### Next.js 14+ (App Router)
**선정 이유:**
- React 기반으로 컴포넌트 재사용성 높음
- SSR/SSG로 SEO 최적화 및 초기 로딩 속도 개선
- API Routes로 백엔드 통합 가능
- 파일 기반 라우팅으로 직관적인 구조
- 내장 이미지 최적화
- TypeScript 완벽 지원

**보안 기능:**
- CSRF 보호 기본 제공
- XSS 방어 (자동 이스케이프)
- Content Security Policy 설정 가능

### TypeScript
**선정 이유:**
- 타입 안전성으로 런타임 에러 사전 방지
- IDE 자동완성으로 개발 생산성 향상
- 리팩토링 시 안전성 보장
- 대규모 프로젝트 유지보수 용이

### Tailwind CSS
**선정 이유:**
- 유틸리티 기반으로 일관된 디자인 시스템 구축
- 빠른 프로토타이핑
- 사용하지 않는 CSS 자동 제거 (PurgeCSS)
- 반응형 디자인 쉬움
- 커스터마이징 용이

### React Hook Form + Zod
**선정 이유:**
- 타입 안전한 폼 검증
- 성능 최적화 (불필요한 리렌더링 방지)
- 입력값 검증으로 보안 강화
- 직관적인 API

---

## 백엔드

### Next.js API Routes
**선정 이유:**
- 프론트엔드와 완벽한 통합
- 서버리스 함수로 배포 간편
- TypeScript 타입 공유
- 간단한 API 구현에 최적

**대안:** 복잡한 비즈니스 로직이 필요한 경우 Nest.js 고려

### Node.js Runtime
**선정 이유:**
- 대규모 커뮤니티 및 라이브러리
- JavaScript/TypeScript 생태계 통합
- 비동기 처리 최적화
- 빠른 개발 속도

---

## 데이터베이스

### PostgreSQL
**선정 이유:**
- 오픈소스이면서 엔터프라이즈급 성능
- ACID 트랜잭션 지원
- JSON 데이터 타입 지원
- 복잡한 쿼리 및 인덱싱
- 확장성 및 안정성

### Prisma ORM
**선정 이유:**
- TypeScript 타입 안전성
- 직관적인 스키마 정의
- 자동 마이그레이션 관리
- SQL Injection 자동 방어
- 쿼리 최적화 및 성능 모니터링
- VS Code 확장으로 자동완성

**주요 기능:**
```prisma
// 타입 안전한 쿼리
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: { orders: true }
})
```

---

## 인증 및 권한

### NextAuth.js (Auth.js v5)
**선정 이유:**
- Next.js와 완벽한 통합
- 소셜 로그인 쉬운 구현 (Google, Kakao, Naver)
- JWT 및 세션 관리
- CSRF 토큰 자동 처리
- 보안 베스트 프랙티스 내장

**지원하는 인증 방식:**
- OAuth 2.0 (Google, Kakao, Naver)
- 이메일/비밀번호
- Magic Link

---

## 테스팅 (TDD)

### Vitest
**선정 이유:**
- Vite 기반으로 매우 빠름
- Jest 호환 API
- TypeScript 네이티브 지원
- 모던한 개발 경험

**사용:**
- 유닛 테스트
- 통합 테스트
- API 테스트
- 정확도 테스트

### Playwright
**선정 이유:**
- 크로스 브라우저 테스트
- 안정적인 E2E 테스트
- 자동 대기 및 재시도
- 스크린샷 및 비디오 녹화

**사용:**
- E2E 테스트
- 사용자 시나리오 테스트

### React Testing Library
**선정 이유:**
- 사용자 중심 테스트
- 구현 세부사항이 아닌 동작 테스트
- React 커뮤니티 표준

**사용:**
- 컴포넌트 테스트
- 사용자 상호작용 테스트

### MSW (Mock Service Worker)
**선정 이유:**
- API 모킹
- 네트워크 레벨에서 요청 가로채기
- 개발 환경과 테스트 환경 모두 사용 가능

---

## 보안

### 보안 라이브러리

#### helmet
- HTTP 헤더 보안 설정
- XSS 방어
- 클릭재킹 방지
- MIME 타입 스니핑 방지

#### bcrypt
- 비밀번호 해싱
- Salt 자동 생성
- 타이밍 공격 방지

#### express-rate-limit (또는 next-rate-limit)
- API 요청 제한
- DDoS 방어
- 무차별 대입 공격 방지

### 환경변수 관리
- `.env.local` 파일로 관리
- 민감 정보 Git 제외
- Vercel/AWS Secrets Manager 사용

---

## CI/CD 및 클라우드

### Vercel (추천)
**선정 이유:**
- Next.js 최적화
- 자동 CI/CD
- 무료 티어 제공
- 간단한 배포
- 프리뷰 배포 (PR별)
- Edge Functions 지원

**자동화:**
- Git push 시 자동 배포
- PR 생성 시 프리뷰 환경 생성
- 환경변수 관리

### GitHub Actions
**선정 이유:**
- GitHub 네이티브 통합
- 무료 티어 (Public repo)
- 유연한 워크플로우 설정

**워크플로우:**
```yaml
name: CI/CD
on: [push, pull_request]
jobs:
  test:
    - 린트 체크
    - 타입 체크
    - 유닛 테스트
    - E2E 테스트
  deploy:
    - Vercel 자동 배포
```

### 대안: AWS
**장점:**
- 더 많은 제어권
- 복잡한 인프라 구성 가능
- 데이터베이스 관리 (RDS)

**서비스:**
- AWS Amplify (프론트엔드)
- AWS ECS/Fargate (컨테이너)
- AWS RDS (PostgreSQL)
- AWS S3 (정적 파일)
- AWS CloudFront (CDN)

---

## 코드 품질

### ESLint
**선정 이유:**
- JavaScript/TypeScript 린팅
- 코드 스타일 일관성
- 잠재적 버그 사전 발견

**설정:**
- Next.js 권장 설정
- TypeScript 규칙
- React Hooks 규칙
- 접근성 규칙

### Prettier
**선정 이유:**
- 코드 포맷팅 자동화
- 일관된 코드 스타일
- ESLint와 통합

### Husky + lint-staged
**선정 이유:**
- Git hooks 관리
- 커밋 전 자동 린트 및 테스트
- 불량 코드 커밋 방지

**설정:**
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm test"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

---

## 모니터링 및 로깅

### Sentry
**선정 이유:**
- 실시간 에러 트래킹
- 에러 알림
- 성능 모니터링
- 사용자 피드백 수집

### Vercel Analytics
**선정 이유:**
- 실시간 성능 모니터링
- Web Vitals 추적
- 무료 (Vercel 사용 시)

---

## 알림 및 메시징

### 카카오톡 비즈니스 API
**선정 이유:**
- 한국 사용자에게 익숙
- 높은 메시지 도달률
- 템플릿 기반 메시지

**대안:**
- Twilio (SMS)
- SendGrid (이메일)

---

## 아키텍처 다이어그램

```
┌─────────────────────────────────────────────┐
│           클라이언트 (Browser)                │
│        Next.js 14 (App Router)              │
│   React + TypeScript + Tailwind CSS        │
└──────────────────┬──────────────────────────┘
                   │
                   │ HTTPS
                   │
┌──────────────────▼──────────────────────────┐
│              Vercel (Edge)                  │
│         Next.js API Routes                  │
│          NextAuth.js                        │
└──────────────────┬──────────────────────────┘
                   │
                   │ Prisma Client
                   │
┌──────────────────▼──────────────────────────┐
│         PostgreSQL (Vercel/Supabase)        │
│              Prisma ORM                     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│          외부 서비스                         │
├─────────────────────────────────────────────┤
│  • 카카오 로그인 (OAuth)                     │
│  • 구글 로그인 (OAuth)                       │
│  • 네이버 로그인 (OAuth)                     │
│  • 카카오톡 알림 API                         │
│  • Sentry (에러 트래킹)                      │
└─────────────────────────────────────────────┘
```

---

## 패키지 버전 (예상)

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "typescript": "^5.4.0",
    "@prisma/client": "^5.11.0",
    "next-auth": "^5.0.0",
    "zod": "^3.22.0",
    "react-hook-form": "^7.51.0",
    "@hookform/resolvers": "^3.3.0",
    "bcrypt": "^5.1.0"
  },
  "devDependencies": {
    "prisma": "^5.11.0",
    "vitest": "^1.4.0",
    "playwright": "^1.42.0",
    "@testing-library/react": "^14.2.0",
    "msw": "^2.2.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.2.0",
    "@sentry/nextjs": "^7.100.0"
  }
}
```

---

## 개발 환경

### 필수 설치
- Node.js 20+ (LTS)
- npm 또는 pnpm
- Git
- VS Code (권장)

### VS Code 확장 (권장)
- ESLint
- Prettier
- Prisma
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features

---

## 데이터베이스 호스팅 옵션

### 1. Vercel Postgres (권장 - MVP)
- Next.js 완벽 통합
- 무료 티어 제공
- 자동 백업
- 간편한 설정

### 2. Supabase
- PostgreSQL + 추가 기능
- 무료 티어 넉넉함
- 실시간 기능
- Storage 포함

### 3. AWS RDS
- 프로덕션급 안정성
- 완전 관리형
- 자동 백업 및 복구
- 확장성

---

## 성능 최적화

### 프론트엔드
- Next.js Image 최적화
- 코드 스플리팅 (자동)
- 동적 임포트
- 서버 컴포넌트 활용

### 백엔드
- Prisma 쿼리 최적화
- 데이터베이스 인덱싱
- API 응답 캐싱
- Edge Functions 활용

### 네트워크
- CDN (Vercel/CloudFront)
- Gzip/Brotli 압축
- HTTP/2 지원
