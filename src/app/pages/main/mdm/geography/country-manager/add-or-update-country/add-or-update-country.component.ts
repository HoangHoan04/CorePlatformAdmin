import { SelectBoxDto } from '@/app/core/models/common.models';
import { Country, CountrySaveRequest } from '@/app/core/models/mdm/country.models';
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

/**
 * Sheet (nz-drawer, bên phải) thêm mới / chỉnh sửa quốc gia.
 *  - [country] = null -> thêm mới; có giá trị -> chỉnh sửa (mã alpha-2 bị khóa).
 *  - [(visible)] mở / đóng sheet; (saved) phát ra khi lưu thành công để màn hình cha nạp lại danh sách.
 * Lỗi kiểm tra từ API hiển thị nguyên văn (API đã dịch theo ngôn ngữ đang dùng).
 */
@Component({
  standalone: false,
  selector: 'app-add-or-update-country',
  templateUrl: './add-or-update-country.component.html',
  styleUrls: ['./add-or-update-country.component.scss'],
})
export class AddOrUpdateCountryComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** Bản ghi cần sửa; null = thêm mới. */
  @Input() country: Country | null = null;
  /** Gợi ý thứ tự hiển thị khi thêm mới. */
  @Input() nextSortOrder = 0;

  @Output() saved = new EventEmitter<Country>();

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly message = inject(NzMessageService);
  private readonly i18n = inject(I18nMessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly urls = this.apiService.MDM.COUNTRIES;

  saving = false;
  currencies: SelectBoxDto[] = [];

  readonly form: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]],
    alpha3Code: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{3}$/)]],
    numericCode: ['', [Validators.pattern(/^[0-9]{3}$/)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    nameEn: ['', [Validators.required, Validators.maxLength(150)]],
    phoneCode: ['', [Validators.pattern(/^\+?[0-9\- ]{1,9}$/)]],
    currencyCode: [null],
    flagEmoji: ['', [Validators.maxLength(10)]],
    sortOrder: [0],
    isActive: [true],
  });

  get isEdit(): boolean {
    return !!this.country;
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Mỗi lần mở sheet: đổ dữ liệu vào form + nạp danh sách cho ô chọn
    if (changes['visible'] && this.visible) {
      this.resetForm();
      this.loadCurrencies();
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
    const body: CountrySaveRequest = {
      id: this.country?.id ?? null,
      code: (v.code || '').trim().toUpperCase(),
      alpha3Code: (v.alpha3Code || '').trim().toUpperCase(),
      numericCode: (v.numericCode || '').trim() || null,
      name: (v.name || '').trim(),
      nameEn: (v.nameEn || '').trim(),
      phoneCode: (v.phoneCode || '').trim() || null,
      currencyCode: v.currencyCode || null,
      flagEmoji: (v.flagEmoji || '').trim() || null,
      sortOrder: Number(v.sortOrder) || 0,
      isActive: !!v.isActive,
    };

    this.saving = true;
    const url = this.isEdit ? this.urls.UPDATE : this.urls.CREATE;
    this.apiService.post<Country>(url, body).subscribe({
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
    const c = this.country;
    this.form.reset({
      code: c?.code ?? '',
      alpha3Code: c?.alpha3Code ?? '',
      numericCode: c?.numericCode ?? '',
      name: c?.name ?? '',
      nameEn: c?.nameEn ?? '',
      phoneCode: c?.phoneCode ?? '',
      currencyCode: c?.currencyCode ?? null,
      flagEmoji: c?.flagEmoji ?? '',
      sortOrder: c?.sortOrder ?? this.nextSortOrder,
      isActive: c?.isActive ?? true,
    });
    // Mã alpha-2 được bảng khác tham chiếu -> không cho sửa
    const code = this.form.get('code')!;
    if (this.isEdit) {
      code.disable();
    } else {
      code.enable();
    }
  }

  /** Tiền tệ đang hoạt động cho ô chọn (select-box của danh mục tiền tệ, nạp một lần). */
  private loadCurrencies(): void {
    if (this.currencies.length) return;
    this.apiService.get<SelectBoxDto[]>(this.apiService.MDM.CURRENCIES.SELECT_BOX).subscribe({
      next: (list) => {
        this.currencies = list;
        this.cdr.markForCheck();
      },
      error: () => (this.currencies = []),
    });
  }
}
