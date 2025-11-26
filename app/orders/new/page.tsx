'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AddressSearch from '@/components/AddressSearch'

interface OrderItem {
  itemCode: string
  itemName: string
  itemSpec: string
  quantity: string
  unit: string
}

const emptyItem: OrderItem = {
  itemCode: '',
  itemName: '',
  itemSpec: '',
  quantity: '',
  unit: '개',
}

// 배송시간 옵션 (시간 선택 후 "까지" 붙임)
const deliveryTimeOptions = [
  { value: '', label: '선택 안함' },
  { value: '09:00', label: '09시' },
  { value: '10:00', label: '10시' },
  { value: '11:00', label: '11시' },
  { value: '12:00', label: '12시' },
  { value: '13:00', label: '13시' },
  { value: '14:00', label: '14시' },
  { value: '15:00', label: '15시' },
  { value: '16:00', label: '16시' },
  { value: '17:00', label: '17시' },
  { value: '18:00', label: '18시' },
]

export default function NewOrderPage() {
  const { status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    recipientName: '',
    recipientBusinessName: '',
    recipientBusinessNumber: '',
    recipientPhone1: '',
    recipientPhone2: '',
    recipientAddress: '',
    recipientAddressDetail: '',
    deliveryDate: '',
    deliveryTimeType: '',
    deliveryTime: '',
    memo: '',
  })

  const [items, setItems] = useState<OrderItem[]>([{ ...emptyItem }])

  // 인증 체크
  if (status === 'loading') {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleAddressSelect = (address: string) => {
    setFormData((prev) => ({ ...prev, recipientAddress: address }))
    setError('')
  }

  const handleItemChange = (index: number, field: keyof OrderItem, value: string) => {
    setItems((prev) => {
      const newItems = [...prev]
      newItems[index] = { ...newItems[index], [field]: value }
      return newItems
    })
    setError('')
  }

  const addItem = () => {
    setItems((prev) => [...prev, { ...emptyItem }])
  }

  const removeItem = (index: number) => {
    if (items.length === 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  // 배송시간 문자열 생성 (선택한 시간 + "까지")
  const getDeliveryTimeString = () => {
    if (!formData.deliveryTimeType) return ''
    const option = deliveryTimeOptions.find((o) => o.value === formData.deliveryTimeType)
    return option ? `${option.label}까지` : ''
  }

  const handleSubmit = async (e: React.FormEvent, orderStatus: 'DRAFT' | 'SENT') => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 품목 검증
    const validItems = items.filter((item) => item.itemName && item.quantity && item.unit)
    if (validItems.length === 0) {
      setError('최소 1개 이상의 품목을 입력해주세요.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          deliveryTime: getDeliveryTimeString(),
          items: validItems.map((item) => ({
            ...item,
            quantity: parseFloat(item.quantity),
          })),
          status: orderStatus,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '주문 생성에 실패했습니다.')
        setLoading(false)
        return
      }

      // 성공 시 주문 목록으로 이동
      router.push('/orders')
    } catch (err) {
      setError('서버 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  // 오늘 날짜 (최소 배송일)
  const today = new Date().toISOString().split('T')[0]

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
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">새 주문 생성</h1>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e, 'SENT')}>
            {/* 수주자 정보 */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                수주자 정보
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    담당자명 *
                  </label>
                  <input
                    type="text"
                    name="recipientName"
                    value={formData.recipientName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업체명 *
                  </label>
                  <input
                    type="text"
                    name="recipientBusinessName"
                    value={formData.recipientBusinessName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(주)가나다"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사업자번호
                  </label>
                  <input
                    type="text"
                    name="recipientBusinessNumber"
                    value={formData.recipientBusinessNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123-45-67890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    전화번호1 *
                  </label>
                  <input
                    type="tel"
                    name="recipientPhone1"
                    value={formData.recipientPhone1}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="010-1234-5678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    전화번호2
                  </label>
                  <input
                    type="tel"
                    name="recipientPhone2"
                    value={formData.recipientPhone2}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="02-123-4567"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    주소 *
                  </label>
                  <AddressSearch
                    value={formData.recipientAddress}
                    onSelect={handleAddressSelect}
                    placeholder="클릭하여 주소 검색"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상세주소
                  </label>
                  <input
                    type="text"
                    name="recipientAddressDetail"
                    value={formData.recipientAddressDetail}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="OO빌딩 3층"
                  />
                </div>
              </div>
            </section>

            {/* 배송 정보 */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                배송 정보
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    희망 배송일 *
                  </label>
                  <input
                    type="date"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    onChange={handleChange}
                    required
                    min={today}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    희망 배송시간
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      name="deliveryTimeType"
                      value={formData.deliveryTimeType}
                      onChange={handleChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {deliveryTimeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {formData.deliveryTimeType && (
                      <span className="text-gray-700 font-medium whitespace-nowrap">까지</span>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    메모
                  </label>
                  <textarea
                    name="memo"
                    value={formData.memo}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="배송 관련 메모를 입력하세요"
                  />
                </div>
              </div>
            </section>

            {/* 품목 정보 */}
            <section className="mb-8">
              <div className="flex justify-between items-center mb-4 pb-2 border-b">
                <h2 className="text-lg font-semibold text-gray-900">주문 품목</h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  + 품목 추가
                </button>
              </div>

              {/* 품목 입력 영역 */}
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    {/* 모바일: 넘버링 + 삭제 버튼 */}
                    <div className="flex sm:hidden w-full justify-between items-center mb-3">
                      <span className="flex items-center gap-2">
                        <span className="w-7 h-7 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-700">품목</span>
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* 데스크탑: 한 줄 레이아웃 */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      {/* 넘버링 (데스크탑) */}
                      <div className="hidden sm:flex items-center justify-center flex-shrink-0">
                        <span className="w-7 h-7 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                          {index + 1}
                        </span>
                      </div>

                      {/* 품목코드 */}
                      <div className="w-full sm:w-24 flex-shrink-0">
                        <label className="sm:hidden text-xs text-gray-500 mb-1 block">품목코드</label>
                        <input
                          type="text"
                          value={item.itemCode}
                          onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="품목코드"
                        />
                      </div>

                      {/* 품목명 */}
                      <div className="w-full sm:flex-1">
                        <label className="sm:hidden text-xs text-gray-500 mb-1 block">품목명 *</label>
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="품목명 *"
                        />
                      </div>

                      {/* 규격 */}
                      <div className="w-full sm:w-28 flex-shrink-0">
                        <label className="sm:hidden text-xs text-gray-500 mb-1 block">규격</label>
                        <input
                          type="text"
                          value={item.itemSpec}
                          onChange={(e) => handleItemChange(index, 'itemSpec', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="규격"
                        />
                      </div>

                      {/* 수량 */}
                      <div className="w-full sm:w-24 flex-shrink-0">
                        <label className="sm:hidden text-xs text-gray-500 mb-1 block">수량 *</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          required
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="수량 *"
                        />
                      </div>

                      {/* 단위 */}
                      <div className="w-full sm:w-20 flex-shrink-0">
                        <label className="sm:hidden text-xs text-gray-500 mb-1 block">단위</label>
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="개">개</option>
                          <option value="박스">박스</option>
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="L">L</option>
                          <option value="ml">ml</option>
                          <option value="팩">팩</option>
                          <option value="봉">봉</option>
                          <option value="세트">세트</option>
                        </select>
                      </div>

                      {/* 삭제 버튼 (데스크탑) */}
                      <div className="hidden sm:flex flex-shrink-0">
                        {items.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                            title="삭제"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        ) : (
                          <div className="w-9"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 버튼 */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={(e) => handleSubmit(e as any, 'DRAFT')}
                disabled={loading}
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                임시저장
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 touch-feedback"
              >
                {loading ? '처리 중...' : '발송하기'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
