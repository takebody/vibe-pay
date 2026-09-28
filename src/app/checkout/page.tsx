"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LgeHeader } from "@/components/lge/LgeHeader";
import { CardLogo } from "@/components/lge/CardLogos";
import { ProductSelectModal } from "@/components/lge/ProductSelectModal";
import { LgeProduct, LGE_CATALOG_PRODUCTS } from "@/data/lgeProducts";
import {
  ChevronDown,
  ChevronRight,
  Info,
  Check,
  AlertCircle,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  ShoppingBag,
} from "lucide-react";

interface ProductItem {
  id: string;
  name: string;
  modelCode: string;
  category?: string;
  originalPrice: number;
  discountRate: number;
  salePrice: number;
  benefitPrice?: number;
  quantity: number;
  imageUrl?: string;
  badges?: string[];
  deliveryNotice?: string;
}

// 1. 주문 제품 기본 목록: 정수기/냉장고 필터 삭제되어 빈 배열로 시작
const INITIAL_PRODUCTS: ProductItem[] = [];

const CARD_COMPANIES = [
  { name: "신한", hasBenefit: true },
  { name: "현대", hasBenefit: true },
  { name: "KB국민", hasBenefit: true },
  { name: "롯데", hasBenefit: true },
  { name: "하나Pay", hasBenefit: true },
  { name: "NH농협", hasBenefit: false },
  { name: "우리", hasBenefit: true },
  { name: "기타", hasBenefit: false },
];

