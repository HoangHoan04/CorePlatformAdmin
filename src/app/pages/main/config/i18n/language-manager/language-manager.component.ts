import { PERMISSION_CODES } from '@/app/core/constants/common/permission-codes';
import { ROUTES_CONFIG } from '@/app/core/constants/common/routes.config';
import { enumData } from '@/app/core/constants/enums/enumData';
import { PagedResult } from '@/app/core/models/common.models';
import { Language, LanguageSaveRequest } from '@/app/core/models/i18n.models';
import { ApiService } from '@/app/core/services/api.service';
import { AppLanguageService } from '@/app/core/services/app-language.service';
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
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NzMessageService } from 'ng-zorro-antd/message';

interface LanguagePreset {
  code: string;
  name: string;
  nativeName: string;
  direction: 'LTR' | 'RTL';
  dateFormat: string;
  decimal: string;
  group: string;
}

/** Gợi ý điền nhanh các ngôn ngữ phổ biến */
const LANGUAGE_PRESETS: LanguagePreset[] = [
  { code: 'vi-VN', name: 'Tiếng Việt', nativeName: 'Tiếng Việt', direction: 'LTR', dateFormat: 'dd/MM/yyyy', decimal: ',', group: '.' },
  { code: 'en-US', name: 'Tiếng Anh (Mỹ)', nativeName: 'English', direction: 'LTR', dateFormat: 'MM/dd/yyyy', decimal: '.', group: ',' },
  { code: 'en-GB', name: 'Tiếng Anh (Anh)', nativeName: 'English (UK)', direction: 'LTR', dateFormat: 'dd/MM/yyyy', decimal: '.', group: ',' },
  { code: 'ja-JP', name: 'Tiếng Nhật', nativeName: '日本語', direction: 'LTR', dateFormat: 'yyyy/MM/dd', decimal: '.', group: ',' },
  { code: 'ko-KR', name: 'Tiếng Hàn', nativeName: '한국어', direction: 'LTR', dateFormat: 'yyyy.MM.dd', decimal: '.', group: ',' },
  { code: 'zh-CN', name: 'Tiếng Trung (Giản thể)', nativeName: '简体中文', direction: 'LTR', dateFormat: 'yyyy/MM/dd', decimal: '.', group: ',' },
  { code: 'zh-TW', name: 'Tiếng Trung (Phồn thể)', nativeName: '繁體中文', direction: 'LTR', dateFormat: 'yyyy/MM/dd', decimal: '.', group: ',' },
  { code: 'th-TH', name: 'Tiếng Thái', nativeName: 'ไทย', direction: 'LTR', dateFormat: 'dd/MM/yyyy', decimal: '.', group: ',' },
  { code: 'lo-LA', name: 'Tiếng Lào', nativeName: 'ລາວ', direction: 'LTR', dateFormat: 'dd/MM/yyyy', decimal: ',', group: '.' },
  { code: 'km-KH', name: 'Tiếng Khmer', nativeName: 'ខ្មែរ', direction: 'LTR', dateFormat: 'dd/MM/yyyy', decimal: ',', group: '.' },
  { code: 'fr-FR', name: 'Tiếng Pháp', nativeName: 'Français', direction: 'LTR', dateFormat: 'dd/MM/yyyy', decimal: ',', group: ' ' },
  { code: 'de-DE', name: 'Tiếng Đức', nativeName: 'Deutsch', direction: 'LTR', dateFormat: 'dd.MM.yyyy', decimal: ',', group: '.' },
  { code: 'ru-RU', name: 'Tiếng Nga', nativeName: 'Русский', direction: 'LTR', dateFormat: 'dd.MM.yyyy', decimal: ',', group: ' ' },
  { code: 'ar-SA', name: 'Tiếng Ả Rập', nativeName: 'العربية', direction: 'RTL', dateFormat: 'dd/MM/yyyy', decimal: '.', group: ',' },
];

@Component({
  standalone: false,
  selector: 'app-language-manager',
  templateUrl: './language-manager.component.html',
  styleUrls: ['./language-manager.component.scss'],
})
export class LanguageManagerComponent implements OnInit, AfterViewInit {
  private readonly ENTITY_KEY = 'i18n.language.entityName';

  @ViewChild('progressTpl', { static: true }) progressTpl!: TemplateRef<any>;
  @ViewChild('nameTpl', { static: true }) nameTpl!: TemplateRef<any>;
  @ViewChild('defaultTpl', { static: true }) defaultTpl!: TemplateRef<any>;

