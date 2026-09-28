"use client";

import React, { useState } from "react";
import { LgeProduct, LGE_CATALOG_PRODUCTS } from "@/data/lgeProducts";
import { FilterBottle } from "./FilterBottle";
import { X, Search, Check, Plus, Minus, ShoppingBag, Sparkles } from "lucide-react";

interface ProductItem {
  id: string;
  name: string;
  modelCode: string;
  category: string;
  originalPrice: number;
  discountRate: number;
  salePrice: number;
  benefitPrice?: number;
  quantity: number;
  filterNumber?: "1" | "2";
  imageUrl?: string;
  badges?: string[];
}

interface ProductSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProducts: ProductItem[];
  onAddProduct: (product: LgeProduct) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveProduct: (productId: string) => void;
}

const CATEGORIES = ["전체", "가전", "TV/AV", "IT/모니터", "에어케어"] as const;

export const ProductSelectModal: React.FC<ProductSelectModalProps> = ({
  isOpen,
  onClose,
  currentProducts,
  onAddProduct,
  onUpdateQuantity,
  onRemoveProduct,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredProducts = LGE_CATALOG_PRODUCTS.filter((item) => {
    const matchesCategory =
      selectedCategory === "전체" || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.modelCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getProductQuantityInCart = (id: string) => {
    const found = currentProducts.find((p) => p.id === id);
    return found ? found.quantity : 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#c5163f] text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-gray-950 tracking-tight">
                  LGE 인기 가전 제품 선택
                </h2>
                <span className="text-[11px] bg-red-100 text-[#c5163f] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> 인기 모델 5선
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                원하시는 제품을 선택하여 결제 품목에 즉시 추가하거나 수량을 조절할 수 있습니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar & Search */}
        <div className="p-4 border-b border-gray-100 bg-white flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Categories */}
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                  selectedCategory === cat
                    ? "bg-gray-950 text-white shadow-2xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="제품명, 모델명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 focus:bg-white"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((prod) => {
              const qtyInCart = getProductQuantityInCart(prod.id);
              const isSelected = qtyInCart > 0;

              return (
                <div
                  key={prod.id}
                  className={`bg-white rounded-xl border p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
                    isSelected
                      ? "border-[#c5163f] ring-2 ring-[#c5163f]/20 bg-red-50/10"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div>
                    {/* Visual Container */}
                    <div className="h-44 w-full bg-white rounded-lg flex items-center justify-center relative overflow-hidden border border-gray-100 p-2 mb-3.5 group">
                      {prod.filterNumber ? (
                        <div className="scale-125">
                          <FilterBottle number={prod.filterNumber} />
                        </div>
                      ) : prod.imageUrl ? (
                        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : null}

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        {prod.badges?.map((badge, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              badge.includes("1위")
                                ? "bg-black text-white"
                                : "bg-gray-100 text-gray-700 border border-gray-200"
                            }`}
                          >
                            {badge}
                          </span>
                        ))}
                      </div>

                      {/* Selected Chip */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-[#c5163f] text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" /> 담김
                        </div>
                      )}
                    </div>

                    {/* Meta info */}
                    <p className="text-[11px] font-mono text-gray-400 font-medium">
                      {prod.modelCode}
                    </p>
                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mt-0.5">
                      {prod.name}
                    </h3>

                    {/* Price Section */}
                    <div className="mt-2.5 space-y-0.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-red-600 font-extrabold text-sm">
                          {prod.discountRate}%
                        </span>
                        <span className="text-base font-black text-gray-950 tabular-nums">
                          {prod.salePrice.toLocaleString()}원
                        </span>
                        <span className="text-xs text-gray-400 line-through tabular-nums ml-auto">
                          {prod.originalPrice.toLocaleString()}원
                        </span>
                      </div>
                      {prod.benefitPrice && (
                        <p className="text-[11px] text-red-500 font-bold">
                          최대혜택가: {prod.benefitPrice.toLocaleString()}원
                        </p>
                      )}
                    </div>

                    {prod.deliveryNotice && (
                      <p className="text-[10px] text-gray-500 mt-2 font-medium bg-gray-50 px-2 py-1 rounded">
                        {prod.deliveryNotice}
                      </p>
                    )}
                  </div>

                  {/* Action Button / Quantity Controls */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    {isSelected ? (
                      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-1.5">
                        <span className="text-xs font-bold text-gray-700 ml-1.5">
                          담긴 수량: <span className="text-[#c5163f]">{qtyInCart}개</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(prod.id, -1)}
                            className="w-7 h-7 bg-white hover:bg-gray-100 border border-gray-200 rounded text-gray-700 flex items-center justify-center font-bold text-sm shadow-2xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-extrabold text-gray-900 tabular-nums">
                            {qtyInCart}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(prod.id, 1)}
                            className="w-7 h-7 bg-white hover:bg-gray-100 border border-gray-200 rounded text-gray-700 flex items-center justify-center font-bold text-sm shadow-2xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAddProduct(prod)}
                        className="w-full py-2 bg-gray-900 hover:bg-[#c5163f] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        주문에 담기
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-600 font-medium">
            현재 선택된 품목:{" "}
            <span className="font-extrabold text-gray-950">
              {currentProducts.length}개 상품 (총 {currentProducts.reduce((sum, p) => sum + p.quantity, 0)}개)
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#c5163f] hover:bg-[#a91235] text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-[0.98]"
            >
              선택 완료 (결제창 반영)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
