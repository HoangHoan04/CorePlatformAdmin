import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Danh mục URL API của CorePlatformApi (gom theo nhóm controller).
 */
@Injectable({
  providedIn: 'root',
})
export class EndpointService {
  private readonly baseUrl = environment.apiUrl;

  readonly AUTH = {
    LOGIN: `${this.baseUrl}/auth/login`,
    REFRESH: `${this.baseUrl}/auth/refresh`,
    LOGOUT: `${this.baseUrl}/auth/logout`,
    ME: `${this.baseUrl}/auth/me`,
    CHANGE_PASSWORD: `${this.baseUrl}/auth/change-password`,
  } as const;

  readonly DASHBOARD = {
    OVERVIEW: `${this.baseUrl}/dashboard/overview`,
  } as const;

  readonly SYSTEM = {
    HEALTH: `${this.baseUrl}/system/health`,
    SCHEMAS: `${this.baseUrl}/system/schemas`,
    ENTITIES: `${this.baseUrl}/system/entities`,
  } as const;

  /** Đa ngôn ngữ: cài đặt ngôn ngữ + khóa dịch / bản dịch (I18nController) */
  readonly I18N = {
    TRANSLATIONS_OF: (lang: string) => `${this.baseUrl}/translations/${encodeURIComponent(lang)}`,
    LANGUAGES_ACTIVE: `${this.baseUrl}/i18n/languages/active`,
    LANGUAGES_PAGINATION: `${this.baseUrl}/i18n/languages/pagination`,
    LANGUAGE_DETAIL: (code: string) => `${this.baseUrl}/i18n/languages/${encodeURIComponent(code)}`,
    LANGUAGE_CREATE: `${this.baseUrl}/i18n/languages/create`,
    LANGUAGE_UPDATE: `${this.baseUrl}/i18n/languages/update`,
    LANGUAGE_ACTIVATE: `${this.baseUrl}/i18n/languages/activate`,
    LANGUAGE_DEACTIVATE: `${this.baseUrl}/i18n/languages/deactivate`,
    LANGUAGE_SET_DEFAULT: `${this.baseUrl}/i18n/languages/set-default`,
    LANGUAGE_DELETE: `${this.baseUrl}/i18n/languages/delete`,
    TRANSLATION_PAGINATION: `${this.baseUrl}/i18n/translations/pagination`,
    TRANSLATION_NAMESPACES: `${this.baseUrl}/i18n/translations/namespaces`,
    TRANSLATION_STATS: `${this.baseUrl}/i18n/translations/stats`,
    TRANSLATION_SYNC: `${this.baseUrl}/i18n/translations/sync`,
    TRANSLATION_SAVE: `${this.baseUrl}/i18n/translations/save`,
    TRANSLATION_KEY_SAVE: `${this.baseUrl}/i18n/translations/keys/save`,
    TRANSLATION_KEY_DELETE: `${this.baseUrl}/i18n/translations/keys/delete`,
    TRANSLATION_IMPORT: `${this.baseUrl}/i18n/translations/import`,
    TRANSLATION_EXPORT: (lang: string) =>
      `${this.baseUrl}/i18n/translations/export/${encodeURIComponent(lang)}`,
  } as const;

