import { DashboardService, DashboardSettings } from '@/app/core/services';
import { ActiveLanguage } from '@/app/core/models/i18n.models';
import { AppLanguageService } from '@/app/core/services/app-language.service';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-change-language',
  standalone: false,
  templateUrl: './change-language.component.html',
  styleUrls: ['./change-language.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ChangeLanguageComponent implements OnInit, OnDestroy {
  s: DashboardSettings;
  languages: ActiveLanguage[] = [];
  private sub = new Subscription();

  constructor(
    private dashboardService: DashboardService,
    readonly langSvc: AppLanguageService,
  ) {
    this.s = dashboardService.snapshot;
  }

  ngOnInit(): void {
    this.sub.add(
      this.dashboardService.settings$.subscribe((settings) => {
        this.s = settings;
        this.langSvc.applyDocumentLanguage(settings.language);
      }),
    );
    this.sub.add(
      this.langSvc.languages$.subscribe((list) => {
        this.languages = list;
        this.langSvc.applyDocumentLanguage(this.s.language);
      }),
    );
    this.langSvc.load();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get current(): ActiveLanguage | undefined {
    return this.langSvc.find(this.s.language);
  }

  isCurrent(code: string): boolean {
    return this.langSvc.isSame(code, this.s.language);
  }

  setLanguage(code: string): void {
    this.dashboardService.updateSettings({ language: code });
  }
}
