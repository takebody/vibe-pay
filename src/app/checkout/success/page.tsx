"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight, AlertCircle, Receipt, RefreshCw, LayoutDashboard } from "lucide-react";

interface PaymentSuccessData {
  paymentKey: string;
  orderId: string;
  amount: number;
  balanceAmount: number;
  method: string;
  status: string;
  approvedAt: string;
  receiptUrl?: string;
  order?: {
    orderName: string;
    customerName: string;
  };
}

function SuccessContent() {
  const searchParams = useSearchParams();

  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amountStr = searchParams.get("amount");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentSuccessData | null>(null);

  const isConfirmingRef = React.useRef(false);

  const confirmPayment = React.useCallback(async () => {
    if (!paymentKey || !orderId || !amountStr) {
      setError("결제 승인 파라미터(paymentKey, orderId, amount)가 올바르지 않습니다.");
      setIsLoading(false);
      return;
    }

    const amount = parseInt(amountStr, 10);
    if (isNaN(amount)) {
      setError("유효하지 않은 결제 금액입니다.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "결제 승인 처리에 실패했습니다.");
      }

      setPaymentData(data.payment);
    } catch (err: unknown) {
      console.error("Confirm error:", err);
      setError((err as Error).message || "결제 승인 요청 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [paymentKey, orderId, amountStr]);

  useEffect(() => {
    if (isConfirmingRef.current) return;
    isConfirmingRef.current = true;
    confirmPayment();
  }, [confirmPayment]);

  const handleRetry = () => {
    confirmPayment();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center max-w-md w-full">
          <div className="w-12 h-12 border-4 border-[#c5163f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">결제 승인 처리 중</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            토스페이먼츠 서버와 통신하여 결제 무결성을 검증하고 승인을 확정하고 있습니다. 잠시만 기다려주세요...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-200 text-center max-w-md w-full">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">결제 승인 실패</h2>
          <p className="text-sm text-red-600 mb-6 bg-red-50 p-3 rounded-lg border border-red-100 font-medium">
            {error}
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleRetry}
              className="w-full py-2.5 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-black transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" /> 승인 상태 재확인
            </button>
            <Link
              href="/checkout"
              className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition"
            >
              새로 주문하기
            </Link>
            <Link
              href="/"
              className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition"
            >
              대시보드로 이동
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-12 px-4 flex flex-col items-center justify-center">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Success Header */}
        <div className="bg-gradient-to-b from-green-50 to-white p-8 text-center border-b border-gray-100">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4 shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <span className="text-xs font-bold text-green-700 bg-green-100/70 border border-green-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Payment Completed
          </span>
          <h1 className="text-2xl font-black text-gray-900 mt-2">결제가 성공적으로 완료되었습니다!</h1>
          <p className="text-sm text-gray-500 mt-1">
            토스페이먼츠 샌드박스 승인 및 DB 영속화가 완료되었습니다.
          </p>
        </div>

        {/* Payment Summary */}
        <div className="p-6 space-y-4 text-sm">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2.5">
            <div className="flex justify-between items-center text-gray-600">
              <span>주문번호</span>
              <span className="font-mono font-semibold text-gray-900 text-xs">{paymentData?.orderId}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>상품명</span>
              <span className="font-semibold text-gray-900">{paymentData?.order?.orderName || "LG 전자 케어 필터"}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>구매자명</span>
              <span className="font-semibold text-gray-900">{paymentData?.order?.customerName || "김대환"}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>결제수단</span>
              <span className="font-semibold text-gray-900">{paymentData?.method}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>승인일시</span>
              <span className="font-semibold text-gray-900">
                {paymentData?.approvedAt ? new Date(paymentData.approvedAt).toLocaleString("ko-KR") : "-"}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline">
              <span className="font-bold text-gray-900">결제 금액</span>
              <span className="text-xl font-black text-red-600">
                {paymentData?.amount.toLocaleString()}원
              </span>
            </div>
          </div>

          {/* Receipt Link */}
          {paymentData?.receiptUrl && (
            <a
              href={paymentData.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-700 font-semibold text-xs transition"
            >
              <Receipt className="w-4 h-4 text-gray-500" />
              토스페이먼츠 전자영수증(매출전표) 확인
            </a>
          )}

          {/* Actions */}
          <div className="pt-3 space-y-2">
            <Link
              href="/"
              className="w-full py-3.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-sm transition"
            >
              <LayoutDashboard className="w-4 h-4" />
              대시보드에서 내역 확인하기
            </Link>
            <Link
              href="/checkout"
              className="w-full py-3 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold rounded-xl flex items-center justify-center gap-1.5 text-sm transition"
            >
              새로운 테스트 결제 진행
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#c5163f] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
