import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardOverview } from '../models/dashboard.models';
import { ApiService } from './api.service';

/**
 * Gọi API số liệu Dashboard (khác DashboardService — service cấu hình giao diện layout).
 */
@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  constructor(private readonly api: ApiService) {}

  getOverview(days = 7): Observable<DashboardOverview> {
    return this.api.get<DashboardOverview>(this.api.DASHBOARD.OVERVIEW, { days });
  }
}
