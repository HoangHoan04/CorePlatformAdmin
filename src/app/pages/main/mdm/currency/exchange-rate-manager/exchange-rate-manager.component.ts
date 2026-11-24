import { PERMISSION_CODES } from '@/app/core/constants/common/permission-codes';
import { enumData } from '@/app/core/constants/enums/enumData';
import { EXCHANGE_RATE_TYPES, exchangeRateTypeKey } from '@/app/core/constants/enums/mdm.enums';
import { PagedResult, SelectBoxDto } from '@/app/core/models/common.models';
import { ExchangeRate, ExchangeRateQuery } from '@/app/core/models/mdm/exchange-rate.models';
import { ApiService } from '@/app/core/services/api.service';
import { AuthService } from '@/app/core/services/auth.service';
import { I18nMessageService } from '@/app/core/services/i18n-message.service';
import { PermissionService } from '@/app/core/services/permission.service';
import { toIsoDate } from '@/app/core/utils/date.util';
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
 * Tỷ giá quy đổi (API: api/mdm/exchange-rates) — theo mẫu CountryManagerComponent.
 *
 *   exchange-rate-manager/                  danh sách
 *   ├─ add-or-update-exchange-rate/         sheet bên phải: thêm / sửa
 *   └─ exchange-rate-detail/                sheet bên phải: xem chi tiết (kèm tỷ giá nghịch đảo)
 *
 * Khác mẫu Quốc gia: không có trạng thái -> "xóa" thay cho kích hoạt / ngừng hoạt động;
 * tỷ giá dùng chung (Platform Admin nhập) chỉ xem với người dùng thuộc tenant.
 */
@Component({
  standalone: false,
  selector: 'app-exchange-rate-manager',
  templateUrl: './exchange-rate-manager.component.html',
  styleUrls: ['./exchange-rate-manager.component.scss'],
})
export class ExchangeRateManagerComponent implements OnInit {
  private readonly ENTITY_KEY = 'mdm.exchangeRate.entityName';

  private readonly apiService = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly message = inject(NzMessageService);
  private readonly i18n = inject(I18nMessageService);
  private readonly translate = inject(TranslateService);
  private readonly actionConfirm = inject(ActionConfirmService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly permissionSvc = inject(PermissionService);

  private readonly urls = this.apiService.MDM.EXCHANGE_RATES;

  @ViewChild('pairTpl', { static: true }) pairTpl!: TemplateRef<any>;
  @ViewChild('rateTpl', { static: true }) rateTpl!: TemplateRef<any>;
  @ViewChild('scopeTpl', { static: true }) scopeTpl!: TemplateRef<any>;

  // ── Danh sách ───────────────────────────────────────────────────────
  data: ExchangeRate[] = [];
  loading = false;
  columns: TableColumn[] = [];

  pagination: PaginationConfig = {
    current: enumData.PAGE.PAGE_INDEX,
    pageSize: enumData.PAGE.PAGE_SIZE,
    total: enumData.PAGE.TOTAL,
    showTotal: true,
  };
  sortField = 'effectiveAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  // ── Sheet xem chi tiết / thêm / sửa ─────────────────────────────────
  detailVisible = false;
  detailId: string | null = null;

  formVisible = false;
  editing: ExchangeRate | null = null;

  // ── Bộ lọc ──────────────────────────────────────────────────────────
  filters: Record<string, any> = this.emptyFilters();

  filterConfig: FilterConfig = {
    show: true,
    collapsible: true,
    defaultOpen: true,
    title: 'common.filter.title',
    actionsAlign: 'center',
  };

  filterFields: FilterField[] = this.buildFilterFields([]);

  filterActions: FilterAction[] = [
    CommonFilterActions.search(() => this.onFilterSearch(), this.loading),
    CommonFilterActions.clear(() => this.onFilterClear()),
  ];

  // ── Thanh công cụ ───────────────────────────────────────────────────
  toolbar: ToolbarConfig = { show: true };

  toolbarActions: TableAction[] = [
    {
      ...CommonActions.create(() => this.openCreate()),
      visible: () => this.permissionSvc.has(PERMISSION_CODES.MDM_EXCHANGE_RATE_CREATE),
    },
    {
      ...CommonActions.uploadExcel({
        templateUrl: this.urls.EXCEL_TEMPLATE,
        importUrl: this.urls.EXCEL_IMPORT,
        entityName: this.ENTITY_KEY,
        onSuccess: () => this.loadData(),
      }),
      visible: () => this.permissionSvc.has(PERMISSION_CODES.MDM_EXCHANGE_RATE_IMPORT),
    },
    {
      ...CommonActions.exportExcel({
        exportUrl: this.urls.EXCEL_EXPORT,
        getPayload: () => this.buildQuery(),
      }),
      visible: () => this.permissionSvc.has(PERMISSION_CODES.MDM_EXCHANGE_RATE_EXPORT),
    },
  ];

  // ── Nút trên từng dòng: xem, sửa, xóa ───────────────────────────────
  rowActions: RowAction<ExchangeRate>[] = [
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
      visible: (row) => this.canEditRow(row) && this.permissionSvc.has(PERMISSION_CODES.MDM_EXCHANGE_RATE_UPDATE),
      onClick: (row) => this.openEdit(row),
    },
    {
      key: 'delete',
      icon: 'delete',
      tooltip: 'table.action.delete',
      severity: 'danger',
      visible: (row) => this.canEditRow(row) && this.permissionSvc.has(PERMISSION_CODES.MDM_EXCHANGE_RATE_DELETE),
      onClick: (row) => this.remove(row),
    },
  ];

