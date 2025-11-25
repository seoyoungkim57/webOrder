# API 명세서

## 개요

### Base URL
```
개발: http://localhost:3000/api
프로덕션: https://weborder.vercel.app/api
```

### 인증 방식
- **공급자**: NextAuth.js 세션 기반 (쿠키)
- **공급받는자**: URL 토큰 + 본인 인증 코드

### 공통 응답 형식

#### 성공 응답
```json
{
  "success": true,
  "data": { ... },
  "message": "성공 메시지"
}
```

#### 에러 응답
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지",
    "details": { ... }
  }
}
```

### HTTP 상태 코드
- `200`: 성공
- `201`: 생성 성공
- `400`: 잘못된 요청
- `401`: 인증 필요
- `403`: 권한 없음
- `404`: 리소스 없음
- `422`: 유효성 검증 실패
- `429`: 요청 횟수 제한 초과
- `500`: 서버 에러

---

## 인증 API

### 1. 소셜 로그인 (Google)

#### `GET /api/auth/signin/google`

Google OAuth 로그인 시작

**요청 파라미터:** 없음

**응답:**
- 302 Redirect to Google OAuth

---

### 2. 소셜 로그인 (Kakao)

#### `GET /api/auth/signin/kakao`

Kakao OAuth 로그인 시작

---

### 3. 소셜 로그인 (Naver)

#### `GET /api/auth/signin/naver`

Naver OAuth 로그인 시작

---

### 4. 로그아웃

#### `POST /api/auth/signout`

현재 세션 로그아웃

**요청 헤더:**
```
Cookie: next-auth.session-token=...
```

**응답:**
```json
{
  "success": true,
  "message": "로그아웃되었습니다."
}
```

---

### 5. 세션 확인

#### `GET /api/auth/session`

현재 로그인 사용자 정보 조회

**응답:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "image": "https://..."
  },
  "expires": "2025-02-25T00:00:00.000Z"
}
```

---

## 사용자 API

### 1. 프로필 조회

#### `GET /api/user/profile`

로그인한 사용자의 프로필 조회

**인증:** 필수

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "phone": "010-1234-5678",
    "businessName": "홍길동 상회",
    "businessNumber": "123-45-67890",
    "address": "서울시 강남구",
    "addressDetail": "테헤란로 123",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### 2. 프로필 수정

#### `PATCH /api/user/profile`

프로필 정보 수정

**인증:** 필수

**요청 본문:**
```json
{
  "name": "홍길동",
  "phone": "010-1234-5678",
  "businessName": "홍길동 상회",
  "businessNumber": "123-45-67890",
  "address": "서울시 강남구",
  "addressDetail": "테헤란로 123"
}
```

**응답:**
```json
{
  "success": true,
  "data": { ... },
  "message": "프로필이 수정되었습니다."
}
```

---

## 주문서 API

### 1. 주문서 생성

#### `POST /api/orders`

새 주문서 생성

**인증:** 필수

**요청 본문:**
```json
{
  "recipientName": "김철수",
  "recipientBusinessName": "김철수 마트",
  "recipientBusinessNumber": "234-56-78901",
  "recipientPhone1": "010-9876-5432",
  "recipientPhone2": "02-1234-5678",
  "recipientAddress": "부산시 해운대구",
  "recipientAddressDetail": "해운대로 456",
  "deliveryDate": "2025-02-01T00:00:00.000Z",
  "deliveryTime": "09:00-12:00",
  "memo": "문 앞에 두고 가세요",
  "items": [
    {
      "itemCode": "APPLE-001",
      "itemName": "사과",
      "itemSpec": "1등급/대",
      "quantity": 10,
      "unit": "박스",
      "sortOrder": 0
    },
    {
      "itemCode": "PEAR-002",
      "itemName": "배",
      "itemSpec": "특등급/대",
      "quantity": 5,
      "unit": "박스",
      "sortOrder": 1
    }
  ]
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "orderNumber": "ORD-20250125-0001",
    "token": "access-token-uuid",
    "url": "https://weborder.vercel.app/order/access-token-uuid",
    "status": "SENT",
    "tokenExpiresAt": "2025-02-24T00:00:00.000Z",
    "createdAt": "2025-01-25T00:00:00.000Z"
  },
  "message": "주문서가 생성되었습니다."
}
```

