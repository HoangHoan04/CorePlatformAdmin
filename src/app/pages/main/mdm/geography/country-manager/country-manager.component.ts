import { PERMISSION_CODES } from '@/app/core/constants/common/permission-codes';
import { enumData } from '@/app/core/constants/enums/enumData';
import { PagedResult } from '@/app/core/models/common.models';
import { Country, CountryQuery } from '@/app/core/models/mdm/country.models';
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
 * MẪU CRUD CHUẨN — màn hình danh mục quốc gia (API: api/mdm/countries).
 *
 * Tổ chức thư mục (làm theo cho các danh mục khác):
 *   country-manager/                      màn hình danh sách: lọc, bảng, thanh công cụ, nút trên dòng
 *   ├─ add-or-update-country/             sheet bên phải: form thêm mới / chỉnh sửa
 *   └─ country-detail/                    sheet bên phải: xem chi tiết (chỉ đọc)
 *
 * Màn hình danh sách lo:
 *  1. Nạp dữ liệu: loadData() — phân trang + lọc + sắp xếp phía server.
 *  2. Mở sheet xem / thêm / sửa (component con), nạp lại danh sách khi con báo (saved).
 *  3. Kích hoạt / ngừng hoạt động: hỏi xác nhận rồi gọi API.
 *  4. Excel: tải mẫu / nhập (ExcelImportModal xem trước + báo lỗi từng dòng) / xuất theo bộ lọc hiện tại —
 *     chỉ cần khai báo URL, app-table-custom tự xử lý.
 * Mọi chữ hiển thị là khóa dịch (nhập nội dung ở màn hình Bản dịch), không gõ cứng văn bản.
 */
@Component({
  standalone: false,
  selector: 'app-country-manager',
  templateUrl: './country-manager.component.html',
  styleUrls: ['./country-manager.component.scss'],
})
export class CountryManagerComponent implements OnInit {
  /** Khóa dịch tên đối tượng — dùng trong thông báo chung ("Đã kích hoạt quốc gia ..."). */
  private readonly ENTITY_KEY = 'mdm.country.entityName';

  private readonly apiService = inject(ApiService);
  private readonly message = inject(NzMessageService);
  private readonly i18n = inject(I18nMessageService);
  private readonly translate = inject(TranslateService);
  private readonly actionConfirm = inject(ActionConfirmService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly permissionSvc = inject(PermissionService);

  /** Đường dẫn API của màn hình (EndpointService.MDM.COUNTRIES). */
  private readonly urls = this.apiService.MDM.COUNTRIES;

  @ViewChild('codeTpl', { static: true }) codeTpl!: TemplateRef<any>;

  // ── Danh sách ───────────────────────────────────────────────────────
  data: Country[] = [];
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
  editing: Country | null = null;

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
      label: 'mdm.country.code',
      type: 'input',
      placeholder: 'mdm.country.searchCode',
      col: 8,
      allowClear: true,
    },
    {
      key: 'name',
      label: 'mdm.country.name',
      type: 'input',
      placeholder: 'mdm.country.searchName',
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

  // ── Thanh công cụ: thêm mới, nhập Excel (tải mẫu + nhập), xuất Excel ─
  toolbar: ToolbarConfig = { show: true };

  toolbarActions: TableAction[] = [
    {
      ...CommonActions.create(() => this.openCreate()),
      visible: () => this.permissionSvc.has(PERMISSION_CODES.MDM_COUNTRY_CREATE),
    },
    {
      ...CommonActions.uploadExcel({
        templateUrl: this.urls.EXCEL_TEMPLATE,
        importUrl: this.urls.EXCEL_IMPORT,
        entityName: this.ENTITY_KEY,
        onSuccess: () => this.loadData(),
      }),
      visible: () => this.permissionSvc.has(PERMISSION_CODES.MDM_COUNTRY_IMPORT),
    },
    {
      ...CommonActions.exportExcel({
        exportUrl: this.urls.EXCEL_EXPORT,
        getPayload: () => this.buildQuery(),
      }),
      visible: () => this.permissionSvc.has(PERMISSION_CODES.MDM_COUNTRY_EXPORT),
    },
  ];

  // ── Nút trên từng dòng: xem, sửa, kích hoạt, ngừng hoạt động ───────
  rowActions: RowAction<Country>[] = [
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
    return this.permissionSvc.has(PERMISSION_CODES.MDM_COUNTRY_UPDATE);
  }

  /** Gợi ý thứ tự hiển thị cho bản ghi mới. */
  get nextSortOrder(): number {
    return this.data.reduce((max, c) => Math.max(max, c.sortOrder), 0) + 1;
  }

  ngOnInit(): void {
    this.columns = [
      { field: 'code', header: 'mdm.country.code', sortable: true, width: 110, body: this.codeTpl },
      { field: 'alpha3Code', header: 'mdm.country.alpha3Code', type: 'text', sortable: true, width: 110 },
      { field: 'numericCode', header: 'mdm.country.numericCode', type: 'text', width: 100, align: 'center' },
      { field: 'name', header: 'mdm.country.name', type: 'text', sortable: true, width: 220 },
      { field: 'nameEn', header: 'mdm.country.nameEn', type: 'text', sortable: true, width: 220 },
      { field: 'phoneCode', header: 'mdm.country.phoneCode', type: 'text', width: 120, align: 'center' },
      { field: 'currencyCode', header: 'mdm.country.currencyCode', type: 'text', width: 110, align: 'center' },
      { field: 'sortOrder', header: 'mdm.country.sortOrder', type: 'number', width: 100, align: 'center' },
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

  /** Bộ lọc + phân trang hiện tại — dùng cho cả danh sách và xuất Excel. */
  buildQuery(): CountryQuery {
    const query: CountryQuery = {
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
    this.apiService.post<PagedResult<Country>>(this.urls.PAGINATION, this.buildQuery()).subscribe({
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

  openDetail(row: Country): void {
    this.detailId = row.id;
    this.detailVisible = true;
  }

  openCreate(): void {
    this.editing = null;
    this.formVisible = true;
  }

  openEdit(row: Country): void {
    this.editing = row;
    this.formVisible = true;
  }

  /** Sheet thêm / sửa lưu thành công. */
  onSaved(): void {
    this.loadData();
  }

  // ── Kích hoạt / ngừng hoạt động ─────────────────────────────────────

  async setActive(row: Country, active: boolean): Promise<void> {
    const confirmed = active
      ? await this.actionConfirm.confirmActivate(this.ENTITY_KEY, row.name)
      : await this.actionConfirm.confirmDeactivate(this.ENTITY_KEY, row.name);
    if (!confirmed) return;

    const url = active ? this.urls.ACTIVATE : this.urls.DEACTIVATE;
    this.apiService.post<boolean>(url, { id: row.id }).subscribe({
      next: () => {
        this.message.success(
          active
            ? this.i18n.activateSuccess(this.ENTITY_KEY, row.name)
            : this.i18n.deactivateSuccess(this.ENTITY_KEY, row.name),
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
