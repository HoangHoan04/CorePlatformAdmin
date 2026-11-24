import { registerLocaleData } from '@angular/common';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import vi from '@angular/common/locales/vi';
import { NgModule, provideZoneChangeDetection } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IconDefinition } from '@ant-design/icons-angular';
import * as AllIcons from '@ant-design/icons-angular/icons';
import {
  MissingTranslationHandler,
  provideTranslateService,
  TranslateLoader,
} from '@ngx-translate/core';
import { NZ_I18N, vi_VN } from 'ng-zorro-antd/i18n';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ApiTranslateLoader } from './core/i18n/api-translate.loader';
import { AppMissingTranslationHandler } from './core/i18n/missing-key.collector';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { LanguageInterceptor } from './core/interceptors/language.interceptor';
import { AdminLayoutModule } from './layout/admin-layout/admin-layout.module';
import { OtherModule } from './pages/other/other.module';
import { SharedModule } from './shared/shared.module';

registerLocaleData(vi);

const antDesignIcons: IconDefinition[] = Object.values(AllIcons);

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, SharedModule, AdminLayoutModule, OtherModule, AppRoutingModule],
  providers: [
    // Angular 21 mặc định chạy zoneless kể cả với bootstrapModule. Ứng dụng này viết theo kiểu dựa vào
    // zone.js (gán state trong callback HTTP / setTimeout), nên phải bật lại zone để giao diện tự cập nhật.
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Locale của thư viện ng-zorro (DatePicker, Pagination...) — không phải bản dịch nội dung.
    { provide: NZ_I18N, useValue: vi_VN },
    { provide: NZ_ICONS, useValue: antDesignIcons },
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: LanguageInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    // Bản dịch nội dung lấy từ API: GET /api/translations/{lang}
    provideTranslateService({
      lang: 'vi',
      fallbackLang: 'vi',
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new ApiTranslateLoader(http),
        deps: [HttpClient],
      },
      // Khóa chưa có bản dịch: ghi nhận để đồng bộ lên database + hiển thị nguyên khóa
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useClass: AppMissingTranslationHandler,
      },
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
