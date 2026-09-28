# [PRD] 토스페이먼츠 샌드박스 연동 이커머스 결제 & 대시보드 시스템

---

## 1. 프로젝트 개요 (Overview)

* **목적**: LGE.COM 주문결제 UX를 벤치마킹한 실감나는 이커머스 체크아웃 화면과 토스페이먼츠 Sandbox API를 연동하여, 결제(인증-승인-취소) 전체 라이프사이클을 테스트하고 결제 통계 및 이력을 실시간으로 관리하는 대시보드 시스템 구축.
* **핵심 타깃**: 토스페이먼츠 결제 파이프라인 및 주문/결제 데이터 정합성을 빠르게 검증하고 직관적으로 관리하고자 하는 개발자 및 운영자.
* **핵심 플로우**:
  1. **대시보드(`/`)**: 첫 진입 시 결제/취소 통계(KPI 카드, 매출 추이 차트, 수단별 비중) 및 내역 테이블을 확인. (초기 샘플 시드 데이터 내장으로 즉시 시각화 확인 가능)
  2. **새 결제 테스트**: 대시보드 내 **[결제 하기]** 버튼 클릭 시 **LGE.COM 스타일의 체크아웃 페이지(`/checkout`)**로 이동.
  3. **체크아웃 진행**: 정수기/냉장고 필터 2종(수량 조절 및 할인율 적용), 배송/할인 정보 입력, 결제수단 선택 후 토스 일반 결제창 SDK 호출.
  4. **승인 및 DB 동기화**: 샌드박스 결제 성공 시 승인 API(`/api/payments/confirm`)를 거쳐 DB 영속화 후 결과 페이지 표시, 대시보드로 복귀 시 실시간 통계 반영.
  5. **취소(환불) 관리**: 대시보드 결제 내역에서 [결제 취소] 모달을 띄워 토스 취소 API 호출 및 DB 상태 갱신.

---

## 2. 화면 및 UX 구조 (User Flow & UI Design)

### 2.1. 첫 화면: 관리자 대시보드 (`/`)

1. **상단 네비게이션 & 액션 영역**
   * 서비스 로고/타이틀 (`Vibe Pay Admin`) 및 `Toss Sandbox Active` 상태 배지.
   * **[결제 하기] (새 주문 테스트)** 메인 CTA 버튼: 클릭 시 `/checkout` 페이지로 바로 이동.
2. **KPI 요약 통계 카드**
   * **총 누적 결제액**: 승인 완료(`DONE`) 건의 총 결제 금액 합계.
   * **금일 결제액**: 당일 승인된 실시간 매출액.
   * **결제 성공 건수**: 승인 완료 건수.
   * **취소/환불 건수 & 금액**: 전액/부분 취소된 총 금액 및 건수.
   * **취소율(%)**: 전체 승인 대비 취소 건수 비율.
3. **통계 시각화 차트 (Recharts)**
   * **매출 및 주문 추이 차트**: 일별/기간별 결제 금액 및 결제 건수 추이 (라인/바 혼합형 차트).
   * **결제 수단별 비중 차트**: 신용카드, 간편결제, 가상계좌 등 결제 수단 점유율 (도넛 차트).
4. **결제 및 취소 내역 관리 테이블**
   * **표시 컬럼**: 주문 번호(`orderId`), 결제 키(`paymentKey`), 주문 상품명, 결제 금액, 잔여 금액, 결제 수단, 결제 상태(`DONE`, `CANCELED`, `PARTIAL_CANCELED`), 승인 일시, 작업.
   * **필터 & 검색**: 상태 탭(전체/완료/취소), 주문번호/주문자명 검색, 최신순/금액순 정렬, 페이지네이션.
5. **결제 취소(환불) 모달**
   * 테이블 행의 [취소] 버튼 클릭 시 모달 오픈.
   * 취소 가능 잔액 확인, 취소 유형(전액 취소 / 부분 취소 금액 입력), 취소 사유(필수) 입력.
   * [취소 실행] 클릭 시 토스페이먼츠 취소 API 호출 및 DB 상태 실시간 갱신.
6. **초기 시드 데이터 자동 구성**
   * 프로젝트 최초 실행 시, 대시보드 차트와 테이블이 즉시 활성화되도록 현실감 있는 5~8건의 최근 결제/취소 시드 데이터 제공.

---

### 2.2. 주문결제 페이지 (`/checkout` - LGE.COM 레퍼런스 스타일)

> **디자인 벤치마크**: 첨부된 LGE.COM 주문결제 페이지 레이아웃과 감성을 충실히 반영하여, 좌측 주문서 폼과 우측 Sticky 결제 요약 카드의 2열 레이아웃으로 구성.

