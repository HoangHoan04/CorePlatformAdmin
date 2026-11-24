import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, catchError, finalize, forkJoin, of, tap } from 'rxjs';
import { ActiveLanguage } from '../models/i18n.models';
import { EndpointService } from './endpoint.service';

/** Dùng khi API chưa trả về danh sách ngôn ngữ (mất kết nối...) */
const FALLBACK_LANGUAGES: ActiveLanguage[] = [
  {
    code: 'vi-VN',
    name: 'Tiếng Việt',
    nativeName: 'Tiếng Việt',
    direction: 'LTR',
    dateFormat: 'dd/MM/yyyy',
    isDefault: true,
  },
  {
    code: 'en-US',
    name: 'Tiếng Anh',
    nativeName: 'English',
    direction: 'LTR',
    dateFormat: 'MM/dd/yyyy',
    isDefault: false,
  },
];

/** Cờ có sẵn trong assets/icons (theo mã ngôn ngữ 2 ký tự) */
const FLAG_ICONS = new Set(['vi', 'en']);

/**
 * Danh sách ngôn ngữ đang hỗ trợ (config.languages, is_active) cho bộ chọn ngôn ngữ,
 * và tiện ích nạp lại bản dịch sau khi sửa ở màn hình quản trị.
 */
@Injectable({ providedIn: 'root' })
export class AppLanguageService {
  private readonly languagesSubject = new BehaviorSubject<ActiveLanguage[]>(FALLBACK_LANGUAGES);
  readonly languages$ = this.languagesSubject.asObservable();
  private loading = false;
  private loaded = false;

  constructor(
    private readonly http: HttpClient,
    private readonly endpoints: EndpointService,
    private readonly translate: TranslateService,
  ) {}

  get languages(): ActiveLanguage[] {
    return this.languagesSubject.value;
  }

  /** Nạp danh sách ngôn ngữ (một lần; force = nạp lại sau khi sửa cài đặt ngôn ngữ). */
  load(force = false): void {
    if (this.loading || (this.loaded && !force)) return;
    this.loading = true;
    this.http
      .get<ActiveLanguage[]>(this.endpoints.I18N.LANGUAGES_ACTIVE)
      .pipe(
        catchError(() => of(null)),
        finalize(() => (this.loading = false)),
      )
      .subscribe((list) => {
        if (list && list.length) {
          this.loaded = true;
          this.languagesSubject.next(list);
        }
      });
  }

  /** "vi" khớp "vi-VN" (cài đặt cũ lưu mã 2 ký tự). */
  isSame(code: string | null | undefined, current: string | null | undefined): boolean {
    if (!code || !current) return false;
    const a = code.toLowerCase();
    const b = current.toLowerCase();
    return a === b || a.startsWith(b + '-') || b.startsWith(a + '-');
  }

  find(current: string | null | undefined): ActiveLanguage | undefined {
    return this.languages.find((l) => this.isSame(l.code, current));
  }

  /** Đường dẫn ảnh cờ nếu có, ngược lại null (hiển thị mã ngôn ngữ). */
  flagOf(code: string | null | undefined): string | null {
    const short = (code || '').split('-')[0].toLowerCase();
    return FLAG_ICONS.has(short) ? `assets/icons/${short}.svg` : null;
  }

  shortCode(code: string | null | undefined): string {
    return (code || '').split('-')[0].toUpperCase();
  }

  /** Gắn lang/dir cho thẻ html theo ngôn ngữ đang dùng. */
  applyDocumentLanguage(code: string): void {
    const lang = this.find(code);
    document.documentElement.lang = (lang?.code || code || 'vi').split('-')[0];
    document.documentElement.dir = lang?.direction === 'RTL' ? 'rtl' : 'ltr';
  }

  /**
   * Nạp lại bản dịch từ API cho ngôn ngữ đang dùng (và ngôn ngữ dự phòng) để thấy ngay nội dung vừa sửa.
   */
  reloadTranslations(): Observable<unknown> {
    const current = this.translate.getCurrentLang();
    const fallback = this.translate.getFallbackLang();
    const langs = [...new Set([current, fallback].filter((l): l is string => !!l))];
    if (!langs.length) return of(null);
    return forkJoin(langs.map((l) => this.translate.reloadLang(l))).pipe(
      tap(() => {
        if (current) this.translate.use(current);
      }),
      catchError(() => of(null)),
    );
  }
}
