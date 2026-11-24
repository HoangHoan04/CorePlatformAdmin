import { PagedRequest } from '../common.models';

export interface AdministrativeUnitMappingQuery extends PagedRequest {
  countryCode?: string | null;
  mappingType?: string | null;
  /** Đơn vị cũ hoặc mới là đơn vị này. */
  unitId?: string | null;
  /** Mã / tên đơn vị cũ, mới, số văn bản. */
  keyword?: string;
  /** yyyy-MM-dd */
  fromDate?: string | null;
  toDate?: string | null;
}

export interface AdministrativeUnitMapping {
  id: string;
  oldUnitId: string;
  oldUnitCode: string;
  oldUnitName: string;
  newUnitId: string;
  newUnitCode: string;
  newUnitName: string;
  countryCode: string;
  mappingType: string;
  /** yyyy-MM-dd */
  effectiveDate: string;
  legalReference?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface AdministrativeUnitMappingSaveRequest {
  id?: string | null;
  oldUnitId: string;
  newUnitId: string;
  mappingType: string;
  effectiveDate: string | null;
  legalReference?: string | null;
  note?: string | null;
}