  data: Language[] = [];
  loading = false;

  pagination: PaginationConfig = {
    current: enumData.PAGE.PAGE_INDEX,
    pageSize: enumData.PAGE.PAGE_SIZE,
    total: enumData.PAGE.TOTAL,
    showTotal: true,
  };

  sortField = 'sortOrder';
  sortOrder = enumData.PAGE.SORT_ORDER.ASC;

  toolbar: ToolbarConfig = { show: true };

  toolbarActions: TableAction[] = [
    {
      ...CommonActions.create(() => this.openCreate()),
      visible: () => this.permissionSvc.has(PERMISSION_CODES.CONFIG_LANGUAGE_CREATE),
    },
    {
      key: 'translations',
      label: 'i18n.language.goTranslations',
      icon: 'translation',
      severity: 'info',
      onClick: () => this.goTranslations(),
      visible: () => this.permissionSvc.has(PERMISSION_CODES.CONFIG_TRANSLATION_VIEW),
    },
  ];

  filters: Record<string, any> = { code: '', name: '', isActive: null };

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
      label: 'i18n.language.code',
      type: 'input',
      placeholder: 'i18n.language.searchCode',
      col: 8,
      allowClear: true,
    },
    {
      key: 'name',
      label: 'i18n.language.name',
      type: 'input',
      placeholder: 'i18n.language.searchName',
      col: 8,
      allowClear: true,
    },
    {
      key: 'isActive',
      label: 'i18n.language.status',
      type: 'select',
      placeholder: 'i18n.language.filterStatus',
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

  columns: TableColumn[] = [];

  rowActions: RowAction<Language>[] = [
    {
      key: 'translate',
      icon: 'translation',
      tooltip: 'i18n.language.translateMissing',
      severity: 'primary',
      visible: () => this.permissionSvc.has(PERMISSION_CODES.CONFIG_TRANSLATION_VIEW),
      onClick: (record) => this.goTranslations(record),
    },
    {
      key: 'edit',
      icon: 'edit',
      tooltip: 'table.action.edit',
      severity: 'info',
      visible: () => this.permissionSvc.has(PERMISSION_CODES.CONFIG_LANGUAGE_UPDATE),
      onClick: (record) => this.openEdit(record),
    },
    {
      key: 'setDefault',
      icon: 'star',
      tooltip: 'i18n.language.setDefault',
      severity: 'warning',
      visible: (record) =>
        !record.isDefault && this.permissionSvc.has(PERMISSION_CODES.CONFIG_LANGUAGE_UPDATE),
      onClick: (record) => this.setDefault(record),
    },
    {
      key: 'activate',
      icon: 'check-circle',
      tooltip: 'table.action.activate',
      severity: 'success',
      visible: (record) =>
        !record.isActive && this.permissionSvc.has(PERMISSION_CODES.CONFIG_LANGUAGE_UPDATE),
      onClick: (record) => this.toggleActive(record, true),
    },
    {
      key: 'deactivate',
      icon: 'stop',
      tooltip: 'table.action.deactivate',
      severity: 'danger',
      visible: (record) =>
        record.isActive &&
        !record.isDefault &&
        this.permissionSvc.has(PERMISSION_CODES.CONFIG_LANGUAGE_UPDATE),
      onClick: (record) => this.toggleActive(record, false),
    },
    {
      key: 'delete',
      icon: 'delete',
      tooltip: 'table.action.delete',
      severity: 'danger',
      visible: (record) =>
        !record.isDefault && this.permissionSvc.has(PERMISSION_CODES.CONFIG_LANGUAGE_DELETE),
      onClick: (record) => this.deleteLanguage(record),
    },
  ];

  // ── Form tạo / sửa ──────────────────────────────────────────────────
  readonly presets = LANGUAGE_PRESETS;
  readonly dateFormats = ['dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'yyyy/MM/dd', 'dd.MM.yyyy', 'yyyy.MM.dd', 'dd-MM-yyyy'];
  modalVisible = false;
  saving = false;
  editing: Language | null = null;
  form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly message: NzMessageService,
    private readonly i18n: I18nMessageService,
    private readonly translate: TranslateService,
    private readonly apiService: ApiService,
    private readonly cdr: ChangeDetectorRef,
    private readonly actionConfirm: ActionConfirmService,
    private readonly langSvc: AppLanguageService,
    readonly permissionSvc: PermissionService,
  ) {
    this.form = this.fb.group({
      preset: [null],
      code: ['', [Validators.required, Validators.maxLength(10), Validators.pattern(/^[a-zA-Z]{2,3}([-_][A-Za-z0-9]{2,8})*$/)]],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      nativeName: ['', [Validators.required, Validators.maxLength(100)]],
      direction: ['LTR'],
      dateFormat: ['dd/MM/yyyy', [Validators.required, Validators.maxLength(20)]],
      decimal: [','],
      group: ['.'],
      sortOrder: [0],
      isActive: [true],
    });
    this.form.get('preset')!.valueChanges.subscribe((code) => this.applyPreset(code));
  }

  ngOnInit(): void {
    this.columns = [
      { field: 'code', header: 'i18n.language.code', type: 'text', sortable: true, width: 110 },
      { field: 'name', header: 'i18n.language.name', sortable: true, width: 220, body: this.nameTpl },
      { field: 'direction', header: 'i18n.language.direction', type: 'text', width: 100, align: 'center' },
      { field: 'dateFormat', header: 'i18n.language.dateFormat', type: 'text', width: 130 },
      { field: 'translatedCount', header: 'i18n.language.progress', width: 220, body: this.progressTpl },
      { field: 'isDefault', header: 'i18n.language.isDefault', sortable: true, width: 120, align: 'center', body: this.defaultTpl },
      { field: 'sortOrder', header: 'i18n.language.sortOrder', type: 'number', sortable: true, width: 90, align: 'center' },
      {
        field: 'isActive',
        header: 'i18n.language.status',
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

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  loadData(): void {
    this.loading = true;
    this.syncFilterActionsLoading();

    const payload: Record<string, any> = {
      pageIndex: this.pagination.current,
      pageSize: this.pagination.pageSize,
      sortField: this.sortField,
      sortOrder: this.sortOrder,
      code: (this.filters['code'] || '').trim() || undefined,
      name: (this.filters['name'] || '').trim() || undefined,
    };
    if (this.filters['isActive'] !== null && this.filters['isActive'] !== undefined) {
      payload['isActive'] = this.filters['isActive'];
    }

    this.apiService
      .post<PagedResult<Language>>(this.apiService.I18N.LANGUAGES_PAGINATION, payload)
      .subscribe({
        next: (res) => {
          this.data = res.items;
          this.pagination.total = res.totalCount;
          this.loading = false;
          this.syncFilterActionsLoading();
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.message.error(this.i18n.loadListFailed(this.ENTITY_KEY, err.error));
          this.loading = false;
          this.syncFilterActionsLoading();
          this.cdr.markForCheck();
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
    this.filters = { code: '', name: '', isActive: null };
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

  percent(row: Language): number {
    return row.totalKeys ? Math.round((row.translatedCount / row.totalKeys) * 1000) / 10 : 0;
  }

  // ── Tạo / sửa ───────────────────────────────────────────────────────

  openCreate(): void {
    this.editing = null;
    const nextOrder = this.data.reduce((max, l) => Math.max(max, l.sortOrder), 0) + 1;
    this.form.reset({
      preset: null,
      code: '',
      name: '',
      nativeName: '',
      direction: 'LTR',
      dateFormat: 'dd/MM/yyyy',
      decimal: ',',
      group: '.',
      sortOrder: nextOrder,
      isActive: true,
    });
    this.form.get('code')!.enable();
    this.modalVisible = true;
  }

  openEdit(row: Language): void {
    this.editing = row;
    const nf = this.parseNumberFormat(row.numberFormat);
    this.form.reset({
      preset: null,
      code: row.code,
      name: row.name,
      nativeName: row.nativeName,
      direction: row.direction,
      dateFormat: row.dateFormat,
      decimal: nf.decimal,
      group: nf.group,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
    });
    this.form.get('code')!.disable();
    this.modalVisible = true;
  }

  applyPreset(code: string | null): void {
    const preset = this.presets.find((p) => p.code === code);
    if (!preset) return;
    this.form.patchValue({
      code: preset.code,
      name: preset.name,
      nativeName: preset.nativeName,
      direction: preset.direction,
      dateFormat: preset.dateFormat,
      decimal: preset.decimal,
      group: preset.group,
    });
  }

  closeModal(): void {
    if (this.saving) return;
    this.modalVisible = false;
  }

  submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c) => {
        c.markAsDirty();
        c.updateValueAndValidity({ onlySelf: true });
      });
      return;
    }

    const v = this.form.getRawValue();
    const body: LanguageSaveRequest = {
      code: (v.code || '').trim(),
      name: (v.name || '').trim(),
      nativeName: (v.nativeName || '').trim(),
      direction: v.direction,
      dateFormat: (v.dateFormat || '').trim(),
      numberFormat: JSON.stringify({ decimal: v.decimal ?? '', group: v.group ?? '' }),
      isActive: !!v.isActive,
      sortOrder: Number(v.sortOrder) || 0,
    };

    this.saving = true;
    const url = this.editing ? this.apiService.I18N.LANGUAGE_UPDATE : this.apiService.I18N.LANGUAGE_CREATE;
    this.apiService.post<Language>(url, body).subscribe({
      next: () => {
        this.saving = false;
        this.modalVisible = false;
        this.message.success(this.editing ? this.i18n.updateSuccess() : this.i18n.createSuccess());
        this.afterLanguagesChanged();
      },
      error: (err: any) => {
        this.saving = false;
        this.message.error(this.i18n.genericError(err.error));
      },
    });
  }

  // ── Hành động trên dòng ─────────────────────────────────────────────

  async setDefault(row: Language): Promise<void> {
    const ok = await this.actionConfirm.confirm({
      title: this.translate.instant('i18n.language.setDefaultTitle'),
      content: this.translate.instant('i18n.language.setDefaultContent', { name: row.name }),
    });
    if (!ok) return;
    this.apiService.post<boolean>(this.apiService.I18N.LANGUAGE_SET_DEFAULT, { code: row.code }).subscribe({
      next: () => {
        this.message.success(this.i18n.updateSuccess());
        this.afterLanguagesChanged();
      },
      error: (err: any) => this.message.error(this.i18n.genericError(err.error)),
    });
  }

  async toggleActive(row: Language, active: boolean): Promise<void> {
    const confirmed = active
      ? await this.actionConfirm.confirmActivate(this.ENTITY_KEY, row.name)
      : await this.actionConfirm.confirmDeactivate(this.ENTITY_KEY, row.name);
    if (!confirmed) return;

    const url = active ? this.apiService.I18N.LANGUAGE_ACTIVATE : this.apiService.I18N.LANGUAGE_DEACTIVATE;
    this.apiService.post<boolean>(url, { code: row.code }).subscribe({
      next: () => {
        this.message.success(
          active
            ? this.i18n.activateSuccess(this.ENTITY_KEY, row.name)
            : this.i18n.deactivateSuccess(this.ENTITY_KEY, row.name),
        );
        this.afterLanguagesChanged();
      },
      error: (err: any) =>
        this.message.error(
          active
            ? this.i18n.activateError(this.ENTITY_KEY, err.error)
            : this.i18n.deactivateError(this.ENTITY_KEY, err.error),
        ),
    });
  }

  async deleteLanguage(row: Language): Promise<void> {
    const ok = await this.actionConfirm.confirm({
      title: this.translate.instant('i18n.language.deleteTitle'),
      content: this.translate.instant('i18n.language.deleteContent', {
        name: row.name,
        count: row.translatedCount,
      }),
      okText: this.translate.instant('common.actions.delete'),
      icon: 'warning',
    });
    if (!ok) return;
    this.apiService.post<boolean>(this.apiService.I18N.LANGUAGE_DELETE, { code: row.code }).subscribe({
      next: () => {
        this.message.success(this.i18n.deleteSuccess());
        this.afterLanguagesChanged();
      },
      error: (err: any) => this.message.error(this.i18n.genericError(err.error)),
    });
  }

  goTranslations(row?: Language): void {
    const path = ROUTES_CONFIG['CONFIG'].children!['CONFIG_I18N'].children!['TRANSLATIONS'].path;
    this.router.navigate([path], {
      queryParams: row ? { lang: row.code, status: 'missing' } : {},
    });
  }

  private afterLanguagesChanged(): void {
    this.loadData();
    this.langSvc.load(true);
  }

  private parseNumberFormat(json?: string | null): { decimal: string; group: string } {
    try {
      const parsed = json ? JSON.parse(json) : null;
      return { decimal: parsed?.decimal ?? ',', group: parsed?.group ?? '.' };
    } catch {
      return { decimal: ',', group: '.' };
    }
  }

  private syncFilterActionsLoading(): void {
    const searchAction = this.filterActions.find((action) => action.key === 'search');
    if (searchAction) {
      searchAction.loading = this.loading;
    }
  }
}
