import { ADMIN_UNIT_TYPES, adminUnitTypeKey } from '@/app/core/constants/enums/mdm.enums';
import { SelectBoxDto } from '@/app/core/models/common.models';
import {
  AdministrativeUnit,
  AdministrativeUnitSaveRequest,
} from '@/app/core/models/mdm/administrative-unit.models';
import { ApiService } from '@/app/core/services/api.service';
import { I18nMessageService } from '@/app/core/services/i18n-message.service';
import { fromIsoDate, toIsoDate } from '@/app/core/utils/date.util';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Subject, debounceTime, switchMap } from 'rxjs';

/** Đơn vị cấp trên tối đa ở cấp 2 (đơn vị mới tối đa cấp 3). */
const PARENT_MAX_LEVEL = 2;

/**
 * Sheet (nz-drawer, bên phải) thêm mới / chỉnh sửa đơn vị hành chính.
 *  - [unit] = null -> thêm mới; có giá trị -> chỉnh sửa (quốc gia, cấp trên, mã bị khóa — cấp + đường dẫn cây
 *    phụ thuộc vào chúng; sáp nhập / chia tách khai báo ở Ánh xạ sáp nhập).
 *  - [defaultParent] / [defaultCountryCode]: điền sẵn khi thêm mới (đang xem đơn vị trực thuộc / đang lọc quốc gia).
 *  - Ô "Đơn vị cấp trên" tìm trên server (select-box, lọc theo quốc gia đã chọn).
 */
