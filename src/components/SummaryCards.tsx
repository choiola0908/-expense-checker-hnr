"use client";

import React from "react";
import {
  FileText,
  CheckCircle2,
  AlertOctagon,
  TrendingDown,
  Filter,
  DollarSign,
  Copy
} from "lucide-react";
import { AuditSummary, ArticleType } from "@/lib/types";
import { POLICY_RULES } from "@/constants/policyRules";
import { formatCurrency } from "@/lib/utils";

interface SummaryCardsProps {
  summary: AuditSummary;
  selectedArticle: ArticleType | "ALL" | null;
  onSelectArticle: (article: ArticleType | "ALL" | null) => void;
  fileName?: string;
  onOpenRejectModal?: () => void;
}

export default function SummaryCards({
  summary,
  selectedArticle,
  onSelectArticle,
  fileName,
  onOpenRejectModal
}: SummaryCardsProps) {
  const articles: ArticleType[] = ["제5조", "제6조", "제7조", "제8조", "제9조"];

  // 위반율 계산
  const violationRate =
    summary.totalCount > 0
      ? Math.round((summary.violationCount / summary.totalCount) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Top Banner with File Info and Reject Modal Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            분석 대상 파일
          </span>
          <div className="flex items-center space-x-2 mt-0.5">
            <h2 className="text-base font-bold text-slate-800 truncate max-w-md">
              {fileName || "경비 내역 파일"}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              총 {summary.totalCount}건
            </span>
          </div>
        </div>

        {summary.violationCount > 0 && onOpenRejectModal && (
          <button
            type="button"
            onClick={onOpenRejectModal}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-rose-200 transition-all hover:scale-[1.02]"
          >
            <Copy className="w-4 h-4" />
            <span>제출자별 반려 사유 일괄 복사</span>
          </button>
        )}
      </div>

      {/* 3.3 핵심 지표 카드 (전체 건수, 정상 건수, 총 위반 건수, 중복 제출) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

        {/* 1. 전체 건수 */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs sm:text-sm font-semibold">전체 제출 건수</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {summary.totalCount.toLocaleString()}<span className="text-sm font-normal text-slate-500 ml-1">건</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 truncate">
              총 청구: {formatCurrency(summary.totalAmount)}
            </p>
          </div>
        </div>

        {/* 2. 정상 건수 */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs sm:text-sm font-semibold">정상 승인 건수</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight">
              {summary.validCount.toLocaleString()}<span className="text-sm font-normal text-emerald-600 ml-1">건</span>
            </div>
            <p className="text-xs text-emerald-600/80 mt-1">
              승인 가능: {formatCurrency(summary.totalAmount - summary.violationAmount)}
            </p>
          </div>
        </div>

        {/* 3. 총 위반 건수 */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-rose-200 bg-gradient-to-br from-white to-rose-50/40 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-xs sm:text-sm font-semibold">총 위반 건수</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight">
                {summary.violationCount.toLocaleString()}
              </span>
              <span className="text-sm font-normal text-rose-500">건</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 ml-auto">
                위반율 {violationRate}%
              </span>
            </div>
            <p className="text-xs text-rose-600/80 mt-1">
              위반 금액: {formatCurrency(summary.violationAmount)}
            </p>
          </div>
        </div>

        {/* 4. 중복 제출 감지 건수 */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-amber-200 bg-gradient-to-br from-white to-amber-50/30 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs sm:text-sm font-semibold">중복 제출 감지</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight">
              {summary.duplicateCount.toLocaleString()}<span className="text-sm font-normal text-amber-600 ml-1">건</span>
            </div>
            <p className="text-xs text-amber-700/80 mt-1">
              동일 지출 2중 청구 감지
            </p>
          </div>
        </div>
      </div>

      {/* 3.3 조항별 위반 통계 (배지 칩 형태 및 클릭 시 원클릭 필터) */}
      <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-800">
              조항별 위반 통계 (제5조~제9조 배지 칩 · 클릭 시 해당 조항만 즉시 필터)
            </h3>
          </div>
          {selectedArticle && selectedArticle !== "ALL" && (
            <button
              type="button"
              onClick={() => onSelectArticle(null)}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline"
            >
              전체 보기 (필터 해제)
            </button>
          )}
        </div>

        {/* 배지 칩스 목록 */}
        <div className="flex flex-wrap gap-2 sm:gap-2.5">
          {articles.map((art) => {
            const count = summary.articleStats[art] || 0;
            const isSelected = selectedArticle === art;
            const hasViolation = count > 0;
            const ruleInfo = POLICY_RULES[art];

            return (
              <button
                key={art}
                type="button"
                onClick={() => onSelectArticle(isSelected ? null : art)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all border font-medium ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20 scale-[1.02]"
                    : hasViolation
                    ? "bg-rose-50 hover:bg-rose-100 text-slate-800 border-rose-200 hover:border-rose-300"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200 opacity-60"
                }`}
                title={`${art} (${ruleInfo.title}): ${ruleInfo.summary}`}
              >
                <span className="font-bold">{art}</span>
                <span className={isSelected ? "text-slate-200" : "text-slate-600"}>
                  {ruleInfo.title}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isSelected
                      ? "bg-white text-slate-900"
                      : hasViolation
                      ? "bg-rose-600 text-white shadow-sm"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {count}건
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
