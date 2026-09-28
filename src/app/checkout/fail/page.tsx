"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, RefreshCw, LayoutDashboard, HelpCircle } from "lucide-react";

function FailContent() {
  const searchParams = useSearchParams();

  const code = searchParams.get("code") || "PAYMENT_FAILED";
  const message =
    searchParams.get("message") || "결제 진행 중 사용자에 의해 취소되었거나 오류가 발생했습니다.";
  const orderId = searchParams.get("orderId");

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-12 px-4 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-center">
        {/* Fail Header */}
        <div className="bg-gradient-to-b from-red-50 to-white p-8 border-b border-gray-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-4 shadow-sm">
            <XCircle className="w-9 h-9" />
          </div>
          <span className="text-xs font-bold text-red-700 bg-red-100/70 border border-red-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Payment Cancelled / Failed
          </span>
          <h1 className="text-2xl font-black text-gray-900 mt-2">결제에 실패하였습니다</h1>
          <p className="text-sm text-gray-500 mt-1">
            토스페이먼츠 결제창에서 처리가 중단되었습니다.
          </p>
        </div>

        {/* Error Info */}
        <div className="p-6 space-y-4 text-sm text-left">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
            {orderId && (
              <div className="flex justify-between items-center text-xs text-gray-600">
                <span>주문 번호</span>
                <span className="font-mono font-medium text-gray-900">{orderId}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs text-gray-600">
              <span>에러 코드</span>
              <span className="font-mono font-bold text-red-600">{code}</span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-500 block mb-1">상세 실패 사유</span>
              <p className="text-sm text-gray-800 font-medium bg-white p-2.5 rounded border border-gray-200 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p>
              토스 샌드박스에서는 가상 카드 번호 또는 테스트 인증을 통해 정상 결제를 시뮬레이션할 수 있습니다.
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-2 space-y-2">
            <Link
              href="/checkout"
              className="w-full py-3 bg-[#c5163f] hover:bg-[#a91235] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 text-sm transition shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              결제 다시 시도하기
            </Link>
            <Link
              href="/"
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl flex items-center justify-center gap-1.5 text-sm transition"
            >
              <LayoutDashboard className="w-4 h-4" />
              대시보드로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutFailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#c5163f] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <FailContent />
    </Suspense>
  );
}
