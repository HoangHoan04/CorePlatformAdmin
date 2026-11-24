import { SYMBOL_POSITIONS, symbolPositionKey } from '@/app/core/constants/enums/mdm.enums';
import { Currency, CurrencySaveRequest } from '@/app/core/models/mdm/currency.models';
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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { formatMoneyPreview } from '../currency-format';

/**
 * Sheet (nz-drawer, bên phải) thêm mới / chỉnh sửa tiền tệ. Mã ISO bị khóa khi sửa.
 * Có xem trước cách hiển thị số tiền theo ký hiệu / vị trí / số chữ số thập phân đang nhập.
 */
@Component({
  standalone: false,
  selector: 'app-add-or-update-currency',
  templateUrl: './add-or-update-currency.component.html',
  styleUrls: ['./add-or-update-currency.component.scss'],
})
export class AddOrUpdateCurrencyComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() currency: Currency | null = null;
  @Input() nextSortOrder = 0;

  @Output() saved = new EventEmitter<Currency>();

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly message = inject(NzMessageService);
  private readonly i18n = inject(I18nMessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly urls = this.apiService.MDM.CURRENCIES;

  readonly positions = SYMBOL_POSITIONS;
  readonly positionKey = symbolPositionKey;

  saving = false;

  readonly form: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{3}$/)]],
    numericCode: ['', [Validators.pattern(/^[0-9]{3}$/)]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    symbol: ['', [Validators.required, Validators.maxLength(10)]],
    decimalPlaces: [0, [Validators.min(0), Validators.max(6)]],
    roundingUnit: [1, [Validators.required, Validators.min(0.000001)]],
    symbolPosition: ['SUFFIX', [Validators.required]],
    sortOrder: [0],
    isActive: [true],
  });

  get isEdit(): boolean {
    return !!this.currency;
  }

  /** Ví dụ hiển thị 1234567.891 theo cấu hình đang nhập. */
  get preview(): string {
    const v = this.form.getRawValue();
    return formatMoneyPreview(1234567.891, v.symbol, v.symbolPosition, Number(v.decimalPlaces) || 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetForm();
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
    const body: CurrencySaveRequest = {
      id: this.currency?.id ?? null,
      code: (v.code || '').trim().toUpperCase(),
      numericCode: (v.numericCode || '').trim() || null,
      name: (v.name || '').trim(),
      symbol: (v.symbol || '').trim(),
      decimalPlaces: Number(v.decimalPlaces) || 0,
      roundingUnit: Number(v.roundingUnit) || 1,
      symbolPosition: v.symbolPosition,
      sortOrder: Number(v.sortOrder) || 0,
      isActive: !!v.isActive,
    };

    this.saving = true;
    const url = this.isEdit ? this.urls.UPDATE : this.urls.CREATE;
    this.apiService.post<Currency>(url, body).subscribe({
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
    const c = this.currency;
    this.form.reset({
      code: c?.code ?? '',
      numericCode: c?.numericCode ?? '',
      name: c?.name ?? '',
      symbol: c?.symbol ?? '',
      decimalPlaces: c?.decimalPlaces ?? 0,
      roundingUnit: c?.roundingUnit ?? 1,
      symbolPosition: c?.symbolPosition ?? 'SUFFIX',
      sortOrder: c?.sortOrder ?? this.nextSortOrder,
      isActive: c?.isActive ?? true,
    });
    // Mã ISO được quốc gia / tỷ giá / công ty tham chiếu -> không cho sửa
    const code = this.form.get('code')!;
    if (this.isEdit) {
      code.disable();
    } else {
      code.enable();
    }
  }
}
