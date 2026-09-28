import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "토스페이먼츠 결제 & 대시보드 시스템 | Vibe Pay",
  description: "LGE.COM 스타일 체크아웃 및 토스페이먼츠 샌드박스 결제 연동 & 관리자 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased bg-[#f8f9fa] text-gray-900 min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