---

### 2. 주문서 목록 조회

#### `GET /api/orders`

내가 작성한 주문서 목록 조회

**인증:** 필수

**쿼리 파라미터:**
- `status` (선택): 상태 필터 (DRAFT, SENT, REJECTED, REVIEWING, ACCEPTED, COMPLETED)
- `page` (선택): 페이지 번호 (기본: 1)
- `limit` (선택): 페이지당 개수 (기본: 20, 최대: 100)
- `sort` (선택): 정렬 기준 (createdAt, updatedAt, deliveryDate) (기본: createdAt)
- `order` (선택): 정렬 순서 (asc, desc) (기본: desc)

**응답:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "orderNumber": "ORD-20250125-0001",
        "recipientName": "김철수",
        "recipientBusinessName": "김철수 마트",
        "deliveryDate": "2025-02-01T00:00:00.000Z",
        "status": "SENT",
        "itemCount": 2,
        "createdAt": "2025-01-25T00:00:00.000Z",
        "updatedAt": "2025-01-25T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

---

### 3. 주문서 상세 조회

#### `GET /api/orders/:id`

주문서 상세 정보 조회 (공급자용)

**인증:** 필수

**경로 파라미터:**
- `id`: 주문서 ID

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-20250125-0001",
    "recipientName": "김철수",
    "recipientBusinessName": "김철수 마트",
    "recipientBusinessNumber": "234-56-78901",
    "recipientPhone1": "010-9876-5432",
    "recipientPhone2": "02-1234-5678",
    "recipientAddress": "부산시 해운대구",
    "recipientAddressDetail": "해운대로 456",
    "deliveryDate": "2025-02-01T00:00:00.000Z",
    "deliveryTime": "09:00-12:00",
    "memo": "문 앞에 두고 가세요",
    "status": "SENT",
    "token": "access-token-uuid",
    "url": "https://weborder.vercel.app/order/access-token-uuid",
    "tokenExpiresAt": "2025-02-24T00:00:00.000Z",
    "viewCount": 3,
    "lastViewedAt": "2025-01-26T10:00:00.000Z",
    "items": [
      {
        "id": "item-uuid-1",
        "itemCode": "APPLE-001",
        "itemName": "사과",
        "itemSpec": "1등급/대",
        "quantity": 10,
        "unit": "박스",
        "sortOrder": 0
      },
      {
        "id": "item-uuid-2",
        "itemCode": "PEAR-002",
        "itemName": "배",
        "itemSpec": "특등급/대",
        "quantity": 5,
        "unit": "박스",
        "sortOrder": 1
      }
    ],
    "histories": [
      {
        "id": "history-uuid-1",
        "status": "SENT",
        "changedBy": "SUPPLIER",
        "createdAt": "2025-01-25T00:00:00.000Z"
      }
    ],
    "createdAt": "2025-01-25T00:00:00.000Z",
    "updatedAt": "2025-01-25T00:00:00.000Z"
  }
}
```

---

### 4. 주문서 수정

#### `PATCH /api/orders/:id`

주문서 수정 (DRAFT 상태에서만 가능)

**인증:** 필수

**경로 파라미터:**
- `id`: 주문서 ID

**요청 본문:** 생성과 동일

**응답:**
```json
{
  "success": true,
  "data": { ... },
  "message": "주문서가 수정되었습니다."
}
```

---

### 5. 주문서 삭제

#### `DELETE /api/orders/:id`

주문서 삭제 (소프트 삭제)

**인증:** 필수

**경로 파라미터:**
- `id`: 주문서 ID

**응답:**
```json
{
  "success": true,
  "message": "주문서가 삭제되었습니다."
}
```

---

### 6. 주문서 URL 재생성

#### `POST /api/orders/:id/regenerate-token`

주문서 URL 토큰 재생성 (만료 시)

**인증:** 필수

**경로 파라미터:**
- `id`: 주문서 ID

**응답:**
```json
{
  "success": true,
  "data": {
    "token": "new-token-uuid",
    "url": "https://weborder.vercel.app/order/new-token-uuid",
    "tokenExpiresAt": "2025-02-24T00:00:00.000Z"
  },
  "message": "URL이 재생성되었습니다."
}
```

---

## 공급받는자 API (공개)

### 1. 주문서 조회 (토큰)

#### `GET /api/public/orders/:token`

URL 토큰으로 주문서 조회

**인증:** 불필요

**경로 파라미터:**
- `token`: URL 토큰

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-20250125-0001",
    "recipientName": "김철수",
    "recipientBusinessName": "김철수 마트",
    "recipientAddress": "부산시 해운대구",
    "recipientAddressDetail": "해운대로 456",
    "deliveryDate": "2025-02-01T00:00:00.000Z",
    "deliveryTime": "09:00-12:00",
    "memo": "문 앞에 두고 가세요",
    "status": "SENT",
    "items": [
      {
        "itemName": "사과",
        "itemSpec": "1등급/대",
        "quantity": 10,
        "unit": "박스"
      },
      {
        "itemName": "배",
        "itemSpec": "특등급/대",
        "quantity": 5,
        "unit": "박스"
      }
    ],
    "supplier": {
      "businessName": "홍길동 상회",
      "phone": "010-1234-****"
    },
    "isExpired": false,
    "expiresAt": "2025-02-24T00:00:00.000Z",
    "requiresVerification": true
  }
}
```