```
+-----------------------------------------------------------------------------------+
|  [LG전자 스타일 로고]  주문결제                                                    |
+----------------------------------------------------------+------------------------+
| [좌측 메인 영역]                                         | [우측 Sticky 사이드바] |
| 1. 주문 제품 리스트                                      |                        |
|    - 정수기 박테리아 멀티 필터                            |  [결제 금액 요약 카드] |
|      (AGM75450001, 수량조절, 24% 29,700원 정가 39,500원) |  - 제품 수: N개        |
|    - 냉장고/정수기 중금속7 흡착 필터                     |  - 주문금액: 합계원    |
|      (AGM75449901, 수량조절, 24% 33,500원 정가 44,600원) |  - 할인금액: -할인원   |
|                                                          |  - 배송비: 0원         |
| 2. 주문자 정보                                           |  - 포인트 사용: 0원    |
|    - 이름 / 휴대폰 번호 (기본값 제공 및 수정 가능)        |  --------------------  |
|                                                          |  최종 결제금액: XXXX원 |
| 3. 배송 정보                                             |                        |
|    - 배송지 주소 / [변경] 버튼                           |  [v] 약관 동의 체크     |
|    - 배송 요청 메시지 셀렉트 드롭다운                    |                        |
|                                                          |  [ XXX,XXX원 결제하기 ]|
| 4. 할인 혜택                                             |  (LGE 시그니처 레드)   |
|    - 회원할인 (-4,300원) / 임직원할인 (-16,600원)        |                        |
|    - LG전자 멤버십 포인트 입력 & [사용] / [전체 사용]     |                        |
|                                                          |                        |
| 5. 결제 수단 선택 (일반 결제창 SDK 연계)                 |                        |
|    - [ ] LGE.COM 제휴카드                                |                        |
|    - [o] 일반결제 (신한, 현대, 국민, 롯데, 하나, 우리 등)|                        |
|    - [ ] 간편결제 (카카오페이, 토스페이, 네이버페이 등)  |                        |
|    - [ ] 현금 (가상계좌)                                 |                        |
+----------------------------------------------------------+------------------------+
```

1. **주문 제품 섹션**:
   * 정수기 필터, 냉장고 필터 2종 기본 배치, 썸네일, 모델코드, 수량 조절 버튼(+/-), 할인율(24%), 실시간 판매가/정상가 표시.
2. **주문자 & 배송지 정보**:
   * 기본 배송지 정보(수령인, 연락처, 주소, 배송 요청사항 셀렉트박스) 제공.
3. **할인 혜택**:
   * 회원할인 및 추가 할인 항목 표시, 포인트 인풋 입력 인터랙션.
4. **결제 수단 선택 UI**:
   * 첨부 이미지와 동일한 카드사 그리드(신한, 현대, KB국민, 롯데, 하나Pay, NH농협, 우리, 기타) 버튼 인터랙션.
   * 간편결제 및 가상계좌 선택 라디오 지원.
5. **우측 Sticky 결제 금액 요약 카드**:
   * 전체 합계, 제품 수, 주문금액, 할인금액, 배송비, 최종 결제금액 실시간 합산.
   * 약관 확인 및 결제 동의 체크박스.
   * `[최종금액 결제하기]` 시그니처 레드 버튼 -> 토스 일반 결제창(`loadTossPayments` -> `requestPayment`) 호출.

---

### 2.3. 결제 결과 및 콜백 라우트

1. **성공 라우트 (`/checkout/success`)**
   * 쿼리스트링(`paymentKey`, `orderId`, `amount`) 수신.
   * 백엔드 승인 API(`/api/payments/confirm`) 호출 후 승인 완료 응답 수신.
   * 결제 완료 카드: 주문번호, 승인시각, 결제수단, 결제금액, 영수증 보기 링크.
   * [대시보드로 돌아가기] 버튼을 통해 대시보드로 이동 시 통계에 즉시 반영.
2. **실패 라우트 (`/checkout/fail`)**
   * 토스페이먼츠 오류 코드(`code`) 및 오류 메시지(`message`)를 파싱하여 친절한 에러 카드 표시.
   * [다시 결제하기] 및 [대시보드로 이동] 버튼 제공.

---

## 3. 백엔드 및 토스페이먼츠 API 연동 사양

