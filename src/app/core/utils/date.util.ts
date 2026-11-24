/**
 * Chuyển ngày giữa API (chuỗi ISO "yyyy-MM-dd", kiểu DateOnly) và nz-date-picker (Date) — theo giờ địa phương,
 * không qua UTC để tránh lệch một ngày.
 */
export function toIsoDate(value: Date | null | undefined): string | null {
  if (!value) return null;
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromIsoDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const [y, m, d] = value.substring(0, 10).split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
}
