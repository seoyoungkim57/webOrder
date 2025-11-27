import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 배송지 주소 목록 조회 (GET)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const addresses = await prisma.savedAddress.findMany({
      where: {
        userId: session.user.id,
        ...(search && {
          OR: [
            { nickname: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: [
        { isDefault: 'desc' },
        { usageCount: 'desc' },
        { lastUsedAt: 'desc' },
      ],
    })

    return NextResponse.json({ addresses })
  } catch (error) {
    console.error('배송지 주소 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '배송지 주소 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 배송지 주소 등록 (POST)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const {
      nickname,
      address,
      addressDetail,
      isDefault,
    } = body

    // 필수 필드 검증
    if (!nickname || !address) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    // 기본 주소로 설정 시 기존 기본값 해제
    if (isDefault) {
      await prisma.savedAddress.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    const savedAddress = await prisma.savedAddress.create({
      data: {
        userId: session.user.id,
        nickname,
        address,
        addressDetail: addressDetail || null,
        isDefault: isDefault || false,
      },
    })

    return NextResponse.json(
      { message: '배송지 주소가 등록되었습니다.', address: savedAddress },
      { status: 201 }
    )
  } catch (error) {
    console.error('배송지 주소 등록 오류:', error)
    return NextResponse.json(
      { error: '배송지 주소 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
