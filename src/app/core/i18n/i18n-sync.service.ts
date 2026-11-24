import { Injectable } from '@angular/core';
import { RouteConfig, ROUTES_CONFIG } from '../constants/common/routes.config';
import { TranslationSyncItem } from '../models/i18n.models';
import { EXTRACTED_I18N_KEYS } from './i18n-keys.generated';
import { MissingKeyCollector } from './missing-key.collector';

export interface I18nSyncPayload {
  platform: 'WEB';
  keys: TranslationSyncItem[];
}

export interface I18nSyncSourceCount {
  source: number;
  routes: number;
  runtime: number;
}

/**
 * Gom toàn bộ khóa dịch đang được dùng trong ứng dụng web để gửi lên API đồng bộ:
 *  1. Khóa quét được trong mã nguồn (scripts/extract-i18n-keys.mjs -> i18n-keys.generated.ts)
 *  2. Khóa menu trong ROUTES_CONFIG
 *  3. Khóa thiếu ghi nhận được lúc chạy (khóa ghép động)
 * Chỉ gửi khóa (+ mô tả ngữ cảnh), KHÔNG gửi bản dịch: khóa mới được tạo với bản dịch rỗng
 * để nhập ở màn hình Bản dịch. Khóa đã có thì giữ nguyên bản dịch.
 */
@Injectable({ providedIn: 'root' })
export class I18nSyncService {
  constructor(private readonly collector: MissingKeyCollector) {}

  build(): { payload: I18nSyncPayload; counts: I18nSyncSourceCount } {
    const items = new Map<string, TranslationSyncItem>();
    const upsert = (key: string, description?: string) => {
      const item = items.get(key) ?? { key };
      if (!item.description && description) item.description = description;
      items.set(key, item);
    };

    for (const k of EXTRACTED_I18N_KEYS) {
      upsert(k.key, `Dùng tại: ${k.source}`);
    }

    let routes = 0;
    const walk = (list: Record<string, RouteConfig>) => {
      for (const route of Object.values(list)) {
        if (route.translationKey) {
          routes++;
          upsert(route.translationKey, `Menu: ${route.path}`);
        }
        if (route.children) walk(route.children);
      }
    };
    walk(ROUTES_CONFIG);

    const runtime = this.collector.list();
    for (const key of runtime) {
      upsert(key, 'Phát hiện khi chạy ứng dụng (khóa thiếu bản dịch)');
    }

    return {
      payload: { platform: 'WEB', keys: [...items.values()] },
      counts: {
        source: EXTRACTED_I18N_KEYS.length,
        routes,
        runtime: runtime.length,
      },
    };
  }

  /** Sau khi đồng bộ thành công: xóa danh sách khóa thiếu đã gửi. */
  clearRuntime(): void {
    this.collector.clear();
  }
}
