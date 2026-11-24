/**
 * Định dạng số tiền theo cấu hình tiền tệ (ký hiệu, vị trí ký hiệu, số chữ số thập phân) — dùng để xem trước.
 * Dấu phân cách hàng nghìn / thập phân theo định dạng số của trình duyệt.
 */
export function formatMoneyPreview(
  amount: number,
  symbol: string | null | undefined,
  position: string | null | undefined,
  decimals: number,
): string {
  const digits = Math.min(Math.max(decimals, 0), 6);
  const number = amount.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  const s = (symbol || '').trim();
  if (!s) return number;
  return position === 'PREFIX' ? `${s}${number}` : `${number} ${s}`;
}
