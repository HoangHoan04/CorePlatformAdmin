import { PERMISSION_CODES } from '@/app/core/constants/common/permission-codes';
import { enumData } from '@/app/core/constants/enums/enumData';
import { ADMIN_UNIT_MAPPING_TYPES, adminUnitMappingTypeKey } from '@/app/core/constants/enums/mdm.enums';
import { PagedResult, SelectBoxDto } from '@/app/core/models/common.models';
import {
  AdministrativeUnitMapping,
  AdministrativeUnitMappingQuery,
} from '@/app/core/models/mdm/administrative-unit-mapping.models';
import { ApiService } from '@/app/core/services/api.service';
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
 * Ánh xạ đơn vị hành chính cũ → mới (API: api/mdm/administrative-unit-mappings) — theo mẫu CountryManagerComponent.
 *
 *   administrative-unit-mapping-manager/                 danh sách
 *   ├─ add-or-update-administrative-unit-mapping/        sheet bên phải: thêm / sửa
 *   └─ administrative-unit-mapping-detail/               sheet bên phải: xem chi tiết
 *
 * Khác mẫu Quốc gia: bảng không có trạng thái hoạt động nên thay "kích hoạt / ngừng hoạt động" bằng "xóa".
 */
@Component({
  standalone: false,
  selector: 'app-administrative-unit-mapping-manager',
  templateUrl: './administrative-unit-mapping-manager.component.html',
  styleUrls: ['./administrative-unit-mapping-manager.component.scss'],
})
export class AdministrativeUnitMappingManagerComponent implements OnInit {
  private readonly ENTITY_KEY = 'mdm.adminUnitMapping.entityName';

