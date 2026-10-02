"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, Download, Sparkles, AlertTriangle } from "lucide-react";
import { parseExpenseCSV } from "@/lib/parser";
import { ExpenseItem } from "@/lib/types";

interface FileUploaderProps {
  onDataLoaded: (items: ExpenseItem[], fileName: string) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

export default function FileUploader({
  onDataLoaded,
  isLoading,
  setIsLoading
}: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setErrorMessage("현재는 .csv 파일만 지원합니다. 엑셀 파일은 [다른 이름으로 저장 > CSV UTF-8]로 변환해 주세요.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const items = await parseExpenseCSV(file);
      if (items.length === 0) {
        setErrorMessage("CSV 파일에서 읽을 수 있는 데이터가 없습니다. 헤더와 내용을 확인해 주세요.");
        return;
      }
      onDataLoaded(items, file.name);
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "알 수 없는 오류";
      setErrorMessage(`파일 파싱 중 오류가 발생했습니다: ${errText}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // 샘플 데이터 불러오기
  const handleLoadSample = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await fetch("/sample_expenses.csv");
      if (!res.ok) throw new Error("샘플 파일을 불러올 수 없습니다.");
      const csvText = await res.text();
      const items = await parseExpenseCSV(csvText);
      onDataLoaded(items, "sample_expenses.csv (테스트 샘플 데이터)");
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "알 수 없는 오류";
      setErrorMessage(`샘플 데이터 로드 실패: ${errText}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer bg-white ${
          isDragOver
            ? "border-blue-500 bg-blue-50/60 scale-[1.01]"
            : "border-slate-300 hover:border-blue-400 hover:bg-slate-50/60"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
            <UploadCloud className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              경비 내역 CSV 파일을 이곳에 드래그하거나 클릭하여 업로드
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              PapaParse 기반 클라이언트 사이드 파싱으로 파일이 즉시 실시간 데이터 그리드에 로드됩니다.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <FileSpreadsheet className="w-4 h-4" />
            <span>지원 형식: .csv (UTF-8, CP949 한글 엑셀 자동 감지)</span>
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-semibold text-slate-700">
                CSV 파싱 및 데이터 로드 중...
              </span>
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="mt-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs sm:text-sm text-rose-700">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Quick Action Helpers */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 px-1">
        <button
          type="button"
          onClick={handleLoadSample}
          disabled={isLoading}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200 transition-colors shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>테스트용 샘플 데이터로 즉시 확인해보기</span>
        </button>

        <a
          href="/sample_expenses.csv"
          download="경비정산서식_샘플.csv"
          className="inline-flex items-center space-x-1 text-slate-500 hover:text-slate-800 underline underline-offset-4"
        >
          <Download className="w-3.5 h-3.5" />
          <span>표준 샘플 CSV 서식 다운로드</span>
        </a>
      </div>
    </div>
  );
}