### 3.1. 토스페이먼츠 샌드박스 연동
* **SDK**: 토스페이먼츠 JavaScript SDK (클라이언트: `loadTossPayments`)
* **승인 API**: `POST https://api.tosspayments.com/v1/payments/confirm`
* **취소 API**: `POST https://api.tosspayments.com/v1/payments/{paymentKey}/cancel`
* **인증 방식**: HTTP Basic Auth
  * Header: `Authorization: Basic {Base64(TOSS_SECRET_KEY + ":")}`
* **결제 무결성 검증**:
  * 결제창 호출 전 `POST /api/orders`로 주문 고유번호(`orderId`) 및 금액(`amount`)을 DB에 임시 저장.
  * 승인 요청 시 전달받은 금액이 DB의 해당 `Order.amount`와 정확히 일치하는지 대조 후 토스 승인 API 호출.

### 3.2. 백엔드 REST API 명세

| Method | Endpoint | 역할 | Payload / Query |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders` | 결제 전 주문 가등록 및 사전 금액 검증 데이터 생성 | `orderId`, `orderName`, `amount`, `customerName`, `customerPhone`, `items` |
| `POST` | `/api/payments/confirm` | 토스페이먼츠 승인 요청 및 Payment 레코드 저장 | `paymentKey`, `orderId`, `amount` |
| `POST` | `/api/payments/cancel` | 토스 결제 취소 요청 및 상태 갱신, 취소 이력 저장 | `paymentKey`, `cancelReason`, `cancelAmount` |
| `GET` | `/api/dashboard/stats` | 대시보드 KPI 카드 및 차트용 집계 통계 데이터 조회 | `period` (`today`, `week`, `month`, `all`) |
| `GET` | `/api/dashboard/payments` | 결제/취소 목록 페이징 및 필터 검색 조회 | `page`, `limit`, `status`, `search` |

---

## 4. 데이터베이스 모델링 (Prisma Schema - SQLite 기반)

> 바이브 코딩 및 로컬 환경에서 별도의 외부 DB 설치 없이 즉시 실행 및 테스트가 가능하도록 SQLite를 기본 채택 (추후 PostgreSQL로 손쉽게 전환 가능).

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Order {
  id            String      @id @default(uuid())
  orderId       String      @unique // 고유 주문 번호 (ORDER_UUID_timestamp)
  orderName     String      // 대표 주문명
  amount        Int         // 결제 예정 총액
  customerName  String      // 구매자명
  customerPhone String?     // 구매자 연락처
  customerEmail String?     // 구매자 이메일
  address       String?     // 배송지 주소
  orderItems    OrderItem[]
  status        String      @default("PENDING") // PENDING, PAID, CANCELED, FAILED
  payment       Payment?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model OrderItem {
  id        String  @id @default(uuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [orderId], onDelete: Cascade)
  productId String
  name      String
  modelCode String?
  price     Int
  quantity  Int
  imageUrl  String?
}

model Payment {
  id            String          @id @default(uuid())
  paymentKey    String          @unique // 토스 발급 결제 키
  orderId       String          @unique
  order         Order           @relation(fields: [orderId], references: [orderId])
  amount        Int             // 최초 결제 금액
  balanceAmount Int             // 취소 후 남은 잔여 금액
  method        String          // CARD, EASY_PAY, VIRTUAL_ACCOUNT 등
  status        String          // DONE, CANCELED, PARTIAL_CANCELED, ABORTED
  approvedAt    DateTime?       // 승인 일시
  receiptUrl    String?         // 매출전표 영수증 링크
  cancels       CancelHistory[]
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
}

model CancelHistory {
  id           String   @id @default(uuid())
  paymentId    String
  payment      Payment  @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  cancelAmount Int      // 취소된 금액
  cancelReason String   // 취소 사유
  canceledAt   DateTime @default(now())
}
```

---

## 5. 기술 스택 & 환경 설정

* **프레임워크**: Next.js 14+ (App Router), React 18, TypeScript
* **스타일링**: Tailwind CSS, Lucide Icons, 커스텀 LGE.COM 컴포넌트 디자인
* **차트 시각화**: Recharts (대시보드 KPI 추이 및 도넛 차트)
* **ORM & DB**: Prisma ORM + SQLite (`file:./dev.db`)
* **결제 연동**: `@tosspayments/payment-sdk` (또는 `@tosspayments/tosspayments-sdk`) + Toss REST API
* **환경 변수 (`.env.local`)**:
  ```env
  DATABASE_URL="file:./dev.db"
  NEXT_PUBLIC_TOSS_CLIENT_KEY="test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq"
  TOSS_SECRET_KEY="test_sk_zXLkKEypNArWmo50nX3mqGbpgm79"
  NEXT_PUBLIC_APP_URL="http://localhost:3000"
  ```
