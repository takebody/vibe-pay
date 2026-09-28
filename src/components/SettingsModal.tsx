"use client";

import React, { useState, useEffect } from "react";
import {
  KeyRound,
  X,
  Check,
  RotateCcw,
  ExternalLink,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onKeysUpdated,
}) => {
  const [clientKey, setClientKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load current keys when opened
  useEffect(() => {
    if (!isOpen) return;

    const fetchKeys = async () => {
      setIsLoading(true);
      setStatusMessage(null);
      try {
        const res = await fetch("/api/settings/keys");
        if (res.ok) {
          const data = await res.json();
          setClientKey(data.clientKey);
          setSecretKey(data.secretKey);
          setIsCustom(data.isCustom);
        }
      } catch (e) {
        console.error("Failed to load keys:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKeys();
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/settings/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientKey, secretKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "키 저장에 실패했습니다.");
      }

      setIsCustom(data.isCustom);
      setStatusMessage({ type: "success", text: data.message });
      if (onKeysUpdated) onKeysUpdated();
    } catch (err: unknown) {
      setStatusMessage({
        type: "error",
        text: (err as Error).message || "키 저장 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!confirm("토스페이먼츠 기본 공용 샌드박스 테스트 키로 복원하시겠습니까?")) {
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/settings/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "기본 키 복원에 실패했습니다.");
      }

      setClientKey(data.clientKey);
      setSecretKey(data.secretKey);
      setIsCustom(false);
      setStatusMessage({ type: "success", text: data.message });
      if (onKeysUpdated) onKeysUpdated();
    } catch (err: unknown) {
      setStatusMessage({
        type: "error",
        text: (err as Error).message || "기본 키 복원 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden text-gray-900">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c5163f]/10 text-[#c5163f] flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-950">
                토스페이먼츠 API 키 설정
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    isCustom
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {isCustom ? "사용자 커스텀 키 적용 중" : "토스 기본 샌드박스 키 사용 중"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5 text-xs">
          {isLoading ? (
            <div className="py-12 text-center text-gray-400">
              <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              키 정보를 불러오는 중입니다...
            </div>
          ) : (
            <>
              {/* Alert / Notice */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>실시간 동적 키 교체 지원</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  키를 변경하면 서버 재시작 없이 즉시 새 키로 결제창 호출 및 승인/취소가 진행됩니다.
                  본인 상점의 테스트 결제 내역을 직접 확인하고 싶을 때 유용합니다.
                </p>
              </div>

              {/* Client Key Field */}
              <div>
                <label className="font-bold text-gray-800 block mb-1.5">
                  클라이언트 키 (Client Key) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientKey}
                  onChange={(e) => setClientKey(e.target.value)}
                  placeholder="test_ck_..."
                  className="w-full px-3.5 py-2.5 font-mono text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                  required
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  브라우저의 결제창 SDK를 초기화할 때 사용되는 공개 키입니다. (<code>test_ck_...</code>)
                </p>
              </div>

              {/* Secret Key Field */}
              <div>
                <label className="font-bold text-gray-800 block mb-1.5">
                  시크릿 키 (Secret Key) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="test_sk_..."
                    className="w-full pr-10 pl-3.5 py-2.5 font-mono text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  서버에서 결제 승인 및 취소 API를 호출할 때 사용되는 비밀 키입니다. (<code>test_sk_...</code>)
                </p>
              </div>

              {/* Toss Developer Center Link */}
              <div className="pt-1 flex items-center justify-between text-[11px] text-gray-500">
                <span>내 토스 테스트 키를 어디서 확인하나요?</span>
                <a
                  href="https://developers.tosspayments.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#c5163f] hover:underline font-bold flex items-center gap-1"
                >
                  토스 개발자센터 바로가기
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    statusMessage.type === "success"
                      ? "bg-green-50 border border-green-200 text-green-800"
                      : "bg-red-50 border border-red-200 text-red-800"
                  }`}
                >
                  {statusMessage.type === "success" ? (
                    <Check className="w-4 h-4 flex-shrink-0 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}
            </>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetToDefault}
              disabled={isSaving || !isCustom}
              className="px-3.5 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium flex items-center gap-1.5 transition text-xs"
              title="기본 테스트 키로 되돌리기"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              기본 키로 복원
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-semibold text-xs"
              >
                닫기
              </button>
              <button
                type="submit"
                disabled={isSaving || isLoading}
                className="px-5 py-2 bg-gray-900 hover:bg-black text-white rounded-lg font-bold transition flex items-center gap-1.5 shadow-sm text-xs"
              >
                {isSaving ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                API 키 저장
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
