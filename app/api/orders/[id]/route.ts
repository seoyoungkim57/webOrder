import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 주문 상세 조회 (GET)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        histories: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('주문 조회 오류:', error)
    return NextResponse.json(
      { error: '주문을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 주문 수정 (PUT)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const existingOrder = await prisma.order.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingOrder) {
      return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 })
    }

    // SENT 이후에는 수정 불가
    if (['SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'REVIEWING'].includes(existingOrder.status)) {
      return NextResponse.json(
        { error: '발송된 주문은 수정할 수 없습니다.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      recipientName,
      recipientBusinessName,
      recipientBusinessNumber,
      recipientPhone1,
      recipientPhone2,
      recipientAddress,
      recipientAddressDetail,
      deliveryDate,
      deliveryTime,
      memo,
      items,
      status,
    } = body

    // 트랜잭션으로 수정
    const order = await prisma.$transaction(async (tx) => {
      // 주문 수정
      const updatedOrder = await tx.order.update({
        where: { id: params.id },
        data: {
          recipientName,
          recipientBusinessName,
          recipientBusinessNumber,
          recipientPhone1,
          recipientPhone2,
          recipientAddress,
          recipientAddressDetail,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
          deliveryTime,
          memo,
          status,
        },
      })

      // 품목이 있으면 기존 삭제 후 새로 생성
      if (items && Array.isArray(items)) {
        await tx.orderItem.deleteMany({ where: { orderId: params.id } })
        await tx.orderItem.createMany({
          data: items.map((item: any, index: number) => ({
            orderId: params.id,
            itemCode: item.itemCode || null,
            itemName: item.itemName,
            itemSpec: item.itemSpec || null,
            quantity: item.quantity,
            unit: item.unit,
            sortOrder: index,
          })),
        })
      }

      // 상태 변경 시 이력 추가
      if (status && status !== existingOrder.status) {
        await tx.orderHistory.create({
          data: {
            orderId: params.id,
            status,
            changedBy: session.user.id,
          },
        })
      }

      return updatedOrder
    })

    // 수정된 주문 조회
    const updatedOrder = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    return NextResponse.json({
      message: '주문이 수정되었습니다.',
      order: updatedOrder,
    })
  } catch (error) {
    console.error('주문 수정 오류:', error)
    return NextResponse.json(
      { error: '주문 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 주문 삭제 (DELETE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const existingOrder = await prisma.order.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingOrder) {
      return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 })
    }

    // SENT 이후에는 삭제 대신 취소 처리
    if (['SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'REVIEWING'].includes(existingOrder.status)) {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: params.id },
          data: { status: 'CANCELLED' },
        })
        await tx.orderHistory.create({
          data: {
            orderId: params.id,
            status: 'CANCELLED',
            changedBy: session.user.id,
          },
        })
      })

      return NextResponse.json({ message: '주문이 취소되었습니다.' })
    }

    // DRAFT 상태는 완전 삭제
    await prisma.order.delete({ where: { id: params.id } })

    return NextResponse.json({ message: '주문이 삭제되었습니다.' })
  } catch (error) {
    console.error('주문 삭제 오류:', error)
    return NextResponse.json(
      { error: '주문 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
