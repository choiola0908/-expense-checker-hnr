"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Users,
  Clock,
  Filter,
  CheckCircle2,
  AlertCircle,
  Copy,
  Info
} from "lucide-react";
import { AuditedExpenseItem, ArticleType } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ExpenseTableProps {
  items: AuditedExpenseItem[];
  selectedArticleFilter?: ArticleType | "ALL" | null;
  onSelectArticleFilter?: (article: ArticleType | "ALL" | null) => void;
  onOpenRejectModalForEmployee?: (employee: string) => void;
}

export default function ExpenseTable({
  items,
  selectedArticleFilter,
  onSelectArticleFilter,
  onOpenRejectModalForEmployee
}: ExpenseTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [internalArticle, setInternalArticle] = useState<string>("ALL");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("ALL");
  const [onlyViolations, setOnlyViolations] = useState(false);
  const [onlyDuplicates, setOnlyDuplicates] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [sortField, setSortField] = useState<"date" | "amount" | "merchant" | "employee" | "violations">("violations");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedItemForRaw, setSelectedItemForRaw] = useState<AuditedExpenseItem | null>(null);

  // 현재 활성 조항 필터 (부모로부터 전달된 값 우선)
  const activeArticle = selectedArticleFilter !== undefined && selectedArticleFilter !== null
    ? selectedArticleFilter
    : internalArticle;

  const handleArticleChange = (val: string) => {
    setInternalArticle(val);
    if (onSelectArticleFilter) {
      onSelectArticleFilter(val === "ALL" ? null : (val as ArticleType));
    }
    setCurrentPage(1);
  };

  // 카테고리 목록
  const categories = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.category))).filter(Boolean);
  }, [items]);

  // 제출자 목록
  const employees = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.employee))).filter(Boolean);
  }, [items]);

  // 필터링
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. 위반 건만 보기 필터
      if (onlyViolations && !item.isViolation) return false;

      // 2. 중복 제출 건만 보기 필터
      if (onlyDuplicates && !item.isDuplicate) return false;

      // 3. 조항별 필터
      if (activeArticle !== "ALL") {
        const hasArticle = item.violations.some((v) => v.article === activeArticle);
        if (!hasArticle) return false;
      }

      // 4. 카테고리 필터
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
        return false;
      }

      // 5. 제출자 필터
      if (selectedEmployee !== "ALL" && item.employee !== selectedEmployee) {
        return false;
      }

      // 6. 검색어 필터
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const match =
          item.employee.toLowerCase().includes(query) ||
          item.merchant.toLowerCase().includes(query) ||
          item.memo.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.receiptType.toLowerCase().includes(query) ||
          (item.approvalNo && item.approvalNo.toLowerCase().includes(query)) ||
          item.violations.some((v) => v.reason.toLowerCase().includes(query));
        if (!match) return false;
      }

      return true;
    });
  }, [items, onlyViolations, onlyDuplicates, activeArticle, selectedCategory, selectedEmployee, searchQuery]);

  // 정렬
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      if (sortField === "violations") {
        const aCount = a.violations.length;
        const bCount = b.violations.length;
        return sortAsc ? aCount - bCount : bCount - aCount;
      } else if (sortField === "date") {
        const dateA = `${a.date} ${a.time}`;
        const dateB = `${b.date} ${b.time}`;
        return sortAsc ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
      } else if (sortField === "amount") {
        return sortAsc ? a.amount - b.amount : b.amount - a.amount;
      } else if (sortField === "merchant") {
        return sortAsc ? a.merchant.localeCompare(b.merchant) : b.merchant.localeCompare(a.merchant);
      } else {
        return sortAsc ? a.employee.localeCompare(b.employee) : b.employee.localeCompare(a.employee);
      }
    });
  }, [filteredItems, sortField, sortAsc]);

  // 페이지네이션
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, currentPage, pageSize]);

  const handleSort = (field: "date" | "amount" | "merchant" | "employee" | "violations") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* 실시간 반응형 데이터 그리드 테이블 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="제출자, 가맹점, 메모, 위반사유 검색..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Filters and Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            {/* Active Article Badge */}
            {activeArticle !== "ALL" && (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-semibold text-xs">
                <span>{activeArticle} 필터 적용 중</span>
                <button
                  type="button"
                  onClick={() => handleArticleChange("ALL")}
                  className="hover:text-blue-900 ml-1 font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Toggle: 위반 건만 보기 */}
            <label className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 select-none">
              <input
                type="checkbox"
                checked={onlyViolations}
                onChange={(e) => {
                  setOnlyViolations(e.target.checked);
                  setCurrentPage(1);
                }}
                className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
              />
              <span className={`font-semibold ${onlyViolations ? "text-rose-600" : "text-slate-700"}`}>
                위반 건만 보기
              </span>
            </label>

            {/* Toggle: 중복 건만 보기 */}
            <label className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 select-none">
              <input
                type="checkbox"
                checked={onlyDuplicates}
                onChange={(e) => {
                  setOnlyDuplicates(e.target.checked);
                  setCurrentPage(1);
                }}
                className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
              />
              <span className={`font-semibold ${onlyDuplicates ? "text-amber-600" : "text-slate-700"}`}>
                중복 의심 건만
              </span>
            </label>

            {/* Article Filter Dropdown */}
            <select
              value={activeArticle}
              onChange={(e) => handleArticleChange(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">전체 조항</option>
              <option value="제5조">제5조 (식대)</option>
              <option value="제6조">제6조 (교통비)</option>
              <option value="제7조">제7조 (증빙)</option>
              <option value="제8조">제8조 (접대비)</option>
              <option value="제9조">제9조 (제출/중복)</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">전체 항목</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Employee Filter */}
            <select
              value={selectedEmployee}
              onChange={(e) => {
                setSelectedEmployee(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">전체 제출자</option>
              {employees.map((emp) => (
                <option key={emp} value={emp}>
                  {emp}
                </option>
              ))}
            </select>

            {/* Page Size */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value={10}>10개씩</option>
              <option value={15}>15개씩</option>
              <option value={30}>30개씩</option>
              <option value={50}>50개씩</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-3.5 w-12 text-center">No</th>
                <th className="py-3 px-3.5">
                  <button
                    type="button"
                    onClick={() => handleSort("violations")}
                    className="flex items-center space-x-1 hover:text-slate-900"
                  >
                    <span>검사 상태</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3.5">
                  <button
                    type="button"
                    onClick={() => handleSort("employee")}
                    className="flex items-center space-x-1 hover:text-slate-900"
                  >
                    <span>제출자</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3.5">
                  <button
                    type="button"
                    onClick={() => handleSort("date")}
                    className="flex items-center space-x-1 hover:text-slate-900"
                  >
                    <span>사용일시</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3.5">계정과목</th>
                <th className="py-3 px-3.5">
                  <button
                    type="button"
                    onClick={() => handleSort("merchant")}
                    className="flex items-center space-x-1 hover:text-slate-900"
                  >
                    <span>가맹점(사용처)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort("amount")}
                    className="flex items-center space-x-1 ml-auto hover:text-slate-900"
                  >
                    <span>청구 금액</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3.5">인원/증빙</th>
                <th className="py-3 px-3.5 min-w-[240px]">적요 / 위반 사유</th>
                <th className="py-3 px-3.5 text-center">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Search className="w-8 h-8 text-slate-300" />
                      <span>검색 또는 필터 조건에 부합하는 경비 내역이 없습니다.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((item, idx) => {
                  const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        item.isViolation
                          ? "bg-rose-50/40 hover:bg-rose-50/70"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      {/* No */}
                      <td className="py-3 px-3.5 text-center text-slate-400 text-xs font-mono">
                        {globalIndex}
                      </td>

                      {/* 검사 상태 배지 */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {item.isViolation ? (
                          <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>위반 ({item.violations.length})</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>정상</span>
                          </div>
                        )}
                        {item.isDuplicate && (
                          <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            중복
                          </span>
                        )}
                      </td>

                      {/* Employee */}
                      <td className="py-3 px-3.5 font-semibold text-slate-800 whitespace-nowrap">
                        {item.employee}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="text-slate-900 font-medium">{formatDate(item.date)}</div>
                        {item.time && (
                          <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{item.time}</span>
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                          {item.category}
                        </span>
                      </td>

                      {/* Merchant */}
                      <td className="py-3 px-3.5 font-medium text-slate-800 max-w-[160px] truncate" title={item.merchant}>
                        {item.merchant}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3.5 text-right font-bold text-slate-900 whitespace-nowrap font-mono">
                        {formatCurrency(item.amount)}
                      </td>

                      {/* Attendees & Receipt */}
                      <td className="py-3 px-3.5 text-xs text-slate-600 whitespace-nowrap">
                        <div className="flex items-center space-x-1 text-slate-700">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>{item.attendees}명</span>
                          {item.attendees > 1 && (
                            <span className="text-[10px] text-slate-400">
                              (인당 {formatCurrency(Math.round(item.amount / item.attendees))})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          증빙: {item.receiptType || "미확인"}
                        </div>
                        {item.approvalNo && (
                          <div className="text-[10px] text-blue-600 font-mono">
                            품의: {item.approvalNo}
                          </div>
                        )}
                      </td>

                      {/* Memo & Violations */}
                      <td className="py-3 px-3.5">
                        {item.memo && (
                          <div className="text-xs text-slate-600 mb-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                            {item.memo}
                          </div>
                        )}

                        {item.violations.length > 0 && (
                          <div className="space-y-1">
                            {item.violations.map((v, vIdx) => (
                              <div
                                key={vIdx}
                                className="text-xs p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-1.5"
                              >
                                <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white font-bold text-[10px] shrink-0 mt-0.5">
                                  {v.article}
                                </span>
                                <span className="leading-snug">
                                  {v.reason}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Action: Copy for this employee & Raw Data View */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          {item.isViolation && onOpenRejectModalForEmployee && (
                            <button
                              type="button"
                              onClick={() => onOpenRejectModalForEmployee(item.employee)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title={`${item.employee}님 반려 사유 텍스트 복사`}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedItemForRaw(item)}
                            className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="CSV 원본 행 데이터 확인"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-slate-600">
          <div>
            총 <span className="font-bold text-slate-800">{filteredItems.length}</span>건 중{" "}
            <span className="font-bold text-slate-800">
              {filteredItems.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            </span>
            -
            <span className="font-bold text-slate-800">
              {Math.min(currentPage * pageSize, filteredItems.length)}
            </span>
            건 표시
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CSV 원본 데이터 모달 */}
      {selectedItemForRaw && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-900">
                CSV 원본 행 상세 데이터 ({selectedItemForRaw.employee} - {selectedItemForRaw.merchant})
              </h3>
              <button
                type="button"
                onClick={() => setSelectedItemForRaw(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-2">
              {Object.entries(selectedItemForRaw.raw).map(([key, value]) => (
                <div key={key} className="flex justify-between items-start text-xs border-b border-slate-100 pb-1.5">
                  <span className="font-semibold text-slate-600 shrink-0 mr-4">{key}</span>
                  <span className="text-slate-900 font-mono text-right break-all">{value || "(빈값)"}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedItemForRaw(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
