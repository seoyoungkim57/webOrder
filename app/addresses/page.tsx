'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SavedAddress {
  id: string
  nickname: string
  address: string
  addressDetail: string | null
  isDefault: boolean
  usageCount: number
  lastUsedAt: string | null
}

export default function AddressesPage() {
  const { status } = useSession()
  const router = useRouter()
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAddresses()
    }
  }, [status])

  const fetchAddresses = async (searchQuery?: string) => {
    try {
      const url = searchQuery
        ? `/api/addresses?search=${encodeURIComponent(searchQuery)}`
        : '/api/addresses'
      const response = await fetch(url)
      const data = await response.json()
      if (response.ok) {
        setAddresses(data.addresses)
      }
    } catch (error) {
      console.error('배송지 주소 목록 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    fetchAddresses(search)
  }

  const handleDelete = async (id: string, nickname: string) => {
    if (!confirm(`"${nickname}" 배송지 주소를 삭제하시겠습니까?`)) return

    setDeleting(id)
    try {
      const response = await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== id))
      }
    } catch (error) {
      console.error('삭제 실패:', error)
    } finally {
      setDeleting(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <nav className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                webOrder
              </Link>
            </div>
            <div className="flex items-center">
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                대시보드
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          {/* 헤더 */}
          <div className="p-6 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-2xl font-bold text-gray-900">배송지 주소 관리</h1>
              <Link
                href="/addresses/new"
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                배송지 등록
              </Link>
            </div>

            {/* 검색 */}
            <form onSubmit={handleSearch} className="mt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="별칭, 주소로 검색"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  검색
                </button>
              </div>
            </form>
          </div>

          {/* 목록 */}
          <div className="divide-y">
            {addresses.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                {search ? (
                  <p>검색 결과가 없습니다.</p>
                ) : (
                  <>
                    <p className="mb-4">등록된 배송지 주소가 없습니다.</p>
                    <Link
                      href="/addresses/new"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      첫 배송지 주소를 등록해보세요
                    </Link>
                  </>
                )}
              </div>
            ) : (
              addresses.map((address) => (
                <div
                  key={address.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {address.nickname}
                        </span>
                        {address.isDefault && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                            기본
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {address.address}
                        {address.addressDetail && (
                          <span className="text-gray-500 ml-1">
                            {address.addressDetail}
                          </span>
                        )}
                      </div>
                      {address.usageCount > 0 && (
                        <div className="text-xs text-gray-400 mt-2">
                          {address.usageCount}회 사용
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Link
                        href={`/addresses/${address.id}/edit`}
                        className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        수정
                      </Link>
                      <button
                        onClick={() => handleDelete(address.id, address.nickname)}
                        disabled={deleting === address.id}
                        className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deleting === address.id ? '삭제 중...' : '삭제'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