  get canUpdate(): boolean {
    return this.permissionSvc.has(PERMISSION_CODES.MDM_EXCHANGE_RATE_UPDATE);
  }

  /** Người dùng thuộc tenant không sửa / xóa được tỷ giá dùng chung. */
  canEditRow(row: { isShared: boolean } | null | undefined): boolean {
    return !!row && (!row.isShared || !this.auth.currentUser?.tenantId);
  }

  ngOnInit(): void {
    this.columns = [
      { field: 'fromCurrency', header: 'mdm.exchangeRate.pair', sortable: true, width: 150, body: this.pairTpl },
      {
        field: 'rateType',
        header: 'mdm.exchangeRate.rateType',
        sortable: true,
        width: 170,
        render: (value: string) => this.translate.instant(exchangeRateTypeKey(value)),
      },
      { field: 'rate', header: 'mdm.exchangeRate.rate', sortable: true, width: 170, align: 'right', body: this.rateTpl },
      {
        field: 'effectiveAt',
        header: 'mdm.exchangeRate.effectiveAt',
        type: 'datetime',
        dateFormat: 'dd/MM/yyyy HH:mm',
        sortable: true,
        width: 160,
        align: 'center',
      },
      { field: 'source', header: 'mdm.exchangeRate.source', type: 'text', sortable: true, width: 120, align: 'center' },
      { field: 'isShared', header: 'mdm.exchangeRate.scope', width: 130, align: 'center', body: this.scopeTpl },
      { field: 'note', header: 'mdm.exchangeRate.note', type: 'text', width: 220 },
    ];
    this.loadCurrencies();
    this.loadData();
  }

  // ── Nạp dữ liệu ─────────────────────────────────────────────────────

  buildQuery(): ExchangeRateQuery {
    const f = this.filters;
    const range: Date[] | null = f['dateRange'];
    return {
      pageIndex: this.pagination.current,
      pageSize: this.pagination.pageSize,
      sortField: this.sortField,
      sortOrder: this.sortOrder,
      fromCurrency: f['fromCurrency'] || null,
      toCurrency: f['toCurrency'] || null,
      rateType: f['rateType'] || null,
      source: (f['source'] || '').trim() || undefined,
      fromDate: range?.[0] ? toIsoDate(range[0]) : null,
      toDate: range?.[1] ? toIsoDate(range[1]) : null,
    };
  }

