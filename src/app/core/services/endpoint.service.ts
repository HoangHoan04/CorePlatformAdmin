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

  readonly MASTER_DATA = {
    COUNTRIES: `${this.baseUrl}/master-data/countries`,
    CURRENCIES: `${this.baseUrl}/master-data/currencies`,
    LANGUAGES: `${this.baseUrl}/master-data/languages`,
    MODULES: `${this.baseUrl}/master-data/modules`,
  } as const;
}
