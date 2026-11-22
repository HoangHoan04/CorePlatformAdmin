import { CurrentUser } from '@/app/core/models';
import {
  AuthService,
  DashboardService,
  DashboardSettings,
  SidebarService,
} from '@/app/core/services';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  s: DashboardSettings;
  collapsed = false;
  user: CurrentUser | null = null;
  private readonly sub = new Subscription();

  changePasswordVisible = false;
  changePasswordLoading = false;
  changePasswordError = '';
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';

  constructor(
    private readonly sidebarService: SidebarService,
    private readonly dashboardService: DashboardService,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly message: NzMessageService,
    private readonly translate: TranslateService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.s = dashboardService.snapshot;
  }

  get displayName(): string {
    return this.user?.displayName || this.user?.fullName || this.user?.username || '';
  }

  get avatarText(): string {
    const name = (this.user?.fullName || this.user?.username || 'U').trim();
    const parts = name.split(/\s+/);
    const initials =
      parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.substring(0, 2);
    return initials.toUpperCase();
  }

  ngOnInit(): void {
    this.sub.add(this.sidebarService.collapsed$.subscribe((v) => (this.collapsed = v)));
    this.sub.add(this.dashboardService.settings$.subscribe((settings) => (this.s = settings)));
    this.sub.add(
      this.auth.currentUser$.subscribe((user) => {
        this.user = user;
        this.cdr.markForCheck();
      }),
    );
    // Đồng bộ lại vai trò/quyền mới nhất từ server
    this.auth.loadCurrentUser().subscribe({ error: () => undefined });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  openChangePasswordModal(): void {
    this.oldPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.changePasswordError = '';
    this.changePasswordVisible = true;
  }

  closeChangePasswordModal(): void {
    this.changePasswordVisible = false;
  }

  submitChangePassword(): void {
    this.changePasswordError = '';
    if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
      this.changePasswordError = this.translate.instant('auth.fillAllFields');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.changePasswordError = this.translate.instant('auth.passwordMismatch');
      return;
    }

    this.changePasswordLoading = true;
    this.auth
      .changePassword({
        currentPassword: this.oldPassword,
        newPassword: this.newPassword,
        confirmNewPassword: this.confirmPassword,
      })
      .subscribe({
        next: () => {
          this.changePasswordLoading = false;
          this.changePasswordVisible = false;
          this.message.success(this.translate.instant('auth.changePasswordSuccess'));
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.changePasswordLoading = false;
          this.changePasswordError =
            err?.error?.message || this.translate.instant('auth.changePasswordFailed');
          this.cdr.markForCheck();
        },
      });
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  openSettings(): void {
    this.dashboardService.setConfigOpen(true);
  }

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/auth/login'));
  }
}