  loadData(): void {
    this.setLoading(true);
    this.apiService.post<PagedResult<ExchangeRate>>(this.urls.PAGINATION, this.buildQuery()).subscribe({
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
    this.sortField = event.sortField || 'effectiveAt';
    this.sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
    this.loadData();
  }

  // ── Xem / thêm / sửa (sheet con) ────────────────────────────────────

  openDetail(row: ExchangeRate): void {
    this.detailId = row.id;
    this.detailVisible = true;
  }

  openCreate(): void {
    this.editing = null;
    this.formVisible = true;
  }

  openEdit(row: ExchangeRate): void {
    this.editing = row;
    this.formVisible = true;
  }

  onSaved(): void {
    this.loadData();
  }

  // ── Xóa ─────────────────────────────────────────────────────────────

  async remove(row: ExchangeRate): Promise<void> {
    const ok = await this.actionConfirm.confirm({
      title: this.translate.instant('mdm.exchangeRate.deleteTitle'),
      content: this.translate.instant('mdm.exchangeRate.deleteContent', {
        pair: `${row.fromCurrency}/${row.toCurrency}`,
        rate: row.rate,
      }),
      okText: this.translate.instant('common.actions.delete'),
      icon: 'warning',
    });
    if (!ok) return;

    this.apiService.post<boolean>(this.urls.DELETE, { id: row.id }).subscribe({
      next: () => {
        this.message.success(this.i18n.deleteSuccess());
        this.loadData();
      },
      error: (err: any) => this.message.error(this.i18n.genericError(err.error)),
    });
  }

  // ── Nội bộ ──────────────────────────────────────────────────────────

  private loadCurrencies(): void {
    this.apiService.get<SelectBoxDto[]>(this.apiService.MDM.CURRENCIES.SELECT_BOX).subscribe({
      next: (list) => {
        this.filterFields = this.buildFilterFields(list);
        this.cdr.markForCheck();
      },
    });
  }

  private buildFilterFields(currencies: SelectBoxDto[]): FilterField[] {
    const options = currencies.map((c) => ({ label: `${c.code} — ${c.name}`, value: c.code }));
    return [
      {
        key: 'fromCurrency',
        label: 'mdm.exchangeRate.fromCurrency',
        type: 'select',
        placeholder: 'mdm.exchangeRate.chooseCurrency',
        col: 4,
        allowClear: true,
        options,
      },
      {
        key: 'toCurrency',
        label: 'mdm.exchangeRate.toCurrency',
        type: 'select',
        placeholder: 'mdm.exchangeRate.chooseCurrency',
        col: 4,
        allowClear: true,
        options,
      },
      {
        key: 'rateType',
        label: 'mdm.exchangeRate.rateType',
        type: 'select',
        placeholder: 'mdm.exchangeRate.chooseRateType',
        col: 4,
        allowClear: true,
        options: EXCHANGE_RATE_TYPES.map((t) => ({ label: exchangeRateTypeKey(t), value: t })),
      },
      {
        key: 'source',
        label: 'mdm.exchangeRate.source',
        type: 'input',
        placeholder: 'mdm.exchangeRate.searchSource',
        col: 4,
        allowClear: true,
      },
      {
        key: 'dateRange',
        label: 'mdm.exchangeRate.effectiveAt',
        type: 'dateRange',
        col: 8,
        allowClear: true,
      },
    ];
  }

  private emptyFilters(): Record<string, any> {
    return { fromCurrency: null, toCurrency: null, rateType: null, source: '', dateRange: null };
  }

  private setLoading(value: boolean): void {
    this.loading = value;
    const searchAction = this.filterActions.find((a) => a.key === 'search');
    if (searchAction) searchAction.loading = value;
    this.cdr.markForCheck();
  }
}
