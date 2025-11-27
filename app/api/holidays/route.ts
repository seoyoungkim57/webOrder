import { NextRequest, NextResponse } from 'next/server'

// 공공데이터 포털 - 한국천문연구원 특일 정보 API
// https://www.data.go.kr/data/15012690/openapi.do
const HOLIDAY_API_URL = 'http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo'

interface HolidayItem {
  dateKind: string
  dateName: string
  isHoliday: string
  locdate: number
  seq: number
}

interface HolidayResponse {
  response: {
    header: {
      resultCode: string
      resultMsg: string
    }
    body: {
      items: {
        item: HolidayItem | HolidayItem[]
      } | ''
      numOfRows: number
      pageNo: number
      totalCount: number
    }
  }
}

// 메모리 캐시 (서버 재시작 시 초기화)
const holidayCache: Record<string, { data: Record<string, string>; timestamp: number }> = {}
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24시간

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const year = searchParams.get('year')
  const month = searchParams.get('month')

  if (!year) {
    return NextResponse.json({ error: '연도가 필요합니다.' }, { status: 400 })
  }

  const serviceKey = process.env.PUBLIC_DATA_API_KEY

  if (!serviceKey) {
    // API 키가 없으면 빈 데이터 반환 (하드코딩된 공휴일 사용하도록)
    return NextResponse.json({ holidays: {}, source: 'fallback' })
  }

  try {
    const cacheKey = month ? `${year}-${month}` : year
    const now = Date.now()

    // 캐시 확인
    if (holidayCache[cacheKey] && now - holidayCache[cacheKey].timestamp < CACHE_DURATION) {
      return NextResponse.json({
        holidays: holidayCache[cacheKey].data,
        source: 'cache'
      })
    }

    const holidays: Record<string, string> = {}

    if (month) {
      // 특정 월의 공휴일 조회
      const monthHolidays = await fetchHolidays(serviceKey, year, month)
      Object.assign(holidays, monthHolidays)
    } else {
      // 연간 공휴일 조회 (1월~12월)
      const promises = []
      for (let m = 1; m <= 12; m++) {
        const monthStr = m.toString().padStart(2, '0')
        promises.push(fetchHolidays(serviceKey, year, monthStr))
      }
      const results = await Promise.all(promises)
      results.forEach(result => Object.assign(holidays, result))
    }

    // 캐시 저장
    holidayCache[cacheKey] = { data: holidays, timestamp: now }

    return NextResponse.json({ holidays, source: 'api' })
  } catch (error) {
    console.error('공휴일 API 오류:', error)
    return NextResponse.json({ holidays: {}, source: 'error' })
  }
}

async function fetchHolidays(
  serviceKey: string,
  year: string,
  month: string
): Promise<Record<string, string>> {
  const holidays: Record<string, string> = {}

  try {
    const url = new URL(HOLIDAY_API_URL)
    url.searchParams.append('serviceKey', serviceKey)
    url.searchParams.append('solYear', year)
    url.searchParams.append('solMonth', month)
    url.searchParams.append('_type', 'json')
    url.searchParams.append('numOfRows', '30')

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`API 응답 오류: ${response.status}`)
      return holidays
    }

    const data: HolidayResponse = await response.json()

    if (data.response.header.resultCode !== '00') {
      console.error(`API 결과 오류: ${data.response.header.resultMsg}`)
      return holidays
    }

    const items = data.response.body.items
    if (!items || items === '') {
      return holidays
    }

    // items.item이 배열이거나 단일 객체일 수 있음
    const itemList = Array.isArray(items.item) ? items.item : [items.item]

    for (const item of itemList) {
      if (item.isHoliday === 'Y') {
        // locdate: 20241225 형식 -> 2024-12-25 형식으로 변환
        const dateStr = item.locdate.toString()
        const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
        holidays[formattedDate] = item.dateName
      }
    }

    return holidays
  } catch (error) {
    console.error(`${year}-${month} 공휴일 조회 실패:`, error)
    return holidays
  }
}