**에러:**
- `404`: 주문서 없음 또는 만료됨
- `403`: 본인 인증 필요

---

### 2. 본인 인증

#### `POST /api/public/orders/:token/verify`

핸드폰 번호 뒷자리 4자리로 본인 인증

**인증:** 불필요

**경로 파라미터:**
- `token`: URL 토큰

**요청 본문:**
```json
{
  "verificationCode": "5432"
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "verified": true,
    "sessionToken": "verification-session-token"
  },
  "message": "인증되었습니다."
}
```

**에러:**
- `401`: 인증 코드 불일치
- `429`: 인증 시도 횟수 초과 (5회)

---

### 3. 주문 상태 변경

#### `POST /api/public/orders/:token/status`

주문 상태 변경 (반려/검토중/수락)

**인증:** 본인 인증 필요 (세션)

**경로 파라미터:**
- `token`: URL 토큰

**요청 헤더:**
```
X-Verification-Token: verification-session-token
```

**요청 본문:**
```json
{
  "status": "ACCEPTED",
  "reason": "반려 사유 (선택)"
}
```

**상태값:**
- `REJECTED`: 반려
- `REVIEWING`: 검토중
- `ACCEPTED`: 수락

**응답:**
```json
{
  "success": true,
  "data": {
    "status": "ACCEPTED",
    "updatedAt": "2025-01-26T10:00:00.000Z"
  },
  "message": "주문이 수락되었습니다."
}
```

---

## 도착지 관리 API

### 1. 저장된 도착지 목록

#### `GET /api/destinations`

저장된 도착지 목록 조회

**인증:** 필수

**쿼리 파라미터:**
- `search` (선택): 검색어 (별칭, 상호)
- `sort` (선택): 정렬 (lastUsedAt, usageCount) (기본: lastUsedAt)

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nickname": "서울 본사",
      "businessName": "김철수 마트",
      "businessNumber": "234-56-78901",
      "contactName": "김철수",
      "phone1": "010-9876-5432",
      "phone2": "02-1234-5678",
      "address": "서울시 강남구",
      "addressDetail": "테헤란로 123",
      "isDefault": true,
      "usageCount": 15,
      "lastUsedAt": "2025-01-25T00:00:00.000Z"
    }
  ]
}
```

---

### 2. 도착지 생성

#### `POST /api/destinations`

새 도착지 저장

**인증:** 필수

**요청 본문:**
```json
{
  "nickname": "부산 지점",
  "businessName": "김철수 마트 부산점",
  "businessNumber": "345-67-89012",
  "contactName": "이영희",
  "phone1": "010-1111-2222",
  "phone2": "051-1234-5678",
  "address": "부산시 해운대구",
  "addressDetail": "해운대로 456",
  "isDefault": false
}
```

**응답:**
```json
{
  "success": true,
  "data": { ... },
  "message": "도착지가 저장되었습니다."
}
```

---

### 3. 도착지 수정

#### `PATCH /api/destinations/:id`

도착지 정보 수정

**인증:** 필수

---

### 4. 도착지 삭제

#### `DELETE /api/destinations/:id`

도착지 삭제

**인증:** 필수

---

## 품목 관리 API

### 1. 최근 품목 목록

#### `GET /api/recent-items`

최근 입력한 품목 목록 (자동완성용)

**인증:** 필수

**쿼리 파라미터:**
- `search` (선택): 검색어 (품목명)
- `limit` (선택): 개수 (기본: 10, 최대: 50)

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "itemCode": "APPLE-001",
      "itemName": "사과",
      "itemSpec": "1등급/대",
      "unit": "박스",
      "usageCount": 25,
      "lastUsedAt": "2025-01-25T00:00:00.000Z"
    }
  ]
}
```

