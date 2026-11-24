import { HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Nạp bản dịch từ API (config.translation_keys + config.translations) thay cho file JSON tĩnh.
 * GET {apiUrl}/translations/{lang} trả về object lồng nhau theo namespace, VD: { auth: { signIn: "Đăng nhập" } }.
 * API lỗi -> trả object rỗng (giao diện hiển thị key) để ứng dụng vẫn chạy.
 */
export class ApiTranslateLoader implements TranslateLoader {
  constructor(private readonly http: HttpClient) {}

  getTranslation(lang: string): Observable<TranslationObject> {
    return this.http
      .get<TranslationObject>(`${environment.apiUrl}/translations/${encodeURIComponent(lang)}`)
      .pipe(
        catchError(() => {
          console.warn(`[i18n] Không tải được bản dịch '${lang}' từ API.`);
          return of({});
        }),
      );
  }
}
