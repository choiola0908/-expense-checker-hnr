import Papa from "papaparse";
import { ExpenseItem, CSVParseSummary } from "./types";

// 컬럼 매핑 사전 (소문자 및 공백 제거 기준)
const COLUMN_ALIASES: Record<keyof Omit<ExpenseItem, "id" | "raw">, string[]> = {
  employee: ["제출자", "성명", "이름", "사원명", "신청자", "담당자", "employee", "name", "user"],
  date: ["사용일자", "사용일", "일자", "결제일", "결제일자", "지출일", "지출일자", "date"],
  time: ["사용시간", "결제시간", "시간", "승인시간", "time"],
  category: ["계정과목", "항목", "지출구분", "구분", "지출항목", "비용구분", "category"],
  merchant: ["가맹점", "가맹점명", "상호", "사용처", "가맹점(상호)", "merchant", "store", "place"],
  amount: ["금액", "지출금액", "결제금액", "청구금액", "합계", "승인금액", "amount", "price", "cost"],
  attendees: ["인원수", "인원", "참석인원", "동반인원", "참석자수", "attendees", "count"],
  receiptType: ["증빙구분", "증빙", "증빙종류", "영수증종류", "영수증구분", "증빙자료", "receipt", "proof"],
  memo: ["메모", "적요", "사용목적", "목적", "사유", "내용", "비고", "상세내역", "memo", "note", "description"],
  approvalNo: ["품의번호", "사전품의", "사전품의번호", "결재번호", "품의", "approval_no", "approval"],
  submitDate: ["제출일자", "제출일", "신청일", "신청일자", "submit_date"]
};

// 숫자 정제 유틸 (문자열 내의 콤마, '원', 공백 제거)
export function parseAmount(val: unknown): number {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
}

// 인원수 파싱 유틸 (기본값 1)
export function parseAttendees(val: unknown): number {
  if (!val) return 1;
  const cleaned = String(val).replace(/[^0-9]/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) || num <= 0 ? 1 : num;
}

// 날짜 및 시간 정규화 유틸
export function normalizeDateTime(rawDate: string, rawTime?: string): { date: string; time: string } {
  let date = String(rawDate || "").trim();
  let time = String(rawTime || "").trim();

  // 날짜 문자열에 시간까지 포함된 경우 (예: "2026-03-15 22:30:00" 또는 "2026-03-15T22:30")
  if (date.includes(" ") || date.includes("T")) {
    const parts = date.replace("T", " ").split(" ");
    date = parts[0];
    if (!time && parts[1]) {
      time = parts[1].slice(0, 5);
    }
  }

  // 날짜 형식 정리 (2026.03.15, 2026/03/15 -> 2026-03-15)
  date = date.replace(/[./]/g, "-").slice(0, 10);

  // 시간 형식 정리 (예: "22:30:15" -> "22:30", "9:5" -> "09:05")
  if (time) {
    const timeMatch = time.match(/(\d{1,2})[:시](\d{1,2})?/);
    if (timeMatch) {
      const hour = timeMatch[1].padStart(2, "0");
      const minute = (timeMatch[2] || "00").padStart(2, "0");
      time = `${hour}:${minute}`;
    }
  }

  return { date, time };
}

// CSV 텍스트 또는 파일 파싱
export async function parseExpenseCSV(fileOrText: File | string): Promise<ExpenseItem[]> {
  let csvText: string;

  if (typeof fileOrText === "string") {
    csvText = fileOrText;
  } else {
    // 파일 인코딩(UTF-8 우선, 필요 시 EUC-KR 처리)
    csvText = await readFileWithFallback(fileOrText);
  }

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          resolve([]);
          return;
        }

        const items: ExpenseItem[] = results.data.map((row, index) => {
          const mapped: Record<string, string> = {};

          // 헤더 키 매칭 (대소문자/공백 무시)
          Object.entries(row).forEach(([colName, colVal]) => {
            const cleanCol = colName.trim().toLowerCase().replace(/[\s_\-]/g, "");
            for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
              if (aliases.some((alias) => cleanCol === alias.toLowerCase().replace(/[\s_\-]/g, ""))) {
                mapped[key] = colVal ? String(colVal).trim() : "";
                break;
              }
            }
          });

          const { date, time } = normalizeDateTime(mapped.date || "", mapped.time || "");

          return {
            id: `item-${index + 1}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
            employee: mapped.employee || "미상",
            date: date || "",
            time: time || "",
            category: mapped.category || "기타",
            merchant: mapped.merchant || "기타 사용처",
            amount: parseAmount(mapped.amount),
            attendees: parseAttendees(mapped.attendees),
            receiptType: mapped.receiptType || "미확인",
            memo: mapped.memo || "",
            approvalNo: mapped.approvalNo || "",
            submitDate: mapped.submitDate || "",
            raw: row
          };
        });

        resolve(items);
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
}

// 파일 인코딩 처리 유틸 (EUC-KR 깨짐 방지)
async function readFileWithFallback(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();

  // 1차 시도: UTF-8
  try {
    const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
    return utf8Decoder.decode(buffer);
  } catch {
    // UTF-8 디코딩 실패 시 한글 Windows 엑셀 기본인 EUC-KR(CP949)로 재시도
    try {
      const eucKrDecoder = new TextDecoder("euc-kr");
      return eucKrDecoder.decode(buffer);
    } catch {
      // 최후 수단: 느슨한 UTF-8
      const fallback = new TextDecoder("utf-8");
      return fallback.decode(buffer);
    }
  }
}

// 파싱 데이터 요약 계산
export function summarizeParsedExpenses(items: ExpenseItem[]): CSVParseSummary {
  const employeeSet = new Set<string>();
  const categoryMap = new Map<string, { count: number; amount: number }>();
  let totalAmount = 0;
  let minDate = "";
  let maxDate = "";

  let violationCount = 0;
  let duplicateCount = 0;

  items.forEach((item) => {
    totalAmount += item.amount;
    if (item.employee) employeeSet.add(item.employee);

    if (item.date) {
      if (!minDate || item.date < minDate) minDate = item.date;
      if (!maxDate || item.date > maxDate) maxDate = item.date;
    }

    const cat = item.category || "기타";
    const current = categoryMap.get(cat) || { count: 0, amount: 0 };
    categoryMap.set(cat, {
      count: current.count + 1,
      amount: current.amount + item.amount
    });

    // 3.2 룰 엔진 검증 결과 집계
    const audited = item as unknown as { isViolation?: boolean; isDuplicate?: boolean };
    if (audited.isViolation) violationCount += 1;
    if (audited.isDuplicate) duplicateCount += 1;
  });

  const categories = Array.from(categoryMap.entries()).map(([name, stat]) => ({
    name,
    count: stat.count,
    amount: stat.amount
  }));

  return {
    totalRows: items.length,
    totalAmount,
    uniqueEmployees: Array.from(employeeSet),
    dateRange: { start: minDate, end: maxDate },
    categories,
    violationCount,
    duplicateCount
  };
}