  /**
   * Danh mục dùng chung (MDM) — mỗi danh mục một nhóm, ghi rõ từng đường dẫn (khớp controller phía API).
   * Danh mục cần thêm API riêng thì ghi thêm dòng vào đúng nhóm của nó.
   */
  readonly MDM = {
    /** CountriesController — api/mdm/countries */
    COUNTRIES: {
      PAGINATION: `${this.baseUrl}/mdm/countries/pagination`,
      DETAIL: (id: string) => `${this.baseUrl}/mdm/countries/${id}`,
      CREATE: `${this.baseUrl}/mdm/countries/create`,
      UPDATE: `${this.baseUrl}/mdm/countries/update`,
      ACTIVATE: `${this.baseUrl}/mdm/countries/activate`,
      DEACTIVATE: `${this.baseUrl}/mdm/countries/deactivate`,
      SELECT_BOX: `${this.baseUrl}/mdm/countries/select-box`,
      EXCEL_TEMPLATE: `${this.baseUrl}/mdm/countries/excel/template`,
      EXCEL_EXPORT: `${this.baseUrl}/mdm/countries/excel/export`,
      EXCEL_IMPORT: `${this.baseUrl}/mdm/countries/excel/import`,
    },
    /** AdministrativeUnitsController — api/mdm/administrative-units */
    ADMINISTRATIVE_UNITS: {
      PAGINATION: `${this.baseUrl}/mdm/administrative-units/pagination`,
      DETAIL: (id: string) => `${this.baseUrl}/mdm/administrative-units/${id}`,
      CREATE: `${this.baseUrl}/mdm/administrative-units/create`,
      UPDATE: `${this.baseUrl}/mdm/administrative-units/update`,
      ACTIVATE: `${this.baseUrl}/mdm/administrative-units/activate`,
      DEACTIVATE: `${this.baseUrl}/mdm/administrative-units/deactivate`,
      SELECT_BOX: `${this.baseUrl}/mdm/administrative-units/select-box`,
      EXCEL_TEMPLATE: `${this.baseUrl}/mdm/administrative-units/excel/template`,
      EXCEL_EXPORT: `${this.baseUrl}/mdm/administrative-units/excel/export`,
      EXCEL_IMPORT: `${this.baseUrl}/mdm/administrative-units/excel/import`,
    },
    /** AdministrativeUnitMappingsController — api/mdm/administrative-unit-mappings */
    ADMINISTRATIVE_UNIT_MAPPINGS: {
      PAGINATION: `${this.baseUrl}/mdm/administrative-unit-mappings/pagination`,
      DETAIL: (id: string) => `${this.baseUrl}/mdm/administrative-unit-mappings/${id}`,
      CREATE: `${this.baseUrl}/mdm/administrative-unit-mappings/create`,
      UPDATE: `${this.baseUrl}/mdm/administrative-unit-mappings/update`,
      DELETE: `${this.baseUrl}/mdm/administrative-unit-mappings/delete`,
      EXCEL_TEMPLATE: `${this.baseUrl}/mdm/administrative-unit-mappings/excel/template`,
      EXCEL_EXPORT: `${this.baseUrl}/mdm/administrative-unit-mappings/excel/export`,
      EXCEL_IMPORT: `${this.baseUrl}/mdm/administrative-unit-mappings/excel/import`,
    },
    /** CurrenciesController — api/mdm/currencies */
    CURRENCIES: {
      PAGINATION: `${this.baseUrl}/mdm/currencies/pagination`,
      DETAIL: (id: string) => `${this.baseUrl}/mdm/currencies/${id}`,
      CREATE: `${this.baseUrl}/mdm/currencies/create`,
      UPDATE: `${this.baseUrl}/mdm/currencies/update`,
      ACTIVATE: `${this.baseUrl}/mdm/currencies/activate`,
      DEACTIVATE: `${this.baseUrl}/mdm/currencies/deactivate`,
      SELECT_BOX: `${this.baseUrl}/mdm/currencies/select-box`,
      EXCEL_TEMPLATE: `${this.baseUrl}/mdm/currencies/excel/template`,
      EXCEL_EXPORT: `${this.baseUrl}/mdm/currencies/excel/export`,
      EXCEL_IMPORT: `${this.baseUrl}/mdm/currencies/excel/import`,
    },
    /** ExchangeRatesController — api/mdm/exchange-rates */
    EXCHANGE_RATES: {
      PAGINATION: `${this.baseUrl}/mdm/exchange-rates/pagination`,
      DETAIL: (id: string) => `${this.baseUrl}/mdm/exchange-rates/${id}`,
      CREATE: `${this.baseUrl}/mdm/exchange-rates/create`,
      UPDATE: `${this.baseUrl}/mdm/exchange-rates/update`,
      DELETE: `${this.baseUrl}/mdm/exchange-rates/delete`,
      /** Tỷ giá hiệu lực tại thời điểm: ?from=USD&to=VND&rateType=TRANSFER&at=... */
      LATEST: `${this.baseUrl}/mdm/exchange-rates/latest`,
      EXCEL_TEMPLATE: `${this.baseUrl}/mdm/exchange-rates/excel/template`,
      EXCEL_EXPORT: `${this.baseUrl}/mdm/exchange-rates/excel/export`,
      EXCEL_IMPORT: `${this.baseUrl}/mdm/exchange-rates/excel/import`,
    },
    /** BanksController — api/mdm/banks */
    BANKS: {
      PAGINATION: `${this.baseUrl}/mdm/banks/pagination`,
      DETAIL: (id: string) => `${this.baseUrl}/mdm/banks/${id}`,
      CREATE: `${this.baseUrl}/mdm/banks/create`,
      UPDATE: `${this.baseUrl}/mdm/banks/update`,
      ACTIVATE: `${this.baseUrl}/mdm/banks/activate`,
      DEACTIVATE: `${this.baseUrl}/mdm/banks/deactivate`,
      /** ?countryCode=VN&supportsVietqr=true&search= */
      SELECT_BOX: `${this.baseUrl}/mdm/banks/select-box`,
      EXCEL_TEMPLATE: `${this.baseUrl}/mdm/banks/excel/template`,
      EXCEL_EXPORT: `${this.baseUrl}/mdm/banks/excel/export`,
      EXCEL_IMPORT: `${this.baseUrl}/mdm/banks/excel/import`,
    },
  } as const;
}
