import { PERMISSION_CODES } from '@/app/core/constants/common/permission-codes';
import { enumData } from '@/app/core/constants/enums/enumData';
import { PagedResult, SelectBoxDto } from '@/app/core/models/common.models';
import { Bank, BankQuery } from '@/app/core/models/mdm/bank.models';
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
 * Danh mục ngân hàng (API: api/mdm/banks) — theo mẫu CountryManagerComponent.
 *
 *   bank-manager/                 danh sách
 *   ├─ add-or-update-bank/        sheet bên phải: thêm / sửa
 *   └─ bank-detail/               sheet bên phải: xem chi tiết
 */
@Component({
  standalone: false,
  selector: 'app-bank-manager',
  templateUrl: './bank-manager.component.html',
  styleUrls: ['./bank-manager.component.scss'],
})
export class BankManagerComponent implements OnInit {
  private readonly ENTITY_KEY = 'mdm.bank.entityName';

  private readonly apiService = inject(ApiService);
  private readonly message = inject(NzMessageService);
  private readonly i18n = inject(I18nMessageService);
  private readonly translate = inject(TranslateService);
  private readonly actionConfirm = inject(ActionConfirmService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly permissionSvc = inject(PermissionService);

  private readonly urls = this.apiService.MDM.BANKS;

  @ViewChild('nameTpl', { static: true }) nameTpl!: TemplateRef<any>;
  @ViewChild('vietqrTpl', { static: true }) vietqrTpl!: TemplateRef<any>;

  // ── Danh sách ───────────────────────────────────────────────────────
  data: Bank[] = [];
  loading = false;
  columns: TableColumn[] = [];

  pagination: PaginationConfig = {
    current: enumData.PAGE.PAGE_INDEX,
    pageSize: enumData.PAGE.PAGE_SIZE,
    total: enumData.PAGE.TOTAL,
    showTotal: true,
  };
  sortField = 'shortName';
  sortOrder: 'asc' | 'desc' = 'asc';

  // ── Sheet xem chi tiết / thêm / sửa ─────────────────────────────────
  detailVisible = false;
  detailId: string | null = null;

  formVisible = false;
  editing: Bank | null = null;

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
      visible: () => this.permissionSvc.has(PERMISSION_CODES.MDM_BANK_CREATE),
    },
    {
      ...CommonActions.uploadExcel({
        templateUrl: this.urls.EXCEL_TEMPLATE,
        importUrl: this.urls.EXCEL_IMPORT,
        entityName: this.ENTITY_KEY,
        onSuccess: () => this.loadData(),
      }),
      visible: () => this.permissionSvc.has(PERMISSION_CODES.MDM_BANK_IMPORT),
    },
    {
      ...CommonActions.exportExcel({
        exportUrl: this.urls.EXCEL_EXPORT,
        getPayload: () => this.buildQuery(),
      }),
      visible: () => this.permissionSvc.has(PERMISSION_CODES.MDM_BANK_EXPORT),
    },
  ];

  // ── Nút trên từng dòng ──────────────────────────────────────────────
  rowActions: RowAction<Bank>[] = [
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
    return this.permissionSvc.has(PERMISSION_CODES.MDM_BANK_UPDATE);
  }

  ngOnInit(): void {
    this.columns = [
      { field: 'shortName', header: 'mdm.bank.shortName', sortable: true, width: 280, body: this.nameTpl },
      { field: 'code', header: 'mdm.bank.code', type: 'text', sortable: true, width: 110 },
      { field: 'bin', header: 'mdm.bank.bin', type: 'text', sortable: true, width: 110, align: 'center' },
      { field: 'swiftCode', header: 'mdm.bank.swiftCode', type: 'text', width: 130, align: 'center' },
      { field: 'supportsVietqr', header: 'mdm.bank.supportsVietqr', sortable: true, width: 120, align: 'center', body: this.vietqrTpl },
      { field: 'countryCode', header: 'mdm.bank.countryCode', type: 'text', width: 90, align: 'center' },
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
    this.loadCountries();
    this.loadData();
  }

  // ── Nạp dữ liệu ─────────────────────────────────────────────────────

  buildQuery(): BankQuery {
    const f = this.filters;
    const query: BankQuery = {
      pageIndex: this.pagination.current,
      pageSize: this.pagination.pageSize,
      sortField: this.sortField,
      sortOrder: this.sortOrder,
      countryCode: f['countryCode'] || null,
      code: (f['code'] || '').trim() || undefined,
      name: (f['name'] || '').trim() || undefined,
    };
    if (f['supportsVietqr'] !== null && f['supportsVietqr'] !== undefined) query.supportsVietqr = f['supportsVietqr'];
    if (f['isActive'] !== null && f['isActive'] !== undefined) query.isActive = f['isActive'];
    return query;
  }

  loadData(): void {
    this.setLoading(true);
    this.apiService.post<PagedResult<Bank>>(this.urls.PAGINATION, this.buildQuery()).subscribe({
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
    this.sortField = event.sortField || 'shortName';
    this.sortOrder = event.sortOrder === -1 ? 'desc' : 'asc';
    this.loadData();
  }

  // ── Xem / thêm / sửa (sheet con) ────────────────────────────────────

  openDetail(row: Bank): void {
    this.detailId = row.id;
    this.detailVisible = true;
  }

  openCreate(): void {
    this.editing = null;
    this.formVisible = true;
  }

  openEdit(row: Bank): void {
    this.editing = row;
    this.formVisible = true;
  }

  onSaved(): void {
    this.loadData();
  }

  // ── Kích hoạt / ngừng hoạt động ─────────────────────────────────────

  async setActive(row: Bank, active: boolean): Promise<void> {
    const confirmed = active
      ? await this.actionConfirm.confirmActivate(this.ENTITY_KEY, row.shortName)
      : await this.actionConfirm.confirmDeactivate(this.ENTITY_KEY, row.shortName);
    if (!confirmed) return;

    const url = active ? this.urls.ACTIVATE : this.urls.DEACTIVATE;
    this.apiService.post<boolean>(url, { id: row.id }).subscribe({
      next: () => {
        this.message.success(
          active
            ? this.i18n.activateSuccess(this.ENTITY_KEY, row.shortName)
            : this.i18n.deactivateSuccess(this.ENTITY_KEY, row.shortName),
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

  private loadCountries(): void {
    this.apiService.get<SelectBoxDto[]>(this.apiService.MDM.COUNTRIES.SELECT_BOX).subscribe({
      next: (list) => {
        this.filterFields = this.buildFilterFields(list);
        this.cdr.markForCheck();
      },
    });
  }

  private buildFilterFields(countries: SelectBoxDto[]): FilterField[] {
    return [
      {
        key: 'code',
        label: 'mdm.bank.code',
        type: 'input',
        placeholder: 'mdm.bank.searchCode',
        col: 6,
        allowClear: true,
      },
      {
        key: 'name',
        label: 'mdm.bank.name',
        type: 'input',
        placeholder: 'mdm.bank.searchName',
        col: 6,
        allowClear: true,
      },
      {
        key: 'countryCode',
        label: 'mdm.bank.countryCode',
        type: 'select',
        placeholder: 'mdm.adminUnit.chooseCountry',
        col: 4,
        allowClear: true,
        options: countries.map((c) => ({ label: `${c.code} — ${c.name}`, value: c.code })),
      },
      {
        key: 'supportsVietqr',
        label: 'mdm.bank.supportsVietqr',
        type: 'select',
        placeholder: 'enums.yesNoFilter.all',
        col: 4,
        allowClear: true,
        options: Object.values(enumData.YES_NO_FILTER)
          .filter((s) => s.value !== null)
          .map((s) => ({ label: s.labelKey, value: s.value })),
      },
      {
        key: 'isActive',
        label: 'common.status',
        type: 'select',
        placeholder: 'common.filter.chooseStatus',
        col: 4,
        allowClear: true,
        options: Object.values(enumData.STATUS_FILTER_IS_ACTIVE)
          .filter((s) => s.value !== null)
          .map((s) => ({ label: s.labelKey, value: s.value })),
      },
    ];
  }

  private emptyFilters(): Record<string, any> {
    return { code: '', name: '', countryCode: null, supportsVietqr: null, isActive: null };
  }

  private setLoading(value: boolean): void {
    this.loading = value;
    const searchAction = this.filterActions.find((a) => a.key === 'search');
    if (searchAction) searchAction.loading = value;
    this.cdr.markForCheck();
  }
}
