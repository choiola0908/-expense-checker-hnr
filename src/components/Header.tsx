"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  RefreshCw,
  BookOpen,
  Share2,
  Check
} from "lucide-react";
import SecurityModal from "./SecurityModal";
import PolicyGuideModal from "./PolicyGuideModal";

interface HeaderProps {
  hasData: boolean;
  onReset: () => void;
  fileName?: string;
  totalRows?: number;
}

export default function Header({ hasData, onReset, fileName, totalRows }: HeaderProps) {
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // URL 공유 링크 복사 (대표 및 결재자 즉시 전달용)
  const handleShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = window.location.href;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <>
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Service Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  한결인테리어 경비 정산 검사기
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                사내 규정(제5조~제9조) 실시간 자동 감사 솔루션
              </p>
            </div>
          </div>

          {/* Action buttons & Status */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* 사내 규정 안내 버튼 */}
            <button
              type="button"
              onClick={() => setIsPolicyModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              title="사내 경비 처리 규정(제5조~제9조) 기준 보기"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">경비 규정 보기</span>
            </button>

            {/* 웹 링크 복사 (대표/결재자 전달용 URL 공유) */}
            <button
              type="button"
              onClick={handleShareLink}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                copiedLink
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              }`}
              title="결재자(대표) 공유용 웹 링크 복사"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>링크 복사됨!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">URL 공유</span>
                </>
              )}
            </button>

            {/* PRD 4.3 Zero Persistence 보안 정책 버튼 */}
            <button
              type="button"
              onClick={() => setIsSecurityModalOpen(true)}
              className="hidden lg:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="사내 금융 데이터 보안 및 무저장 정책 안내 보기"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero-Persistence</span>
            </button>

            {/* 데이터 리셋 / 새 파일 업로드 버튼 */}
            {hasData && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors"
                title="새 CSV 파일 업로드"
              >
                <RefreshCw className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">새 파일 분석</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 사내 규정 전문 모달 */}
      <PolicyGuideModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
      />

      {/* 보안 정책 모달 */}
      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </>
  );
}
