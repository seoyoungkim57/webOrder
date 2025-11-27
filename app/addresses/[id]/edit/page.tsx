'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import AddressSearch from '@/components/AddressSearch'

export default function EditAddressPage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const addressId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    nickname: '',
    address: '',
    addressDetail: '',
    isDefault: false,
  })

  useEffect(() => {
    if (status === 'authenticated' && addressId) {
      fetchAddress()
    }
  }, [status, addressId])

  const fetchAddress = async () => {
    try {
      const response = await fetch(`/api/addresses/${addressId}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '배송지 주소를 불러올 수 없습니다.')
        return
      }

      const address = data.address
      setFormData({
        nickname: address.nickname,
        address: address.address,
        addressDetail: address.addressDetail || '',
        isDefault: address.isDefault,
      })
    } catch (err) {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setError('')
  }

  const handleAddressSelect = (address: string) => {
    setFormData((prev) => ({ ...prev, address }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '배송지 주소 수정에 실패했습니다.')
        setSaving(false)
        return
      }

      router.push('/addresses')
    } catch (err) {
      setError('서버 오류가 발생했습니다.')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                webOrder
              </Link>
            </div>
            <div className="flex items-center">
              <Link href="/addresses" className="text-sm text-gray-600 hover:text-gray-900">
                배송지 목록
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">배송지 주소 수정</h1>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* 별칭 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  별칭 * <span className="text-xs text-gray-400">(구분하기 쉬운 이름)</span>
                </label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 본사, 강남 물류센터, 부산지점"
                />
              </div>

              {/* 주소 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  주소 *
                </label>
                <AddressSearch
                  value={formData.address}
                  onSelect={handleAddressSelect}
                  placeholder="클릭하여 주소 검색"
                />
              </div>

              {/* 상세주소 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상세주소
                </label>
                <input
                  type="text"
                  name="addressDetail"
                  value={formData.addressDetail}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="동/호수, 층 등"
                />
              </div>

              {/* 기본 주소 설정 */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isDefault"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                  기본 배송지로 설정
                </label>
              </div>
            </div>

            {/* 버튼 */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-end">
              <Link
                href="/addresses"
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors text-center"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
