import type { Metadata, Viewport } from 'next'
import './globals.css'
import Providers from './providers'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export const metadata: Metadata = {
  title: 'webOrder - 주문 관리 시스템',
  description: '소상공인·소기업을 위한 웹 기반 주문 관리 시스템',
  keywords: ['주문관리', '발주', '수주', '소상공인', '주문시스템'],
  authors: [{ name: 'webOrder' }],
  formatDetection: {
    telephone: true,
    email: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'webOrder',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
