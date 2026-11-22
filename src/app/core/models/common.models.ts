export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
}

export interface PagedRequest {
  pageIndex: number;
  pageSize: number;
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SelectBoxDto {
  id: string;
  name: string;
  code?: string;
}

/** Kết quả import Excel (dùng cho ExcelImportModalComponent). */
export interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: string[];
}
