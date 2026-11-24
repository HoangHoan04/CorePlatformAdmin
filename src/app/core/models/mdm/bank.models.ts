import { PagedRequest } from '../common.models';

export interface BankQuery extends PagedRequest {
  countryCode?: string | null;
  /** Mã / BIN / SWIFT (chứa chuỗi). */
  code?: string;
  /** Tên ngắn / tên đầy đủ (chứa chuỗi). */
  name?: string;
  supportsVietqr?: boolean | null;
  isActive?: boolean | null;
}

export interface Bank {
  id: string;
  countryCode: string;
  code: string;
  /** Mã BIN NAPAS (VietQR) */
  bin?: string | null;
  shortName: string;
  name: string;
  swiftCode?: string | null;
  logoUrl?: string | null;
  supportsVietqr: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface BankSaveRequest {
  id?: string | null;
  countryCode: string;
  code: string;
  bin?: string | null;
  shortName: string;
  name: string;
  swiftCode?: string | null;
  logoUrl?: string | null;
  supportsVietqr: boolean;
  isActive: boolean;
}
