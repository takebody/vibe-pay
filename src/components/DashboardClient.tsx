/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  RotateCcw,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Percent,
  Receipt,
  ShoppingCart,
  CheckCircle,
  KeyRound,
  Calendar,
} from "lucide-react";
import { SettingsModal } from "@/components/SettingsModal";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface StatsData {
  totalSales: number;
  netSales: number;
  todaySales: number;
  successCount: number;
  canceledCount: number;
  totalCancelAmount: number;
  cancelRate: number;
  totalTransactions: number;
}

interface DailyTrendItem {
  date: string;
  sales: number;
  orders: number;
}

interface MethodStatItem {
  name: string;
  count: number;
  amount: number;
  percentage: number;
}

interface CancelHistoryItem {
  id: string;
  cancelAmount: number;
  cancelReason: string;
  canceledAt: string;
}

interface PaymentItem {
  id: string;
  paymentKey: string;
  orderId: string;
  amount: number;
  balanceAmount: number;
  method: string;
  status: string;
  approvedAt: string | null;
  receiptUrl: string | null;
  createdAt: string;
  order: {
    orderName: string;
    customerName: string;
    customerPhone: string | null;
    status: string;
  };
  cancels: CancelHistoryItem[];
}

const PIE_COLORS = ["#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6"];

export default function DashboardClient() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [dailyTrend, setDailyTrend] = useState<DailyTrendItem[]>([]);
  const [methodStats, setMethodStats] = useState<MethodStatItem[]>([]);

  // Table states
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Month & Date Range Filter states
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCustomRange, setIsCustomRange] = useState(false);

  // Month options (last 6 months)
  const monthOptions = React.useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yyyy = d.getFullYear();
      const mm = (d.getMonth() + 1).toString().padStart(2, "0");
      const val = `${yyyy}-${mm}`;
      const label = `${yyyy}년 ${d.getMonth() + 1}월` + (i === 0 ? " (이번 달)" : "");
      list.push({ value: val, label });
    }
    return list;
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cancel Modal state
  const [selectedPaymentForCancel, setSelectedPaymentForCancel] = useState<PaymentItem | null>(null);
  const [cancelType, setCancelType] = useState<"full" | "partial">("full");
  const [partialAmount, setPartialAmount] = useState<number>(0);
  const [cancelReason, setCancelReason] = useState("");
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Settings Modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Fetch Dashboard Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/stats?days=7");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setDailyTrend(data.dailyTrend);
        setMethodStats(data.methodStats);
      }
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
  }, []);

  // Fetch Payment List
  const fetchPayments = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        status: statusFilter,
        search: searchTerm,
      });

      if (selectedMonth && selectedMonth !== "ALL" && selectedMonth !== "CUSTOM") {
        params.set("month", selectedMonth);
      } else if (selectedMonth === "CUSTOM" || isCustomRange) {
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
      }

      const res = await fetch(`/api/dashboard/payments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.total);
      }
    } catch (e) {
      console.error("Failed to load payments:", e);
    }
  }, [page, statusFilter, searchTerm, selectedMonth, startDate, endDate, isCustomRange]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchStats(), fetchPayments()]);
    setIsLoading(false);
  }, [fetchStats, fetchPayments]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStats(), fetchPayments()]);
    setIsRefreshing(false);
  };

  const handleOpenCancelModal = (p: PaymentItem) => {
    setSelectedPaymentForCancel(p);
    setCancelType("full");
    setPartialAmount(Math.min(10000, p.balanceAmount));
    setCancelReason("");
    setCancelError(null);
  };

  const handleExecuteCancel = async () => {
    if (!selectedPaymentForCancel) return;
    if (!cancelReason.trim()) {
      setCancelError("취소 사유를 입력해 주세요.");
      return;
    }

    const cancelAmount =
      cancelType === "full" ? selectedPaymentForCancel.balanceAmount : partialAmount;

    if (cancelAmount <= 0 || cancelAmount > selectedPaymentForCancel.balanceAmount) {
      setCancelError("올바른 취소 금액을 입력해 주세요.");
      return;
    }

    setIsCanceling(true);
    setCancelError(null);

    try {
      const res = await fetch("/api/payments/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentKey: selectedPaymentForCancel.paymentKey,
          cancelReason,
          cancelAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "결제 취소 처리에 실패했습니다.");
      }

      // Close modal and refresh
      setSelectedPaymentForCancel(null);
      await handleRefresh();
      alert("결제 취소가 성공적으로 처리되었습니다.");
    } catch (err: unknown) {
      console.error("Cancel failed:", err);
      setCancelError((err as Error).message || "취소 처리 중 오류가 발생했습니다.");
    } finally {
      setIsCanceling(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "DONE":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            결제완료
          </span>
        );
      case "CANCELED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            전액취소
          </span>
        );
      case "PARTIAL_CANCELED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            부분취소
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 pb-16" suppressHydrationWarning>
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-black text-sm">
              VP
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                Vibe Pay 이커머스 관리자
              </h1>
              <p className="text-[11px] text-gray-500 font-medium">
                토스페이먼츠 샌드박스 결제 & 대시보드
              </p>
            </div>
            <span className="ml-2 text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Toss Sandbox Active
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              title="새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 hover:border-gray-900 hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-700 transition shadow-2xs"
              title="토스페이먼츠 API 키 설정"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#c5163f]" />
              API 키 설정
            </button>

            {/* Main Primary Action: 결제 하기 (새 주문 테스트) */}
            <Link
              href="/checkout"
              className="flex items-center gap-2 px-4 py-2 bg-[#c5163f] hover:bg-[#a91235] text-white text-sm font-bold rounded-lg shadow-sm transition active:scale-[0.98]"
            >
              <ShoppingCart className="w-4 h-4" />
              결제 하기 (새 주문)
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Row 1: KPI Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: 총 누적 결제액 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold text-slate-600">총 누적 결제액</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 group-hover:scale-105 transition-transform">
                <DollarSign className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">
              {stats ? `${stats.totalSales.toLocaleString()}원` : "..."}
            </p>
            <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
              실 결제 잔액: <span className="font-bold text-slate-600">{stats ? `${stats.netSales.toLocaleString()}원` : "..."}</span>
            </p>
          </div>

          {/* Card 2: 금일 결제액 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold text-slate-600">금일 결제액</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-600 tracking-tight tabular-nums">
              {stats ? `${stats.todaySales.toLocaleString()}원` : "..."}
            </p>
            <p className="text-[11px] text-slate-400 mt-1.5 font-medium">오늘 00시 이후 실시간 승인액</p>
          </div>

          {/* Card 3: 결제 성공 건수 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold text-slate-600">결제 완료 건수</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform">
                <CheckCircle className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">
              {stats ? `${stats.successCount}건` : "..."}
            </p>
            <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
              총 트랜잭션: <span className="font-bold text-slate-600">{stats?.totalTransactions || 0}건</span>
            </p>
          </div>

          {/* Card 4: 취소/환불 금액 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold text-slate-600">환불(취소) 금액</span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 group-hover:scale-105 transition-transform">
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <p className="text-2xl font-black text-rose-600 tracking-tight tabular-nums">
              {stats ? `${stats.totalCancelAmount.toLocaleString()}원` : "..."}
            </p>
            <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
              취소 건수: <span className="font-bold text-rose-600">{stats?.canceledCount || 0}건</span>
            </p>
          </div>

          {/* Card 5: 결제 취소율 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold text-slate-600">결제 취소율</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform">
                <Percent className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <p className="text-2xl font-black text-amber-600 tracking-tight tabular-nums">
              {stats ? `${stats.cancelRate}%` : "..."}
            </p>
            <p className="text-[11px] text-slate-400 mt-1.5 font-medium">전체 주문 대비 환불 비율</p>
          </div>
        </div>

        {/* Row 2: Charts (Trend & Payment Method) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: 최근 7일 매출 및 건수 추이 (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  최근 7일 매출 및 결제 건수 추이
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  일별 승인 금액(바)과 결제 건수(라인) 종합 통계
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-indigo-600">
                  <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600" /> 매출액
                </span>
                <span className="flex items-center gap-1.5 text-rose-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> 결제건수
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyTrend} margin={{ top: 12, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#818CF8" stopOpacity={0.65} />
                    </linearGradient>
                    <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#F43F5E" floodOpacity="0.35" />
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#64748B", fontWeight: 500 }}
                    tickLine={false}
                    axisLine={{ stroke: "#E2E8F0" }}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: "#64748B", fontWeight: 500 }}
                    tickFormatter={(v) => `${Math.round(v / 10000)}만`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: "#64748B", fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.96)",
                      backdropFilter: "blur(8px)",
                      borderRadius: "14px",
                      border: "1px solid #E2E8F0",
                      boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.1)",
                      fontSize: "12px",
                      padding: "10px 14px",
                    }}
                    formatter={(value: any, name: any) => {
                      if (name === "매출액") return [`${Number(value || 0).toLocaleString()}원`, "매출액"];
                      return [`${value || 0}건`, "결제건수"];
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="sales"
                    name="매출액"
                    fill="url(#salesBarGradient)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={34}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    name="결제건수"
                    stroke="#F43F5E"
                    strokeWidth={3}
                    filter="url(#lineGlow)"
                    dot={{ r: 4, stroke: "#FFFFFF", strokeWidth: 2, fill: "#F43F5E" }}
                    activeDot={{ r: 6, stroke: "#FFFFFF", strokeWidth: 2.5, fill: "#E11D48" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: 결제 수단별 비중 (1 Col) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col relative overflow-hidden">
            <h3 className="text-sm font-black text-slate-900 tracking-tight mb-1">
              결제 수단별 점유율
            </h3>
            <p className="text-xs text-slate-500 mb-2">카드, 간편결제, 가상계좌 등 비중</p>

            <div className="h-60 w-full flex-1 relative flex items-center justify-center">
              {methodStats.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={methodStats}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="46%"
                        innerRadius={62}
                        outerRadius={88}
                        paddingAngle={4}
                        cornerRadius={6}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      >
                        {methodStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.96)",
                          backdropFilter: "blur(8px)",
                          borderRadius: "12px",
                          border: "1px solid #E2E8F0",
                          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.1)",
                          fontSize: "12px",
                        }}
                        formatter={(value: any, name: any) => [`${value || 0}건`, name || ""]}
                      />
                      <Legend
                        iconType="circle"
                        wrapperStyle={{ fontSize: 11, fontWeight: 600, color: "#64748B" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Centered Donut Metric */}
                  <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      전체 결제
                    </span>
                    <span className="text-lg font-black text-slate-900 tabular-nums">
                      {stats?.totalTransactions || 0}건
                    </span>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  결제 데이터가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 3: 결제 내역 관리 테이블 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Table Header Controls */}
          <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">결제 및 취소 내역</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                전체 {totalCount}건의 결제 트랜잭션이 조회되었습니다.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter Tabs */}
              <div className="inline-flex p-1 bg-gray-100 rounded-lg text-xs font-semibold text-gray-600">
                {["ALL", "DONE", "CANCELED", "PARTIAL_CANCELED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setStatusFilter(st);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-md transition ${
                      statusFilter === st
                        ? "bg-white text-gray-900 shadow-sm"
                        : "hover:text-gray-900"
                    }`}
                  >
                    {st === "ALL" && "전체"}
                    {st === "DONE" && "완료"}
                    {st === "CANCELED" && "취소"}
                    {st === "PARTIAL_CANCELED" && "부분취소"}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="주문번호/고객명 검색"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 w-44"
                />
              </div>
            </div>

            {/* Date / Month Filter Bar */}
            <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/70 p-3 rounded-xl border border-gray-200/80 mt-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#c5163f]" />
                  조회 기간:
                </span>

                {/* Month Dropdown */}
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedMonth(val);
                    setPage(1);
                    if (val === "CUSTOM") {
                      setIsCustomRange(true);
                    } else {
                      setIsCustomRange(false);
                      setStartDate("");
                      setEndDate("");
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:border-black cursor-pointer shadow-2xs"
                >
                  <option value="ALL">전체 기간</option>
                  {monthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                  <option value="CUSTOM">직접 기간 입력 (시작일~종료일)</option>
                </select>

                {/* Custom Date Range Picker */}
                {isCustomRange && (
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-gray-300">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setPage(1);
                      }}
                      className="px-2 py-0.5 text-xs bg-transparent focus:outline-none font-mono font-medium text-gray-800"
                    />
                    <span className="text-xs text-gray-400">~</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setPage(1);
                      }}
                      className="px-2 py-0.5 text-xs bg-transparent focus:outline-none font-mono font-medium text-gray-800"
                    />
                  </div>
                )}

                {/* Reset Filter Button */}
                {(selectedMonth !== "ALL" || startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMonth("ALL");
                      setIsCustomRange(false);
                      setStartDate("");
                      setEndDate("");
                      setPage(1);
                    }}
                    className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-600 px-2 py-1 rounded hover:bg-gray-200/60 transition font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" />
                    필터 초기화
                  </button>
                )}
              </div>

              {/* Active Filter summary text */}
              <div className="text-[11px] text-gray-500 font-medium">
                {selectedMonth === "ALL" && "전체 기간 내역 표시 중"}
                {selectedMonth !== "ALL" &&
                  selectedMonth !== "CUSTOM" &&
                  `${selectedMonth} 결제 내역 조회 중`}
                {selectedMonth === "CUSTOM" &&
                  (startDate || endDate) &&
                  `${startDate || "처음"} ~ ${endDate || "현재"} 내역 조회 중`}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">주문 정보</th>
                  <th className="py-3 px-4">주문 상품 / 고객</th>
                  <th className="py-3 px-4">결제 금액</th>
                  <th className="py-3 px-4">결제 수단</th>
                  <th className="py-3 px-4">상태</th>
                  <th className="py-3 px-4">승인 일시</th>
                  <th className="py-3 px-4 text-center">관리 액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      데이터를 불러오는 중입니다...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      해당 조건의 결제 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-gray-900 block">{p.orderId}</span>
                        <span className="font-mono text-[10px] text-gray-400 truncate block max-w-[140px]">
                          {p.paymentKey}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-gray-900 block truncate max-w-[180px]">
                          {p.order?.orderName}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {p.order?.customerName} {p.order?.customerPhone ? `(${p.order.customerPhone})` : ""}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 block">
                          {p.amount.toLocaleString()}원
                        </span>
                        {p.balanceAmount < p.amount && (
                          <span className="text-[11px] text-rose-600 font-medium block">
                            잔액: {p.balanceAmount.toLocaleString()}원
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-[11px] font-medium">
                          {p.method}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{renderStatusBadge(p.status)}</td>
                      <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                        {p.approvedAt
                          ? new Date(p.approvedAt).toLocaleString("ko-KR", {
                              month: "numeric",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {p.receiptUrl && (
                            <a
                              href={p.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition"
                              title="영수증 보기"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {p.balanceAmount > 0 && (
                            <button
                              type="button"
                              onClick={() => handleOpenCancelModal(p)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded text-[11px] border border-rose-200 transition"
                            >
                              결제 취소
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <span>
              페이지 {page} / {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 결제 취소(환불) 모달 */}
      {selectedPaymentForCancel && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2 text-rose-600 font-bold">
                <RotateCcw className="w-4 h-4" />
                <span>토스페이먼츠 결제 취소 요청</span>
              </div>
              <button
                onClick={() => setSelectedPaymentForCancel(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">주문 번호:</span>
                  <span className="font-mono font-bold text-gray-900">
                    {selectedPaymentForCancel.orderId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">상품명:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedPaymentForCancel.order?.orderName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">원 결제 금액:</span>
                  <span className="font-bold text-gray-900">
                    {selectedPaymentForCancel.amount.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-200">
                  <span className="font-bold text-gray-700">취소 가능 잔액:</span>
                  <span className="font-black text-rose-600">
                    {selectedPaymentForCancel.balanceAmount.toLocaleString()}원
                  </span>
                </div>
              </div>

              {/* Cancel Mode Selection */}
              <div>
                <label className="font-bold text-gray-700 block mb-2">취소 유형 선택</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:border-gray-400 transition">
                    <input
                      type="radio"
                      name="cancelType"
                      checked={cancelType === "full"}
                      onChange={() => setCancelType("full")}
                      className="text-[#c5163f] focus:ring-[#c5163f]"
                    />
                    <div>
                      <span className="font-bold block">전액 취소</span>
                      <span className="text-[10px] text-gray-500">
                        {selectedPaymentForCancel.balanceAmount.toLocaleString()}원 전체 환불
                      </span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:border-gray-400 transition">
                    <input
                      type="radio"
                      name="cancelType"
                      checked={cancelType === "partial"}
                      onChange={() => setCancelType("partial")}
                      className="text-[#c5163f] focus:ring-[#c5163f]"
                    />
                    <div>
                      <span className="font-bold block">부분 취소</span>
                      <span className="text-[10px] text-gray-500">금액 직접 입력</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Partial Amount Input */}
              {cancelType === "partial" && (
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    취소할 금액 (원)
                  </label>
                  <input
                    type="number"
                    value={partialAmount}
                    max={selectedPaymentForCancel.balanceAmount}
                    onChange={(e) =>
                      setPartialAmount(
                        Math.min(
                          selectedPaymentForCancel.balanceAmount,
                          Math.max(1, parseInt(e.target.value) || 0)
                        )
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold focus:outline-none focus:border-rose-500"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    최대 가능 금액: {selectedPaymentForCancel.balanceAmount.toLocaleString()}원
                  </p>
                </div>
              )}

              {/* Cancel Reason */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  취소 사유 <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="예: 고객 단순 변심, 수량 변경 등"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              {cancelError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
                  {cancelError}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedPaymentForCancel(null)}
                disabled={isCanceling}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 text-xs font-semibold"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleExecuteCancel}
                disabled={isCanceling}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                {isCanceling ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                취소 승인 요청
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Key Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onKeysUpdated={handleRefresh}
      />
    </div>
  );
}
