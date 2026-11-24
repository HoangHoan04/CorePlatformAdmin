import { PERMISSION_CODES } from '@/app/core/constants/common/permission-codes';
import { enumData } from '@/app/core/constants/enums/enumData';
import { symbolPositionKey } from '@/app/core/constants/enums/mdm.enums';
import { PagedResult } from '@/app/core/models/common.models';
import { Currency, CurrencyQuery } from '@/app/core/models/mdm/currency.models';
import { ApiService } from '@/app/core/services/api.service';
import { I18nMessageService } from '@/app/core/services/i18n-message.service';
import { PermissionService } from '@/app/core/services/permission.service';
import {
  CommonFilterActions,
  FilterAction,
  FilterConfig,
  FilterField,
} from '@/app/shared/components/filter-custom/filter-custom.types';
import {
  CommonActions,
  PaginationConfig,
  RowAction,
  TableAction,
  TableColumn,
  ToolbarConfig,
} from '@/app/shared/components/table-custom/table-custom.types';
import { ActionConfirmService } from '@/app/shared/services/action-confirm.service';
import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NzMessageService } from 'ng-zorro-antd/message';

/**
 * Danh mục tiền tệ ISO 4217 (API: api/mdm/currencies) — theo mẫu CountryManagerComponent.
 *
 *   currency-manager/                  danh sách
 *   ├─ add-or-update-currency/         sheet bên phải: thêm / sửa
 *   └─ currency-detail/                sheet bên phải: xem chi tiết (kèm ví dụ hiển thị số tiền)
 */
@Component({
  standalone: false,
  selector: 'app-currency-manager',
  templateUrl: './currency-manager.component.html',
  styleUrls: ['./currency-manager.component.scss'],
})
export class CurrencyManagerComponent implements OnInit {
  private readonly ENTITY_KEY = 'mdm.currency.entityName';

