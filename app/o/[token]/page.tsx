'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ORDER_STATUS } from '@/lib/utils'

interface OrderItem {
  id: string
  itemCode: string | null
  itemName: string
  itemSpec: string | null
  quantity: number
  unit: string
}

interface Supplier {
  name: string | null
  businessName: string | null
  phone: string | null
  email: string | null
}

interface Order {
  id: string
  orderNumber: string
  recipientName: string
  recipientBusinessName: string
  recipientPhone1: string
  recipientAddress: string
  recipientAddressDetail: string | null
  deliveryDate: string
  deliveryTime: string | null
  memo: string | null
  status: string
  items: OrderItem[]
  supplier: Supplier
  createdAt: string
}

export default function RecipientOrderPage() {
  const params = useParams()
  const token = params.token as string

  const [step, setStep] = useState<'verify' | 'view' | 'respond'>('verify')
  const [verificationCode, setVerificationCode] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)
  const [responseReason, setResponseReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [responseSuccess, setResponseSuccess] = useState('')

  useEffect(() => {
    fetchOrder()
  }, [token])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/public/orders/${token}`)
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

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const response = await fetch(`/api/public/orders/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '인증에 실패했습니다.')
        setSubmitting(false)
        return
      }

      setVerified(true)
      setStep('view')
      fetchOrder() // 상태 갱신
    } catch (err) {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResponse = async (responseType: 'ACCEPTED' | 'REJECTED' | 'REVIEWING') => {
    setError('')
    setSubmitting(true)

    try {
      const response = await fetch(`/api/public/orders/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: responseType,
          reason: responseReason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '처리에 실패했습니다.')
        setSubmitting(false)
        return
      }

      setResponseSuccess(data.message)
      fetchOrder() // 상태 갱신
    } catch (err) {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      SENT: 'bg-blue-100 text-blue-800',
      VIEWED: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      REVIEWING: 'bg-purple-100 text-purple-800',
    }
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${colors[status] || 'bg-gray-100'}`}>
        {ORDER_STATUS[status as keyof typeof ORDER_STATUS] || status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">주문을 찾을 수 없습니다</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!order) return null

  // 인증 페이지
  if (!verified && step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">🔐</div>
            <h1 className="text-xl font-bold text-gray-900">주문 확인</h1>
            <p className="text-sm text-gray-500 mt-2">
              본인 확인을 위해 전화번호 뒷 4자리를 입력해주세요.
            </p>
          </div>

          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">주문번호:</span> {order.orderNumber}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">수신자:</span> {order.recipientBusinessName}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleVerify}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                전화번호 뒷 4자리
              </label>
              <input
                type="text"
                maxLength={4}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0000"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting || verificationCode.length !== 4}
              className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 touch-feedback"
            >
              {submitting ? '확인 중...' : '확인'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // 응답 완료 페이지
  if (responseSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
          <div className="text-6xl mb-4">
            {order.status === 'ACCEPTED' && '✅'}
            {order.status === 'REJECTED' && '❌'}
            {order.status === 'REVIEWING' && '📝'}
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{responseSuccess}</h1>
          <p className="text-gray-500">발주자에게 응답이 전달되었습니다.</p>
        </div>
      </div>
    )
  }

  // 주문 상세 보기 + 응답
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-lg font-bold text-gray-900">주문 확인</h1>
        </div>
      </div>

      <main className="max-w-2xl mx-auto py-6 px-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          {/* 주문 정보 */}
          <div className="p-4 border-b">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">주문번호</p>
                <p className="font-bold text-gray-900">{order.orderNumber}</p>
              </div>
              {getStatusBadge(order.status)}
            </div>
          </div>

          {/* 발주자 정보 */}
          <div className="p-4 border-b">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">발주자 정보</h2>
            <div className="text-sm text-gray-600 space-y-1">
              {order.supplier.businessName && (
                <p>{order.supplier.businessName}</p>
              )}
              {order.supplier.name && (
                <p>담당자: {order.supplier.name}</p>
              )}
              {order.supplier.phone && (
                <p>연락처: {order.supplier.phone}</p>
              )}
            </div>
          </div>

          {/* 배송 정보 */}
          <div className="p-4 border-b">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">배송 정보</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="text-gray-500">희망 배송일:</span>{' '}
                {formatDate(order.deliveryDate)}
                {order.deliveryTime && ` ${order.deliveryTime}`}
              </p>
              <p>
                <span className="text-gray-500">배송지:</span>{' '}
                {order.recipientAddress}
                {order.recipientAddressDetail && ` ${order.recipientAddressDetail}`}
              </p>
              {order.memo && (
                <p className="mt-2">
                  <span className="text-gray-500">메모:</span>{' '}
                  {order.memo}
                </p>
              )}
            </div>
          </div>

          {/* 품목 목록 */}
          <div className="p-4 border-b">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">주문 품목</h2>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">
                      {index + 1}. {item.itemName}
                    </p>
                    {item.itemSpec && (
                      <p className="text-xs text-gray-500">{item.itemSpec}</p>
                    )}
                  </div>
                  <p className="text-gray-900 font-medium">
                    {Number(item.quantity).toLocaleString()} {item.unit}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 응답 섹션 */}
          {['SENT', 'VIEWED'].includes(order.status) && (
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">주문 응답</h2>

              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">
                  의견 (선택사항)
                </label>
                <textarea
                  value={responseReason}
                  onChange={(e) => setResponseReason(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="의견이 있으시면 입력해주세요"
                />
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleResponse('ACCEPTED')}
                  disabled={submitting}
                  className="w-full py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 touch-feedback"
                >
                  수락
                </button>
                <button
                  onClick={() => handleResponse('REVIEWING')}
                  disabled={submitting}
                  className="w-full py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 touch-feedback"
                >
                  검토 요청
                </button>
                <button
                  onClick={() => handleResponse('REJECTED')}
                  disabled={submitting}
                  className="w-full py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 touch-feedback"
                >
                  거절
                </button>
              </div>
            </div>
          )}

          {/* 이미 응답한 경우 */}
          {['ACCEPTED', 'REJECTED', 'REVIEWING'].includes(order.status) && (
            <div className="p-4 text-center">
              <p className="text-gray-500">이미 응답이 완료된 주문입니다.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
