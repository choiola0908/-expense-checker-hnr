import { ArticleType } from "@/constants/policyRules";

export type { ArticleType };

export interface ExpenseItem {
  id: string;
  employee: string;       // 제출자
  date: string;           // 사용일자 (YYYY-MM-DD)
  time: string;           // 결제/사용 시간 (HH:mm)
  category: string;       // 계정과목/항목 (식대, 교통비, 소모품비, 접대비 등)
  merchant: string;       // 가맹점 / 사용처
  amount: number;         // 지출금액 (원)
  attendees: number;      // 참석 인원수 (기본 1)
  receiptType: string;    // 증빙구분 (법인카드, 세금계산서, 간이영수증 등)
  memo: string;           // 메모 / 사용목적 / 적요
  approvalNo?: string;    // 품의번호
  submitDate?: string;    // 제출일자
  raw: Record<string, string>; // 원본 행 데이터
}

export interface Violation {
  article: ArticleType;
  articleTitle: string;
  reason: string;
  severity: "error" | "warning";
  excessAmount?: number;
}

export type ViolationResult = Violation;

export interface AuditedExpenseItem extends ExpenseItem {
  isViolation: boolean;
  violations: Violation[];
  isDuplicate: boolean;
}

export interface AuditSummary {
  totalCount: number;
  validCount: number;
  violationCount: number;
  duplicateCount: number;
  totalAmount: number;
  violationAmount: number;
  articleStats: Record<ArticleType, number>;
}

export interface CSVParseSummary {
  totalRows: number;
  totalAmount: number;
  uniqueEmployees: string[];
  dateRange: { start: string; end: string };
  categories: { name: string; count: number; amount: number }[];
  violationCount: number;
  duplicateCount: number;
}
