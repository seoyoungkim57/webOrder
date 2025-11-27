'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import AddressSearch from '@/components/AddressSearch'

interface OrderItem {
  id?: string
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

// 전화번호 포맷팅 함수 (숫자만 추출 후 ###-####-#### 형식으로 변환)
const formatPhoneNumber = (value: string) => {
  const numbers = value.replace(/[^0-9]/g, '')
  if (numbers.length <= 3) {
    return numbers
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }
}

// 사업자번호 포맷팅 함수 (숫자만 추출 후 ###-##-##### 형식으로 변환)
const formatBusinessNumber = (value: string) => {
  const numbers = value.replace(/[^0-9]/g, '')
  if (numbers.length <= 3) {
    return numbers
  } else if (numbers.length <= 5) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`
  }
}

// 요일 이름
const dayNames = ['일', '월', '화', '수', '목', '금', '토']

export default function EditOrderPage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [useCustomTime, setUseCustomTime] = useState(false)
  const [holidays, setHolidays] = useState<Record<string, string>>({})

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
    deliveryTimeCustom: '',
    memo: '',
  })

  const [items, setItems] = useState<OrderItem[]>([{ ...emptyItem }])

  // 공휴일 데이터 가져오기
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const currentYear = new Date().getFullYear()
        // 올해와 내년 공휴일 가져오기
        const [thisYear, nextYear] = await Promise.all([
          fetch(`/api/holidays?year=${currentYear}`).then(res => res.json()),
          fetch(`/api/holidays?year=${currentYear + 1}`).then(res => res.json()),
        ])
        setHolidays({
          ...thisYear.holidays,
          ...nextYear.holidays,
        })
      } catch (err) {
        console.error('공휴일 데이터 로드 실패:', err)
      }
    }
    fetchHolidays()
  }, [])

  // 날짜에서 요일 정보 가져오기
  const getDayInfo = (dateString: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const dayIndex = date.getDay()
    const dayName = dayNames[dayIndex]
    const holidayName = holidays[dateString] || null
    const isSunday = dayIndex === 0
    const isSaturday = dayIndex === 6

    return {
      dayName,
      isHoliday: !!holidayName,
      isSunday,
      isSaturday,
      holidayName,
    }
  }

  // 기존 주문 데이터 불러오기
  useEffect(() => {
    if (status === 'authenticated' && orderId) {
      fetchOrder()
    }
  }, [status, orderId])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '주문을 불러올 수 없습니다.')
        return
      }

      const order = data.order

      // 배송시간에서 시간값 추출 (예: "09시까지" -> "09:00")
      let deliveryTimeType = ''
      let deliveryTimeCustom = ''
      if (order.deliveryTime) {
        const match = order.deliveryTime.match(/(\d{2})시까지/)
        if (match) {
          deliveryTimeType = `${match[1]}:00`
        } else {
          // 시간 형식이 아니면 직접 입력으로 처리
          deliveryTimeCustom = order.deliveryTime.replace('까지', '')
          setUseCustomTime(true)
        }
      }

      setFormData({
        recipientName: order.recipientName,
        recipientBusinessName: order.recipientBusinessName,
        recipientBusinessNumber: order.recipientBusinessNumber || '',
        recipientPhone1: order.recipientPhone1,
        recipientPhone2: order.recipientPhone2 || '',
        recipientAddress: order.recipientAddress,
        recipientAddressDetail: order.recipientAddressDetail || '',
        deliveryDate: order.deliveryDate.split('T')[0],
        deliveryTimeType,
        deliveryTimeCustom,
        memo: order.memo || '',
      })

      setItems(
        order.items.map((item: any) => ({
          id: item.id,
          itemCode: item.itemCode || '',
          itemName: item.itemName,
          itemSpec: item.itemSpec || '',
          quantity: String(item.quantity),
          unit: item.unit,
        }))
      )
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    // 전화번호 필드는 자동 포맷팅 적용
    if (name === 'recipientPhone1' || name === 'recipientPhone2') {
      setFormData((prev) => ({ ...prev, [name]: formatPhoneNumber(value) }))
    } else if (name === 'recipientBusinessNumber') {
      setFormData((prev) => ({ ...prev, [name]: formatBusinessNumber(value) }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
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

  const getDeliveryTimeString = () => {
    if (useCustomTime) {
      return formData.deliveryTimeCustom ? `${formData.deliveryTimeCustom}까지` : ''
    }
    if (!formData.deliveryTimeType) return ''
    const option = deliveryTimeOptions.find((o) => o.value === formData.deliveryTimeType)
    return option ? `${option.label}까지` : ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    const validItems = items.filter((item) => item.itemName && item.quantity && item.unit)
    if (validItems.length === 0) {
      setError('최소 1개 이상의 품목을 입력해주세요.')
      setSaving(false)
      return
    }

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          deliveryTime: getDeliveryTimeString(),
          items: validItems.map((item) => ({
            id: item.id,
            itemCode: item.itemCode,
            itemName: item.itemName,
            itemSpec: item.itemSpec,
            quantity: parseFloat(item.quantity),
            unit: item.unit,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '주문 수정에 실패했습니다.')
        setSaving(false)
        return
      }

      router.push(`/orders/${orderId}`)
    } catch (err) {
      setError('서버 오류가 발생했습니다.')
      setSaving(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                webOrder
              </Link>
            </div>
            <div className="flex items-center">
              <Link href={`/orders/${orderId}`} className="text-sm text-gray-600 hover:text-gray-900">
                주문 상세로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">주문 수정</h1>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* 거래처 정보 */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                거래처 정보
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  />
                </div>
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
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      name="deliveryDate"
                      value={formData.deliveryDate}
                      onChange={handleChange}
                      required
                      min={today}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 date-picker-large"
                    />
                    {formData.deliveryDate && (() => {
                      const dayInfo = getDayInfo(formData.deliveryDate)
                      if (!dayInfo) return null
                      const colorClass = dayInfo.isSunday || dayInfo.isHoliday
                        ? 'text-red-600'
                        : dayInfo.isSaturday
                        ? 'text-blue-600'
                        : 'text-gray-700'
                      return (
                        <span className={`font-semibold ${colorClass} whitespace-nowrap`}>
                          ({dayInfo.dayName})
                          {dayInfo.holidayName && (
                            <span className="ml-1 text-sm text-red-500">{dayInfo.holidayName}</span>
                          )}
                        </span>
                      )
                    })()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    희망 배송시간
                  </label>
                  {!useCustomTime ? (
                    <div className="flex items-center gap-2 mb-2">
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
                  ) : (
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        name="deliveryTimeCustom"
                        value={formData.deliveryTimeCustom}
                        onChange={handleChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="예: 오전 중, 점심 전, 14시까지"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="radio"
                        name="timeInputType"
                        checked={!useCustomTime}
                        onChange={() => setUseCustomTime(false)}
                        className="text-blue-600"
                      />
                      선택
                    </label>
                    <label className="flex items-center gap-1 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="radio"
                        name="timeInputType"
                        checked={useCustomTime}
                        onChange={() => setUseCustomTime(true)}
                        className="text-blue-600"
                      />
                      직접 입력
                    </label>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    배송지 주소 *
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
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    메모
                    <span className="ml-2 text-xs text-gray-400 font-normal">
                      ({formData.memo.length}/500자)
                    </span>
                  </label>
                  <textarea
                    name="memo"
                    value={formData.memo}
                    onChange={handleChange}
                    maxLength={500}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="배송 관련 메모를 입력하세요 (최대 500자)"
                  />
                </div>
              </div>
            </section>

            {/* 품목 정보 */}
            <section className="mb-8">
              <div className="mb-4 pb-2 border-b">
                <h2 className="text-lg font-semibold text-gray-900">주문 품목</h2>
              </div>

              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
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

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="hidden sm:flex items-center justify-center flex-shrink-0">
                        <span className="w-7 h-7 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                          {index + 1}
                        </span>
                      </div>

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

              {/* 품목 추가 버튼 */}
              <button
                type="button"
                onClick={addItem}
                className="w-full mt-3 py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                품목 추가
              </button>
            </section>

            {/* 버튼 */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Link
                href={`/orders/${orderId}`}
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
