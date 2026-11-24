export interface TableColumnInfo {
  name: string;
  storeType: string;
  comment?: string | null;
  isNullable: boolean;
  isPrimaryKey: boolean;
  defaultSql?: string | null;
  references?: string | null;
  isComputed: boolean;
}

export interface TableInfo {
  schema: string;
  table: string;
  entity: string;
  comment?: string | null;
  isPartitioned: boolean;
  hasTenant: boolean;
  hasSoftDelete: boolean;
  checkConstraints: string[];
  columns: TableColumnInfo[];
  hiddenColumns: string[];
}

export interface TableRowsResult {
  items: Record<string, unknown>[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
}

export interface TableRowsQuery {
  pageIndex: number;
  pageSize: number;
  search?: string;
  includeDeleted?: boolean;
}

export interface SystemHealth {
  status: string;
  database: string;
  canConnect: boolean;
  appliedMigrations: string[];
  pendingMigrations: string[];
  pgvectorEnabled: boolean;
  serverTime: string;
}

export interface SchemaTableCount {
  schema: string;
  tables: number;
}

export interface PartitionInfo {
  parentTable: string;
  partition: string;
  bound: string;
  estimatedRows: number;
  sizeBytes: number;
}

export interface DbFunctionInfo {
  schema: string;
  name: string;
  arguments: string;
  returns: string;
  comment?: string | null;
}
