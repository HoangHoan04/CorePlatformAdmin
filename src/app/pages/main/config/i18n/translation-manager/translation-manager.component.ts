import { PERMISSION_CODES } from '@/app/core/constants/common/permission-codes';
import { enumData } from '@/app/core/constants/enums/enumData';
import { I18nSyncService } from '@/app/core/i18n/i18n-sync.service';
import { PagedResult } from '@/app/core/models/common.models';
import {
  Language,
  NamespaceCount,
  TranslationImportResult,
  TranslationKeySaveRequest,
  TranslationRow,
  TranslationSaveItem,
  TranslationSaveResult,
  TranslationStats,
  TranslationSyncResult,
} from '@/app/core/models/i18n.models';
import { ApiService } from '@/app/core/services/api.service';
import { AppLanguageService } from '@/app/core/services/app-language.service';
import { I18nMessageService } from '@/app/core/services/i18n-message.service';
import { PermissionService } from '@/app/core/services/permission.service';
import { downloadBlob } from '@/app/core/utils/file.util';
import {
  CommonFilterActions,
  FilterAction,
  FilterConfig,
  FilterField,
} from '@/app/shared/components/filter-custom/filter-custom.types';
import {
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
  HostListener,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Observable, finalize, forkJoin, of, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';

const LANG_FIELD_PREFIX = 'lang__';
const PLATFORMS = ['WEB', 'MOBILE', 'API'];

/**
 * Màn hình bản dịch: mỗi dòng là một khóa dịch, mỗi cột là một ngôn ngữ — nhập trực tiếp trên bảng rồi Lưu.
 * Nút "Đồng bộ khóa" nạp toàn bộ khóa đang dùng trong ứng dụng lên API (tạo khóa còn thiếu).
 */
@Component({
  standalone: false,
  selector: 'app-translation-manager',
  templateUrl: './translation-manager.component.html',
  styleUrls: ['./translation-manager.component.scss'],
})
export class TranslationManagerComponent implements OnInit {
  private readonly ENTITY_KEY = 'i18n.translation.entityName';

  @ViewChild('keyTpl', { static: true }) keyTpl!: TemplateRef<any>;
  @ViewChild('valueTpl', { static: true }) valueTpl!: TemplateRef<any>;

  data: TranslationRow[] = [];
  loading = false;
  syncing = false;
  saving = false;

  languages: Language[] = [];
  namespaces: NamespaceCount[] = [];
  stats: TranslationStats = { totalKeys: 0, translatedByLanguage: {} };

  /** Ô đã sửa chưa lưu: `${keyId}|${lang}` -> giá trị mới */
  private readonly drafts = new Map<string, string>();

  pagination: PaginationConfig = {
    current: enumData.PAGE.PAGE_INDEX,
    pageSize: 20,
    total: enumData.PAGE.TOTAL,
    showTotal: true,
  };

  sortField = 'key';
  sortOrder = enumData.PAGE.SORT_ORDER.ASC;

  toolbar: ToolbarConfig = { show: true };

  private readonly saveAction: TableAction = {
    key: 'save-translations',
    label: 'i18n.translation.saveChanges',
    icon: 'save',
    severity: 'success',
    disabled: true,
    loading: () => this.saving,
    onClick: () => this.saveDrafts(),
    visible: () => this.permissionSvc.has(PERMISSION_CODES.CONFIG_TRANSLATION_UPDATE),
  };

  private readonly discardAction: TableAction = {
    key: 'discard',
    label: 'i18n.translation.discard',
    icon: 'undo',
    severity: 'secondary',
    onClick: () => this.discardDrafts(),
    visible: () => this.dirtyCount > 0,
  };

  private readonly exportAction: TableAction = {
    key: 'export-json',
    label: 'i18n.translation.exportJson',
    icon: 'download',
    severity: 'info',
    subActions: [],
    visible: () => this.permissionSvc.has(PERMISSION_CODES.CONFIG_TRANSLATION_EXPORT),
  };

  private readonly importAction: TableAction = {
    key: 'import-json',
    label: 'i18n.translation.importJson',
    icon: 'upload',
    severity: 'info',
    onClick: () => this.openImport(),
    visible: () => this.permissionSvc.has(PERMISSION_CODES.CONFIG_TRANSLATION_IMPORT),
  };

  toolbarActions: TableAction[] = [
    {
      key: 'create-key',
      label: 'common.actions.create',
      icon: 'plus',
      severity: 'success',
      onClick: () => this.openKeyModal(),
      visible: () => this.permissionSvc.has(PERMISSION_CODES.CONFIG_TRANSLATION_UPDATE),
    },
    {
      key: 'sync',
      label: 'i18n.translation.sync',
      icon: 'sync',
      severity: 'primary',
      loading: () => this.syncing,
      onClick: () => this.syncKeys(),
      visible: () => this.permissionSvc.has(PERMISSION_CODES.CONFIG_TRANSLATION_IMPORT),
    },
    this.saveAction,
    this.discardAction,
    this.exportAction,
    this.importAction,
  ];

  filters: Record<string, any> = {
    search: '',
    namespace: null,
    languageCode: null,
    status: null,
    visibleLanguages: [],
  };

  filterConfig: FilterConfig = {
    show: true,
    collapsible: true,
    defaultOpen: true,
    title: 'common.filter.title',
    actionsAlign: 'center',
  };

  filterFields: FilterField[] = this.buildFilterFields();

  filterActions: FilterAction[] = [
    CommonFilterActions.search(() => this.onFilterSearch(), this.loading),
    CommonFilterActions.clear(() => this.onFilterClear()),
  ];

  columns: TableColumn[] = [];

  rowActions: RowAction<TranslationRow>[] = [
    {
      key: 'edit',
      icon: 'edit',
      tooltip: 'i18n.translation.editKey',
      severity: 'info',
      visible: () => this.permissionSvc.has(PERMISSION_CODES.CONFIG_TRANSLATION_UPDATE),
      onClick: (record) => this.openKeyModal(record),
    },
    {
      key: 'delete',
      icon: 'delete',
      tooltip: 'table.action.delete',
      severity: 'danger',
      visible: () => this.permissionSvc.has(PERMISSION_CODES.CONFIG_TRANSLATION_UPDATE),
      onClick: (record) => this.deleteKey(record),
    },
  ];

  // ── Modal khóa dịch ─────────────────────────────────────────────────
  readonly platforms = PLATFORMS;
  keyModalVisible = false;
  keySaving = false;
  editingKey: TranslationRow | null = null;
  keyForm: FormGroup;
  keyValues: Record<string, string> = {};

  // ── Modal nhập JSON ─────────────────────────────────────────────────
  importVisible = false;
  importing = false;
  importLang: string | null = null;
  importOverwrite = false;
  importCreateKeys = true;
  importFile: File | null = null;
  importPreviewCount = 0;
  importData: Record<string, unknown> | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly message: NzMessageService,
    private readonly modal: NzModalService,
    private readonly i18n: I18nMessageService,
    private readonly translate: TranslateService,
    private readonly apiService: ApiService,
    private readonly cdr: ChangeDetectorRef,
    private readonly actionConfirm: ActionConfirmService,
    private readonly syncSvc: I18nSyncService,
    private readonly langSvc: AppLanguageService,
    readonly permissionSvc: PermissionService,
  ) {
    this.keyForm = this.fb.group({
      fullKey: [
        '',
        [
          Validators.required,
          Validators.maxLength(306),
          Validators.pattern(/^[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)+$/),
        ],
      ],
      description: [''],
      platforms: [[...PLATFORMS]],
    });
  }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    if (params.get('lang')) this.filters['languageCode'] = params.get('lang');
    if (params.get('status')) this.filters['status'] = params.get('status');
    if (params.get('namespace')) this.filters['namespace'] = params.get('namespace');
    if (params.get('search')) this.filters['search'] = params.get('search');
    this.filters = { ...this.filters };

    this.rebuildColumns();
    this.loadMeta().subscribe(() => this.loadData());
  }

  /** Ctrl + S: lưu các ô đã sửa */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      if (this.dirtyCount > 0 && !this.saving) this.saveDrafts().subscribe();
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.dirtyCount > 0) event.preventDefault();
  }

  // ── Nạp dữ liệu ─────────────────────────────────────────────────────

  /** Ngôn ngữ, namespace, thống kê */
  loadMeta(): Observable<unknown> {
    return forkJoin({
      languages: this.apiService
        .post<PagedResult<Language>>(this.apiService.I18N.LANGUAGES_PAGINATION, {
          pageIndex: 1,
          pageSize: 200,
          sortField: 'sortOrder',
          sortOrder: 'asc',
        })
        .pipe(catchError(() => of(null))),
      namespaces: this.apiService
        .get<NamespaceCount[]>(this.apiService.I18N.TRANSLATION_NAMESPACES)
        .pipe(catchError(() => of([] as NamespaceCount[]))),
      stats: this.apiService
        .get<TranslationStats>(this.apiService.I18N.TRANSLATION_STATS)
        .pipe(catchError(() => of(null))),
    }).pipe(
      tap(({ languages, namespaces, stats }) => {
        if (languages) this.languages = languages.items;
        this.namespaces = namespaces;
        if (stats) this.stats = stats;
        this.filterFields = this.buildFilterFields();
        this.rebuildColumns();
        this.rebuildExportActions();
        this.cdr.markForCheck();
      }),
    );
  }

  loadData(): void {
    this.loading = true;
    this.syncFilterActionsLoading();

    const payload: Record<string, any> = {
      pageIndex: this.pagination.current,
      pageSize: this.pagination.pageSize,
      sortField: this.sortField,
      sortOrder: this.sortOrder,
      search: (this.filters['search'] || '').trim() || undefined,
      namespace: this.filters['namespace'] || undefined,
      // Lọc trạng thái mà chưa chọn ngôn ngữ -> tính theo ngôn ngữ mặc định
      languageCode:
        this.filters['languageCode'] ||
        (this.filters['status'] ? this.defaultLanguageCode : undefined) ||
        undefined,
      status: this.filters['status'] || undefined,
    };

    this.apiService
      .post<PagedResult<TranslationRow>>(this.apiService.I18N.TRANSLATION_PAGINATION, payload)
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
    const visibleChanged =
      JSON.stringify(filters['visibleLanguages'] || []) !==
      JSON.stringify(this.filters['visibleLanguages'] || []);
    this.filters = filters;
    if (visibleChanged) this.rebuildColumns();
  }

  onFilterSearch(): void {
    this.pagination.current = 1;
    this.loadData();
  }

  onFilterClear(): void {
    this.filters = {
      search: '',
      namespace: null,
      languageCode: null,
      status: null,
      visibleLanguages: [],
    };
    this.rebuildColumns();
    this.pagination.current = 1;
    this.loadData();
  }

  onPageChange(event: { page: number; pageSize: number }): void {
    this.pagination.current = event.page;
    this.pagination.pageSize = event.pageSize;
    this.loadData();
  }

  onSortChange(event: { sortField: string | null; sortOrder: 1 | -1 | 0 | null }): void {
    this.sortField = event.sortField === 'createdAt' ? 'createdAt' : 'key';
    this.sortOrder = event.sortOrder === -1 ? 'desc' : 'asc';
    this.loadData();
  }

  // ── Ô bản dịch ──────────────────────────────────────────────────────

  langOf(field: string): string {
    return field.startsWith(LANG_FIELD_PREFIX) ? field.substring(LANG_FIELD_PREFIX.length) : field;
  }

  language(code: string): Language | undefined {
    return this.languages.find((l) => l.code === code);
  }

  original(row: TranslationRow, lang: string): string {
    return row.values?.[lang]?.value ?? '';
  }

  cellValue(row: TranslationRow, lang: string): string {
    const key = this.draftKey(row.keyId, lang);
    return this.drafts.has(key) ? this.drafts.get(key)! : this.original(row, lang);
  }

  isDirty(row: TranslationRow, lang: string): boolean {
    return this.drafts.has(this.draftKey(row.keyId, lang));
  }

  isUnreviewed(row: TranslationRow, lang: string): boolean {
    const cell = row.values?.[lang];
    return !!cell && !!cell.value && !cell.isReviewed && !this.isDirty(row, lang);
  }

  onCellChange(row: TranslationRow, lang: string, value: string): void {
    const key = this.draftKey(row.keyId, lang);
    if ((value ?? '') === this.original(row, lang)) {
      this.drafts.delete(key);
    } else {
      this.drafts.set(key, value ?? '');
    }
    this.saveAction.disabled = this.drafts.size === 0;
  }

  /** Điền bản dịch ngôn ngữ mặc định vào ô trống (để sửa tiếp) */
  copyFromDefault(row: TranslationRow, lang: string): void {
    const def = this.languages.find((l) => l.isDefault);
    if (!def || def.code === lang) return;
    const source = this.cellValue(row, def.code);
    if (source) this.onCellChange(row, lang, source);
  }

  get canEdit(): boolean {
    return this.permissionSvc.has(PERMISSION_CODES.CONFIG_TRANSLATION_UPDATE);
  }

  get dirtyCount(): number {
    return this.drafts.size;
  }

  get defaultLanguageCode(): string | undefined {
    return this.languages.find((l) => l.isDefault)?.code;
  }

  percent(code: string): number {
    const total = this.stats.totalKeys;
    const done = this.stats.translatedByLanguage?.[code] ?? 0;
    return total ? Math.round((done / total) * 1000) / 10 : 0;
  }

  translatedCount(code: string): number {
    return this.stats.translatedByLanguage?.[code] ?? 0;
  }

  saveDrafts(): Observable<unknown> {
    if (this.drafts.size === 0) return of(null);
    const items: TranslationSaveItem[] = [...this.drafts.entries()].map(([k, value]) => {
      const [keyId, languageCode] = k.split('|');
      return { keyId, languageCode, value: value.trim() ? value : null, isReviewed: true };
    });

    this.saving = true;
    return this.apiService
      .post<TranslationSaveResult>(this.apiService.I18N.TRANSLATION_SAVE, { items })
      .pipe(
        tap({
          next: (res) => {
            this.drafts.clear();
            this.saveAction.disabled = true;
            this.message.success(
              this.translate.instant('i18n.translation.saveResult', {
                created: res.created,
                updated: res.updated,
                deleted: res.deleted,
              }),
            );
            this.afterTranslationsChanged();
          },
          error: (err: any) => this.message.error(this.i18n.genericError(err.error)),
        }),
        catchError(() => of(null)),
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
      );
  }

  async discardDrafts(): Promise<void> {
    const ok = await this.actionConfirm.confirm({
      title: this.translate.instant('i18n.translation.discardTitle'),
      content: this.translate.instant('i18n.translation.discardContent', { count: this.dirtyCount }),
      icon: 'warning',
    });
    if (!ok) return;
    this.drafts.clear();
    this.saveAction.disabled = true;
    this.cdr.markForCheck();
  }

  // ── Đồng bộ khóa ────────────────────────────────────────────────────

  syncKeys(): Observable<unknown> {
    const { payload, counts } = this.syncSvc.build();
    this.syncing = true;
    return this.apiService
      .post<TranslationSyncResult>(this.apiService.I18N.TRANSLATION_SYNC, payload)
      .pipe(
        tap({
          next: (res) => {
            this.syncSvc.clearRuntime();
            this.modal.success({
              nzTitle: this.translate.instant('i18n.translation.syncDoneTitle'),
              nzContent: this.translate.instant('i18n.translation.syncDoneContent', {
                received: res.received,
                source: counts.source,
                routes: counts.routes,
                runtime: counts.runtime,
                createdKeys: res.createdKeys,
                existingKeys: res.existingKeys,
                createdTranslations: res.createdTranslations,
                totalKeys: res.totalKeys,
              }),
              nzOkText: this.translate.instant('common.messages.confirm'),
            });
            if (res.invalidKeys?.length) {
              console.warn('[i18n] Khóa không hợp lệ bị bỏ qua:', res.invalidKeys);
            }
            this.pagination.current = 1;
            this.afterTranslationsChanged();
          },
          error: (err: any) => this.message.error(this.i18n.genericError(err.error)),
        }),
        catchError(() => of(null)),
        finalize(() => {
          this.syncing = false;
          this.cdr.markForCheck();
        }),
      );
  }

  // ── Khóa dịch ───────────────────────────────────────────────────────

  openKeyModal(row?: TranslationRow): void {
    this.editingKey = row ?? null;
    this.keyForm.reset({
      fullKey: row?.fullKey ?? (this.filters['namespace'] ? `${this.filters['namespace']}.` : ''),
      description: row?.description ?? '',
      platforms: row?.platforms?.length ? [...row.platforms] : [...PLATFORMS],
    });
    this.keyValues = {};
    for (const lang of this.languages) {
      this.keyValues[lang.code] = row ? this.cellValue(row, lang.code) : '';
    }
    this.keyModalVisible = true;
  }

  togglePlatform(platform: string, checked: boolean): void {
    const current: string[] = this.keyForm.value.platforms || [];
    const next = checked
      ? [...new Set([...current, platform])]
      : current.filter((p) => p !== platform);
    this.keyForm.patchValue({ platforms: next });
  }

  hasPlatform(platform: string): boolean {
    return (this.keyForm.value.platforms || []).includes(platform);
  }

  closeKeyModal(): void {
    if (this.keySaving) return;
    this.keyModalVisible = false;
  }

  submitKey(): void {
    if (this.keyForm.invalid) {
      Object.values(this.keyForm.controls).forEach((c) => {
        c.markAsDirty();
        c.updateValueAndValidity({ onlySelf: true });
      });
      return;
    }

    const v = this.keyForm.getRawValue();
    const values: Record<string, string> = {};
    for (const [lang, value] of Object.entries(this.keyValues)) {
      const before = this.editingKey ? this.original(this.editingKey, lang) : '';
      if ((value ?? '') !== before) values[lang] = value ?? '';
    }

    const body: TranslationKeySaveRequest = {
      id: this.editingKey?.keyId ?? null,
      fullKey: (v.fullKey || '').trim(),
      description: (v.description || '').trim() || null,
      platforms: v.platforms,
      values,
    };

    this.keySaving = true;
    this.apiService.post<TranslationRow>(this.apiService.I18N.TRANSLATION_KEY_SAVE, body).subscribe({
      next: () => {
        this.keySaving = false;
        this.keyModalVisible = false;
        if (this.editingKey) {
          // bỏ các ô nháp của khóa vừa lưu qua form
          for (const lang of this.languages) this.drafts.delete(this.draftKey(this.editingKey.keyId, lang.code));
          this.saveAction.disabled = this.drafts.size === 0;
        }
        this.message.success(this.editingKey ? this.i18n.updateSuccess() : this.i18n.createSuccess());
        this.afterTranslationsChanged();
      },
      error: (err: any) => {
        this.keySaving = false;
        this.message.error(this.i18n.genericError(err.error));
      },
    });
  }

  async deleteKey(row: TranslationRow): Promise<void> {
    const ok = await this.actionConfirm.confirm({
      title: this.translate.instant('i18n.translation.deleteKeyTitle'),
      content: this.translate.instant('i18n.translation.deleteKeyContent', { key: row.fullKey }),
      okText: this.translate.instant('common.actions.delete'),
      icon: 'warning',
    });
    if (!ok) return;
    this.apiService
      .post<number>(this.apiService.I18N.TRANSLATION_KEY_DELETE, { ids: [row.keyId] })
      .subscribe({
        next: () => {
          for (const lang of this.languages) this.drafts.delete(this.draftKey(row.keyId, lang.code));
          this.saveAction.disabled = this.drafts.size === 0;
          this.message.success(this.i18n.deleteSuccess());
          this.afterTranslationsChanged();
        },
        error: (err: any) => this.message.error(this.i18n.genericError(err.error)),
      });
  }

  copyKey(key: string, event: MouseEvent): void {
    event.stopPropagation();
    navigator.clipboard?.writeText(key).then(
      () => this.message.success(this.translate.instant('i18n.translation.copied')),
      () => undefined,
    );
  }

  // ── Nhập / xuất JSON ────────────────────────────────────────────────

  exportJson(lang: Language): void {
    this.apiService.getBlob(this.apiService.I18N.TRANSLATION_EXPORT(lang.code)).subscribe({
      next: (response) => {
        if (!response.body) return;
        downloadBlob(response.body, `translations_${lang.code}.json`);
      },
      error: (err: any) => this.message.error(this.i18n.genericError(err.error)),
    });
  }

  openImport(): void {
    this.importLang = this.filters['languageCode'] || this.languages.find((l) => !l.isDefault)?.code || null;
    this.importOverwrite = false;
    this.importCreateKeys = true;
    this.importFile = null;
    this.importData = null;
    this.importPreviewCount = 0;
    this.importVisible = true;
  }

  onImportFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ''));
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not object');
        this.importFile = file;
        this.importData = parsed;
        this.importPreviewCount = this.countLeaves(parsed);
      } catch {
        this.importFile = null;
        this.importData = null;
        this.importPreviewCount = 0;
        this.message.error(this.translate.instant('i18n.translation.importInvalidFile'));
      }
      this.cdr.markForCheck();
    };
    reader.readAsText(file, 'utf-8');
  }

  submitImport(): void {
    if (!this.importLang || !this.importData) {
      this.message.warning(this.translate.instant('i18n.translation.importChooseFile'));
      return;
    }
    this.importing = true;
    this.apiService
      .post<TranslationImportResult>(this.apiService.I18N.TRANSLATION_IMPORT, {
        languageCode: this.importLang,
        data: this.importData,
        overwrite: this.importOverwrite,
        createMissingKeys: this.importCreateKeys,
      })
      .subscribe({
        next: (res) => {
          this.importing = false;
          this.importVisible = false;
          this.message.success(
            this.translate.instant('i18n.translation.importResult', {
              total: res.total,
              createdKeys: res.createdKeys,
              created: res.created,
              updated: res.updated,
              skipped: res.skipped,
            }),
            { nzDuration: 6000 },
          );
          this.afterTranslationsChanged();
        },
        error: (err: any) => {
          this.importing = false;
          this.message.error(this.i18n.genericError(err.error));
        },
      });
  }

  // ── Nội bộ ──────────────────────────────────────────────────────────

  private afterTranslationsChanged(): void {
    this.loadMeta().subscribe(() => this.loadData());
    // Giao diện hiện tại dùng ngay bản dịch mới
    this.langSvc.reloadTranslations().subscribe();
  }

  private draftKey(keyId: string, lang: string): string {
    return `${keyId}|${lang}`;
  }

  private visibleLanguages(): Language[] {
    const selected: string[] = this.filters['visibleLanguages'] || [];
    return selected.length ? this.languages.filter((l) => selected.includes(l.code)) : this.languages;
  }

  private rebuildColumns(): void {
    const langCols: TableColumn[] = this.visibleLanguages().map((l) => ({
      field: `${LANG_FIELD_PREFIX}${l.code}`,
      header: `${l.nativeName} (${l.code})`,
      width: 300,
      resizable: true,
      body: this.valueTpl,
    }));
    this.columns = [
      {
        field: 'key',
        header: 'i18n.translation.key',
        width: 340,
        sortable: true,
        frozen: true,
        body: this.keyTpl,
      },
      ...langCols,
    ];
  }

  private rebuildExportActions(): void {
    this.exportAction.subActions = this.languages.map((l) => ({
      key: `export-${l.code}`,
      label: `${l.nativeName} (${l.code})`,
      icon: 'file-text',
      onClick: () => this.exportJson(l),
    }));
  }

  private buildFilterFields(): FilterField[] {
    const languageOptions = (this.languages || []).map((l) => ({
      label: `${l.nativeName} (${l.code})`,
      value: l.code,
    }));
    return [
      {
        key: 'search',
        label: 'i18n.translation.search',
        type: 'input',
        placeholder: 'i18n.translation.searchPlaceholder',
        col: 6,
        allowClear: true,
      },
      {
        key: 'namespace',
        label: 'i18n.translation.namespace',
        type: 'select',
        placeholder: 'i18n.translation.allNamespaces',
        col: 4,
        allowClear: true,
        options: (this.namespaces || []).map((n) => ({
          label: `${n.namespace} (${n.count})`,
          value: n.namespace,
        })),
      },
      {
        key: 'languageCode',
        label: 'i18n.translation.language',
        type: 'select',
        placeholder: 'i18n.translation.chooseLanguage',
        col: 4,
        allowClear: true,
        options: languageOptions,
      },
      {
        key: 'status',
        label: 'i18n.translation.status',
        type: 'select',
        placeholder: 'i18n.translation.allStatus',
        col: 4,
        allowClear: true,
        options: [
          { label: 'i18n.translation.statusMissing', value: 'missing' },
          { label: 'i18n.translation.statusTranslated', value: 'translated' },
          { label: 'i18n.translation.statusUnreviewed', value: 'unreviewed' },
        ],
      },
      {
        key: 'visibleLanguages',
        label: 'i18n.translation.visibleLanguages',
        type: 'multiSelect',
        placeholder: 'i18n.translation.allLanguages',
        col: 6,
        allowClear: true,
        options: languageOptions,
      },
    ];
  }

  private countLeaves(obj: unknown): number {
    if (obj === null || obj === undefined) return 0;
    if (typeof obj !== 'object') return 1;
    return Object.values(obj as Record<string, unknown>).reduce<number>(
      (sum, v) => sum + this.countLeaves(v),
      0,
    );
  }

  private syncFilterActionsLoading(): void {
    const searchAction = this.filterActions.find((action) => action.key === 'search');
    if (searchAction) {
      searchAction.loading = this.loading;
    }
  }
}
