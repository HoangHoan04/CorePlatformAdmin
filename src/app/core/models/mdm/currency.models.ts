import { PagedRequest } from '../common.models';

export interface CurrencyQuery extends PagedRequest {
  code?: string;
  name?: string;
  isActive?: boolean | null;
}

export interface Currency {
  id: string;
  code: string;
  numericCode?: string | null;
  name: string;
  symbol: string;
  decimalPlaces: number;
  roundingUnit: number;
  symbolPosition: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

/** Tạo (id rỗng) / cập nhật. Mã ISO không sửa được sau khi tạo. */
export interface CurrencySaveRequest {
  id?: string | null;
  code: string;
  numericCode?: string | null;
  name: string;
  symbol: string;
  decimalPlaces: number;
  roundingUnit: number;
  symbolPosition: string;
  sortOrder: number;
  isActive: boolean;
}
