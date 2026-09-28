"use client";

import dynamic from "next/dynamic";

const DashboardClient = dynamic(() => import("@/components/DashboardClient"), {
  ssr: false,
  loading: () => (
    <div
      className="min-h-screen bg-[#f8f9fa] text-gray-900 pb-16 flex items-center justify-center"
      suppressHydrationWarning
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center font-black text-sm shadow-md animate-pulse">
          VP
        </div>
        <p className="text-xs text-gray-500 font-medium">대시보드를 로딩 중입니다...</p>
      </div>
    </div>
  ),
});

export default function Page() {
  return <DashboardClient />;
}
