/** @type {import('next').NextConfig} */
const nextConfig = {
  // 보안 헤더 설정
  async headers() {
    return [
      {
        // 모든 라우트에 적용
        source: '/(.*)',
        headers: [
          {
            // MIME 타입 스니핑 방지
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // 클릭재킹 방지
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            // XSS 필터 활성화
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            // Referrer 정보 제한
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // DNS 프리페치 제어
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            // HTTPS 강제 (프로덕션용)
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            // 권한 정책
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // API 라우트에 추가 헤더
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
