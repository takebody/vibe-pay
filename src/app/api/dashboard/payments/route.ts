import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));
    const status = searchParams.get("status") || "ALL";
    const search = searchParams.get("search")?.trim() || "";
    const month = searchParams.get("month")?.trim() || ""; // Format: YYYY-MM
    const startDate = searchParams.get("startDate")?.trim() || ""; // Format: YYYY-MM-DD
    const endDate = searchParams.get("endDate")?.trim() || ""; // Format: YYYY-MM-DD

    const skip = (page - 1) * limit;

    // Build filter where clause
    const where: Record<string, unknown> = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    // Date / Month range filtering
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [yearStr, monthStr] = month.split("-");
      const year = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      const startOfMonth = new Date(year, m - 1, 1, 0, 0, 0, 0);
      const endOfMonth = new Date(year, m, 0, 23, 59, 59, 999);

      where.createdAt = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    } else if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        dateFilter.gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        dateFilter.lte = e;
      }
      where.createdAt = dateFilter;
    }

    if (search) {
      where.OR = [
        { paymentKey: { contains: search } },
        { orderId: { contains: search } },
        {
          order: {
            OR: [
              { orderName: { contains: search } },
              { customerName: { contains: search } },
              { customerPhone: { contains: search } },
            ],
          },
        },
      ];
    }

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        include: {
          order: {
            include: {
              orderItems: true,
            },
          },
          cancels: {
            orderBy: { canceledAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      success: true,
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: unknown) {
    console.error("Dashboard payments list error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "결제 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
