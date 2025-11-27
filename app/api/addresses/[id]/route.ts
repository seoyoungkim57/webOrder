import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 배송지 주소 상세 조회 (GET)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const address = await prisma.savedAddress.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!address) {
      return NextResponse.json({ error: '배송지 주소를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ address })
  } catch (error) {
    console.error('배송지 주소 조회 오류:', error)
    return NextResponse.json(
      { error: '배송지 주소를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 배송지 주소 수정 (PUT)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const existingAddress = await prisma.savedAddress.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingAddress) {
      return NextResponse.json({ error: '배송지 주소를 찾을 수 없습니다.' }, { status: 404 })
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
    if (isDefault && !existingAddress.isDefault) {
      await prisma.savedAddress.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    const updatedAddress = await prisma.savedAddress.update({
      where: { id: params.id },
      data: {
        nickname,
        address,
        addressDetail: addressDetail || null,
        isDefault: isDefault || false,
      },
    })

    return NextResponse.json({
      message: '배송지 주소가 수정되었습니다.',
      address: updatedAddress,
    })
  } catch (error) {
    console.error('배송지 주소 수정 오류:', error)
    return NextResponse.json(
      { error: '배송지 주소 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 배송지 주소 삭제 (DELETE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const existingAddress = await prisma.savedAddress.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingAddress) {
      return NextResponse.json({ error: '배송지 주소를 찾을 수 없습니다.' }, { status: 404 })
    }

    await prisma.savedAddress.delete({ where: { id: params.id } })

    return NextResponse.json({ message: '배송지 주소가 삭제되었습니다.' })
  } catch (error) {
    console.error('배송지 주소 삭제 오류:', error)
    return NextResponse.json(
      { error: '배송지 주소 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
