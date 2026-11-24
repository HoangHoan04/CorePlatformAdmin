import { exchangeRateTypeKey } from '@/app/core/constants/enums/mdm.enums';
import { ExchangeRate } from '@/app/core/models/mdm/exchange-rate.models';
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
import { NzMessageService } from 'ng-zorro-antd/message';

/**
 * Sheet (nz-drawer, bên phải) xem chi tiết tỷ giá — chỉ đọc, kèm tỷ giá nghịch đảo.
 * Nút "Chỉnh sửa" chỉ hiện khi có quyền sửa và được sửa dòng này ([canEditRow]: tỷ giá dùng chung
 * không sửa được với người dùng thuộc tenant).
 */
@Component({
  standalone: false,
  selector: 'app-exchange-rate-detail',
  templateUrl: './exchange-rate-detail.component.html',
  styleUrls: ['./exchange-rate-detail.component.scss'],
})
export class ExchangeRateDetailComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() rateId: string | null = null;
  @Input() canEdit = false;
  @Input() canEditRow: (row: ExchangeRate) => boolean = () => true;

  @Output() edit = new EventEmitter<ExchangeRate>();

  private readonly apiService = inject(ApiService);
  private readonly message = inject(NzMessageService);
  private readonly i18n = inject(I18nMessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly rateTypeKey = exchangeRateTypeKey;

  loading = false;
  rate: ExchangeRate | null = null;

  get inverse(): number | null {
    return this.rate && this.rate.rate > 0 ? 1 / this.rate.rate : null;
  }

  get showEdit(): boolean {
    return this.canEdit && !!this.rate && this.canEditRow(this.rate);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['visible'] || changes['rateId']) && this.visible && this.rateId) {
      this.load(this.rateId);
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onEdit(): void {
    if (!this.rate) return;
    const rate = this.rate;
    this.close();
    this.edit.emit(rate);
  }

  private load(id: string): void {
    this.loading = true;
    this.rate = null;
    this.apiService.get<ExchangeRate>(this.apiService.MDM.EXCHANGE_RATES.DETAIL(id)).subscribe({
      next: (res) => {
        this.rate = res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.loading = false;
        this.message.error(this.i18n.loadDetailFailed(err.error));
        this.cdr.markForCheck();
      },
    });
  }
}
