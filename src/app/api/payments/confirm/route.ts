import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmTossPayment, getTossPayment, TossPaymentResponse } from "@/lib/toss";

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

    // 1. Idempotency Check: If payment is already approved and recorded in DB, return success
    const existingPayment = await prisma.payment.findUnique({
      where: { paymentKey },
      include: {
        order: {
          include: {
            orderItems: true,
          },
        },
      },
    });

    if (existingPayment && (existingPayment.status === "DONE" || existingPayment.status === "PAID")) {
      return NextResponse.json({
        success: true,
        order: existingPayment.order,
        payment: existingPayment,
        alreadyProcessed: true,
      });
    }

    // 2. Validate against DB Order record (Prevent amount tampering)
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

    // 3. Call Toss Payments Confirm API (with concurrency / ALREADY_PROCESSING_REQUEST tolerance)
    let tossResult: TossPaymentResponse;

    try {
      tossResult = await confirmTossPayment({
        paymentKey,
        orderId,
        amount,
      });
    } catch (confirmError: unknown) {
      const code = (confirmError as { code?: string }).code || "";
      const msg = (confirmError as Error).message || "";

      // If Toss Payments reports already processing or already approved, handle gracefully
      if (
        code === "ALREADY_PROCESSING_REQUEST" ||
        code === "ALREADY_APPROVED_PAYMENT" ||
        msg.includes("ALREADY_")
      ) {
        console.warn(`Toss payment ${paymentKey} is already processing or approved. Resolving status...`);

        // Wait briefly (1.5s) for any concurrent in-flight approval to finalize
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Re-check DB in case concurrent request completed
        const paymentAfterWait = await prisma.payment.findUnique({
          where: { paymentKey },
          include: {
            order: {
              include: {
                orderItems: true,
              },
            },
          },
        });

        if (paymentAfterWait && paymentAfterWait.status === "DONE") {
          return NextResponse.json({
            success: true,
            order: paymentAfterWait.order,
            payment: paymentAfterWait,
            alreadyProcessed: true,
          });
        }

        // Query Toss Payments GET API directly
        try {
          tossResult = await getTossPayment(paymentKey);
          if (tossResult.status !== "DONE") {
            throw confirmError;
          }
        } catch {
          throw confirmError;
        }
      } else {
        throw confirmError;
      }
    }

    const approvedAt = tossResult.approvedAt
      ? new Date(tossResult.approvedAt)
      : new Date();
    const receiptUrl =
      tossResult.receipt?.url || tossResult.card?.receiptUrl || null;
    const method = tossResult.method || "CARD";
    const status = tossResult.status || "DONE";

    // 4. Update Order and upsert Payment in DB
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
