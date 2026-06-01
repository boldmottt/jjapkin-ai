import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind 클래스 병합 유틸리티
 * clsx + tailwind-merge를 결합하여 충돌 없는 className 생성
 *
 * 사용법:
 *   cn("px-4 py-2", isActive && "bg-blue-500")
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
