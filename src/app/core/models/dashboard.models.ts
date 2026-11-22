export interface DashboardStats {
  tenants: number;
  activeTenants: number;
  companies: number;
  branches: number;
  departments: number;
  users: number;
  activeUsers: number;
  lockedUsers: number;
  activeSessions: number;
  roles: number;
  activeModules: number;
}

export interface LoginTrendPoint {
  date: string;
  success: number;
  failed: number;
}

export interface RecentLogin {
  occurredAt: string;
  username?: string | null;
  eventType: string;
  failureReason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface ModuleItem {
  code: string;
  name: string;
  baseRoute?: string | null;
  isCore: boolean;
  isActive: boolean;
}

export interface SystemInfo {
  database: string;
  serverVersion: string;
  canConnect: boolean;
  appliedMigrations: number;
  pendingMigrations: number;
  lastMigration?: string | null;
  pgvectorEnabled: boolean;
}

export interface DashboardOverview {
  stats: DashboardStats;
  loginTrend: LoginTrendPoint[];
  recentLogins: RecentLogin[];
  modules: ModuleItem[];
  system: SystemInfo;
  generatedAt: string;
}
