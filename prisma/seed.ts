import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.cancelHistory.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();

  const now = new Date();
  const subDays = (d: number, h: number = 0) => {
    const target = new Date(now.getTime() - d * 24 * 60 * 60 * 1000 - h * 60 * 60 * 1000);
    return target;
  };

  const seedOrders = [
    {
      orderId: "ORDER_20260928_001",
      orderName: "정수기 박테리아 멀티 필터 외 1건",
      amount: 63200,
      customerName: "김대환",
      customerPhone: "010-8472-0411",
      customerEmail: "dh.kim@lge.test",
      address: "경기 군포시 수리산로 244 (산본동, 한양백두아파트) 990동 1902호",
      status: "PAID",
      createdAt: subDays(0, 2),
      items: [
        {
          productId: "AGM75450001",
          name: "정수기 박테리아 멀티 필터",
          modelCode: "AGM75450001",
          price: 29700,
          quantity: 1,
          imageUrl: "/images/filter_mult.png",
        },
        {
          productId: "AGM75449901",
          name: "냉장고/정수기 중금속7 흡착 필터",
          modelCode: "AGM75449901",
          price: 33500,
          quantity: 1,
          imageUrl: "/images/filter_heavy.png",
        },
      ],
      payment: {
        paymentKey: "toss_pk_live_seed_001",
        amount: 63200,
        balanceAmount: 63200,
        method: "CARD",
        status: "DONE",
        approvedAt: subDays(0, 2),
        receiptUrl: "https://dashboard.tosspayments.com/receipt/sample-001",
      },
    },
    {
      orderId: "ORDER_20260928_002",
      orderName: "냉장고/정수기 중금속7 흡착 필터",
      amount: 33500,
      customerName: "이서연",
      customerPhone: "010-3819-2041",
      customerEmail: "sy.lee@test.com",
      address: "서울시 강남구 테헤란로 152 강남파이낸스센터 12층",
      status: "PAID",
      createdAt: subDays(0, 5),
      items: [
        {
          productId: "AGM75449901",
          name: "냉장고/정수기 중금속7 흡착 필터",
          modelCode: "AGM75449901",
          price: 33500,
          quantity: 1,
          imageUrl: "/images/filter_heavy.png",
        },
      ],
      payment: {
        paymentKey: "toss_pk_live_seed_002",
        amount: 33500,
        balanceAmount: 33500,
        method: "EASY_PAY",
        status: "DONE",
        approvedAt: subDays(0, 5),
        receiptUrl: "https://dashboard.tosspayments.com/receipt/sample-002",
      },
    },
    {
      orderId: "ORDER_20260927_001",
      orderName: "정수기 박테리아 멀티 필터",
      amount: 29700,
      customerName: "박지훈",
      customerPhone: "010-9921-7712",
      customerEmail: "jh.park@sample.com",
      address: "경기도 성남시 분당구 판교역로 166",
      status: "PAID",
      createdAt: subDays(1, 3),
      items: [
        {
          productId: "AGM75450001",
          name: "정수기 박테리아 멀티 필터",
          modelCode: "AGM75450001",
          price: 29700,
          quantity: 1,
          imageUrl: "/images/filter_mult.png",
        },
      ],
      payment: {
        paymentKey: "toss_pk_live_seed_003",
        amount: 29700,
        balanceAmount: 29700,
        method: "CARD",
        status: "DONE",
        approvedAt: subDays(1, 3),
        receiptUrl: "https://dashboard.tosspayments.com/receipt/sample-003",
      },
    },
    {
      orderId: "ORDER_20260926_001",
      orderName: "정수기 필터 세트 3개",
      amount: 89100,
      customerName: "최민수",
      customerPhone: "010-5541-0192",
      customerEmail: "ms.choi@test.org",
      address: "인천광역시 연수구 송도과학로 32",
      status: "CANCELED",
      createdAt: subDays(2, 6),
      items: [
        {
          productId: "AGM75450001",
          name: "정수기 박테리아 멀티 필터",
          modelCode: "AGM75450001",
          price: 89100,
          quantity: 3,
          imageUrl: "/images/filter_mult.png",
        },
      ],
      payment: {
        paymentKey: "toss_pk_live_seed_004",
        amount: 89100,
        balanceAmount: 0,
        method: "CARD",
        status: "CANCELED",
        approvedAt: subDays(2, 6),
        receiptUrl: "https://dashboard.tosspayments.com/receipt/sample-004",
        cancels: [
          {
            cancelAmount: 89100,
            cancelReason: "고객 단순 변심으로 인한 전액 주문 취소",
            canceledAt: subDays(2, 2),
          },
        ],
      },
    },
    {
      orderId: "ORDER_20260925_001",
      orderName: "정수기/냉장고 복합 필터 4개",
      amount: 126400,
      customerName: "한지민",
      customerPhone: "010-7731-9014",
      customerEmail: "jm.han@kakao.test",
      address: "부산광역시 해운대구 마린시티2로 33",
      status: "PAID",
      createdAt: subDays(3, 4),
      items: [
        {
          productId: "AGM75449901",
          name: "냉장고/정수기 중금속7 흡착 필터",
          modelCode: "AGM75449901",
          price: 126400,
          quantity: 4,
          imageUrl: "/images/filter_heavy.png",
        },
      ],
      payment: {
        paymentKey: "toss_pk_live_seed_005",
        amount: 126400,
        balanceAmount: 63200,
        method: "CARD",
        status: "PARTIAL_CANCELED",
        approvedAt: subDays(3, 4),
        receiptUrl: "https://dashboard.tosspayments.com/receipt/sample-005",
        cancels: [
          {
            cancelAmount: 63200,
            cancelReason: "수량 2개 부분 취소 요청 (남은 수량 2개)",
            canceledAt: subDays(3, 1),
          },
        ],
      },
    },
    {
      orderId: "ORDER_20260924_001",
      orderName: "공기청정기 프리미엄 필터 케어",
      amount: 54000,
      customerName: "윤도현",
      customerPhone: "010-4491-8812",
      customerEmail: "dh.yoon@test.com",
      address: "대전광역시 유성구 대학로 291",
      status: "PAID",
      createdAt: subDays(4, 7),
      items: [
        {
          productId: "AAFT750001",
          name: "공기청정기 프리미엄 토탈 필터",
          modelCode: "AAFT750001",
          price: 54000,
          quantity: 1,
          imageUrl: "/images/filter_mult.png",
        },
      ],
      payment: {
        paymentKey: "toss_pk_live_seed_006",
        amount: 54000,
        balanceAmount: 54000,
        method: "EASY_PAY",
        status: "DONE",
        approvedAt: subDays(4, 7),
        receiptUrl: "https://dashboard.tosspayments.com/receipt/sample-006",
      },
    },
    {
      orderId: "ORDER_20260923_001",
      orderName: "식기세척기 전용 케어 패키지",
      amount: 42000,
      customerName: "송혜교",
      customerPhone: "010-1284-5591",
      customerEmail: "hk.song@test.net",
      address: "대구광역시 수성구 달구벌대로 2450",
      status: "PAID",
      createdAt: subDays(5, 5),
      items: [
        {
          productId: "DWC882001",
          name: "식기세척기 연수 연화 필터",
          modelCode: "DWC882001",
          price: 42000,
          quantity: 1,
          imageUrl: "/images/filter_heavy.png",
        },
      ],
      payment: {
        paymentKey: "toss_pk_live_seed_007",
        amount: 42000,
        balanceAmount: 42000,
        method: "VIRTUAL_ACCOUNT",
        status: "DONE",
        approvedAt: subDays(5, 5),
        receiptUrl: "https://dashboard.tosspayments.com/receipt/sample-007",
      },
    },
    {
      orderId: "ORDER_20260922_001",
      orderName: "스타일러 아로마 시트 & 필터",
      amount: 38000,
      customerName: "정우성",
      customerPhone: "010-8842-1920",
      customerEmail: "ws.jung@film.test",
      address: "광주광역시 서구 상무중앙로 110",
      status: "PAID",
      createdAt: subDays(6, 8),
      items: [
        {
          productId: "STY991001",
          name: "스타일러 리프레시 아로마 필터 세트",
          modelCode: "STY991001",
          price: 38000,
          quantity: 1,
          imageUrl: "/images/filter_mult.png",
        },
      ],
      payment: {
        paymentKey: "toss_pk_live_seed_008",
        amount: 38000,
        balanceAmount: 38000,
        method: "CARD",
        status: "DONE",
        approvedAt: subDays(6, 8),
        receiptUrl: "https://dashboard.tosspayments.com/receipt/sample-008",
      },
    },
  ];

  for (const o of seedOrders) {
    const { items, payment, ...orderData } = o;
    await prisma.order.create({
      data: {
        ...orderData,
        orderItems: {
          create: items,
        },
        payment: {
          create: {
            paymentKey: payment.paymentKey,
            amount: payment.amount,
            balanceAmount: payment.balanceAmount,
            method: payment.method,
            status: payment.status,
            approvedAt: payment.approvedAt,
            receiptUrl: payment.receiptUrl,
            cancels: payment.cancels
              ? {
                  create: payment.cancels,
                }
              : undefined,
          },
        },
      },
    });
  }

  console.log(`✅ Seeded ${seedOrders.length} sample orders and payments successfully!`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
