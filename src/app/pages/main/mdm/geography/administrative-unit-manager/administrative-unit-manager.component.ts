import { PERMISSION_CODES } from '@/app/core/constants/common/permission-codes';
import { enumData } from '@/app/core/constants/enums/enumData';
import {
  ADMIN_UNIT_LEVELS,
  ADMIN_UNIT_TYPES,
  adminUnitLevelKey,
  adminUnitTypeKey,
} from '@/app/core/constants/enums/mdm.enums';
import { PagedResult, SelectBoxDto } from '@/app/core/models/common.models';
import {
  AdministrativeUnit,
  AdministrativeUnitQuery,
} from '@/app/core/models/mdm/administrative-unit.models';
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

/** Một nấc trên thanh đường dẫn cây (đơn vị đang xem con của nó). */
interface ParentCrumb {
  id: string;
  name: string;
}

/**
 * Danh mục đơn vị hành chính (API: api/mdm/administrative-units) — theo mẫu CountryManagerComponent.
 *
 *   administrative-unit-manager/                 danh sách: lọc, bảng, xem theo cây (đi sâu vào đơn vị con)
 *   ├─ add-or-update-administrative-unit/        sheet bên phải: thêm / sửa
 *   └─ administrative-unit-detail/               sheet bên phải: xem chi tiết
 *
 * Khác mẫu Quốc gia: nút "Đơn vị trực thuộc" trên dòng mở danh sách con của đơn vị đó; thanh đường dẫn
 * phía trên bảng để quay lại cấp trên. Thêm mới khi đang xem con của một đơn vị -> tự điền đơn vị cấp trên.
 */
@Component({
  standalone: false,
  selector: 'app-administrative-unit-manager',
  templateUrl: './administrative-unit-manager.component.html',
  styleUrls: ['./administrative-unit-manager.component.scss'],
})
export class AdministrativeUnitManagerComponent implements OnInit {
  private readonly ENTITY_KEY = 'mdm.adminUnit.entityName';

