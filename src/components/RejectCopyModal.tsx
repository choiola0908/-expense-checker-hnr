"use client";

import React, { useState, useMemo, useEffect } from "react";
import { X, Copy, Check, User, Send, AlertCircle, FileText } from "lucide-react";
import { AuditedExpenseItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface RejectCopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: AuditedExpenseItem[];
  defaultEmployee?: string | null;
}

export default function RejectCopyModal({
  isOpen,
  onClose,
  items,
  defaultEmployee
}: RejectCopyModalProps) {
  // 위반 건만 필터링
  const violationItems = useMemo(() => {
    return items.filter((item) => item.isViolation);
  }, [items]);

  // 제출자별 그룹화
  const employeeGroups = useMemo(() => {
    const map = new Map<string, AuditedExpenseItem[]>();
    violationItems.forEach((item) => {
      const emp = item.employee || "미상";
      if (!map.has(emp)) {
        map.set(emp, []);
      }
      map.get(emp)!.push(item);
    });
    return map;
  }, [violationItems]);

  const employees = useMemo(() => {
    return Array.from(employeeGroups.keys()).sort();
  }, [employeeGroups]);

  const [selectedEmployee, setSelectedEmployee] = useState<string>("ALL");
  const [copied, setCopied] = useState(false);

  // defaultEmployee가 지정되거나 열릴 때 선택 상태 갱신
  useEffect(() => {
    if (defaultEmployee && employeeGroups.has(defaultEmployee)) {
      setSelectedEmployee(defaultEmployee);
    } else if (employees.length > 0) {
      setSelectedEmployee("ALL");
    }
  }, [defaultEmployee, employeeGroups, employees.length, isOpen]);

  // 서식화된 반려 사유 텍스트 자동 생성
  const formattedText = useMemo(() => {
    if (employees.length === 0) {
      return "위반된 경비 내역이 없습니다.";
    }

    const generateSingleMessage = (empName: string, empItems: AuditedExpenseItem[]) => {
      const totalAmount = empItems.reduce((acc, cur) => acc + cur.amount, 0);

      const itemsDetail = empItems
        .map((item, idx) => {
          const reasons = item.violations
            .map((v) => `  └ [${v.article} ${v.articleTitle}] ${v.reason}`)
            .join("\n");

          return `[건 ${idx + 1}] ${item.date} | ${item.merchant} | ${formatCurrency(item.amount)}
  - 항목: ${item.category}
  - 메모: ${item.memo || "없음"}
${reasons}`;
        })
        .join("\n\n");

      return `안녕하세요, ${empName}님. 경영지원팀(회계)입니다.

제출해 주신 경비 청구 내역 중 사내 경비 처리 규정(제5조~제9조)에 의거하여 보완 또는 반려가 필요한 내역을 안내해 드립니다.

■ 대상자: ${empName}님 (총 ${empItems.length}건 / 합계: ${formatCurrency(totalAmount)})

${itemsDetail}

확인 후 소명 자료(사전 품의서, 추가 증빙 등)를 첨부하여 재상신해 주시거나, 한도 초과분의 경우 개인 부담 정산 처리를 부탁드립니다.
문의사항이 있으시면 경영지원팀으로 연락해 주세요. 감사합니다.`;
    };

    if (selectedEmployee === "ALL") {
      return employees
        .map((emp) => generateSingleMessage(emp, employeeGroups.get(emp) || []))
        .join("\n\n" + "=".repeat(60) + "\n\n");
    } else {
      const empItems = employeeGroups.get(selectedEmployee) || [];
      return generateSingleMessage(selectedEmployee, empItems);
    }
  }, [employees, employeeGroups, selectedEmployee]);

  // 클립보드 복사 실행
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 API fallback
      const textarea = document.createElement("textarea");
      textarea.value = formattedText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                제출자별 반려 사유 원클릭 클립보드 복사
              </h2>
              <p className="text-xs text-slate-500">
                사내 메신저(Slack, 잔디 등)나 사내 이메일에 즉시 붙여넣을 수 있는 정형화된 공문 서식입니다.
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

        {/* Employee Selection Chips */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white overflow-x-auto shrink-0 flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setSelectedEmployee("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
              selectedEmployee === "ALL"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            전체 대상자 일괄 ({violationItems.length}건)
          </button>

          {employees.map((emp) => {
            const count = (employeeGroups.get(emp) || []).length;
            const isSelected = selectedEmployee === emp;
            return (
              <button
                key={emp}
                type="button"
                onClick={() => setSelectedEmployee(emp)}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all border ${
                  isSelected
                    ? "bg-rose-50 border-rose-300 text-rose-800 font-bold ring-1 ring-rose-300"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <User className="w-3 h-3 text-slate-400" />
                <span>{emp}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-200 text-rose-900 font-bold">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Textarea Preview */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-950">
          <textarea
            readOnly
            value={formattedText}
            className="w-full h-80 sm:h-96 p-4 font-mono text-xs sm:text-sm bg-transparent text-slate-200 leading-relaxed focus:outline-none resize-none"
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>
              {selectedEmployee === "ALL"
                ? `전체 ${employees.length}명 대상 서식이 연결되어 복사됩니다.`
                : `${selectedEmployee}님 대상 서식이 복사됩니다.`}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                copied
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200 scale-105"
                  : "bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-200 hover:scale-[1.02]"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>클립보드에 복사 완료!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>반려 사유 텍스트 복사</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