  private readonly apiService = inject(ApiService);
  private readonly message = inject(NzMessageService);
  private readonly i18n = inject(I18nMessageService);
  private readonly translate = inject(TranslateService);
  private readonly actionConfirm = inject(ActionConfirmService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly permissionSvc = inject(PermissionService);

  private readonly urls = this.apiService.MDM.ADMINISTRATIVE_UNIT_MAPPINGS;

  @ViewChild('oldUnitTpl', { static: true }) oldUnitTpl!: TemplateRef<any>;
  @ViewChild('newUnitTpl', { static: true }) newUnitTpl!: TemplateRef<any>;

  // ── Danh sách ───────────────────────────────────────────────────────
  data: AdministrativeUnitMapping[] = [];
  loading = false;
  columns: TableColumn[] = [];

  pagination: PaginationConfig = {
    current: enumData.PAGE.PAGE_INDEX,
    pageSize: enumData.PAGE.PAGE_SIZE,
    total: enumData.PAGE.TOTAL,
    showTotal: true,
  };
  sortField = 'effectiveDate';
  sortOrder: 'asc' | 'desc' = 'asc';

  // ── Sheet xem chi tiết / thêm / sửa ─────────────────────────────────
  detailVisible = false;
  detailId: string | null = null;

  formVisible = false;
  editing: AdministrativeUnitMapping | null = null;

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
      visible: () => this.permissionSvc.has(PERMISSION_CODES.MDM_ADMIN_UNIT_MAPPING_CREATE),
    },
    {
      ...CommonActions.uploadExcel({
        templateUrl: this.urls.EXCEL_TEMPLATE,
        importUrl: this.urls.EXCEL_IMPORT,
        entityName: this.ENTITY_KEY,
        onSuccess: () => this.loadData(),
      }),
      visible: () => this.permissionSvc.has(PERMISSION_CODES.MDM_ADMIN_UNIT_MAPPING_IMPORT),
    },
    {
      ...CommonActions.exportExcel({
        exportUrl: this.urls.EXCEL_EXPORT,
        getPayload: () => this.buildQuery(),
      }),
      visible: () => this.permissionSvc.has(PERMISSION_CODES.MDM_ADMIN_UNIT_MAPPING_EXPORT),
    },
  ];

  // ── Nút trên từng dòng: xem, sửa, xóa ───────────────────────────────
  rowActions: RowAction<AdministrativeUnitMapping>[] = [
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
      key: 'delete',
      icon: 'delete',
      tooltip: 'table.action.delete',
      severity: 'danger',
      visible: () => this.permissionSvc.has(PERMISSION_CODES.MDM_ADMIN_UNIT_MAPPING_DELETE),
      onClick: (row) => this.remove(row),
    },
  ];

  get canUpdate(): boolean {
    return this.permissionSvc.has(PERMISSION_CODES.MDM_ADMIN_UNIT_MAPPING_UPDATE);
  }

  ngOnInit(): void {
    this.columns = [
      { field: 'oldUnitCode', header: 'mdm.adminUnitMapping.oldUnit', sortable: true, width: 280, body: this.oldUnitTpl },
      { field: 'newUnitCode', header: 'mdm.adminUnitMapping.newUnit', sortable: true, width: 280, body: this.newUnitTpl },
      {
        field: 'mappingType',
        header: 'mdm.adminUnitMapping.mappingType',
        sortable: true,
        width: 150,
        render: (value: string) => this.translate.instant(adminUnitMappingTypeKey(value)),
      },
      {
        field: 'effectiveDate',
        header: 'mdm.adminUnitMapping.effectiveDate',
        type: 'date',
        dateFormat: 'dd/MM/yyyy',
        sortable: true,
        width: 130,
        align: 'center',
      },
      { field: 'legalReference', header: 'mdm.adminUnitMapping.legalReference', type: 'text', width: 220 },
      { field: 'countryCode', header: 'mdm.adminUnitMapping.countryCode', type: 'text', width: 90, align: 'center' },
    ];
    this.loadCountries();
    this.loadData();
  }

  // ── Nạp dữ liệu ─────────────────────────────────────────────────────

  buildQuery(): AdministrativeUnitMappingQuery {
    const f = this.filters;
    const range: Date[] | null = f['dateRange'];
    return {
      pageIndex: this.pagination.current,
      pageSize: this.pagination.pageSize,
      sortField: this.sortField,
      sortOrder: this.sortOrder,
      countryCode: f['countryCode'] || null,
      mappingType: f['mappingType'] || null,
      keyword: (f['keyword'] || '').trim() || undefined,
      fromDate: range?.[0] ? toIsoDate(range[0]) : null,
      toDate: range?.[1] ? toIsoDate(range[1]) : null,
    };
  }

  loadData(): void {
    this.setLoading(true);
    this.apiService
      .post<PagedResult<AdministrativeUnitMapping>>(this.urls.PAGINATION, this.buildQuery())
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
    this.pagination.current = 1;
    this.loadData();
  }

  onPageChange(event: { page: number; pageSize: number }): void {
    this.pagination.current = event.page;
    this.pagination.pageSize = event.pageSize;
    this.loadData();
  }

  onSortChange(event: { sortField: string | null; sortOrder: 1 | -1 | 0 | null }): void {
    this.sortField = event.sortField || 'effectiveDate';
    this.sortOrder = event.sortOrder === -1 ? 'desc' : 'asc';
    this.loadData();
  }

  // ── Xem / thêm / sửa (sheet con) ────────────────────────────────────

  openDetail(row: AdministrativeUnitMapping): void {
    this.detailId = row.id;
    this.detailVisible = true;
  }

  openCreate(): void {
    this.editing = null;
    this.formVisible = true;
  }

  openEdit(row: AdministrativeUnitMapping): void {
    this.editing = row;
    this.formVisible = true;
  }

  onSaved(): void {
    this.loadData();
  }

  // ── Xóa ─────────────────────────────────────────────────────────────

  async remove(row: AdministrativeUnitMapping): Promise<void> {
    const ok = await this.actionConfirm.confirm({
      title: this.translate.instant('mdm.adminUnitMapping.deleteTitle'),
      content: this.translate.instant('mdm.adminUnitMapping.deleteContent', {
        oldUnit: row.oldUnitName,
        newUnit: row.newUnitName,
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
        key: 'keyword',
        label: 'mdm.adminUnitMapping.keyword',
        type: 'input',
        placeholder: 'mdm.adminUnitMapping.searchKeyword',
        col: 8,
        allowClear: true,
      },
      {
        key: 'countryCode',
        label: 'mdm.adminUnitMapping.countryCode',
        type: 'select',
        placeholder: 'mdm.adminUnit.chooseCountry',
        col: 4,
        allowClear: true,
        options: countries.map((c) => ({ label: `${c.code} — ${c.name}`, value: c.code })),
      },
      {
        key: 'mappingType',
        label: 'mdm.adminUnitMapping.mappingType',
        type: 'select',
        placeholder: 'mdm.adminUnitMapping.chooseMappingType',
        col: 4,
        allowClear: true,
        options: ADMIN_UNIT_MAPPING_TYPES.map((t) => ({ label: adminUnitMappingTypeKey(t), value: t })),
      },
      {
        key: 'dateRange',
        label: 'mdm.adminUnitMapping.effectiveDate',
        type: 'dateRange',
        col: 8,
        allowClear: true,
      },
    ];
  }

  private emptyFilters(): Record<string, any> {
    return { keyword: '', countryCode: null, mappingType: null, dateRange: null };
  }

  private setLoading(value: boolean): void {
    this.loading = value;
    const searchAction = this.filterActions.find((a) => a.key === 'search');
    if (searchAction) searchAction.loading = value;
    this.cdr.markForCheck();
  }
}
