import {
  ExpenseItem,
  AuditedExpenseItem,
  Violation
} from "./types";
import { POLICY_CONSTANTS, POLICY_RULES } from "@/constants/policyRules";

// 시간 문자열(HH:mm)이 심야(22:00 ~ 05:00)인지 검사
function isNightTime(timeStr: string): boolean {
  if (!timeStr) return false;
  const match = timeStr.match(/^(\d{1,2}):(\d{1,2})/);
  if (!match) return false;
  const hour = parseInt(match[1], 10);
  return hour >= POLICY_CONSTANTS.TAXI_NIGHT_HOUR_START || hour < 5;
}

// 업무상 외부 이동 키워드 목록
const BUSINESS_TRAVEL_KEYWORDS = [
  "고객사",
  "현장",
  "점검",
  "방문",
  "미팅",
  "실측",
  "외근",
  "시공",
  "감리",
  "자재",
  "납품",
  "출장",
  "외부"
];

// 적격증빙 인정 키워드
const VALID_PROOF_KEYWORDS = [
  "법인카드",
  "법카",
  "카드",
  "신용카드",
  "체크카드",
  "전표",
  "세금계산서",
  "계산서",
  "현금영수증"
];

// 날짜 간 차이(일수) 계산
function getDaysDiff(date1Str: string, date2Str: string): number {
  try {
    const d1 = new Date(date1Str);
    const d2 = new Date(date2Str);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/**
 * 단일 경비 항목에 대한 제5조~제9조(제출기한) 룰 검증 순수 함수
 */
export function auditSingleExpenseItem(
  item: ExpenseItem,
  referenceDate?: string
): Violation[] {
  const violations: Violation[] = [];
  const categoryLower = (item.category || "").toLowerCase();
  const memoLower = (item.memo || "").toLowerCase();
  const merchantLower = (item.merchant || "").toLowerCase();
  const receiptLower = (item.receiptType || "").toLowerCase();

  // ----------------------------------------------------
  // 제5조 (식대): 1인당 1회 12,000원 한도 검증
  // ----------------------------------------------------
  const isMeal =
    categoryLower.includes("식대") ||
    categoryLower.includes("식비") ||
    categoryLower.includes("야근식") ||
    categoryLower.includes("중식") ||
    categoryLower.includes("석식") ||
    categoryLower.includes("회식") ||
    memoLower.includes("식대") ||
    memoLower.includes("식사");

  if (isMeal) {
    const attendees = item.attendees > 0 ? item.attendees : 1;
    const perPerson = Math.round(item.amount / attendees);

    if (perPerson > POLICY_CONSTANTS.MEAL_LIMIT_PER_PERSON) {
      const excess = (perPerson - POLICY_CONSTANTS.MEAL_LIMIT_PER_PERSON) * attendees;
      violations.push({
        article: "제5조",
        articleTitle: POLICY_RULES["제5조"].title,
        reason: `1인당 식대 한도(12,000원) 초과: 1인당 ${perPerson.toLocaleString()}원 (총 ${item.amount.toLocaleString()}원 / ${attendees}명, 초과액: ${excess.toLocaleString()}원)`,
        severity: "error",
        excessAmount: excess
      });
    }
  }

  // ----------------------------------------------------
  // 제6조 (교통비): 택시비 검증
  // ----------------------------------------------------
  const isTaxi =
    categoryLower.includes("택시") ||
    merchantLower.includes("택시") ||
    merchantLower.includes("taxi") ||
    merchantLower.includes("카카오t") ||
    merchantLower.includes("우티") ||
    merchantLower.includes("타다") ||
    memoLower.includes("택시");

  if (isTaxi) {
    const isNight = isNightTime(item.time);
    const hasValidTravelReason = BUSINESS_TRAVEL_KEYWORDS.some((kw) =>
      memoLower.includes(kw)
    );
    const isExplicitDayRetire = memoLower.includes("퇴근") && !isNight;

    if (isExplicitDayRetire) {
      violations.push({
        article: "제6조",
        articleTitle: POLICY_RULES["제6조"].title,
        reason: `오후 10시(22:00) 이전 퇴근 택시비 불인정 (결제시간: ${item.time || "미기재"}, 메모: ${item.memo || "없음"})`,
        severity: "error"
      });
    } else if (!isNight && !hasValidTravelReason) {
      violations.push({
        article: "제6조",
        articleTitle: POLICY_RULES["제6조"].title,
        reason: `오후 10시 이전 택시비는 업무상 외부 이동(방문/점검 등) 메모 기재 시에만 인정 (결제시간: ${item.time || "시간 미기재"})`,
        severity: "error"
      });
    }
  }

  // ----------------------------------------------------
  // 제7조 (증빙): 30,000원 이상 간이영수증 불가
  // ----------------------------------------------------
  if (item.amount >= POLICY_CONSTANTS.RECEIPT_REQUIRED_THRESHOLD) {
    const isSimpleReceipt =
      receiptLower.includes("간이") ||
      receiptLower.includes("간이영수증");

    const isMissingProof =
      receiptLower.includes("없음") ||
      receiptLower.includes("미비") ||
      receiptLower.includes("누락") ||
      (!receiptLower && !VALID_PROOF_KEYWORDS.some((kw) => receiptLower.includes(kw)));

    if (isSimpleReceipt) {
      violations.push({
        article: "제7조",
        articleTitle: POLICY_RULES["제7조"].title,
        reason: `30,000원 이상 지출은 적격증빙(법인카드/세금계산서/현금영수증) 필수 (간이영수증 불인정)`,
        severity: "error"
      });
    } else if (isMissingProof && receiptLower.length > 0) {
      violations.push({
        article: "제7조",
        articleTitle: POLICY_RULES["제7조"].title,
        reason: `30,000원 이상 지출 건의 증빙 미비 (현재 증빙: ${item.receiptType || "미확인"})`,
        severity: "warning"
      });
    }
  }

  // ----------------------------------------------------
  // 제8조 (접대비): 300,000원 초과 시 사전 품의번호 필수
  // ----------------------------------------------------
  const isEntertainment =
    categoryLower.includes("접대") ||
    categoryLower.includes("거래처") ||
    memoLower.includes("접대") ||
    memoLower.includes("거래처");

  if (isEntertainment && item.amount > POLICY_CONSTANTS.ENTERTAINMENT_LIMIT_WITHOUT_APPROVAL) {
    const hasApprovalNo =
      item.approvalNo &&
      item.approvalNo.trim() !== "" &&
      item.approvalNo.trim() !== "-" &&
      item.approvalNo.trim() !== "없음";

    if (!hasApprovalNo) {
      violations.push({
        article: "제8조",
        articleTitle: POLICY_RULES["제8조"].title,
        reason: `300,000원 초과 거래처 접대비 사전 품의번호 누락`,
        severity: "error"
      });
    }
  }

  // ----------------------------------------------------
  // 제9조 ① (제출기한): 사용일로부터 30일 이내 제출
  // ----------------------------------------------------
  if (item.date) {
    const submissionRef = item.submitDate || referenceDate || new Date().toISOString().slice(0, 10);
    const diffDays = getDaysDiff(item.date, submissionRef);

    if (diffDays > POLICY_CONSTANTS.SUBMISSION_DEADLINE_DAYS) {
      violations.push({
        article: "제9조",
        articleTitle: POLICY_RULES["제9조"].title,
        reason: `사용일로부터 30일 초과 제출 (사용일: ${item.date}, 경과일수: ${diffDays}일)`,
        severity: "error"
      });
    }
  }

  return violations;
}

/**
 * 전체 경비 목록 룰 검증 순수 함수 (제9조 중복 제출 감지 포함)
 */
export function auditExpenses(
  items: ExpenseItem[],
  referenceDate?: string
): AuditedExpenseItem[] {
  // 1. 중복 제출 감지를 위한 카운터 맵 (사용일_가맹점_금액)
  const duplicateKeyMap = new Map<string, number>();

  items.forEach((item) => {
    const key = `${item.date}_${item.merchant.trim().toLowerCase()}_${item.amount}`;
    duplicateKeyMap.set(key, (duplicateKeyMap.get(key) || 0) + 1);
  });

  // 2. 항목별 룰 엔진 검증 실행
  return items.map((item) => {
    const violations = auditSingleExpenseItem(item, referenceDate);
    const dupKey = `${item.date}_${item.merchant.trim().toLowerCase()}_${item.amount}`;
    const dupCount = duplicateKeyMap.get(dupKey) || 0;
    const isDuplicate = dupCount > 1;

    // 제9조 ② 중복 제출 위반 등록
    if (isDuplicate) {
      violations.push({
        article: "제9조",
        articleTitle: POLICY_RULES["제9조"].title,
        reason: `중복 제출 감지: 동일 사용일(${item.date}), 동일 가맹점(${item.merchant}), 동일 금액(${item.amount.toLocaleString()}원)의 건이 총 ${dupCount}회 제출됨`,
        severity: "error"
      });
    }

    return {
      ...item,
      isViolation: violations.length > 0,
      violations,
      isDuplicate
    };
  });
}

/**
 * 3.3 대시보드 요약: 핵심 지표 및 조항별 위반 발생 수 집계 순수 함수
 */
export function calculateAuditSummary(items: AuditedExpenseItem[]): import("./types").AuditSummary {
  const summary: import("./types").AuditSummary = {
    totalCount: items.length,
    validCount: 0,
    violationCount: 0,
    duplicateCount: 0,
    totalAmount: 0,
    violationAmount: 0,
    articleStats: {
      "제5조": 0,
      "제6조": 0,
      "제7조": 0,
      "제8조": 0,
      "제9조": 0
    }
  };

  items.forEach((item) => {
    summary.totalAmount += item.amount;

    if (item.isViolation) {
      summary.violationCount += 1;
      summary.violationAmount += item.amount;

      // 항목별 중복 제거하여 카운트
      const articlesInItem = new Set<import("./types").ArticleType>();
      item.violations.forEach((v) => articlesInItem.add(v.article));
      articlesInItem.forEach((art) => {
        if (summary.articleStats[art] !== undefined) {
          summary.articleStats[art] += 1;
        }
      });
    } else {
      summary.validCount += 1;
    }

    if (item.isDuplicate) {
      summary.duplicateCount += 1;
    }
  });

  return summary;
}

