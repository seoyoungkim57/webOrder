# webOrder

소상공인·소기업을 위한 웹 기반 주문 관리 시스템

## 🎯 프로젝트 개요

전화 메모나 카카오톡/문자 기반의 비체계적인 주문 관리를 개선하기 위한 웹 애플리케이션입니다.

### 핵심 기능
- ✅ 공급자(발주자): 간편 로그인 → 주문서 작성 → URL 공유
- ✅ 공급받는자(수주자): URL 접근 → 본인 인증 → 상태 변경 (반려/검토중/수락)
- ✅ 체계적인 주문 히스토리 관리

## 🛠️ 기술 스택

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js (OAuth 2.0)
- **Testing**: Vitest, Playwright, React Testing Library
- **CI/CD**: GitHub Actions, Vercel

## 📚 문서

상세한 개발 문서는 [docs](./docs) 디렉토리에서 확인하세요:

- [프로젝트 개요](./docs/README.md) - 요구사항 및 기능 명세
- [기술 스택](./docs/TECH_STACK.md) - 사용 기술 상세 설명
- [데이터베이스 스키마](./docs/DATABASE_SCHEMA.md) - ERD 및 테이블 설계
- [API 명세서](./docs/API_SPEC.md) - REST API 엔드포인트
- [보안 요구사항](./docs/SECURITY.md) - OWASP Top 10 대응
- [개발 로드맵](./docs/ROADMAP.md) - Phase별 개발 계획
- [정확도 테스트](./docs/ACCURACY_TEST.md) - 정확도 테스트 가이드

## 🚀 시작하기

```bash
# 저장소 클론
git clone https://github.com/seoyoungkim57/webOrder.git
cd webOrder

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local

# 데이터베이스 마이그레이션
npx prisma migrate dev

# 개발 서버 실행
npm run dev
```

## 🧪 테스트

```bash
# 유닛 테스트
npm test

# E2E 테스트
npm run test:e2e

# 정확도 테스트
npm run test:accuracy

# 전체 테스트 (커버리지 포함)
npm run test:all
```

## 📝 개발 방식

- **TDD (Test-Driven Development)**: 테스트 우선 개발
- **Clean Code**: 가독성과 유지보수성 중심
- **Security First**: OWASP Top 10 대응

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License

## 👤 작성자

**seoyoungkim57**

- GitHub: [@seoyoungkim57](https://github.com/seoyoungkim57)
- Email: seoyoungkim57@gmail.com

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