@Component({
  standalone: false,
  selector: 'app-add-or-update-administrative-unit',
  templateUrl: './add-or-update-administrative-unit.component.html',
  styleUrls: ['./add-or-update-administrative-unit.component.scss'],
})
export class AddOrUpdateAdministrativeUnitComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() unit: AdministrativeUnit | null = null;
  @Input() defaultParent: { id: string; name: string } | null = null;
  @Input() defaultCountryCode: string | null = null;

  @Output() saved = new EventEmitter<AdministrativeUnit>();

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly message = inject(NzMessageService);
  private readonly i18n = inject(I18nMessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly urls = this.apiService.MDM.ADMINISTRATIVE_UNITS;

  readonly unitTypes = ADMIN_UNIT_TYPES;
  readonly typeKey = adminUnitTypeKey;

  saving = false;
  countries: SelectBoxDto[] = [];
  parents: SelectBoxDto[] = [];
  parentsLoading = false;
  private readonly parentSearch$ = new Subject<string>();

  readonly form: FormGroup = this.fb.group({
    countryCode: [null as string | null, [Validators.required]],
    parentId: [null as string | null],
    code: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_.-]{1,20}$/)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    fullName: ['', [Validators.maxLength(255)]],
    nameEn: ['', [Validators.maxLength(150)]],
    unitType: [null as string | null, [Validators.required]],
    phoneAreaCode: ['', [Validators.pattern(/^[0-9 +-]{1,10}$/)]],
    postalCode: ['', [Validators.maxLength(10)]],
    latitude: [null as number | null, [Validators.min(-90), Validators.max(90)]],
    longitude: [null as number | null, [Validators.min(-180), Validators.max(180)]],
    effectiveFrom: [null as Date | null],
    effectiveTo: [null as Date | null],
    sortOrder: [0],
    isActive: [true],
  });

  get isEdit(): boolean {
    return !!this.unit;
  }

  ngOnInit(): void {
    // Tìm đơn vị cấp trên theo từ khóa (gõ -> chờ 300ms -> gọi select-box)
    this.parentSearch$
      .pipe(
        debounceTime(300),
        switchMap((search) => {
          this.parentsLoading = true;
          return this.apiService.get<SelectBoxDto[]>(this.urls.SELECT_BOX, {
            countryCode: this.form.get('countryCode')!.value,
            maxLevel: PARENT_MAX_LEVEL,
            search,
            take: 50,
          });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (list) => {
          this.parents = this.withSelectedParent(list);
          this.parentsLoading = false;
          this.cdr.markForCheck();
        },
        error: () => (this.parentsLoading = false),
      });

    // Đổi quốc gia -> bỏ đơn vị cấp trên đã chọn, nạp lại danh sách
    this.form
      .get('countryCode')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.isEdit) return;
        this.form.patchValue({ parentId: null }, { emitEvent: false });
        this.parents = [];
        this.parentSearch$.next('');
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetForm();
      this.loadCountries();
    }
  }

  onParentSearch(value: string): void {
    this.parentSearch$.next(value);
  }

  close(): void {
    if (this.saving) return;
    this.visible = false;
    this.visibleChange.emit(false);
  }

  submit(): void {
    const from: Date | null = this.form.value.effectiveFrom;
    const to: Date | null = this.form.value.effectiveTo;
    if (from && to && to <= from) {
      this.form.get('effectiveTo')!.setErrors({ range: true });
    }

    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c) => {
        c.markAsDirty();
        c.updateValueAndValidity({ onlySelf: true });
      });
      if (from && to && to <= from) this.form.get('effectiveTo')!.setErrors({ range: true });
      return;
    }

    const v = this.form.getRawValue();
    const body: AdministrativeUnitSaveRequest = {
      id: this.unit?.id ?? null,
      countryCode: v.countryCode,
      parentId: v.parentId || null,
      code: (v.code || '').trim().toUpperCase(),
      name: (v.name || '').trim(),
      fullName: (v.fullName || '').trim() || null,
      nameEn: (v.nameEn || '').trim() || null,
      unitType: v.unitType,
      phoneAreaCode: (v.phoneAreaCode || '').trim() || null,
      postalCode: (v.postalCode || '').trim() || null,
      latitude: v.latitude ?? null,
      longitude: v.longitude ?? null,
      effectiveFrom: toIsoDate(v.effectiveFrom),
      effectiveTo: toIsoDate(v.effectiveTo),
      sortOrder: Number(v.sortOrder) || 0,
      isActive: !!v.isActive,
    };

    this.saving = true;
    const url = this.isEdit ? this.urls.UPDATE : this.urls.CREATE;
    this.apiService.post<AdministrativeUnit>(url, body).subscribe({
      next: (result) => {
        this.saving = false;
        this.message.success(this.isEdit ? this.i18n.updateSuccess() : this.i18n.createSuccess());
        this.close();
        this.saved.emit(result);
      },
      error: (err: any) => {
        this.saving = false;
        this.message.error(this.i18n.genericError(err.error));
        this.cdr.markForCheck();
      },
    });
  }

  private resetForm(): void {
    const u = this.unit;
    const parent = u?.parentId
      ? { id: u.parentId, name: u.parentName ?? u.parentCode ?? '' }
      : !u
        ? this.defaultParent
        : null;
    this.parents = parent ? [{ id: parent.id, code: '', name: parent.name }] : [];

    this.form.reset(
      {
        countryCode: u?.countryCode ?? this.defaultCountryCode ?? 'VN',
        parentId: parent?.id ?? null,
        code: u?.code ?? '',
        name: u?.name ?? '',
        fullName: u?.fullName ?? '',
        nameEn: u?.nameEn ?? '',
        unitType: u?.unitType ?? null,
        phoneAreaCode: u?.phoneAreaCode ?? '',
        postalCode: u?.postalCode ?? '',
        latitude: u?.latitude ?? null,
        longitude: u?.longitude ?? null,
        effectiveFrom: fromIsoDate(u?.effectiveFrom),
        effectiveTo: fromIsoDate(u?.effectiveTo),
        sortOrder: u?.sortOrder ?? 0,
        isActive: u?.isActive ?? true,
      },
      { emitEvent: false },
    );

    // Quốc gia, cấp trên, mã không sửa được sau khi tạo
    for (const name of ['countryCode', 'parentId', 'code']) {
      const control = this.form.get(name)!;
      if (this.isEdit) {
        control.disable({ emitEvent: false });
      } else {
        control.enable({ emitEvent: false });
      }
    }
  }

  /** Giữ đơn vị cấp trên đang chọn trong danh sách (để ô chọn vẫn hiện tên khi kết quả tìm không chứa nó). */
  private withSelectedParent(list: SelectBoxDto[]): SelectBoxDto[] {
    const selectedId = this.form.get('parentId')!.value;
    const selected = this.parents.find((p) => p.id === selectedId);
    return selected && !list.some((p) => p.id === selected.id) ? [selected, ...list] : list;
  }

  private loadCountries(): void {
    if (this.countries.length) return;
    this.apiService.get<SelectBoxDto[]>(this.apiService.MDM.COUNTRIES.SELECT_BOX).subscribe({
      next: (list) => {
        this.countries = list;
        this.cdr.markForCheck();
      },
    });
  }
}
