import { symbolPositionKey } from '@/app/core/constants/enums/mdm.enums';
import { Currency } from '@/app/core/models/mdm/currency.models';
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
import { formatMoneyPreview } from '../currency-format';

/**
 * Sheet (nz-drawer, bên phải) xem chi tiết tiền tệ — chỉ đọc, kèm ví dụ hiển thị số tiền.
 */
@Component({
  standalone: false,
  selector: 'app-currency-detail',
  templateUrl: './currency-detail.component.html',
  styleUrls: ['./currency-detail.component.scss'],
})
export class CurrencyDetailComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() currencyId: string | null = null;
  @Input() canEdit = false;

  @Output() edit = new EventEmitter<Currency>();

  private readonly apiService = inject(ApiService);
  private readonly message = inject(NzMessageService);
  private readonly i18n = inject(I18nMessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly positionKey = symbolPositionKey;

  loading = false;
  currency: Currency | null = null;

  get preview(): string {
    const c = this.currency;
    return c ? formatMoneyPreview(1234567.891, c.symbol, c.symbolPosition, c.decimalPlaces) : '';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['visible'] || changes['currencyId']) && this.visible && this.currencyId) {
      this.load(this.currencyId);
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onEdit(): void {
    if (!this.currency) return;
    const currency = this.currency;
    this.close();
    this.edit.emit(currency);
  }

  private load(id: string): void {
    this.loading = true;
    this.currency = null;
    this.apiService.get<Currency>(this.apiService.MDM.CURRENCIES.DETAIL(id)).subscribe({
      next: (res) => {
        this.currency = res;
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
