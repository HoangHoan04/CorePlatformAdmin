import { Country } from '@/app/core/models/mdm/country.models';
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
 * Sheet (nz-drawer, bên phải) xem chi tiết quốc gia — chỉ đọc.
 *  - [countryId] + [(visible)]: mở sheet thì nạp chi tiết mới nhất từ API (GET .../{id}).
 *  - (edit) phát ra khi bấm "Chỉnh sửa" (chỉ hiện khi [canEdit]) để màn hình cha mở sheet sửa.
 */
@Component({
  standalone: false,
  selector: 'app-country-detail',
  templateUrl: './country-detail.component.html',
  styleUrls: ['./country-detail.component.scss'],
})
export class CountryDetailComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() countryId: string | null = null;
  @Input() canEdit = false;

  @Output() edit = new EventEmitter<Country>();

  private readonly apiService = inject(ApiService);
  private readonly message = inject(NzMessageService);
  private readonly i18n = inject(I18nMessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  country: Country | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['visible'] || changes['countryId']) && this.visible && this.countryId) {
      this.load(this.countryId);
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onEdit(): void {
    if (!this.country) return;
    const country = this.country;
    this.close();
    this.edit.emit(country);
  }

  private load(id: string): void {
    this.loading = true;
    this.country = null;
    this.apiService.get<Country>(this.apiService.MDM.COUNTRIES.DETAIL(id)).subscribe({
      next: (res) => {
        this.country = res;
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
