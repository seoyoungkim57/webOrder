import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIP, verificationApiLimit } from '@/lib/rate-limit'

// 토큰으로 주문 조회 (인증 불필요 - 수주자용)
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const order = await prisma.order.findFirst({
      where: {
        token: params.token,
        status: { in: ['SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'REVIEWING'] },
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        user: {
          select: {
            name: true,
            businessName: true,
            phone: true,
            email: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: '주문을 찾을 수 없거나 만료되었습니다.' },
        { status: 404 }
      )
    }

    // 토큰 만료 확인
    if (new Date() > new Date(order.tokenExpiresAt)) {
      return NextResponse.json(
        { error: '공유 링크가 만료되었습니다.' },
        { status: 410 }
      )
    }

    // 민감한 정보 제거 후 반환
    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        recipientName: order.recipientName,
        recipientBusinessName: order.recipientBusinessName,
        recipientPhone1: order.recipientPhone1,
        recipientAddress: order.recipientAddress,
        recipientAddressDetail: order.recipientAddressDetail,
        deliveryDate: order.deliveryDate,
        deliveryTime: order.deliveryTime,
        memo: order.memo,
        status: order.status,
        items: order.items,
        supplier: order.user,
        createdAt: order.createdAt,
      },
    })
  } catch (error) {
    console.error('주문 조회 오류:', error)
    return NextResponse.json(
      { error: '주문을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 인증코드 확인 (POST)
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Rate Limiting 체크 (브루트포스 방지)
    const clientIP = getClientIP(request)
    const rateLimitResult = checkRateLimit(clientIP, verificationApiLimit)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: rateLimitResult.blocked
            ? '너무 많은 인증 시도로 일시적으로 차단되었습니다. 30분 후 다시 시도해주세요.'
            : '인증 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 60),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimitResult.resetTime),
          },
        }
      )
    }

    const body = await request.json()
    const { verificationCode } = body

    if (!verificationCode) {
      return NextResponse.json(
        { error: '인증코드를 입력해주세요.' },
        { status: 400 }
      )
    }

    const order = await prisma.order.findFirst({
      where: {
        token: params.token,
        status: { in: ['SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'REVIEWING'] },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: '주문을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 토큰 만료 확인
    if (new Date() > new Date(order.tokenExpiresAt)) {
      return NextResponse.json(
        { error: '공유 링크가 만료되었습니다.' },
        { status: 410 }
      )
    }

    // 인증코드 확인
    if (order.verificationCode !== verificationCode) {
      return NextResponse.json(
        { error: '인증코드가 일치하지 않습니다.' },
        { status: 401 }
      )
    }

    // 조회수 증가 및 상태 업데이트
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
    const userAgent = request.headers.get('user-agent') || ''

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          viewCount: { increment: 1 },
          lastViewedAt: new Date(),
          status: order.status === 'SENT' ? 'VIEWED' : order.status,
        },
      })

      // 첫 조회 시 이력 추가
      if (order.status === 'SENT') {
        await tx.orderHistory.create({
          data: {
            orderId: order.id,
            status: 'VIEWED',
            changedBy: 'recipient',
            ipAddress,
            userAgent,
          },
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: '인증되었습니다.',
    })
  } catch (error) {
    console.error('인증 오류:', error)
    return NextResponse.json(
      { error: '인증 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 주문 응답 (수락/거절/검토) - PUT
export async function PUT(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const body = await request.json()
    const { response, reason } = body

    if (!response || !['ACCEPTED', 'REJECTED', 'REVIEWING'].includes(response)) {
      return NextResponse.json(
        { error: '유효한 응답을 선택해주세요.' },
        { status: 400 }
      )
    }

    const order = await prisma.order.findFirst({
      where: {
        token: params.token,
        status: { in: ['SENT', 'VIEWED'] },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: '주문을 찾을 수 없거나 이미 처리되었습니다.' },
        { status: 404 }
      )
    }

    // 토큰 만료 확인
    if (new Date() > new Date(order.tokenExpiresAt)) {
      return NextResponse.json(
        { error: '공유 링크가 만료되었습니다.' },
        { status: 410 }
      )
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
    const userAgent = request.headers.get('user-agent') || ''

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: response },
      })

      await tx.orderHistory.create({
        data: {
          orderId: order.id,
          status: response,
          reason: reason || null,
          changedBy: 'recipient',
          ipAddress,
          userAgent,
        },
      })
    })

    const statusMessages: Record<string, string> = {
      ACCEPTED: '주문이 수락되었습니다.',
      REJECTED: '주문이 거절되었습니다.',
      REVIEWING: '검토 요청이 전달되었습니다.',
    }

    return NextResponse.json({
      success: true,
      message: statusMessages[response],
    })
  } catch (error) {
    console.error('응답 처리 오류:', error)
    return NextResponse.json(
      { error: '응답 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
