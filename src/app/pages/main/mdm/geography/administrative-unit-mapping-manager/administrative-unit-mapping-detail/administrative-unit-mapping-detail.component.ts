import { adminUnitMappingTypeKey } from '@/app/core/constants/enums/mdm.enums';
import { AdministrativeUnitMapping } from '@/app/core/models/mdm/administrative-unit-mapping.models';
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
 * Sheet (nz-drawer, bên phải) xem chi tiết ánh xạ đơn vị cũ → mới — chỉ đọc.
 */
@Component({
  standalone: false,
  selector: 'app-administrative-unit-mapping-detail',
  templateUrl: './administrative-unit-mapping-detail.component.html',
  styleUrls: ['./administrative-unit-mapping-detail.component.scss'],
})
export class AdministrativeUnitMappingDetailComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() mappingId: string | null = null;
  @Input() canEdit = false;

  @Output() edit = new EventEmitter<AdministrativeUnitMapping>();

  private readonly apiService = inject(ApiService);
  private readonly message = inject(NzMessageService);
  private readonly i18n = inject(I18nMessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly mappingTypeKey = adminUnitMappingTypeKey;

  loading = false;
  mapping: AdministrativeUnitMapping | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['visible'] || changes['mappingId']) && this.visible && this.mappingId) {
      this.load(this.mappingId);
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onEdit(): void {
    if (!this.mapping) return;
    const mapping = this.mapping;
    this.close();
    this.edit.emit(mapping);
  }

  private load(id: string): void {
    this.loading = true;
    this.mapping = null;
    this.apiService
      .get<AdministrativeUnitMapping>(this.apiService.MDM.ADMINISTRATIVE_UNIT_MAPPINGS.DETAIL(id))
      .subscribe({
        next: (res) => {
          this.mapping = res;
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
