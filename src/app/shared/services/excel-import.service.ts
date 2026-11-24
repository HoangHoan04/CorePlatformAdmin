import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ExcelImportModalComponent, ExcelImportModalConfig } from '../components/excel-import-modal/excel-import-modal.component';

@Injectable({
  providedIn: 'root',
})
export class ExcelImportService {
  constructor(
    private modalService: NzModalService,
    private translate: TranslateService,
  ) {}

  openImportModal(config: ExcelImportModalConfig): void {
    this.modalService.create({
      nzTitle: this.translate.instant('common.import.title'),
      nzContent: ExcelImportModalComponent,
      nzData: { config },
      nzWidth: 960,
      nzFooter: null,
      nzMaskClosable: false,
    });
  }
}
