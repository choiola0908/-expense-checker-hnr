"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import FileUploader from "@/components/FileUploader";
import SummaryCards from "@/components/SummaryCards";
import ExpenseTable from "@/components/ExpenseTable";
import RejectCopyModal from "@/components/RejectCopyModal";
import { ExpenseItem, AuditedExpenseItem, AuditSummary, ArticleType } from "@/lib/types";
import { auditExpenses, calculateAuditSummary } from "@/lib/rules";
import { ShieldCheck, Zap, Lock, FileSpreadsheet, Copy } from "lucide-react";

export default function Home() {
  const [fileName, setFileName] = useState<string>("");
  const [auditedItems, setAuditedItems] = useState<AuditedExpenseItem[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedArticleFilter, setSelectedArticleFilter] = useState<ArticleType | "ALL" | null>(null);

  // 3.4 반려 사유 복사 모달 상태
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [targetEmployeeForModal, setTargetEmployeeForModal] = useState<string | null>(null);

  // CSV 데이터 로드 시 처리 (3.1 파싱 + 3.2 룰 엔진 + 3.3 요약 계산)
  const handleDataLoaded = (parsedItems: ExpenseItem[], uploadedFileName: string) => {
    setFileName(uploadedFileName);

    // 3.2 사내 규정(제5조~제9조) 룰 엔진 검증 실행
    const audited = auditExpenses(parsedItems);
    setAuditedItems(audited);

    // 3.3 대시보드 요약: 핵심 지표 및 조항별 통계 계산
    const calculatedSummary = calculateAuditSummary(audited);
    setSummary(calculatedSummary);
    setSelectedArticleFilter(null);
  };

  // 초기화
  const handleReset = () => {
    setFileName("");
    setAuditedItems([]);
    setSummary(null);
    setSelectedArticleFilter(null);
  };

  // 특정 제출자 반려 사유 모달 열기
  const handleOpenRejectModalForEmployee = (employee: string) => {
    setTargetEmployeeForModal(employee);
    setIsRejectModalOpen(true);
  };

  // 전체 제출자 반려 사유 모달 열기
  const handleOpenRejectModalAll = () => {
    setTargetEmployeeForModal(null);
    setIsRejectModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/80">
      {/* 상단 헤더 */}
      <Header
        hasData={auditedItems.length > 0}
        onReset={handleReset}
        fileName={fileName}
        totalRows={auditedItems.length}
      />

      {/* 메인 컨텐츠 영역 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {auditedItems.length === 0 ? (
          /* [초기 상태: 업로드 영역] */
          <div className="space-y-8 max-w-3xl mx-auto py-4 sm:py-8">
            {/* Hero Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                <span>PRD 3.4: 규정 위반 필터링 & 제출자별 원클릭 복사</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                경비 정산 검사 & <span className="text-rose-600">반려 사유 원클릭 복사</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
                CSV 업로드 즉시 제5조~제9조 위반 및 중복 지출을 전수 검출하고, 사내 메신저나 메일에 바로 보낼 수 있는 공문 서식을 클릭 한 번으로 복사합니다.
              </p>
            </div>

            {/* CSV 업로더 */}
            <FileUploader
              onDataLoaded={handleDataLoaded}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />

            {/* 룰 엔진 검증 대상 조항 안내 카드 */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>내장 룰 엔진 검증 대상 (경비규정 발췌 제5조~제9조)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-2">
                  <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px] shrink-0">
                    제5조
                  </span>
                  <div>
                    <span className="font-bold text-slate-900">식대 한도:</span>{" "}
                    1인당 12,000원 한도 초과 검출 (인원수 나눈 금액)
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-2">
                  <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px] shrink-0">
                    제6조
                  </span>
                  <div>
                    <span className="font-bold text-slate-900">교통비(택시):</span>{" "}
                    22:00 이후 퇴근 또는 외부 이동 목적 메모 필수
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-2">
                  <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px] shrink-0">
                    제7조
                  </span>
                  <div>
                    <span className="font-bold text-slate-900">증빙 적격성:</span>{" "}
                    30,000원 이상 지출 건 중 간이영수증 제출 차단
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-2">
                  <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px] shrink-0">
                    제8조
                  </span>
                  <div>
                    <span className="font-bold text-slate-900">접대비 품의:</span>{" "}
                    300,000원 초과 건 사전 품의번호 누락 검증
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-2 sm:col-span-2">
                  <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px] shrink-0">
                    제9조
                  </span>
                  <div>
                    <span className="font-bold text-slate-900">제출기한 & 중복제출:</span>{" "}
                    30일 초과 제출 건 및 동일 일자·가맹점·금액 2중 청구 100% 감지
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* [데이터 로드 완료: 3.3 대시보드 요약 + 3.4 필터 & 복사 + 테이블 뷰] */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* 3.3 요약 카드 (Summary Cards) + 3.4 일괄 복사 버튼 */}
            {summary && (
              <SummaryCards
                summary={summary}
                selectedArticle={selectedArticleFilter}
                onSelectArticle={(art) => setSelectedArticleFilter(art)}
                fileName={fileName}
                onOpenRejectModal={handleOpenRejectModalAll}
              />
            )}

            {/* 3.1 & 3.4 반응형 테이블 뷰 (위반 건 필터 & 개별 제출자 복사 지원) */}
            <ExpenseTable
              items={auditedItems}
              selectedArticleFilter={selectedArticleFilter}
              onSelectArticleFilter={(art) => setSelectedArticleFilter(art)}
              onOpenRejectModalForEmployee={handleOpenRejectModalForEmployee}
            />

            {/* PRD 6 성공 지표 달성 배너 */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-blue-900">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-bold">목표 달성 지표:</span>
                <span>정산 검토 시간 4시간 → 10분 이내 단축 · 중복 제출 감지율 100% (2중 지급 0건)</span>
              </div>
              <span className="text-blue-700/80 font-medium">v1.0 클라이언트 단일 웹 버전</span>
            </div>
          </div>
        )}
      </main>

      {/* 3.4 제출자별 반려 사유 클립보드 복사 모달 */}
      <RejectCopyModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        items={auditedItems}
        defaultEmployee={targetEmployeeForModal}
      />

      {/* 푸터 */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>한결인테리어 경영지원팀(회계) 경비 정산 감사 솔루션</span>
          <span>Next.js 14 App Router · Zero-Persistence · Vercel Ready</span>
        </div>
      </footer>
    </div>
  );
}
