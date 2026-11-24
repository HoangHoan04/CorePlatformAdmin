import { PERMISSION_CODES } from '@/app/core/constants/common/permission-codes';
import { adminUnitMappingTypeKey, adminUnitTypeKey } from '@/app/core/constants/enums/mdm.enums';
import { PagedResult } from '@/app/core/models/common.models';
import { AdministrativeUnit } from '@/app/core/models/mdm/administrative-unit.models';
import { AdministrativeUnitMapping } from '@/app/core/models/mdm/administrative-unit-mapping.models';
import { ApiService } from '@/app/core/services/api.service';
import { I18nMessageService } from '@/app/core/services/i18n-message.service';
import { PermissionService } from '@/app/core/services/permission.service';
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
 * Sheet (nz-drawer, bên phải) xem chi tiết đơn vị hành chính — chỉ đọc.
 * Kèm lịch sử sáp nhập / chia tách liên quan (nếu có quyền xem Ánh xạ sáp nhập).
 */
@Component({
  standalone: false,
  selector: 'app-administrative-unit-detail',
  templateUrl: './administrative-unit-detail.component.html',
  styleUrls: ['./administrative-unit-detail.component.scss'],
})
export class AdministrativeUnitDetailComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() unitId: string | null = null;
  @Input() canEdit = false;

  @Output() edit = new EventEmitter<AdministrativeUnit>();

  private readonly apiService = inject(ApiService);
  private readonly message = inject(NzMessageService);
  private readonly i18n = inject(I18nMessageService);
  private readonly permissionSvc = inject(PermissionService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly typeKey = adminUnitTypeKey;
  readonly mappingTypeKey = adminUnitMappingTypeKey;

  loading = false;
  unit: AdministrativeUnit | null = null;
  mappings: AdministrativeUnitMapping[] = [];

  get canViewMappings(): boolean {
    return this.permissionSvc.has(PERMISSION_CODES.MDM_ADMIN_UNIT_MAPPING_VIEW);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['visible'] || changes['unitId']) && this.visible && this.unitId) {
      this.load(this.unitId);
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onEdit(): void {
    if (!this.unit) return;
    const unit = this.unit;
    this.close();
    this.edit.emit(unit);
  }

  private load(id: string): void {
    this.loading = true;
    this.unit = null;
    this.mappings = [];
    this.apiService.get<AdministrativeUnit>(this.apiService.MDM.ADMINISTRATIVE_UNITS.DETAIL(id)).subscribe({
      next: (res) => {
        this.unit = res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.loading = false;
        this.message.error(this.i18n.loadDetailFailed(err.error));
        this.cdr.markForCheck();
      },
    });

    if (this.canViewMappings) {
      this.apiService
        .post<PagedResult<AdministrativeUnitMapping>>(
          this.apiService.MDM.ADMINISTRATIVE_UNIT_MAPPINGS.PAGINATION,
          { pageIndex: 1, pageSize: 50, unitId: id },
        )
        .subscribe({
          next: (res) => {
            this.mappings = res.items;
            this.cdr.markForCheck();
          },
        });
    }
  }
}