export default function CheckoutPage() {
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);

  // 2. Customer & Shipping Info (사용자 이메일 takebody@naver.com)
  const [customerName] = useState("김대환");
  const [customerPhone] = useState("010-8472-0411");
  const [customerEmail] = useState("takebody@naver.com");
  const [address, setAddress] = useState(
    "[15821] 경기 군포시 수리산로 244 (산본동, 한양백두아파트) , 990동 1902호"
  );
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [shippingMemo, setShippingMemo] = useState("");

  // 3. LG전자 멤버십 포인트 (100,000 P 보유 및 적용 기능)
  const USER_POINT_BALANCE = 100000;
  const [pointInput, setPointInput] = useState<string>("");
  const [appliedPoint, setAppliedPoint] = useState<number>(0);
  const [pointMessage, setPointMessage] = useState<string | null>(null);

  // 4. 결제수단 (LGE.COM 제휴카드 삭제 -> card, easypay, vaccount)
  const [paymentType, setPaymentType] = useState<"card" | "easypay" | "vaccount">("card");
  const [selectedCard, setSelectedCard] = useState("신한");
  const [savePaymentMethod, setSavePaymentMethod] = useState(true);

  // Terms Agreement
  const [agreedTerms, setAgreedTerms] = useState(true);

  // Processing state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handlers for cart
  const handleAddProduct = (item: LgeProduct) => {
    setProducts((prev) => {
      const existingIndex = prev.findIndex((p) => p.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          modelCode: item.modelCode,
          category: item.category,
          originalPrice: item.originalPrice,
          discountRate: item.discountRate,
          salePrice: item.salePrice,
          benefitPrice: item.benefitPrice,
          quantity: 1,
          imageUrl: item.imageUrl,
          badges: item.badges,
          deliveryNotice: item.deliveryNotice,
        },
      ];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setProducts((prev) =>
      prev
        .map((p) => {
          if (p.id === productId) {
            const newQty = p.quantity + delta;
            return newQty > 0 ? { ...p, quantity: newQty } : null;
          }
          return p;
        })
        .filter((p): p is ProductItem => p !== null)
    );
  };

  const handleRemoveProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // Calculations
  const totalOriginalPrice = products.reduce((acc, p) => acc + p.originalPrice * p.quantity, 0);
  const totalSalePrice = products.reduce((acc, p) => acc + p.salePrice * p.quantity, 0);
  const totalItemCount = products.reduce((acc, p) => acc + p.quantity, 0);
  const discountTotal = totalOriginalPrice - totalSalePrice;
  const shippingFee = 0;

  // Maximum allowed points: keep at least 100 KRW for Toss Payments API
  const maxAllowedPoints = Math.max(
    0,
    totalSalePrice > 100 ? Math.min(USER_POINT_BALANCE, totalSalePrice - 100) : 0
  );

  // Automatically adjust appliedPoint if totalSalePrice decreases below appliedPoint
  const effectiveAppliedPoint = Math.min(appliedPoint, maxAllowedPoints);

  const finalAmount =
    products.length === 0
      ? 0
      : Math.max(100, totalSalePrice - effectiveAppliedPoint + shippingFee);

  // Point handlers
  const handleApplyPoint = () => {
    const entered = parseInt(pointInput, 10) || 0;
    if (entered <= 0) {
      setAppliedPoint(0);
      setPointMessage("사용할 포인트를 1P 이상 입력해주세요.");
      return;
    }
    if (entered > USER_POINT_BALANCE) {
      setPointMessage(`보유 포인트(${USER_POINT_BALANCE.toLocaleString()}P)를 초과하여 사용할 수 없습니다.`);
      return;
    }
    if (totalSalePrice === 0) {
      setPointMessage("포인트를 적용할 주문 제품을 먼저 담아주세요.");
      return;
    }
    if (entered > maxAllowedPoints) {
      setAppliedPoint(maxAllowedPoints);
      setPointInput(maxAllowedPoints.toString());
      setPointMessage(
        `토스 최소 결제금액(100원)을 제외한 최대 ${maxAllowedPoints.toLocaleString()}P가 적용되었습니다.`
      );
      return;
    }
    setAppliedPoint(entered);
    setPointMessage(`${entered.toLocaleString()}P가 정상 적용되었습니다.`);
  };

  const handleUseAllPoints = () => {
    if (totalSalePrice === 0) {
      setPointMessage("포인트를 적용할 주문 제품을 먼저 담아주세요.");
      return;
    }
    setPointInput(maxAllowedPoints.toString());
    setAppliedPoint(maxAllowedPoints);
    setPointMessage(`${maxAllowedPoints.toLocaleString()}P가 전액 적용되었습니다.`);
  };

  const handleCancelPoint = () => {
    setPointInput("");
    setAppliedPoint(0);
    setPointMessage(null);
  };

  const handlePayment = async () => {
    if (products.length === 0) {
      alert("주문할 제품을 1개 이상 선택해 주세요.");
      return;
    }

    if (!agreedTerms) {
      alert("약관 내용 및 개인정보 이용/결제에 동의해 주세요.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const orderName =
        products.length === 1
          ? `${products[0].name} ${products[0].quantity}개`
          : `${products[0].name} 외 ${products.length - 1}건`;

      // 1. Pre-register order in DB
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          orderName,
          amount: finalAmount,
          customerName,
          customerPhone,
          customerEmail,
          address,
          items: products.map((p) => ({
            productId: p.id,
            name: p.name,
            modelCode: p.modelCode,
            price: p.salePrice * p.quantity,
            quantity: p.quantity,
            imageUrl: p.imageUrl,
          })),
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || "주문 생성에 실패했습니다.");
      }

      // 2. Fetch active client key (supports dynamic user custom key)
      let activeClientKey =
        process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ||
        "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq";
      try {
        const keyRes = await fetch("/api/settings/keys");
        if (keyRes.ok) {
          const keyData = await keyRes.json();
          if (keyData.clientKey) activeClientKey = keyData.clientKey;
        }
      } catch (e) {
        console.warn("Using fallback client key:", e);
      }

      // Load Toss Payments SDK
      const { loadTossPayments } = await import("@tosspayments/payment-sdk");
      const tossPayments = await loadTossPayments(activeClientKey);

      let tossMethod: "카드" | "가상계좌" | "계좌이체" = "카드";
      if (paymentType === "vaccount") {
        tossMethod = "가상계좌";
      }

      const successUrl = `${window.location.origin}/checkout/success`;
      const failUrl = `${window.location.origin}/checkout/fail`;

      await tossPayments.requestPayment(tossMethod, {
        amount: finalAmount,
        orderId,
        orderName,
        customerName,
        customerEmail,
        successUrl,
        failUrl,
      });
    } catch (err: unknown) {
      console.error("Payment initiation failed:", err);
      const message = (err as Error).message || "결제 진행 중 오류가 발생했습니다.";
      setErrorMessage(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#222222] font-sans antialiased" suppressHydrationWarning>
      {/* 1. LGE Global Top Navigation Bar */}
      <LgeHeader />

      {/* Main Checkout Container */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-10 pb-24">
        {/* Centered Page Title */}
        <h1 className="text-3xl font-black text-center text-gray-950 mb-12 tracking-tight">
          주문결제
        </h1>

        {errorMessage && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">결제 오류 안내</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column (8 Cols): Order Form & Details */}
          <div className="lg:col-span-8 space-y-12">
            {/* 1. 주문 제품 섹션 */}
            <section>
              <div className="flex items-center justify-between pb-3 border-b-2 border-gray-950">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-gray-950">
                    주문 제품
                  </h2>
                  <span className="text-xs bg-gray-100 font-bold px-2.5 py-0.5 rounded-full text-gray-700 border border-gray-200">
                    {totalItemCount}개
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSelectModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-950 hover:bg-[#c5163f] text-white text-xs font-bold rounded-lg transition shadow-2xs group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
                  + LGE 가전 추가·변경
                </button>
              </div>

              {products.length === 0 ? (
                <div className="py-12 px-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 mt-4">
                  <ShoppingBag className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-800">
                    담긴 주문 제품이 없습니다.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    아래 추천 가전 5선에서 제품을 담거나 상단 버튼을 눌러 원하는 가전을 선택해 주세요.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsSelectModalOpen(true)}
                    className="mt-4 px-5 py-2.5 bg-[#c5163f] hover:bg-[#a91235] text-white text-xs font-bold rounded-lg shadow-sm transition"
                  >
                    + LGE 제품 카탈로그 보기
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {products.map((item) => (
                    <div
                      key={item.id}
                      className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      {/* Thumbnail & Info */}
                      <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                        <div className="w-20 h-20 bg-white border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center p-1 flex-shrink-0 shadow-2xs">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <ShoppingBag className="w-6 h-6 text-gray-400" />
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-gray-950 text-base leading-tight">
                              {item.name}
                            </h3>
                            {item.badges?.map((badge, bIdx) => (
                              <span
                                key={bIdx}
                                className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded border border-gray-200"
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 font-mono tracking-tight">
                            {item.modelCode}
                          </p>

                          {/* Quantity control */}
                          <div className="flex items-center gap-3 pt-1">
                            <span className="text-xs text-gray-600 font-medium">
                              수량:
                            </span>
                            <div className="flex items-center border border-gray-300 rounded-md bg-white">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.id, -1)}
                                className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
                                title="수량 감소"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center text-xs font-bold text-gray-900 tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.id, 1)}
                                className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
                                title="수량 증가"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(item.id)}
                              className="text-xs text-gray-400 hover:text-red-600 flex items-center gap-0.5 transition"
                              title="품목 삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>삭제</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Price with Discount */}
                      <div className="text-right sm:self-center pl-24 sm:pl-0">
                        <div className="flex items-center gap-2 justify-start sm:justify-end">
                          <span className="font-bold text-red-600 text-base">
                            {item.discountRate}%
                          </span>
                          <span className="font-black text-gray-950 text-lg tabular-nums">
                            {(item.salePrice * item.quantity).toLocaleString()}원
                          </span>
                          <span className="text-xs text-gray-400 line-through tabular-nums">
                            {(item.originalPrice * item.quantity).toLocaleString()}원
                          </span>
                          <Info className="w-3.5 h-3.5 text-gray-400 inline cursor-pointer ml-0.5" />
                        </div>
                        {item.quantity > 1 && (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            (개당 {item.salePrice.toLocaleString()}원)
                          </p>
                        )}
                        {item.deliveryNotice && (
                          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                            {item.deliveryNotice}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Shelf: LGE Featured Appliances Carousel / Grid */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#c5163f]" />
                    <h4 className="text-sm font-bold text-gray-950">
                      LGE 추천 가전 5선 바로 담기
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSelectModalOpen(true)}
                    className="text-xs font-bold text-[#c5163f] hover:underline flex items-center gap-0.5"
                  >
                    카탈로그 전체보기 <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {LGE_CATALOG_PRODUCTS.filter((p) => p.isPopular).map((prod) => {
                    const inCart = products.find((p) => p.id === prod.id);
                    const qty = inCart ? inCart.quantity : 0;

                    return (
                      <div
                        key={prod.id}
                        className={`bg-slate-50/60 rounded-xl p-2.5 border transition-all duration-150 flex flex-col justify-between ${
                          qty > 0
                            ? "border-[#c5163f] bg-red-50/20 shadow-2xs"
                            : "border-gray-200 hover:border-gray-300 hover:bg-slate-50"
                        }`}
                      >
                        <div>
                          {/* Image preview */}
                          <div className="h-24 w-full bg-white rounded-lg flex items-center justify-center p-1.5 border border-gray-100 overflow-hidden mb-2 relative">
                            {prod.imageUrl ? (
                              <img
                                src={prod.imageUrl}
                                alt={prod.name}
                                className="h-full w-full object-contain"
                              />
                            ) : null}
                            {qty > 0 && (
                              <span className="absolute top-1 right-1 bg-[#c5163f] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                {qty}개
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 font-mono">
                            {prod.modelCode}
                          </p>
                          <h5 className="text-xs font-bold text-gray-900 leading-tight line-clamp-1 mt-0.5">
                            {prod.name}
                          </h5>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-red-600 font-bold text-[11px]">
                              {prod.discountRate}%
                            </span>
                            <span className="text-xs font-black text-gray-950 tabular-nums">
                              {prod.salePrice.toLocaleString()}원
                            </span>
                          </div>
                        </div>

                        <div className="mt-2.5">
                          {qty > 0 ? (
                            <div className="flex items-center justify-between bg-white border border-gray-200 rounded p-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(prod.id, -1)}
                                className="w-5 h-5 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded text-xs"
                              >
                                -
                              </button>
                              <span className="text-[11px] font-bold text-gray-900">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(prod.id, 1)}
                                className="w-5 h-5 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded text-xs"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddProduct(prod)}
                              className="w-full py-1.5 bg-white hover:bg-gray-900 hover:text-white border border-gray-300 text-gray-800 text-[11px] font-bold rounded transition shadow-2xs flex items-center justify-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> 담기
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* 2. 주문자 정보 섹션 (김대환 | 010-8472-0411 | takebody@naver.com) */}
            <section>
              <h2 className="text-xl font-bold text-gray-950 pb-3 border-b-2 border-gray-950 mb-6">
                주문자 정보
              </h2>
              <div className="flex flex-wrap items-center py-2 text-sm gap-y-1">
                <span className="w-36 font-bold text-gray-950 text-sm">
                  주문자 정보<span className="text-red-600">*</span>
                </span>
                <span className="text-gray-900 font-medium">
                  {customerName}
                </span>
                <span className="mx-2 text-gray-300">|</span>
                <span className="text-gray-900 font-medium font-mono">
                  {customerPhone}
                </span>
                <span className="mx-2 text-gray-300">|</span>
                <span className="text-gray-900 font-medium font-mono">
                  {customerEmail}
                </span>
              </div>
            </section>

            {/* 3. 배송 정보 */}
            <section>
              <h2 className="text-xl font-bold text-gray-950 pb-3 border-b-2 border-gray-950 mb-6">
                배송 정보
              </h2>

              <div className="space-y-6 text-sm">
                {/* 배송지 */}
                <div className="flex items-start">
                  <span className="w-36 font-bold text-gray-950 pt-1 flex-shrink-0">
                    배송지<span className="text-red-600">*</span>
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{customerName}</span>
                        <span className="font-mono text-gray-700">{customerPhone}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(!isEditingAddress)}
                        className="px-3.5 py-1 text-xs border border-gray-300 rounded font-medium text-gray-800 hover:bg-gray-50 transition"
                      >
                        {isEditingAddress ? "완료" : "변경"}
                      </button>
                    </div>

                    {isEditingAddress ? (
                      <textarea
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full mt-2 p-2.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-black"
                      />
                    ) : (
                      <p className="text-gray-700 text-xs mt-1 leading-relaxed">{address}</p>
                    )}
                  </div>
                </div>

                {/* 배송 요청사항 */}
                <div className="flex items-center">
                  <span className="w-36 font-bold text-gray-950 flex-shrink-0">
                    배송 요청사항
                  </span>
                  <div className="flex-1 relative">
                    <select
                      value={shippingMemo}
                      onChange={(e) => setShippingMemo(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-300 rounded bg-white text-gray-700 appearance-none focus:outline-none focus:border-gray-900 cursor-pointer"
                    >
                      <option value="">배송 요청 메시지를 선택해주세요.</option>
                      <option value="부재 시 문 앞에 놓아주세요.">부재 시 문 앞에 놓아주세요.</option>
                      <option value="부재 시 경비실에 맡겨주세요.">부재 시 경비실에 맡겨주세요.</option>
                      <option value="배송 전 미리 연락 바랍니다.">배송 전 미리 연락 바랍니다.</option>
                      <option value="파손 위험이 있으니 조심히 다뤄주세요.">파손 위험이 있으니 조심히 다뤄주세요.</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            </section>

            {/* 4. 할인혜택 (LG전자 멤버십 포인트 100,000P 보유 & 실시간 적용) */}
            <section>
              <h2 className="text-xl font-bold text-gray-950 pb-3 border-b-2 border-gray-950 mb-6">
                할인혜택
              </h2>

              <div className="space-y-4 text-sm">
                <div className="flex items-center">
                  <span className="w-36 font-bold text-gray-950">상품 즉시할인</span>
                  <span className="font-bold text-red-600">
                    -{discountTotal.toLocaleString()}원
                  </span>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-950 flex items-center gap-1">
                      LG전자 멤버십 포인트 <Info className="w-3.5 h-3.5 text-gray-400" />
                    </span>
                    <span className="text-xs font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      {USER_POINT_BALANCE.toLocaleString()} P 보유
                    </span>
                  </div>

                  <div className="flex items-center gap-2 max-w-md">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        placeholder="0"
                        value={pointInput}
                        onChange={(e) => {
                          setPointInput(e.target.value);
                          setPointMessage(null);
                        }}
                        className="w-full text-right pr-7 pl-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-black font-mono font-bold"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">
                        P
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyPoint}
                      className="px-4 py-2 text-xs bg-gray-950 text-white rounded font-bold hover:bg-[#c5163f] transition shadow-2xs"
                    >
                      사용
                    </button>
                    <button
                      type="button"
                      onClick={handleUseAllPoints}
                      className="px-3.5 py-2 text-xs border border-gray-300 rounded font-medium text-gray-800 hover:bg-gray-50 transition"
                    >
                      전체 사용
                    </button>
                    {effectiveAppliedPoint > 0 && (
                      <button
                        type="button"
                        onClick={handleCancelPoint}
                        className="px-3 py-2 text-xs border border-red-200 text-red-600 rounded font-medium hover:bg-red-50 transition"
                      >
                        취소
                      </button>
                    )}
                  </div>

                  {pointMessage && (
                    <p
                      className={`text-xs mt-2 font-medium ${
                        effectiveAppliedPoint > 0 ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      {pointMessage}
                    </p>
                  )}
                  {effectiveAppliedPoint > 0 && (
                    <p className="text-[11px] text-gray-500 mt-1">
                      현재 결제에 <span className="font-bold text-red-600">{effectiveAppliedPoint.toLocaleString()}P</span>가 적용 중입니다.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* 5. 결제수단 (LGE.COM 제휴카드 삭제됨 -> 일반결제, 간편결제, 현금) */}
            <section>
              <h2 className="text-xl font-bold text-gray-950 pb-3 border-b-2 border-gray-950 mb-6">
                결제수단
              </h2>

              <div className="space-y-4">
                {/* 1) 일반결제 (신용카드) */}
                <div className="border-b border-gray-200 pb-6">
                  <div
                    onClick={() => setPaymentType("card")}
                    className="flex items-center justify-between py-3 cursor-pointer"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentType === "card"}
                        onChange={() => setPaymentType("card")}
                        className="w-4 h-4 text-black focus:ring-black"
                      />
                      <span className="font-bold text-sm text-gray-950">일반결제 (신용카드)</span>
                    </label>
                    <span className="text-xs text-gray-600 flex items-center font-medium hover:underline">
                      결제/무이자 혜택 안내 <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>

                  {/* Card Companies 4x2 Grid */}
                  {paymentType === "card" && (
                    <div className="grid grid-cols-4 gap-2.5 mt-2">
                      {CARD_COMPANIES.map((card) => {
                        const isSelected = selectedCard === card.name;
                        return (
                          <button
                            key={card.name}
                            type="button"
                            onClick={() => setSelectedCard(card.name)}
                            className={`h-16 rounded-lg border text-center relative transition flex flex-col items-center justify-center p-2 ${
                              isSelected
                                ? "border-gray-950 bg-white font-bold shadow-xs"
                                : "border-gray-200 bg-white hover:border-gray-400 text-gray-800"
                            }`}
                          >
                            {card.hasBenefit && (
                              <span className="absolute top-1.5 right-1.5 text-[9px] bg-red-50 text-red-600 font-bold px-1.5 py-0.2 rounded border border-red-200">
                                혜택
                              </span>
                            )}
                            <div className="mb-1 flex items-center justify-center">
                              <CardLogo name={card.name} />
                            </div>
                            <span className="text-xs tracking-tight">{card.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2) 간편결제 */}
                <div
                  onClick={() => setPaymentType("easypay")}
                  className="flex items-center justify-between py-3 border-b border-gray-200 cursor-pointer"
                >
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentType === "easypay"}
                      onChange={() => setPaymentType("easypay")}
                      className="w-4 h-4 text-black focus:ring-black"
                    />
                    <span className="font-bold text-sm text-gray-950">간편결제 (카카오페이 / 네이버페이 / 토스페이)</span>
                  </label>
                  <span className="text-xs text-red-500 font-medium">10%포인트 적립(최대 20만원)</span>
                </div>

                {/* 3) 현금 (가상계좌) */}
                <div
                  onClick={() => setPaymentType("vaccount")}
                  className="flex items-center justify-between py-3 border-b border-gray-200 cursor-pointer"
                >
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentType === "vaccount"}
                      onChange={() => setPaymentType("vaccount")}
                      className="w-4 h-4 text-black focus:ring-black"
                    />
                    <span className="font-bold text-sm text-gray-950">현금(가상계좌 / 무통장입금)</span>
                  </label>
                </div>

                {/* Checkbox: 선택한 결제수단을 다음에도 사용합니다 */}
                <div className="pt-2 flex items-center gap-2">
                  <div
                    onClick={() => setSavePaymentMethod(!savePaymentMethod)}
                    className={`w-4 h-4 rounded flex items-center justify-center cursor-pointer transition ${
                      savePaymentMethod ? "bg-black text-white" : "border border-gray-400 bg-white"
                    }`}
                  >
                    {savePaymentMethod && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span
                    onClick={() => setSavePaymentMethod(!savePaymentMethod)}
                    className="text-xs font-bold text-gray-950 cursor-pointer select-none"
                  >
                    선택한 결제수단을 다음에도 사용합니다.
                  </span>
                </div>

                {/* Notice link */}
                <div className="pt-4 flex items-center gap-1.5 text-xs text-gray-800 font-bold cursor-pointer hover:underline">
                  <Info className="w-3.5 h-3.5 text-gray-500" />
                  <span>결제 전 반드시 확인하세요!</span>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column (4 Cols): Sticky Summary Box */}
          <div className="lg:col-span-4 sticky top-12 space-y-4">
            {/* 1. Red Bordered "결제 금액" Card */}
            <div className="rounded-lg border-2 border-red-500 p-6 bg-white shadow-xs">
              <h3 className="text-base font-bold text-gray-950 mb-5">
                결제 금액
              </h3>

              <div className="space-y-3.5 text-xs text-gray-700">
                <p className="font-bold text-gray-950 text-sm">전체 합계</p>

                <div className="flex justify-between items-center">
                  <span>제품 수</span>
                  <span className="font-medium text-gray-900">{totalItemCount}개</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>주문금액</span>
                  <span className="font-medium text-gray-900">
                    {totalOriginalPrice.toLocaleString()}원
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    할인금액 합계 <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  </span>
                  <span className="font-bold text-red-600">
                    -{discountTotal.toLocaleString()}원
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span>배송비</span>
                  <span className="font-medium text-gray-900">0원</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>LG전자 멤버십 포인트 사용</span>
                  <span
                    className={`font-bold ${
                      effectiveAppliedPoint > 0 ? "text-red-600" : "text-gray-900"
                    }`}
                  >
                    -{effectiveAppliedPoint.toLocaleString()}원
                  </span>
                </div>

                {/* Light Divider */}
                <div className="pt-4 border-t border-dashed border-gray-300 flex justify-between items-baseline">
                  <span className="font-bold text-gray-950 text-sm">최종 결제금액</span>
                  <span className="text-2xl font-black text-gray-950 tracking-tight">
                    {finalAmount.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Terms Checkbox Accordion Card */}
            <div className="rounded-lg border border-gray-300 p-4 bg-white flex items-center justify-between">
              <div
                onClick={() => setAgreedTerms(!agreedTerms)}
                className="flex items-center gap-3 cursor-pointer select-none flex-1"
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition ${
                    agreedTerms ? "bg-black text-white" : "border-2 border-gray-400 bg-white"
                  }`}
                >
                  {agreedTerms && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span className="text-xs font-bold text-gray-900 leading-tight">
                  약관 내용을 확인하였으며, 개인정보 이용 및 제공과 결제에 동의합니다.
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0 ml-2" />
            </div>

            {/* 3. LGE Signature Solid Red Button */}
            <button
              type="button"
              onClick={handlePayment}
              disabled={isLoading || !agreedTerms || products.length === 0}
              className={`w-full py-4 rounded-md text-white font-bold text-base tracking-tight transition duration-150 flex items-center justify-center shadow-xs ${
                isLoading || !agreedTerms || products.length === 0
                  ? "bg-gray-400 cursor-not-allowed opacity-80"
                  : "hover:brightness-95 active:scale-[0.99]"
              }`}
              style={{
                backgroundColor:
                  agreedTerms && !isLoading && products.length > 0 ? "#EA1936" : undefined,
              }}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>토스 결제창 호출 중...</span>
                </div>
              ) : products.length === 0 ? (
                "제품을 선택해 주세요"
              ) : (
                `${finalAmount.toLocaleString()}원 결제하기`
              )}
            </button>

            {/* Return to Dashboard link */}
            <div className="text-center pt-2">
              <Link
                href="/"
                className="text-xs text-gray-500 hover:text-gray-900 font-medium underline"
              >
                ← 대시보드로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Product Selection Catalog Modal */}
      <ProductSelectModal
        isOpen={isSelectModalOpen}
        onClose={() => setIsSelectModalOpen(false)}
        currentProducts={products}
        onAddProduct={handleAddProduct}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveProduct={handleRemoveProduct}
      />
    </div>
  );
}
