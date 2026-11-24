import { SelectBoxDto } from '@/app/core/models/common.models';
import { Bank, BankSaveRequest } from '@/app/core/models/mdm/bank.models';
import { ApiService } from '@/app/core/services/api.service';
import { I18nMessageService } from '@/app/core/services/i18n-message.service';
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

/**
 * Sheet (nz-drawer, bên phải) thêm mới / chỉnh sửa ngân hàng.
 * Bật "Hỗ trợ VietQR" thì mã BIN NAPAS (6 số) thành bắt buộc. Có xem trước logo.
 */
@Component({
  standalone: false,
  selector: 'app-add-or-update-bank',
  templateUrl: './add-or-update-bank.component.html',
  styleUrls: ['./add-or-update-bank.component.scss'],
})
export class AddOrUpdateBankComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() bank: Bank | null = null;
  @Input() defaultCountryCode: string | null = null;

  @Output() saved = new EventEmitter<Bank>();

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly message = inject(NzMessageService);
  private readonly i18n = inject(I18nMessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly urls = this.apiService.MDM.BANKS;

  saving = false;
  countries: SelectBoxDto[] = [];
  logoError = false;

  readonly form: FormGroup = this.fb.group({
    countryCode: ['VN', [Validators.required]],
    code: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]{1,20}$/)]],
    bin: ['', [Validators.pattern(/^[0-9]{6}$/)]],
    shortName: ['', [Validators.required, Validators.maxLength(100)]],
    name: ['', [Validators.required, Validators.maxLength(255)]],
    swiftCode: ['', [Validators.pattern(/^[A-Za-z]{6}[A-Za-z0-9]{2}([A-Za-z0-9]{3})?$/)]],
    logoUrl: ['', [Validators.maxLength(500), Validators.pattern(/^https?:\/\/.+/i)]],
    supportsVietqr: [false],
    isActive: [true],
  });

  get isEdit(): boolean {
    return !!this.bank;
  }

  ngOnInit(): void {
    // VietQR cần mã BIN NAPAS
    this.form
      .get('supportsVietqr')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((on: boolean) => {
        const bin = this.form.get('bin')!;
        bin.setValidators(on ? [Validators.required, Validators.pattern(/^[0-9]{6}$/)] : [Validators.pattern(/^[0-9]{6}$/)]);
        bin.updateValueAndValidity({ emitEvent: false });
      });

    this.form
      .get('logoUrl')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => (this.logoError = false));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetForm();
      this.loadCountries();
    }
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
      return;
    }

    const v = this.form.getRawValue();
    const body: BankSaveRequest = {
      id: this.bank?.id ?? null,
      countryCode: v.countryCode,
      code: (v.code || '').trim().toUpperCase(),
      bin: (v.bin || '').trim() || null,
      shortName: (v.shortName || '').trim(),
      name: (v.name || '').trim(),
      swiftCode: (v.swiftCode || '').trim().toUpperCase() || null,
      logoUrl: (v.logoUrl || '').trim() || null,
      supportsVietqr: !!v.supportsVietqr,
      isActive: !!v.isActive,
    };

    this.saving = true;
    const url = this.isEdit ? this.urls.UPDATE : this.urls.CREATE;
    this.apiService.post<Bank>(url, body).subscribe({
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
    const b = this.bank;
    this.logoError = false;
    this.form.reset({
      countryCode: b?.countryCode ?? this.defaultCountryCode ?? 'VN',
      code: b?.code ?? '',
      bin: b?.bin ?? '',
      shortName: b?.shortName ?? '',
      name: b?.name ?? '',
      swiftCode: b?.swiftCode ?? '',
      logoUrl: b?.logoUrl ?? '',
      supportsVietqr: b?.supportsVietqr ?? false,
      isActive: b?.isActive ?? true,
    });
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
