import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 수주자 목록 조회 (GET)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const destinations = await prisma.savedDestination.findMany({
      where: {
        userId: session.user.id,
        ...(search && {
          OR: [
            { businessName: { contains: search, mode: 'insensitive' } },
            { contactName: { contains: search, mode: 'insensitive' } },
            { nickname: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: [
        { isDefault: 'desc' },
        { usageCount: 'desc' },
        { lastUsedAt: 'desc' },
      ],
    })

    return NextResponse.json({ destinations })
  } catch (error) {
    console.error('수주자 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '거래처 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 수주자 등록 (POST)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const {
      nickname,
      businessName,
      businessNumber,
      contactName,
      phone1,
      phone2,
      address,
      addressDetail,
      isDefault,
    } = body

    // 필수 필드 검증
    if (!nickname || !businessName || !contactName || !phone1 || !address) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    // 기본 수주자로 설정 시 기존 기본값 해제
    if (isDefault) {
      await prisma.savedDestination.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    const destination = await prisma.savedDestination.create({
      data: {
        userId: session.user.id,
        nickname,
        businessName,
        businessNumber: businessNumber || null,
        contactName,
        phone1,
        phone2: phone2 || null,
        address,
        addressDetail: addressDetail || null,
        isDefault: isDefault || false,
      },
    })

    return NextResponse.json(
      { message: '거래처가 등록되었습니다.', destination },
      { status: 201 }
    )
  } catch (error) {
    console.error('수주자 등록 오류:', error)
    return NextResponse.json(
      { error: '거래처 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