---

## 알림 API

### 1. 알림 목록

#### `GET /api/notifications`

내 알림 목록 조회

**인증:** 필수

**쿼리 파라미터:**
- `page` (선택): 페이지 번호 (기본: 1)
- `limit` (선택): 페이지당 개수 (기본: 20)

**응답:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "STATUS_CHANGED",
        "title": "주문 상태 변경",
        "message": "김철수 마트의 주문이 수락되었습니다.",
        "status": "SENT",
        "sentAt": "2025-01-26T10:00:00.000Z",
        "createdAt": "2025-01-26T10:00:00.000Z",
        "order": {
          "id": "uuid",
          "orderNumber": "ORD-20250125-0001"
        }
      }
    ],
    "pagination": { ... }
  }
}
```

---

## 통계 API

### 1. 대시보드 통계

#### `GET /api/dashboard/stats`

대시보드용 통계 데이터

**인증:** 필수

**쿼리 파라미터:**
- `period` (선택): 기간 (day, week, month) (기본: month)

**응답:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "pendingOrders": 10,
    "acceptedOrders": 120,
    "rejectedOrders": 20,
    "acceptanceRate": 85.7,
    "recentOrders": [
      {
        "id": "uuid",
        "orderNumber": "ORD-20250125-0001",
        "recipientBusinessName": "김철수 마트",
        "status": "ACCEPTED",
        "deliveryDate": "2025-02-01T00:00:00.000Z"
      }
    ],
    "expiringOrders": [
      {
        "id": "uuid",
        "orderNumber": "ORD-20250120-0001",
        "expiresAt": "2025-01-27T00:00:00.000Z"
      }
    ]
  }
}
```

---

## Rate Limiting

모든 API는 Rate Limiting이 적용됩니다:

### 인증된 사용자
- 일반 API: 100 req/min
- 주문서 생성: 20 req/min

### 공개 API (공급받는자)
- 주문서 조회: 30 req/min
- 본인 인증: 5 req/min (실패 시 5회까지만 허용)
- 상태 변경: 10 req/min

### Rate Limit 초과 시
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.",
    "retryAfter": 60
  }
}
```

---

## Webhook (Phase 2)

카카오톡 알림 발송 실패 시 재시도를 위한 Webhook

### 1. 알림 발송 실패 Webhook

#### `POST /api/webhooks/notification-failed`

**요청 본문:**
```json
{
  "notificationId": "uuid",
  "error": "발송 실패 사유"
}
```

---

## 에러 코드

| 코드 | 설명 |
|------|------|
| `UNAUTHORIZED` | 인증 필요 |
| `FORBIDDEN` | 권한 없음 |
| `NOT_FOUND` | 리소스 없음 |
| `VALIDATION_ERROR` | 유효성 검증 실패 |
| `TOKEN_EXPIRED` | 토큰 만료 |
| `VERIFICATION_FAILED` | 본인 인증 실패 |
| `RATE_LIMIT_EXCEEDED` | 요청 횟수 초과 |
| `ORDER_NOT_EDITABLE` | 수정 불가능한 주문서 |
| `INTERNAL_SERVER_ERROR` | 서버 에러 |
