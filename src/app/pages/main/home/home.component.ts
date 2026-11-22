import { CurrentUser, DashboardOverview, RecentLogin } from '@/app/core/models';
import { AuthService, DashboardApiService, DashboardService } from '@/app/core/services';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import type { EChartsCoreOption } from 'echarts/core';
import { finalize, Subscription } from 'rxjs';

interface StatCard {
  key: string;
  icon: string;
  tone: 'primary' | 'success' | 'warning' | 'info';
  value: number;
  hint: string;
}

const EVENT_COLORS: Record<string, string> = {
  LOGIN_SUCCESS: 'success',
  LOGIN_FAILED: 'error',
  ACCOUNT_LOCKED: 'warning',
  TOKEN_REUSE_DETECTED: 'magenta',
  TOKEN_REFRESH: 'processing',
  LOGOUT: 'default',
};

@Component({
  standalone: false,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly dayOptions = [7, 14, 30];
  days = 7;

  loading = false;
  error: string | null = null;
  data: DashboardOverview | null = null;
  user: CurrentUser | null = null;

  statCards: StatCard[] = [];
  orgCards: { key: string; icon: string; value: number }[] = [];
  chartOption: EChartsCoreOption | null = null;

  private readonly sub = new Subscription();

  constructor(
    private readonly dashboardApi: DashboardApiService,
    private readonly layoutSettings: DashboardService,
    private readonly auth: AuthService,
    private readonly translate: TranslateService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.sub.add(this.auth.currentUser$.subscribe((u) => (this.user = u)));
    // Đổi theme / màu chủ đạo hoặc ngôn ngữ -> vẽ lại biểu đồ cho khớp
    this.sub.add(this.layoutSettings.settings$.subscribe(() => this.buildChart()));
    this.sub.add(
      this.translate.onLangChange.subscribe(() => {
        this.buildCards();
        this.buildChart();
      }),
    );
    this.load();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get greetingKey(): string {
    const hour = new Date().getHours();
    if (hour < 11) return 'home.goodMorning';
    if (hour < 14) return 'home.goodNoon';
    if (hour < 18) return 'home.goodAfternoon';
    return 'home.goodEvening';
  }

  get displayName(): string {
    return this.user?.displayName || this.user?.fullName || this.user?.username || '';
  }

  get totalLogins(): { success: number; failed: number } {
    const trend = this.data?.loginTrend ?? [];
    return {
      success: trend.reduce((sum, p) => sum + p.success, 0),
      failed: trend.reduce((sum, p) => sum + p.failed, 0),
    };
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.dashboardApi
      .getOverview(this.days)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (data) => {
          this.data = data;
          this.buildCards();
          this.buildChart();
        },
        error: (err) => {
          this.error =
            err?.error?.message ||
            (err?.status === 0
              ? this.translate.instant('auth.serverUnavailable')
              : this.translate.instant('home.loadFailed'));
        },
      });
  }

  onDaysChange(days: number): void {
    this.days = days;
    this.load();
  }

  eventColor(eventType: string): string {
    return EVENT_COLORS[eventType] ?? 'default';
  }

  eventLabel(eventType: string): string {
    const key = `home.events.${eventType}`;
    const text = this.translate.instant(key);
    return text === key ? eventType : text;
  }

  describeAgent(log: RecentLogin): string {
    const ua = log.userAgent ?? '';
    if (!ua) return '—';
    const browser = /Edg\//.test(ua)
      ? 'Edge'
      : /OPR\//.test(ua)
        ? 'Opera'
        : /Chrome\//.test(ua)
          ? 'Chrome'
          : /Firefox\//.test(ua)
            ? 'Firefox'
            : /Safari\//.test(ua)
              ? 'Safari'
              : /PostmanRuntime/.test(ua)
                ? 'Postman'
                : /curl\//i.test(ua)
                  ? 'curl'
                  : /PowerShell/i.test(ua)
                    ? 'PowerShell'
                    : ua.split(/[\s/]/)[0];
    const os = /Windows/.test(ua)
      ? 'Windows'
      : /Android/.test(ua)
        ? 'Android'
        : /iPhone|iPad/.test(ua)
          ? 'iOS'
          : /Mac OS X/.test(ua)
            ? 'macOS'
            : /Linux/.test(ua)
              ? 'Linux'
              : '';
    return os ? `${browser} · ${os}` : browser;
  }

  private buildCards(): void {
    const s = this.data?.stats;
    if (!s) return;
    const t = (key: string, params?: Record<string, unknown>) => this.translate.instant(key, params);
    this.statCards = [
      {
        key: 'home.stats.tenants',
        icon: 'cluster',
        tone: 'primary',
        value: s.tenants,
        hint: t('home.stats.tenantsHint', { active: s.activeTenants }),
      },
      {
        key: 'home.stats.users',
        icon: 'team',
        tone: 'success',
        value: s.users,
        hint: t('home.stats.usersHint', { active: s.activeUsers, locked: s.lockedUsers }),
      },
      {
        key: 'home.stats.sessions',
        icon: 'safety-certificate',
        tone: 'info',
        value: s.activeSessions,
        hint: t('home.stats.sessionsHint'),
      },
      {
        key: 'home.stats.modules',
        icon: 'appstore',
        tone: 'warning',
        value: s.activeModules,
        hint: t('home.stats.modulesHint', { roles: s.roles }),
      },
    ];
    this.orgCards = [
      { key: 'home.stats.companies', icon: 'bank', value: s.companies },
      { key: 'home.stats.branches', icon: 'branches', value: s.branches },
      { key: 'home.stats.departments', icon: 'partition', value: s.departments },
      { key: 'home.stats.roles', icon: 'idcard', value: s.roles },
    ];
  }

  private buildChart(): void {
    const trend = this.data?.loginTrend;
    if (!trend) return;

    const css = getComputedStyle(document.documentElement);
    const color = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    const success = color('--primary', '#3b82f6');
    const failed = color('--danger', '#ef4444');
    const text = color('--muted-foreground', '#6b7280');
    const grid = color('--border', '#e5e7eb');

    const labels = trend.map((p) => {
      const [, m, d] = p.date.split('-');
      return `${d}/${m}`;
    });

    this.chartOption = {
      color: [success, failed],
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { top: 0, right: 0, textStyle: { color: text }, itemWidth: 12, itemHeight: 12 },
      grid: { left: 8, right: 8, top: 36, bottom: 4, containLabel: true },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: { lineStyle: { color: grid } },
        axisTick: { show: false },
        axisLabel: { color: text },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: grid, type: 'dashed' } },
        axisLabel: { color: text },
      },
      series: [
        {
          name: this.translate.instant('home.chart.success'),
          type: 'bar',
          stack: 'logins',
          barMaxWidth: 28,
          data: trend.map((p) => p.success),
        },
        {
          name: this.translate.instant('home.chart.failed'),
          type: 'bar',
          stack: 'logins',
          barMaxWidth: 28,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          data: trend.map((p) => p.failed),
        },
      ],
    };
    this.cdr.markForCheck();
  }
}
