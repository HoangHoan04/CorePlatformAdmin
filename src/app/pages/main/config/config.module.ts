import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { LanguageManagerComponent } from './i18n/language-manager/language-manager.component';
import { TranslationManagerComponent } from './i18n/translation-manager/translation-manager.component';

/**
 * Phân hệ Cấu hình (config.*): ngôn ngữ & bản dịch. URL theo ROUTES_CONFIG.CONFIG.
 */
const routes: Routes = [
  { path: 'i18n', redirectTo: 'i18n/languages', pathMatch: 'full' },
  { path: 'i18n/languages', component: LanguageManagerComponent, title: 'Cài đặt ngôn ngữ' },
  { path: 'i18n/translations', component: TranslationManagerComponent, title: 'Bản dịch' },
  // Đường dẫn cũ của menu "Khóa dịch" — nay gộp vào màn hình Bản dịch
  { path: 'i18n/translation_keys', redirectTo: 'i18n/translations', pathMatch: 'full' },
];

@NgModule({
  declarations: [LanguageManagerComponent, TranslationManagerComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ConfigModule {}
