'use client'

import { useState, useEffect, useRef } from 'react'

interface AddressSearchProps {
  onSelect: (address: string) => void
  placeholder?: string
  value?: string
}

declare global {
  interface Window {
    daum: any
  }
}

export default function AddressSearch({ onSelect, placeholder, value }: AddressSearchProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [inputValue, setInputValue] = useState(value || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Daum 우편번호 스크립트 로드
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    script.onload = () => setIsScriptLoaded(true)
    document.head.appendChild(script)

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거하지 않음 (다른 곳에서 사용할 수 있음)
    }
  }, [])

  useEffect(() => {
    setInputValue(value || '')
  }, [value])

  const handleSearch = () => {
    if (!isScriptLoaded || !window.daum) {
      alert('주소 검색 기능을 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    new window.daum.Postcode({
      oncomplete: function (data: any) {
        // 도로명 주소 우선, 없으면 지번 주소
        let address = data.roadAddress || data.jibunAddress

        // 건물명이 있으면 추가
        if (data.buildingName) {
          address += ` (${data.buildingName})`
        }

        setInputValue(address)
        onSelect(address)

        // 상세주소 입력 필드로 포커스 이동 (있다면)
        const detailInput = document.querySelector('[name="recipientAddressDetail"]') as HTMLInputElement
        if (detailInput) {
          detailInput.focus()
        }
      },
      width: '100%',
      height: '100%',
    }).open()
  }

  return (
    <div className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        readOnly
        onClick={handleSearch}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder || '클릭하여 주소 검색'}
      />
      <button
        type="button"
        onClick={handleSearch}
        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm whitespace-nowrap"
      >
        주소 검색
      </button>
    </div>
  )
}
