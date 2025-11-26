'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ORDER_STATUS } from '@/lib/utils'

interface OrderItem {
  id: string
  itemCode: string | null
  itemName: string
  itemSpec: string | null
  quantity: number
  unit: string
}

interface OrderHistory {
  id: string
  status: string
  reason: string | null
  changedBy: string
  createdAt: string
}

interface Order {
  id: string
  orderNumber: string
  recipientName: string
  recipientBusinessName: string
  recipientBusinessNumber: string | null
  recipientPhone1: string
  recipientPhone2: string | null
  recipientAddress: string
  recipientAddressDetail: string | null
  deliveryDate: string
  deliveryTime: string | null
  memo: string | null
  status: string
  token: string
  tokenExpiresAt: string
  viewCount: number
  createdAt: string
  items: OrderItem[]
  histories: OrderHistory[]
}

export default function OrderDetailPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login')
    }
  }, [authStatus, router])

  useEffect(() => {
    if (authStatus === 'authenticated' && orderId) {
      fetchOrder()
    }
  }, [authStatus, orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orders/${orderId}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '주문을 불러올 수 없습니다.')
        return
      }

      setOrder(data.order)
    } catch (err) {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!order || order.status !== 'DRAFT') return

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SENT' }),
      })

      if (response.ok) {
        fetchOrder()
      }
    } catch (err) {
      console.error('발송 실패:', err)
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/orders')
      }
    } catch (err) {
      console.error('삭제 실패:', err)
    }
  }

  const copyShareLink = () => {
    if (!order) return
    const shareUrl = `${window.location.origin}/o/${order.token}`
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      VIEWED: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      REVIEWING: 'bg-purple-100 text-purple-800',
      CANCELLED: 'bg-gray-100 text-gray-500',
    }
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${colors[status] || 'bg-gray-100'}`}>
        {ORDER_STATUS[status as keyof typeof ORDER_STATUS] || status}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/orders" className="text-blue-600 hover:text-blue-700">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  if (!order) return null

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
              <Link href="/orders" className="text-sm text-gray-600 hover:text-gray-900">
                주문 목록
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          {/* 주문 헤더 */}
          <div className="p-6 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-xl font-bold text-gray-900">
                    주문번호: {order.orderNumber}
                  </h1>
                  {getStatusBadge(order.status)}
                </div>
                <p className="text-sm text-gray-500">
                  생성일: {formatDateTime(order.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {order.status === 'DRAFT' && (
                  <>
                    <button
                      onClick={handleSend}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                    >
                      발송하기
                    </button>
                    <Link
                      href={`/orders/${order.id}/edit`}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
                    >
                      수정
                    </Link>
                  </>
                )}
                {['SENT', 'VIEWED'].includes(order.status) && (
                  <button
                    onClick={copyShareLink}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors"
                  >
                    {copied ? '복사됨!' : '공유 링크 복사'}
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-md text-sm hover:bg-red-50 transition-colors"
                >
                  {order.status === 'DRAFT' ? '삭제' : '취소'}
                </button>
              </div>
            </div>
          </div>

          {/* 수주자 정보 */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">수주자 정보</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">업체명:</span>
                <span className="ml-2 text-gray-900">{order.recipientBusinessName}</span>
              </div>
              <div>
                <span className="text-gray-500">담당자:</span>
                <span className="ml-2 text-gray-900">{order.recipientName}</span>
              </div>
              {order.recipientBusinessNumber && (
                <div>
                  <span className="text-gray-500">사업자번호:</span>
                  <span className="ml-2 text-gray-900">{order.recipientBusinessNumber}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">연락처:</span>
                <span className="ml-2 text-gray-900">
                  {order.recipientPhone1}
                  {order.recipientPhone2 && ` / ${order.recipientPhone2}`}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-gray-500">주소:</span>
                <span className="ml-2 text-gray-900">
                  {order.recipientAddress}
                  {order.recipientAddressDetail && ` ${order.recipientAddressDetail}`}
                </span>
              </div>
            </div>
          </div>

          {/* 배송 정보 */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">배송 정보</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">희망 배송일:</span>
                <span className="ml-2 text-gray-900">{formatDate(order.deliveryDate)}</span>
              </div>
              {order.deliveryTime && (
                <div>
                  <span className="text-gray-500">희망 배송시간:</span>
                  <span className="ml-2 text-gray-900">{order.deliveryTime}</span>
                </div>
              )}
              {order.memo && (
                <div className="sm:col-span-2">
                  <span className="text-gray-500">메모:</span>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{order.memo}</p>
                </div>
              )}
            </div>
          </div>

          {/* 품목 목록 */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">주문 품목</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      품목코드
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      품목명
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      규격
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      수량
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      단위
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {item.itemCode || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.itemName}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {item.itemSpec || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {Number(item.quantity).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 공유 정보 */}
          {order.status !== 'DRAFT' && (
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">공유 정보</h2>
              <div className="text-sm space-y-2">
                <div>
                  <span className="text-gray-500">공유 링크:</span>
                  <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs break-all">
                    {`${typeof window !== 'undefined' ? window.location.origin : ''}/o/${order.token}`}
                  </code>
                </div>
                <div>
                  <span className="text-gray-500">만료일:</span>
                  <span className="ml-2 text-gray-900">{formatDate(order.tokenExpiresAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500">조회수:</span>
                  <span className="ml-2 text-gray-900">{order.viewCount}회</span>
                </div>
              </div>
            </div>
          )}

          {/* 이력 */}
          {order.histories.length > 0 && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">주문 이력</h2>
              <div className="space-y-3">
                {order.histories.map((history) => (
                  <div
                    key={history.id}
                    className="flex items-start gap-3 text-sm"
                  >
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                    <div>
                      <span className="font-medium">
                        {ORDER_STATUS[history.status as keyof typeof ORDER_STATUS] || history.status}
                      </span>
                      {history.reason && (
                        <span className="text-gray-500 ml-2">- {history.reason}</span>
                      )}
                      <p className="text-gray-400 text-xs">
                        {formatDateTime(history.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
