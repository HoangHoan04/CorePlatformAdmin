import { PagedRequest } from '../common.models';

export interface AdministrativeUnitQuery extends PagedRequest {
  countryCode?: string | null;
  /** Chỉ đơn vị con trực tiếp của đơn vị này. */
  parentId?: string | null;
  level?: number | null;
  unitType?: string | null;
  code?: string;
  name?: string;
  isActive?: boolean | null;
  /** true = còn hiệu lực hôm nay, false = đã hết hiệu lực. */
  isEffective?: boolean | null;
}

/** Tham số ô chọn đơn vị hành chính (GET select-box). */
export interface AdministrativeUnitSelectBoxQuery {
  countryCode?: string | null;
  parentId?: string | null;
  level?: number | null;
  maxLevel?: number | null;
  search?: string | null;
  includeInactive?: boolean;
  take?: number;
}

export interface AdministrativeUnit {
  id: string;
  countryCode: string;
  parentId?: string | null;
  parentCode?: string | null;
  parentName?: string | null;
  code: string;
  name: string;
  fullName: string;
  nameEn?: string | null;
  unitType: string;
  level: number;
  path?: string | null;
  phoneAreaCode?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  /** yyyy-MM-dd */
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  sortOrder: number;
  isActive: boolean;
  childCount: number;
  createdAt: string;
  updatedAt?: string | null;
}

/** Tạo (id rỗng) / cập nhật. Quốc gia, cấp trên, mã không sửa được sau khi tạo. */
export interface AdministrativeUnitSaveRequest {
  id?: string | null;
  countryCode: string;
  parentId?: string | null;
  code: string;
  name: string;
  /** Bỏ trống -> "Tên, tên đầy đủ của cấp trên". */
  fullName?: string | null;
  nameEn?: string | null;
  unitType: string;
  phoneAreaCode?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  sortOrder: number;
  isActive: boolean;
}
