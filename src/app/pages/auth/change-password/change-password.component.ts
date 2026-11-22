import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Đổi mật khẩu bắt buộc (users.must_change_password) ngay sau khi đăng nhập.
 */
@Component({
  standalone: false,
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
})
export class ChangePasswordComponent implements OnInit {
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  error = '';

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly message: NzMessageService,
    private readonly translate: TranslateService,
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn) {
      this.router.navigateByUrl('/auth/login');
    }
  }

  onSubmit(): void {
    this.error = '';

    if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
      this.error = this.translate.instant('auth.fillAllFields');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = this.translate.instant('auth.passwordMismatch');
      return;
    }

    this.loading = true;
    this.authService
      .changePassword({
        currentPassword: this.oldPassword,
        newPassword: this.newPassword,
        confirmNewPassword: this.confirmPassword,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.message.success(this.translate.instant('auth.changePasswordSuccess'));
          this.router.navigateByUrl('/');
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || this.translate.instant('auth.changePasswordFailed');
        },
      });
  }

  goBack(): void {
    this.authService.logout().subscribe(() => this.router.navigateByUrl('/auth/login'));
  }
}
