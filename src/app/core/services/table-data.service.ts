import { Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DbFunctionInfo,
  PartitionInfo,
  SchemaTableCount,
  SystemHealth,
  TableInfo,
  TableRowsQuery,
  TableRowsResult,
} from '../models/table.models';
import { ApiService } from './api.service';

/**
 * Đọc cấu trúc + dữ liệu bảng (api/tables) và thông tin hệ thống (api/system).
 */
@Injectable({ providedIn: 'root' })
export class TableDataService {
  private readonly base = environment.apiUrl;
  private readonly infoCache = new Map<string, Observable<TableInfo>>();

  constructor(private readonly api: ApiService) {}

  describe(schema: string, table: string): Observable<TableInfo> {
    const key = `${schema}.${table}`;
    let cached = this.infoCache.get(key);
    if (!cached) {
      cached = this.api.get<TableInfo>(`${this.base}/tables/${schema}/${table}`).pipe(shareReplay(1));
      this.infoCache.set(key, cached);
    }
    return cached;
  }

  rows(schema: string, table: string, query: TableRowsQuery): Observable<TableRowsResult> {
    return this.api.get<TableRowsResult>(`${this.base}/tables/${schema}/${table}/rows`, {
      pageIndex: query.pageIndex,
      pageSize: query.pageSize,
      search: query.search,
      includeDeleted: query.includeDeleted ? true : undefined,
    });
  }

  health(): Observable<SystemHealth> {
    return this.api.get<SystemHealth>(`${this.base}/system/health`);
  }

  schemas(): Observable<SchemaTableCount[]> {
    return this.api.get<SchemaTableCount[]>(`${this.base}/system/schemas`);
  }

  partitions(): Observable<PartitionInfo[]> {
    return this.api.get<PartitionInfo[]>(`${this.base}/system/partitions`);
  }

  functions(): Observable<DbFunctionInfo[]> {
    return this.api.get<DbFunctionInfo[]>(`${this.base}/system/functions`);
  }
}
