import { Bank } from '@/app/core/models/mdm/bank.models';
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
 * Sheet (nz-drawer, bên phải) xem chi tiết ngân hàng — chỉ đọc.
 */
@Component({
  standalone: false,
  selector: 'app-bank-detail',
  templateUrl: './bank-detail.component.html',
  styleUrls: ['./bank-detail.component.scss'],
})
export class BankDetailComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() bankId: string | null = null;
  @Input() canEdit = false;

  @Output() edit = new EventEmitter<Bank>();

  private readonly apiService = inject(ApiService);
  private readonly message = inject(NzMessageService);
  private readonly i18n = inject(I18nMessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  bank: Bank | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['visible'] || changes['bankId']) && this.visible && this.bankId) {
      this.load(this.bankId);
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onEdit(): void {
    if (!this.bank) return;
    const bank = this.bank;
    this.close();
    this.edit.emit(bank);
  }

  private load(id: string): void {
    this.loading = true;
    this.bank = null;
    this.apiService.get<Bank>(this.apiService.MDM.BANKS.DETAIL(id)).subscribe({
      next: (res) => {
        this.bank = res;
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
