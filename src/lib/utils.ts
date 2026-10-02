import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW"
  }).format(amount).replace("₩", "") + "원";
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  return dateStr;
}
