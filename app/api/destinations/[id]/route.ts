import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 수주자 상세 조회 (GET)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const destination = await prisma.savedDestination.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!destination) {
      return NextResponse.json({ error: '거래처를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ destination })
  } catch (error) {
    console.error('수주자 조회 오류:', error)
    return NextResponse.json(
      { error: '거래처를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 수주자 수정 (PUT)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const existingDestination = await prisma.savedDestination.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingDestination) {
      return NextResponse.json({ error: '거래처를 찾을 수 없습니다.' }, { status: 404 })
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
    if (isDefault && !existingDestination.isDefault) {
      await prisma.savedDestination.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    const destination = await prisma.savedDestination.update({
      where: { id: params.id },
      data: {
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

    return NextResponse.json({
      message: '거래처 정보가 수정되었습니다.',
      destination,
    })
  } catch (error) {
    console.error('수주자 수정 오류:', error)
    return NextResponse.json(
      { error: '거래처 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 수주자 삭제 (DELETE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const existingDestination = await prisma.savedDestination.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingDestination) {
      return NextResponse.json({ error: '거래처를 찾을 수 없습니다.' }, { status: 404 })
    }

    await prisma.savedDestination.delete({ where: { id: params.id } })

    return NextResponse.json({ message: '거래처가 삭제되었습니다.' })
  } catch (error) {
    console.error('수주자 삭제 오류:', error)
    return NextResponse.json(
      { error: '거래처 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
