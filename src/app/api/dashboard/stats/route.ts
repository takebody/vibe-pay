import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "7", 10);

    const payments = await prisma.payment.findMany({
      include: {
        cancels: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const cancels = await prisma.cancelHistory.findMany({
      orderBy: { canceledAt: "desc" },
    });

    // KPI Calculations
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let totalSales = 0;
    let todaySales = 0;
    let successCount = 0;
    let canceledCount = 0;

    for (const p of payments) {
      if (p.status === "DONE" || p.status === "PARTIAL_CANCELED") {
        successCount++;
        totalSales += p.amount;
      } else if (p.status === "CANCELED") {
        canceledCount++;
      }

      const pDate = p.approvedAt || p.createdAt;
      if (pDate >= todayStart && (p.status === "DONE" || p.status === "PARTIAL_CANCELED")) {
        todaySales += p.amount;
      }
    }

    const totalCancelAmount = cancels.reduce((sum, c) => sum + c.cancelAmount, 0);
    const netSales = Math.max(0, totalSales - totalCancelAmount);
    const totalTransactions = payments.length;
    const cancelRate =
      totalTransactions > 0
        ? parseFloat(((canceledCount / totalTransactions) * 100).toFixed(1))
        : 0;

    // Daily Trend (Last N days)
    const dailyTrendMap: { [key: string]: { date: string; sales: number; orders: number } } = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d
        .getDate()
        .toString()
        .padStart(2, "0")}`;
      dailyTrendMap[key] = { date: key, sales: 0, orders: 0 };
    }

    for (const p of payments) {
      const pDate = p.approvedAt || p.createdAt;
      const key = `${(pDate.getMonth() + 1).toString().padStart(2, "0")}/${pDate
        .getDate()
        .toString()
        .padStart(2, "0")}`;

      if (dailyTrendMap[key]) {
        if (p.status !== "FAILED") {
          dailyTrendMap[key].sales += p.amount;
          dailyTrendMap[key].orders += 1;
        }
      }
    }

    const dailyTrend = Object.values(dailyTrendMap);

    // Payment Method Distribution
    const methodMap: { [key: string]: { name: string; count: number; amount: number } } = {
      CARD: { name: "신용카드", count: 0, amount: 0 },
      EASY_PAY: { name: "간편결제", count: 0, amount: 0 },
      VIRTUAL_ACCOUNT: { name: "가상계좌", count: 0, amount: 0 },
      TRANSFER: { name: "계좌이체", count: 0, amount: 0 },
      OTHER: { name: "기타", count: 0, amount: 0 },
    };

    for (const p of payments) {
      const key = methodMap[p.method] ? p.method : "OTHER";
      methodMap[key].count += 1;
      methodMap[key].amount += p.amount;
    }

    const methodStats = Object.values(methodMap)
      .filter((m) => m.count > 0)
      .map((m) => ({
        ...m,
        percentage:
          totalTransactions > 0
            ? parseFloat(((m.count / totalTransactions) * 100).toFixed(1))
            : 0,
      }));

    return NextResponse.json({
      success: true,
      stats: {
        totalSales,
        netSales,
        todaySales,
        successCount,
        canceledCount,
        totalCancelAmount,
        cancelRate,
        totalTransactions,
      },
      dailyTrend,
      methodStats,
    });
  } catch (error: unknown) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "통계 데이터 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
