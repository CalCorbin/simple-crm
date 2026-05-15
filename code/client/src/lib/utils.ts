import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export function extractApiError(err: unknown): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (err as any).response?.data;
    return data?.error || data || "An error occurred";
}
