"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, User, ShoppingCart, LayoutDashboard, KeyRound } from "lucide-react";
import { SettingsModal } from "@/components/SettingsModal";

export const LgeHeader: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200 text-xs select-none">
        {/* 1. Global Utility Top Bar */}
        <div className="max-w-[1340px] mx-auto px-4 sm:px-6 h-10 flex items-center justify-between border-b border-gray-100 text-[#444]">
          {/* Sub-brand logos */}
          <div className="flex items-center gap-5 text-[11px] font-medium text-gray-500">
            <span className="font-bold tracking-tight text-gray-700">SKS</span>
            <span className="font-serif tracking-widest text-[10px] text-gray-700 font-semibold">LG SIGNATURE</span>
            <span className="font-sans font-semibold text-gray-700">LG ThinQ</span>
            <span className="font-mono text-[10px] text-gray-700 font-bold">Let&apos;s gram</span>
          </div>

          {/* Right utility links */}
          <div className="flex items-center gap-3 text-[11px] text-gray-600">
            {/* Settings Button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1 font-semibold text-gray-700 hover:text-black bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded transition"
            >
              <KeyRound className="w-3 h-3 text-[#c5163f]" />
              API 키 설정
            </button>

            <Link
              href="/"
              className="flex items-center gap-1 font-bold text-[#c5163f] hover:underline bg-red-50 px-2 py-1 rounded border border-red-200"
            >
              <LayoutDashboard className="w-3 h-3" />
              관리자 대시보드
            </Link>
            <span className="text-gray-300">|</span>
            <span className="hover:text-black cursor-pointer">회사소개</span>
            <span className="hover:text-black cursor-pointer">지속가능경영</span>
            <span className="hover:text-black cursor-pointer">사업자몰</span>
          </div>
        </div>

        {/* 2. Main Navigation Bar */}
        <div className="max-w-[1340px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo and Main Nav */}
          <div className="flex items-center gap-8">
            {/* LG Electronics Logo */}
            <Link href="/checkout" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#c5163f] flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-sm">
                <span className="text-[15px] font-bold">LG</span>
              </div>
              <span className="font-black text-xl text-gray-900 tracking-tight font-sans">
                LG전자
              </span>
            </Link>

            {/* Nav Menu */}
            <nav className="hidden lg:flex items-center gap-6 text-[14px] font-semibold text-gray-800">
              <span className="hover:text-[#c5163f] cursor-pointer">제품/소모품</span>
              <span className="hover:text-[#c5163f] cursor-pointer">가전 구독</span>
              <span className="hover:text-[#c5163f] cursor-pointer">고객지원</span>
              <span className="hover:text-[#c5163f] cursor-pointer">혜택/이벤트</span>
              <span className="hover:text-[#c5163f] cursor-pointer flex items-center gap-0.5">
                스토리 <span className="text-[#c5163f] text-xs font-bold leading-none">★</span>
              </span>
              <span className="hover:text-[#c5163f] cursor-pointer">베스트샵</span>
              <span className="hover:text-[#c5163f] cursor-pointer">LG AI</span>
              <span className="hover:text-[#c5163f] cursor-pointer">임직원 전용관</span>
              <span className="bg-[#c5163f] text-white text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer shadow-xs">
                홈스타일
              </span>
            </nav>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-5 text-gray-700">
            <button className="p-1 hover:text-black">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-1 hover:text-black relative">
              <User className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#c5163f] rounded-full" />
            </button>
            <button className="p-1 hover:text-black relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-2 bg-[#c5163f] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                4
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};
