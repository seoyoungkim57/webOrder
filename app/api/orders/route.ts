import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  generateOrderNumber,
  generateVerificationCode,
  getTokenExpiryDate,
} from '@/lib/utils'

// 주문 목록 조회 (GET)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')

    const where = {
      userId: session.user.id,
      ...(status && { status }),
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('주문 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '주문 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 주문 생성 (POST)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
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
      status = 'DRAFT',
    } = body

    // 필수 필드 검증
    if (!recipientName || !recipientBusinessName || !recipientPhone1 || !recipientAddress || !deliveryDate) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    // 품목 검증
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: '최소 1개 이상의 품목을 입력해주세요.' },
        { status: 400 }
      )
    }

    for (const item of items) {
      if (!item.itemName || !item.quantity || !item.unit) {
        return NextResponse.json(
          { error: '품목명, 수량, 단위는 필수입니다.' },
          { status: 400 }
        )
      }
    }

    // 주문번호 생성 (중복 방지)
    let orderNumber = generateOrderNumber()
    let attempts = 0
    while (attempts < 5) {
      const existing = await prisma.order.findUnique({ where: { orderNumber } })
      if (!existing) break
      orderNumber = generateOrderNumber()
      attempts++
    }

    // 인증코드 생성 (전화번호 뒷 4자리)
    const verificationCode = generateVerificationCode(recipientPhone1)

    // 트랜잭션으로 주문 및 품목 생성
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          orderNumber,
          recipientName,
          recipientBusinessName,
          recipientBusinessNumber: recipientBusinessNumber || null,
          recipientPhone1,
          recipientPhone2: recipientPhone2 || null,
          recipientAddress,
          recipientAddressDetail: recipientAddressDetail || null,
          deliveryDate: new Date(deliveryDate),
          deliveryTime: deliveryTime || null,
          memo: memo || null,
          status,
          tokenExpiresAt: getTokenExpiryDate(),
          verificationCode,
        },
      })

      // 품목 생성
      await tx.orderItem.createMany({
        data: items.map((item: any, index: number) => ({
          orderId: newOrder.id,
          itemCode: item.itemCode || null,
          itemName: item.itemName,
          itemSpec: item.itemSpec || null,
          quantity: item.quantity,
          unit: item.unit,
          sortOrder: index,
        })),
      })

      // 주문 이력 생성
      await tx.orderHistory.create({
        data: {
          orderId: newOrder.id,
          status,
          changedBy: session.user.id,
        },
      })

      // 최근 품목에 추가
      for (const item of items) {
        await tx.recentItem.upsert({
          where: {
            userId_itemName_itemSpec: {
              userId: session.user.id,
              itemName: item.itemName,
              itemSpec: item.itemSpec || '',
            },
          },
          update: {
            usageCount: { increment: 1 },
            lastUsedAt: new Date(),
            itemCode: item.itemCode || null,
            unit: item.unit,
          },
          create: {
            userId: session.user.id,
            itemCode: item.itemCode || null,
            itemName: item.itemName,
            itemSpec: item.itemSpec || '',
            unit: item.unit,
          },
        })
      }

      return newOrder
    })

    // 생성된 주문 조회 (품목 포함)
    const createdOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    return NextResponse.json(
      {
        message: '주문이 생성되었습니다.',
        order: createdOrder,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('주문 생성 오류:', error)
    return NextResponse.json(
      { error: '주문 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
