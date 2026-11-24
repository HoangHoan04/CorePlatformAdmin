import { ADMIN_UNIT_MAPPING_TYPES, adminUnitMappingTypeKey } from '@/app/core/constants/enums/mdm.enums';
import { SelectBoxDto } from '@/app/core/models/common.models';
import {
  AdministrativeUnitMapping,
  AdministrativeUnitMappingSaveRequest,
} from '@/app/core/models/mdm/administrative-unit-mapping.models';
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
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Subject, debounceTime, map, switchMap } from 'rxjs';

type UnitField = 'oldUnitId' | 'newUnitId';

/**
 * Sheet (nz-drawer, bên phải) thêm mới / chỉnh sửa ánh xạ đơn vị cũ → mới.
 * Hai ô chọn đơn vị tìm trên server (select-box đơn vị hành chính, lọc theo quốc gia):
 *  - Đơn vị cũ: gồm cả đơn vị đã ngừng dùng / hết hiệu lực (đơn vị bị sáp nhập thường đã hết hiệu lực).
 *  - Đơn vị mới: chỉ đơn vị còn hiệu lực.
 */
@Component({
  standalone: false,
  selector: 'app-add-or-update-administrative-unit-mapping',
  templateUrl: './add-or-update-administrative-unit-mapping.component.html',
  styleUrls: ['./add-or-update-administrative-unit-mapping.component.scss'],
})
export class AddOrUpdateAdministrativeUnitMappingComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() mapping: AdministrativeUnitMapping | null = null;
  @Input() defaultCountryCode: string | null = null;

  @Output() saved = new EventEmitter<AdministrativeUnitMapping>();

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly message = inject(NzMessageService);
  private readonly i18n = inject(I18nMessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly urls = this.apiService.MDM.ADMINISTRATIVE_UNIT_MAPPINGS;

  readonly mappingTypes = ADMIN_UNIT_MAPPING_TYPES;
  readonly mappingTypeKey = adminUnitMappingTypeKey;

  saving = false;
  countries: SelectBoxDto[] = [];
  options: Record<UnitField, SelectBoxDto[]> = { oldUnitId: [], newUnitId: [] };
  optionsLoading: Record<UnitField, boolean> = { oldUnitId: false, newUnitId: false };
  private readonly search$ = new Subject<{ field: UnitField; term: string }>();

  readonly form: FormGroup = this.fb.group(
    {
      countryCode: ['VN'],
      oldUnitId: [null as string | null, [Validators.required]],
      newUnitId: [null as string | null, [Validators.required]],
      mappingType: ['MERGE', [Validators.required]],
      effectiveDate: [null as Date | null, [Validators.required]],
      legalReference: ['', [Validators.maxLength(255)]],
      note: [''],
    },
    { validators: [differentUnits] },
  );

  get isEdit(): boolean {
    return !!this.mapping;
  }

  ngOnInit(): void {
    this.search$
      .pipe(
        debounceTime(300),
        switchMap(({ field, term }) => {
          this.optionsLoading[field] = true;
          return this.apiService
            .get<SelectBoxDto[]>(this.apiService.MDM.ADMINISTRATIVE_UNITS.SELECT_BOX, {
              countryCode: this.form.get('countryCode')!.value,
              search: term,
              includeInactive: field === 'oldUnitId',
              take: 50,
            })
            .pipe(map((list) => ({ field, list })));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ field, list }) => {
        this.options[field] = this.withSelected(field, list);
        this.optionsLoading[field] = false;
        this.cdr.markForCheck();
      });

    // Đổi quốc gia -> bỏ hai đơn vị đã chọn
    this.form
      .get('countryCode')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.form.patchValue({ oldUnitId: null, newUnitId: null }, { emitEvent: false });
        this.options = { oldUnitId: [], newUnitId: [] };
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetForm();
      this.loadCountries();
    }
  }

  onSearch(field: UnitField, term: string): void {
    this.search$.next({ field, term });
  }

  onOpen(field: UnitField, open: boolean): void {
    if (open && this.options[field].length <= 1) this.onSearch(field, '');
  }

  close(): void {
    if (this.saving) return;
    this.visible = false;
    this.visibleChange.emit(false);
  }

  submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c) => {
        c.markAsDirty();
        c.updateValueAndValidity({ onlySelf: true });
      });
      if (this.form.hasError('sameUnit')) {
        this.message.warning(this.i18n.instant('mdm.adminUnitMapping.sameUnit'));
      }
      return;
    }

    const v = this.form.getRawValue();
    const body: AdministrativeUnitMappingSaveRequest = {
      id: this.mapping?.id ?? null,
      oldUnitId: v.oldUnitId,
      newUnitId: v.newUnitId,
      mappingType: v.mappingType,
      effectiveDate: toIsoDate(v.effectiveDate),
      legalReference: (v.legalReference || '').trim() || null,
      note: (v.note || '').trim() || null,
    };

    this.saving = true;
    const url = this.isEdit ? this.urls.UPDATE : this.urls.CREATE;
    this.apiService.post<AdministrativeUnitMapping>(url, body).subscribe({
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
    const m = this.mapping;
    // Khi sửa: đưa sẵn hai đơn vị đang chọn vào ô chọn để hiện tên
    this.options = {
      oldUnitId: m ? [{ id: m.oldUnitId, code: m.oldUnitCode, name: m.oldUnitName }] : [],
      newUnitId: m ? [{ id: m.newUnitId, code: m.newUnitCode, name: m.newUnitName }] : [],
    };
    this.form.reset(
      {
        countryCode: m?.countryCode ?? this.defaultCountryCode ?? 'VN',
        oldUnitId: m?.oldUnitId ?? null,
        newUnitId: m?.newUnitId ?? null,
        mappingType: m?.mappingType ?? 'MERGE',
        effectiveDate: fromIsoDate(m?.effectiveDate),
        legalReference: m?.legalReference ?? '',
        note: m?.note ?? '',
      },
      { emitEvent: false },
    );
  }

  private withSelected(field: UnitField, list: SelectBoxDto[]): SelectBoxDto[] {
    const selectedId = this.form.get(field)!.value;
    const selected = this.options[field].find((o) => o.id === selectedId);
    return selected && !list.some((o) => o.id === selected.id) ? [selected, ...list] : list;
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

/** Đơn vị cũ và mới phải khác nhau. */
function differentUnits(group: AbstractControl): ValidationErrors | null {
  const oldId = group.get('oldUnitId')?.value;
  const newId = group.get('newUnitId')?.value;
  return oldId && newId && oldId === newId ? { sameUnit: true } : null;
}
