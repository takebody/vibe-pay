import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cancelTossPayment } from "@/lib/toss";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { paymentKey, cancelReason, cancelAmount } = body;

    if (!paymentKey || !cancelReason) {
      return NextResponse.json(
        { error: "결제 키(paymentKey)와 취소 사유(cancelReason)는 필수 항목입니다." },
        { status: 400 }
      );
    }

    // 1. Find payment record
    const payment = await prisma.payment.findUnique({
      where: { paymentKey },
      include: { order: true },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "해당 결제 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (payment.balanceAmount <= 0) {
      return NextResponse.json(
        { error: "이미 전액 취소 완료된 결제 건입니다." },
        { status: 400 }
      );
    }

    const requestedAmount =
      typeof cancelAmount === "number" && cancelAmount > 0
        ? cancelAmount
        : payment.balanceAmount;

    if (requestedAmount > payment.balanceAmount) {
      return NextResponse.json(
        {
          error: `취소 가능 잔액(${payment.balanceAmount.toLocaleString()}원)보다 큰 금액은 취소할 수 없습니다.`,
        },
        { status: 400 }
      );
    }

    // 2. Call Toss Payments Cancel API
    const tossResult = await cancelTossPayment({
      paymentKey,
      cancelReason,
      cancelAmount: requestedAmount,
    });

    const newBalance = tossResult.balanceAmount ?? (payment.balanceAmount - requestedAmount);
    const newStatus = tossResult.status || (newBalance === 0 ? "CANCELED" : "PARTIAL_CANCELED");

    // 3. Update DB in transaction
    const [updatedPayment, cancelHistory] = await prisma.$transaction([
      prisma.payment.update({
        where: { paymentKey },
        data: {
          balanceAmount: newBalance,
          status: newStatus,
          order: newBalance === 0 ? { update: { status: "CANCELED" } } : undefined,
        },
        include: {
          order: true,
          cancels: {
            orderBy: { canceledAt: "desc" },
          },
        },
      }),
      prisma.cancelHistory.create({
        data: {
          paymentId: payment.id,
          cancelAmount: requestedAmount,
          cancelReason,
          canceledAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      cancelHistory,
      toss: tossResult,
    });
  } catch (error: unknown) {
    console.error("Payment cancel error:", error);
    const message = (error as Error).message || "결제 취소 처리 중 오류가 발생했습니다.";
    return NextResponse.json(
      { error: message },
      { status: (error as unknown as { status?: number }).status || 500 }
    );
  }
}
