import { PagedRequest } from '../common.models';

export interface ExchangeRateQuery extends PagedRequest {
  fromCurrency?: string | null;
  toCurrency?: string | null;
  rateType?: string | null;
  source?: string;
  /** yyyy-MM-dd */
  fromDate?: string | null;
  toDate?: string | null;
}

export interface ExchangeRate {
  id: string;
  tenantId?: string | null;
  /** Tỷ giá dùng chung toàn hệ thống (người dùng tenant chỉ xem, không sửa / xóa). */
  isShared: boolean;
  fromCurrency: string;
  toCurrency: string;
  rateType: string;
  rate: number;
  /** ISO datetime (UTC) */
  effectiveAt: string;
  source: string;
  note?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ExchangeRateSaveRequest {
  id?: string | null;
  fromCurrency: string;
  toCurrency: string;
  rateType: string;
  rate: number;
  /** ISO datetime */
  effectiveAt: string | null;
  source?: string | null;
  note?: string | null;
}

/** Kết quả GET latest: 1 from = rate to. */
export interface ExchangeRateLookup {
  from: string;
  to: string;
  rateType: string;
  rate: number;
  effectiveAt: string;
  source: string;
  isInverse: boolean;
  isShared: boolean;
}