  private readonly apiService = inject(ApiService);
  private readonly message = inject(NzMessageService);
  private readonly i18n = inject(I18nMessageService);
  private readonly translate = inject(TranslateService);
  private readonly actionConfirm = inject(ActionConfirmService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly permissionSvc = inject(PermissionService);

  private readonly urls = this.apiService.MDM.CURRENCIES;

  @ViewChild('codeTpl', { static: true }) codeTpl!: TemplateRef<any>;

  // ── Danh sách ───────────────────────────────────────────────────────
  data: Currency[] = [];
  loading = false;
  columns: TableColumn[] = [];

  pagination: PaginationConfig = {
    current: enumData.PAGE.PAGE_INDEX,
    pageSize: enumData.PAGE.PAGE_SIZE,
    total: enumData.PAGE.TOTAL,
    showTotal: true,
  };
  sortField = 'sortOrder';
  sortOrder: 'asc' | 'desc' = 'asc';

  // ── Sheet xem chi tiết / thêm / sửa ─────────────────────────────────
  detailVisible = false;
  detailId: string | null = null;

  formVisible = false;
  editing: Currency | null = null;

  // ── Bộ lọc ──────────────────────────────────────────────────────────
  filters: Record<string, any> = this.emptyFilters();

  filterConfig: FilterConfig = {
    show: true,
    collapsible: true,
    defaultOpen: true,
    title: 'common.filter.title',
    actionsAlign: 'center',
  };

  filterFields: FilterField[] = [
    {
      key: 'code',
      label: 'mdm.currency.code',
      type: 'input',
      placeholder: 'mdm.currency.searchCode',
      col: 8,
      allowClear: true,
    },
    {
      key: 'name',
      label: 'mdm.currency.name',
      type: 'input',
      placeholder: 'mdm.currency.searchName',
      col: 8,
      allowClear: true,
    },
    {
      key: 'isActive',
      label: 'common.status',
      type: 'select',
      placeholder: 'common.filter.chooseStatus',
      col: 8,
      allowClear: true,
      options: Object.values(enumData.STATUS_FILTER_IS_ACTIVE)
        .filter((s) => s.value !== null)
        .map((s) => ({ label: s.labelKey, value: s.value })),
    },
  ];

  filterActions: FilterAction[] = [
    CommonFilterActions.search(() => this.onFilterSearch(), this.loading),
    CommonFilterActions.clear(() => this.onFilterClear()),
  ];

  // ── Thanh công cụ ───────────────────────────────────────────────────
  toolbar: ToolbarConfig = { show: true };

  toolbarActions: TableAction[] = [
    {
      ...CommonActions.create(() => this.openCreate()),
      visible: () => this.permissionSvc.has(PERMISSION_CODES.MDM_CURRENCY_CREATE),
    },
    {
      ...CommonActions.uploadExcel({
        templateUrl: this.urls.EXCEL_TEMPLATE,
        importUrl: this.urls.EXCEL_IMPORT,
        entityName: this.ENTITY_KEY,
        onSuccess: () => this.loadData(),
      }),
      visible: () => this.permissionSvc.has(PERMISSION_CODES.MDM_CURRENCY_IMPORT),
    },
    {
      ...CommonActions.exportExcel({
        exportUrl: this.urls.EXCEL_EXPORT,
        getPayload: () => this.buildQuery(),
      }),
      visible: () => this.permissionSvc.has(PERMISSION_CODES.MDM_CURRENCY_EXPORT),
    },
  ];

  // ── Nút trên từng dòng ──────────────────────────────────────────────
  rowActions: RowAction<Currency>[] = [
    {
      key: 'view',
      icon: 'eye',
      tooltip: 'table.action.viewDetail',
      severity: 'secondary',
      onClick: (row) => this.openDetail(row),
    },
    {
      key: 'edit',
      icon: 'edit',
      tooltip: 'table.action.edit',
      severity: 'info',
      visible: () => this.canUpdate,
      onClick: (row) => this.openEdit(row),
    },
    {
      key: 'activate',
      icon: 'check-circle',
      tooltip: 'table.action.activate',
      severity: 'success',
      visible: (row) => !row.isActive && this.canUpdate,
      onClick: (row) => this.setActive(row, true),
    },
    {
      key: 'deactivate',
      icon: 'stop',
      tooltip: 'table.action.deactivate',
      severity: 'danger',
      visible: (row) => row.isActive && this.canUpdate,
      onClick: (row) => this.setActive(row, false),
    },
  ];

  get canUpdate(): boolean {
    return this.permissionSvc.has(PERMISSION_CODES.MDM_CURRENCY_UPDATE);
  }

  get nextSortOrder(): number {
    return this.data.reduce((max, c) => Math.max(max, c.sortOrder), 0) + 1;
  }

  ngOnInit(): void {
    this.columns = [
      { field: 'code', header: 'mdm.currency.code', sortable: true, width: 110, body: this.codeTpl },
      { field: 'numericCode', header: 'mdm.currency.numericCode', type: 'text', width: 100, align: 'center' },
      { field: 'name', header: 'mdm.currency.name', type: 'text', sortable: true, width: 220 },
      { field: 'symbol', header: 'mdm.currency.symbol', type: 'text', width: 90, align: 'center' },
      {
        field: 'symbolPosition',
        header: 'mdm.currency.symbolPosition',
        width: 140,
        render: (value: string) => this.translate.instant(symbolPositionKey(value)),
      },
      { field: 'decimalPlaces', header: 'mdm.currency.decimalPlaces', type: 'number', sortable: true, width: 120, align: 'center' },
      { field: 'roundingUnit', header: 'mdm.currency.roundingUnit', type: 'number', width: 130, align: 'right' },
      { field: 'sortOrder', header: 'mdm.currency.sortOrder', type: 'number', width: 100, align: 'center' },
      {
        field: 'isActive',
        header: 'common.status',
        type: 'boolean',
        sortable: true,
        width: 150,
        renderBoolean: (value: boolean) =>
          this.translate.instant(value ? 'common.statusActive' : 'common.statusInactive'),
        badgeSeverity: (value: boolean) => (value ? 'success' : 'danger'),
      },
    ];
    this.loadData();
  }

  // ── Nạp dữ liệu ─────────────────────────────────────────────────────

  buildQuery(): CurrencyQuery {
    const query: CurrencyQuery = {
      pageIndex: this.pagination.current,
      pageSize: this.pagination.pageSize,
      sortField: this.sortField,
      sortOrder: this.sortOrder,
      code: (this.filters['code'] || '').trim() || undefined,
      name: (this.filters['name'] || '').trim() || undefined,
    };
    if (this.filters['isActive'] !== null && this.filters['isActive'] !== undefined) {
      query.isActive = this.filters['isActive'];
    }
    return query;
  }

  loadData(): void {
    this.setLoading(true);
    this.apiService.post<PagedResult<Currency>>(this.urls.PAGINATION, this.buildQuery()).subscribe({
      next: (res) => {
        this.data = res.items;
        this.pagination.total = res.totalCount;
        this.setLoading(false);
      },
      error: (err: any) => {
        this.message.error(this.i18n.loadListFailed(this.ENTITY_KEY, err.error));
        this.setLoading(false);
      },
    });
  }

  onFiltersChange(filters: Record<string, any>): void {
    this.filters = filters;
  }

  onFilterSearch(): void {
    this.pagination.current = 1;
    this.loadData();
  }

  onFilterClear(): void {
    this.filters = this.emptyFilters();
    this.pagination.current = 1;
    this.loadData();
  }

  onPageChange(event: { page: number; pageSize: number }): void {
    this.pagination.current = event.page;
    this.pagination.pageSize = event.pageSize;
    this.loadData();
  }

  onSortChange(event: { sortField: string | null; sortOrder: 1 | -1 | 0 | null }): void {
    this.sortField = event.sortField || 'sortOrder';
    this.sortOrder = event.sortOrder === -1 ? 'desc' : 'asc';
    this.loadData();
  }

  // ── Xem / thêm / sửa (sheet con) ────────────────────────────────────

  openDetail(row: Currency): void {
    this.detailId = row.id;
    this.detailVisible = true;
  }

  openCreate(): void {
    this.editing = null;
    this.formVisible = true;
  }

  openEdit(row: Currency): void {
    this.editing = row;
    this.formVisible = true;
  }

  onSaved(): void {
    this.loadData();
  }

  // ── Kích hoạt / ngừng hoạt động ─────────────────────────────────────

  async setActive(row: Currency, active: boolean): Promise<void> {
    const label = `${row.code} — ${row.name}`;
    const confirmed = active
      ? await this.actionConfirm.confirmActivate(this.ENTITY_KEY, label)
      : await this.actionConfirm.confirmDeactivate(this.ENTITY_KEY, label);
    if (!confirmed) return;

    const url = active ? this.urls.ACTIVATE : this.urls.DEACTIVATE;
    this.apiService.post<boolean>(url, { id: row.id }).subscribe({
      next: () => {
        this.message.success(
          active
            ? this.i18n.activateSuccess(this.ENTITY_KEY, label)
            : this.i18n.deactivateSuccess(this.ENTITY_KEY, label),
        );
        this.loadData();
      },
      error: (err: any) =>
        this.message.error(
          active
            ? this.i18n.activateError(this.ENTITY_KEY, err.error)
            : this.i18n.deactivateError(this.ENTITY_KEY, err.error),
        ),
    });
  }

  // ── Nội bộ ──────────────────────────────────────────────────────────

  private emptyFilters(): Record<string, any> {
    return { code: '', name: '', isActive: null };
  }

  private setLoading(value: boolean): void {
    this.loading = value;
    const searchAction = this.filterActions.find((a) => a.key === 'search');
    if (searchAction) searchAction.loading = value;
    this.cdr.markForCheck();
  }
}
