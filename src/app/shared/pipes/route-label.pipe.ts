import { resolveRouteLabel } from '@/app/core/constants/common';
import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

/**
 * Nhãn menu/route: bản dịch từ API nếu có, ngược lại dùng nhãn mặc định.
 * VD: {{ item | routeLabel }}
 */
@Pipe({ name: 'routeLabel', standalone: false, pure: false })
export class RouteLabelPipe implements PipeTransform {
  constructor(private readonly translate: TranslateService) {}

  transform(route: { label: string; translationKey: string } | null | undefined): string {
    if (!route) return '';
    return resolveRouteLabel(route, (key) => this.translate.instant(key));
  }
}
