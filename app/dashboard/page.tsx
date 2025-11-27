'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">webOrder</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {session.user?.name || session.user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              환영합니다!
            </h2>
            <p className="text-gray-600 mb-6">
              webOrder 대시보드입니다. 여기서 주문을 생성하고 관리할 수 있습니다.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-blue-900">새 주문 생성</h3>
                <p className="mt-2 text-sm text-blue-700">
                  거래처에 보낼 새로운 주문을 생성합니다.
                </p>
                <Link
                  href="/orders/new"
                  className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                >
                  주문 생성
                </Link>
              </div>

              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-green-900">주문 목록</h3>
                <p className="mt-2 text-sm text-green-700">
                  생성한 주문들을 확인하고 관리합니다.
                </p>
                <Link
                  href="/orders"
                  className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors"
                >
                  목록 보기
                </Link>
              </div>

              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-purple-900">거래처 관리</h3>
                <p className="mt-2 text-sm text-purple-700">
                  자주 거래하는 거래처를 관리합니다.
                </p>
                <Link
                  href="/destinations"
                  className="mt-4 inline-block px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 transition-colors"
                >
                  관리하기
                </Link>
              </div>

              <div className="bg-orange-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-orange-900">배송지 주소 관리</h3>
                <p className="mt-2 text-sm text-orange-700">
                  자주 사용하는 배송지 주소를 관리합니다.
                </p>
                <Link
                  href="/addresses"
                  className="mt-4 inline-block px-4 py-2 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700 transition-colors"
                >
                  관리하기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
