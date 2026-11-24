import { EXCHANGE_RATE_TYPES, exchangeRateTypeKey } from '@/app/core/constants/enums/mdm.enums';
import { SelectBoxDto } from '@/app/core/models/common.models';
import { ExchangeRate, ExchangeRateSaveRequest } from '@/app/core/models/mdm/exchange-rate.models';
import { ApiService } from '@/app/core/services/api.service';
import { I18nMessageService } from '@/app/core/services/i18n-message.service';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';

/**
 * Sheet (nz-drawer, bên phải) thêm mới / chỉnh sửa tỷ giá: 1 [tiền nguồn] = [tỷ giá] [tiền đích].
 * Nút đảo chiều đổi chỗ hai loại tiền (tỷ giá đổi thành nghịch đảo).
 */
@Component({
  standalone: false,
  selector: 'app-add-or-update-exchange-rate',
  templateUrl: './add-or-update-exchange-rate.component.html',
  styleUrls: ['./add-or-update-exchange-rate.component.scss'],
})
export class AddOrUpdateExchangeRateComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() rate: ExchangeRate | null = null;

  @Output() saved = new EventEmitter<ExchangeRate>();

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly message = inject(NzMessageService);
  private readonly i18n = inject(I18nMessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly urls = this.apiService.MDM.EXCHANGE_RATES;

  readonly rateTypes = EXCHANGE_RATE_TYPES;
  readonly rateTypeKey = exchangeRateTypeKey;

  saving = false;
  currencies: SelectBoxDto[] = [];
  banks: SelectBoxDto[] = [];

  readonly form: FormGroup = this.fb.group(
    {
      fromCurrency: ['USD', [Validators.required]],
      toCurrency: ['VND', [Validators.required]],
      rateType: ['TRANSFER', [Validators.required]],
      rate: [null as number | null, [Validators.required, Validators.min(0.00000001)]],
      effectiveAt: [new Date() as Date | null, [Validators.required]],
      source: ['MANUAL', [Validators.maxLength(30)]],
      note: ['', [Validators.maxLength(255)]],
    },
    { validators: [differentCurrencies] },
  );

  get isEdit(): boolean {
    return !!this.rate;
  }

  /** Tỷ giá nghịch đảo để người nhập đối chiếu (1 VND = ? USD). */
  get inverse(): number | null {
    const r = Number(this.form.value.rate);
    return r > 0 ? 1 / r : null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetForm();
      this.loadCurrencies();
    }
  }

  /** Đổi chiều cặp tiền, tỷ giá thành nghịch đảo. */
  swap(): void {
    const v = this.form.value;
    const r = Number(v.rate);
    this.form.patchValue({
      fromCurrency: v.toCurrency,
      toCurrency: v.fromCurrency,
      rate: r > 0 ? Number((1 / r).toPrecision(10)) : v.rate,
    });
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
      if (this.form.hasError('sameCurrency')) {
        this.message.warning(this.i18n.instant('mdm.exchangeRate.sameCurrency'));
      }
      return;
    }

    const v = this.form.getRawValue();
    const body: ExchangeRateSaveRequest = {
      id: this.rate?.id ?? null,
      fromCurrency: v.fromCurrency,
      toCurrency: v.toCurrency,
      rateType: v.rateType,
      rate: Number(v.rate),
      effectiveAt: v.effectiveAt ? (v.effectiveAt as Date).toISOString() : null,
      source: (v.source || '').trim() || null,
      note: (v.note || '').trim() || null,
    };

    this.saving = true;
    const url = this.isEdit ? this.urls.UPDATE : this.urls.CREATE;
    this.apiService.post<ExchangeRate>(url, body).subscribe({
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
    const r = this.rate;
    this.form.reset({
      fromCurrency: r?.fromCurrency ?? 'USD',
      toCurrency: r?.toCurrency ?? 'VND',
      rateType: r?.rateType ?? 'TRANSFER',
      rate: r?.rate ?? null,
      effectiveAt: r ? new Date(r.effectiveAt) : new Date(),
      source: r?.source ?? 'MANUAL',
      note: r?.note ?? '',
    });
  }

  private loadCurrencies(): void {
    if (this.currencies.length) return;
    this.apiService.get<SelectBoxDto[]>(this.apiService.MDM.CURRENCIES.SELECT_BOX).subscribe({
      next: (list) => {
        this.currencies = list;
        this.cdr.markForCheck();
      },
    });
  }

  private loadBanks(): void {
    if (this.banks.length) return;
    this.apiService.get<SelectBoxDto[]>(this.apiService.MDM.BANKS.SELECT_BOX).subscribe({
      next: (list) => {
        this.banks = list;
        this.cdr.markForCheck();
      },
    });
  }
}

/** Tiền nguồn và tiền đích phải khác nhau. */
function differentCurrencies(group: AbstractControl): ValidationErrors | null {
  const from = group.get('fromCurrency')?.value;
  const to = group.get('toCurrency')?.value;
  return from && to && from === to ? { sameCurrency: true } : null;
}
