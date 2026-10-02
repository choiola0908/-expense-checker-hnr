"use client";

import React from "react";
import { X, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import { POLICY_RULES } from "@/constants/policyRules";
import { ArticleType } from "@/lib/types";

interface PolicyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PolicyGuideModal({ isOpen, onClose }: PolicyGuideModalProps) {
  if (!isOpen) return null;

  const articles: ArticleType[] = ["제5조", "제6조", "제7조", "제8조", "제9조"];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                한결인테리어 경비 처리 규정 (제5조~제9조)
              </h2>
              <p className="text-xs text-slate-500">
                제정 2024-01-01 / 개정 2026-03-01 / 관리 부서: 경영지원팀(회계)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start space-x-2.5 text-xs text-blue-900">
            <AlertCircle className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
            <div className="leading-relaxed">
              본 시스템은 아래 사내 공식 규정을 기반으로 하드코딩된 순수 함수 룰 엔진에 의해 <strong>100% 자동 전수 대조</strong>를 수행합니다.
            </div>
          </div>

          <div className="space-y-3.5">
            {articles.map((art) => {
              const rule = POLICY_RULES[art];
              return (
                <div
                  key={art}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-xs font-bold">
                      {rule.article}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">
                      {rule.title}
                    </h3>
                  </div>

                  <div className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg mb-2 inline-block">
                    판정 기준: {rule.summary}
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 pl-1">
                    {rule.fullText.map((line, idx) => (
                      <p key={idx} className="leading-relaxed">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>경영지원팀 승인 v1.0 고정 룰셋 적용</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
