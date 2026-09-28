import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      orderId,
      orderName,
      amount,
      customerName,
      customerPhone,
      customerEmail,
      address,
      items,
    } = body;

    if (!orderId || !orderName || typeof amount !== "number" || !customerName) {
      return NextResponse.json(
        { error: "필수 주문 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // Check if orderId already exists
    const existing = await prisma.order.findUnique({
      where: { orderId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "이미 존재하는 주문번호입니다." },
        { status: 409 }
      );
    }

    const order = await prisma.order.create({
      data: {
        orderId,
        orderName,
        amount,
        customerName,
        customerPhone,
        customerEmail,
        address,
        status: "PENDING",
        orderItems: items && Array.isArray(items) && items.length > 0
          ? {
              create: items.map((item: {
                productId: string;
                name: string;
                modelCode?: string;
                price: number;
                quantity: number;
                imageUrl?: string;
              }) => ({
                productId: item.productId,
                name: item.name,
                modelCode: item.modelCode,
                price: item.price,
                quantity: item.quantity,
                imageUrl: item.imageUrl,
              })),
            }
          : undefined,
      },
      include: {
        orderItems: true,
      },
    });

    return NextResponse.json({ success: true, order });
  } catch (error: unknown) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "주문 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
