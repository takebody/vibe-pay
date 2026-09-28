import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmTossPayment } from "@/lib/toss";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { paymentKey, orderId, amount } = body;

    if (!paymentKey || !orderId || typeof amount !== "number") {
      return NextResponse.json(
        { error: "필수 결제 승인 정보(paymentKey, orderId, amount)가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 1. Validate against DB Order record (Prevent amount tampering)
    const existingOrder = await prisma.order.findUnique({
      where: { orderId },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "해당 주문 정보(orderId)를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (existingOrder.amount !== amount) {
      console.error(
        `Amount mismatch detected! DB: ${existingOrder.amount}, Received: ${amount}`
      );
      return NextResponse.json(
        {
          error: "주문 금액이 일치하지 않아 결제 승인을 진행할 수 없습니다. (금액 변조 차단)",
        },
        { status: 400 }
      );
    }

    // 2. Call Toss Payments Confirm API (Server to Server with Basic Auth)
    const tossResult = await confirmTossPayment({
      paymentKey,
      orderId,
      amount,
    });

    const approvedAt = tossResult.approvedAt
      ? new Date(tossResult.approvedAt)
      : new Date();
    const receiptUrl =
      tossResult.receipt?.url || tossResult.card?.receiptUrl || null;
    const method = tossResult.method || "CARD";
    const status = tossResult.status || "DONE";

    // 3. Update Order and upsert Payment in DB
    const [updatedOrder, payment] = await prisma.$transaction([
      prisma.order.update({
        where: { orderId },
        data: { status: "PAID" },
      }),
      prisma.payment.upsert({
        where: { paymentKey },
        create: {
          paymentKey,
          orderId,
          amount,
          balanceAmount: tossResult.balanceAmount ?? amount,
          method,
          status,
          approvedAt,
          receiptUrl,
        },
        update: {
          amount,
          balanceAmount: tossResult.balanceAmount ?? amount,
          method,
          status,
          approvedAt,
          receiptUrl,
        },
        include: {
          order: {
            include: {
              orderItems: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      payment,
      toss: tossResult,
    });
  } catch (error: unknown) {
    console.error("Payment confirmation error:", error);
    const message = (error as Error).message || "결제 승인 처리 중 오류가 발생했습니다.";
    return NextResponse.json(
      { error: message },
      { status: (error as unknown as { status?: number }).status || 500 }
    );
  }
}
