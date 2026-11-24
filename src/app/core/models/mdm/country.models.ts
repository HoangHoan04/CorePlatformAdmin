import { PagedRequest } from '../common.models';

/** Bộ lọc danh sách quốc gia (dùng chung cho phân trang và xuất Excel). */
export interface CountryQuery extends PagedRequest {
  code?: string;
  name?: string;
  isActive?: boolean | null;
}

export interface Country {
  id: string;
  code: string;
  alpha3Code: string;
  numericCode?: string | null;
  name: string;
  nameEn: string;
  phoneCode?: string | null;
  currencyCode?: string | null;
  flagEmoji?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

/** Tạo (id rỗng) / cập nhật (có id). Mã alpha-2 không sửa được sau khi tạo. */
export interface CountrySaveRequest {
  id?: string | null;
  code: string;
  alpha3Code: string;
  numericCode?: string | null;
  name: string;
  nameEn: string;
  phoneCode?: string | null;
  currencyCode?: string | null;
  flagEmoji?: string | null;
  sortOrder: number;
  isActive: boolean;
}