  private readonly apiService = inject(ApiService);
  private readonly message = inject(NzMessageService);
  private readonly i18n = inject(I18nMessageService);
  private readonly translate = inject(TranslateService);
  private readonly actionConfirm = inject(ActionConfirmService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly permissionSvc = inject(PermissionService);

  private readonly urls = this.apiService.MDM.ADMINISTRATIVE_UNITS;

  @ViewChild('codeTpl', { static: true }) codeTpl!: TemplateRef<any>;
  @ViewChild('nameTpl', { static: true }) nameTpl!: TemplateRef<any>;
  @ViewChild('effectiveTpl', { static: true }) effectiveTpl!: TemplateRef<any>;

  readonly typeKey = adminUnitTypeKey;

  // ── Danh sách ───────────────────────────────────────────────────────
  data: AdministrativeUnit[] = [];
  loading = false;
  columns: TableColumn[] = [];

  pagination: PaginationConfig = {
    current: enumData.PAGE.PAGE_INDEX,
    pageSize: enumData.PAGE.PAGE_SIZE,
    total: enumData.PAGE.TOTAL,
    showTotal: true,
  };
  sortField = 'path';
  sortOrder: 'asc' | 'desc' = 'asc';

  /** Đường dẫn cây đang xem: rỗng = tất cả; phần tử cuối = đơn vị cấp trên đang xem con. */
  trail: ParentCrumb[] = [];

  // ── Sheet xem chi tiết / thêm / sửa ─────────────────────────────────
  detailVisible = false;
  detailId: string | null = null;

  formVisible = false;
  editing: AdministrativeUnit | null = null;

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
      visible: () => this.permissionSvc.has(PERMISSION_CODES.MDM_ADMIN_UNIT_CREATE),
    },
    {
      ...CommonActions.uploadExcel({
        templateUrl: this.urls.EXCEL_TEMPLATE,
        importUrl: this.urls.EXCEL_IMPORT,
        entityName: this.ENTITY_KEY,
        onSuccess: () => this.loadData(),
      }),
      visible: () => this.permissionSvc.has(PERMISSION_CODES.MDM_ADMIN_UNIT_IMPORT),
    },
    {
      ...CommonActions.exportExcel({
        exportUrl: this.urls.EXCEL_EXPORT,
        getPayload: () => this.buildQuery(),
      }),
      visible: () => this.permissionSvc.has(PERMISSION_CODES.MDM_ADMIN_UNIT_EXPORT),
    },
  ];

  // ── Nút trên từng dòng ──────────────────────────────────────────────
  rowActions: RowAction<AdministrativeUnit>[] = [
    {
      key: 'children',
      icon: 'apartment',
      tooltip: 'mdm.adminUnit.viewChildren',
      severity: 'primary',
      visible: (row) => row.childCount > 0,
      onClick: (row) => this.drillDown(row),
    },
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
    return this.permissionSvc.has(PERMISSION_CODES.MDM_ADMIN_UNIT_UPDATE);
  }

  /** Đơn vị cấp trên đang xem (để điền sẵn khi thêm mới). */
  get currentParent(): ParentCrumb | null {
    return this.trail.length ? this.trail[this.trail.length - 1] : null;
  }

  ngOnInit(): void {
    this.columns = [
      { field: 'code', header: 'mdm.adminUnit.code', sortable: true, width: 120, body: this.codeTpl },
      { field: 'name', header: 'mdm.adminUnit.name', sortable: true, width: 300, body: this.nameTpl },
      {
        field: 'unitType',
        header: 'mdm.adminUnit.unitType',
        sortable: true,
        width: 170,
        render: (value: string) => this.translate.instant(adminUnitTypeKey(value)),
      },
      {
        field: 'level',
        header: 'mdm.adminUnit.level',
        sortable: true,
        width: 90,
        align: 'center',
      },
      { field: 'parentName', header: 'mdm.adminUnit.parent', type: 'text', width: 220 },
      { field: 'countryCode', header: 'mdm.adminUnit.countryCode', type: 'text', width: 90, align: 'center' },
      { field: 'childCount', header: 'mdm.adminUnit.childCount', type: 'number', width: 110, align: 'center' },
      { field: 'effectiveFrom', header: 'mdm.adminUnit.effective', width: 200, body: this.effectiveTpl },
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

  buildQuery(): AdministrativeUnitQuery {
    const f = this.filters;
    const query: AdministrativeUnitQuery = {
      pageIndex: this.pagination.current,
      pageSize: this.pagination.pageSize,
      sortField: this.sortField,
      sortOrder: this.sortOrder,
      countryCode: f['countryCode'] || null,
      parentId: this.currentParent?.id ?? null,
      level: f['level'] ?? null,
      unitType: f['unitType'] || null,
      code: (f['code'] || '').trim() || undefined,
      name: (f['name'] || '').trim() || undefined,
    };
    if (f['isActive'] !== null && f['isActive'] !== undefined) query.isActive = f['isActive'];
    if (f['isEffective'] !== null && f['isEffective'] !== undefined) query.isEffective = f['isEffective'];
    return query;
  }

  loadData(): void {
    this.setLoading(true);
    this.apiService
      .post<PagedResult<AdministrativeUnit>>(this.urls.PAGINATION, this.buildQuery())
      .subscribe({
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
    this.trail = [];
    this.pagination.current = 1;
    this.loadData();
  }

  onPageChange(event: { page: number; pageSize: number }): void {
    this.pagination.current = event.page;
    this.pagination.pageSize = event.pageSize;
    this.loadData();
  }

  onSortChange(event: { sortField: string | null; sortOrder: 1 | -1 | 0 | null }): void {
    this.sortField = event.sortField || 'path';
    this.sortOrder = event.sortOrder === -1 ? 'desc' : 'asc';
    this.loadData();
  }

  // ── Xem theo cây ────────────────────────────────────────────────────

  /** Xem các đơn vị trực thuộc của một dòng (bỏ lọc cấp để thấy đủ con). */
  drillDown(row: AdministrativeUnit): void {
    this.trail = [...this.trail, { id: row.id, name: row.fullName }];
    this.filters = { ...this.filters, level: null };
    this.pagination.current = 1;
    this.loadData();
  }

  /** Bấm một nấc trên thanh đường dẫn; index = -1 -> về danh sách gốc. */
  goToCrumb(index: number): void {
    this.trail = this.trail.slice(0, index + 1);
    this.pagination.current = 1;
    this.loadData();
  }

  // ── Xem / thêm / sửa (sheet con) ────────────────────────────────────

  openDetail(row: AdministrativeUnit): void {
    this.detailId = row.id;
    this.detailVisible = true;
  }

  openCreate(): void {
    this.editing = null;
    this.formVisible = true;
  }

  openEdit(row: AdministrativeUnit): void {
    this.editing = row;
    this.formVisible = true;
  }

  onSaved(): void {
    this.loadData();
  }

  // ── Kích hoạt / ngừng hoạt động ─────────────────────────────────────

  async setActive(row: AdministrativeUnit, active: boolean): Promise<void> {
    const confirmed = active
      ? await this.actionConfirm.confirmActivate(this.ENTITY_KEY, row.fullName)
      : await this.actionConfirm.confirmDeactivate(this.ENTITY_KEY, row.fullName);
    if (!confirmed) return;

    const url = active ? this.urls.ACTIVATE : this.urls.DEACTIVATE;
    this.apiService.post<boolean>(url, { id: row.id }).subscribe({
      next: () => {
        this.message.success(
          active
            ? this.i18n.activateSuccess(this.ENTITY_KEY, row.fullName)
            : this.i18n.deactivateSuccess(this.ENTITY_KEY, row.fullName),
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

  /** Quốc gia cho ô lọc (select-box của danh mục quốc gia). */
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
        key: 'countryCode',
        label: 'mdm.adminUnit.countryCode',
        type: 'select',
        placeholder: 'mdm.adminUnit.chooseCountry',
        col: 6,
        allowClear: true,
        options: countries.map((c) => ({ label: `${c.code} — ${c.name}`, value: c.code })),
      },
      {
        key: 'level',
        label: 'mdm.adminUnit.level',
        type: 'select',
        placeholder: 'mdm.adminUnit.chooseLevel',
        col: 6,
        allowClear: true,
        options: ADMIN_UNIT_LEVELS.map((l) => ({ label: adminUnitLevelKey(l), value: l })),
      },
      {
        key: 'unitType',
        label: 'mdm.adminUnit.unitType',
        type: 'select',
        placeholder: 'mdm.adminUnit.chooseUnitType',
        col: 6,
        allowClear: true,
        options: ADMIN_UNIT_TYPES.map((t) => ({ label: adminUnitTypeKey(t), value: t })),
      },
      {
        key: 'code',
        label: 'mdm.adminUnit.code',
        type: 'input',
        placeholder: 'mdm.adminUnit.searchCode',
        col: 6,
        allowClear: true,
      },
      {
        key: 'name',
        label: 'mdm.adminUnit.name',
        type: 'input',
        placeholder: 'mdm.adminUnit.searchName',
        col: 6,
        allowClear: true,
      },
      {
        key: 'isEffective',
        label: 'mdm.adminUnit.effective',
        type: 'select',
        placeholder: 'mdm.adminUnit.chooseEffective',
        col: 6,
        allowClear: true,
        options: [
          { label: 'mdm.adminUnit.effectiveNow', value: true },
          { label: 'mdm.adminUnit.expired', value: false },
        ],
      },
      {
        key: 'isActive',
        label: 'common.status',
        type: 'select',
        placeholder: 'common.filter.chooseStatus',
        col: 6,
        allowClear: true,
        options: Object.values(enumData.STATUS_FILTER_IS_ACTIVE)
          .filter((s) => s.value !== null)
          .map((s) => ({ label: s.labelKey, value: s.value })),
      },
    ];
  }

  private emptyFilters(): Record<string, any> {
    return {
      countryCode: null,
      level: null,
      unitType: null,
      code: '',
      name: '',
      isEffective: null,
      isActive: null,
    };
  }

  private setLoading(value: boolean): void {
    this.loading = value;
    const searchAction = this.filterActions.find((a) => a.key === 'search');
    if (searchAction) searchAction.loading = value;
    this.cdr.markForCheck();
  }
}
