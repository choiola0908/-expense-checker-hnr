"use client";

import React from "react";
import { X, ShieldCheck, Lock, DatabaseZap, ServerOff, CheckCircle } from "lucide-react";

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SecurityModal({ isOpen, onClose }: SecurityModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                보안 및 데이터 저장 정책 (Zero-Persistence)
              </h2>
              <p className="text-xs text-slate-500">
                사내 금융/지출 내역의 외부 서버 저장 방지 가이드
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
        <div className="p-6 space-y-4">
          {/* Policy 1: No Database / Zero Persistence */}
          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
              <ServerOff className="w-4 h-4 text-emerald-600" />
              <span>1. 데이터베이스 없음 (No Database / Zero Persistence)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-6">
              업로드하신 CSV 파일과 경비 내역은 백엔드 서버나 외부 데이터베이스에 <strong>전송되거나 저장되지 않습니다.</strong> 모든 데이터 파싱 및 사내 규정 룰 엔진 대조는 사용자의 웹 브라우저 메모리(Client State) 상에서만 100% 실행되며, 창을 닫거나 새로고침하면 즉시 안전하게 소멸됩니다.
            </p>
          </div>

          {/* Policy 2: Git Exclusion Policy */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
              <DatabaseZap className="w-4 h-4 text-blue-600" />
              <span>2. 원격 저장소 노출 차단 (Git Protection)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-6">
              사내 실무 지출 내역 원본 파일 및 <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 text-[11px] font-mono">받은자료/</code> 폴더는 <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 text-[11px] font-mono">.gitignore</code>에 강력하게 등록되어 있어 GitHub 등 외부 원격 코드 저장소에 업로드되는 것을 원천 차단합니다.
            </p>
          </div>

          {/* Security Checklist */}
          <div className="p-4 rounded-xl bg-slate-100/60 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              보안 및 무결성 보장 체크리스트
            </h4>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>서버 사이드 API 호출 및 외부 전송 네트워크 트래픽 0건</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>브라우저 로컬스토리지/쿠키에 금융 데이터 영구 보관 금지</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>순수 클라이언트 사이드 인메모리 암복호화 파싱 환경</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
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
