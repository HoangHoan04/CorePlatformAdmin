import { Injectable, inject } from '@angular/core';
import {
  MissingTranslationHandler,
  MissingTranslationHandlerParams,
  StrictTranslation,
} from '@ngx-translate/core';

const STORAGE_KEY = 'i18n_missing_keys';
const KEY_RE = /^[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)+$/;
const MAX_KEYS = 5000;

/**
 * Ghi lại các khóa dịch bị thiếu khi ứng dụng chạy (kể cả khóa ghép động mà script quét mã nguồn không thấy).
 * Nút "Đồng bộ khóa" gửi các khóa này lên API cùng danh sách quét được.
 */
@Injectable({ providedIn: 'root' })
export class MissingKeyCollector {
  private readonly keys = new Set<string>(this.read());
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  add(key: string): void {
    if (!key || this.keys.has(key) || this.keys.size >= MAX_KEYS || !KEY_RE.test(key)) return;
    this.keys.add(key);
    this.scheduleSave();
  }

  list(): string[] {
    return [...this.keys].sort();
  }

  get size(): number {
    return this.keys.size;
  }

  clear(): void {
    this.keys.clear();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* bỏ qua */
    }
  }

  private scheduleSave(): void {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.keys]));
      } catch {
        /* bỏ qua: trình duyệt chặn storage */
      }
    }, 1000);
  }

  private read(): string[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.filter((k) => typeof k === 'string') : [];
    } catch {
      return [];
    }
  }
}

/**
 * Khi API chưa có bản dịch cho một khóa: ghi nhận khóa thiếu (để "Đồng bộ khóa" đưa lên database)
 * và hiển thị nguyên khóa. Không có văn bản mặc định gõ cứng trong mã nguồn — mọi nội dung nhập ở màn hình Bản dịch.
 */
@Injectable()
export class AppMissingTranslationHandler implements MissingTranslationHandler {
  private readonly collector = inject(MissingKeyCollector);

  handle(params: MissingTranslationHandlerParams): StrictTranslation {
    this.collector.add(params.key);
    return params.key;
  }
}
