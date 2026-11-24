import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Gửi ngôn ngữ giao diện đang chọn lên API (header Accept-Language) để API trả thông báo lỗi,
 * tiêu đề cột Excel... đúng ngôn ngữ (dịch từ bảng translations).
 *
 * KHÔNG inject TranslateService qua constructor: TranslateService khi khởi tạo gọi HttpClient để tải bản dịch
 * -> HttpClient khởi tạo các interceptor -> interceptor lại cần TranslateService => vòng phụ thuộc (NG0200).
 * Vì vậy lấy TranslateService lúc cần qua Injector, và bỏ qua chính request tải bản dịch (ngôn ngữ đã nằm trong URL).
 */
@Injectable()
export class LanguageInterceptor implements HttpInterceptor {
  private translate?: TranslateService;

  constructor(private readonly injector: Injector) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (
      !req.url.startsWith(environment.apiUrl) ||
      req.url.startsWith(`${environment.apiUrl}/translations/`) ||
      req.headers.has('Accept-Language')
    ) {
      return next.handle(req);
    }

    const lang = this.currentLanguage();
    return lang ? next.handle(req.clone({ setHeaders: { 'Accept-Language': lang } })) : next.handle(req);
  }

  private currentLanguage(): string | null {
    try {
      this.translate ??= this.injector.get(TranslateService);
      return this.translate.getCurrentLang() || this.translate.getFallbackLang() || null;
    } catch {
      // TranslateService chưa khởi tạo xong -> dùng ngôn ngữ của trang (AppLanguageService gán)
      return document.documentElement.lang || null;
    }
  }
}
