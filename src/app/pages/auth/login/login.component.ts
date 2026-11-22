import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

const REMEMBER_USER_KEY = 'core_remember_user';
const REMEMBER_TENANT_KEY = 'core_remember_tenant';
const REMEMBER_FLAG_KEY = 'core_remember_flag';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  showPassword = false;
  showTenant = false;
  loading = false;
  errorMessage: string | null = null;
  capsLockOn = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly auth: AuthService,
    private readonly translate: TranslateService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn) {
      this.router.navigateByUrl(this.returnUrl);
      return;
    }

    const remember = localStorage.getItem(REMEMBER_FLAG_KEY) !== 'false';
    const savedUser = remember ? (localStorage.getItem(REMEMBER_USER_KEY) ?? '') : '';
    const savedTenant = remember ? (localStorage.getItem(REMEMBER_TENANT_KEY) ?? '') : '';
    this.showTenant = !!savedTenant;

    this.form = this.fb.nonNullable.group({
      tenantCode: [savedTenant, [Validators.maxLength(50)]],
      username: [savedUser, [Validators.required, Validators.maxLength(255)]],
      password: ['', [Validators.required]],
      remember: [remember],
    });
  }

  get returnUrl(): string {
    const url = this.route.snapshot.queryParamMap.get('returnUrl');
    return url && url.startsWith('/') && !url.startsWith('/auth') ? url : '/';
  }

  isInvalid(control: string): boolean {
    const c = this.form.get(control);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  toggleTenant(): void {
    this.showTenant = !this.showTenant;
    if (!this.showTenant) {
      this.form.patchValue({ tenantCode: '' });
    }
  }

  onPasswordKey(event: KeyboardEvent): void {
    this.capsLockOn = event.getModifierState?.('CapsLock') ?? false;
  }

  onSubmit(): void {
    this.errorMessage = null;
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c) => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      return;
    }

    const { tenantCode, username, password, remember } = this.form.getRawValue();
    this.loading = true;
    this.form.disable();

    this.auth
      .login({ username: username.trim(), password, tenantCode: tenantCode?.trim() || null }, remember)
      .subscribe({
        next: (res) => {
          this.persistRemember(remember, username.trim(), tenantCode?.trim() ?? '');
          this.loading = false;
          if (res.mustChangePassword) {
            this.router.navigateByUrl('/auth/change-password');
          } else {
            this.router.navigateByUrl(this.returnUrl);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.form.enable();
          this.form.patchValue({ password: '' });
          this.errorMessage = this.resolveError(err);
          this.cdr.markForCheck();
        },
      });
  }

  private persistRemember(remember: boolean, username: string, tenantCode: string): void {
    localStorage.setItem(REMEMBER_FLAG_KEY, String(remember));
    if (remember) {
      localStorage.setItem(REMEMBER_USER_KEY, username);
      if (tenantCode) localStorage.setItem(REMEMBER_TENANT_KEY, tenantCode);
      else localStorage.removeItem(REMEMBER_TENANT_KEY);
    } else {
      localStorage.removeItem(REMEMBER_USER_KEY);
      localStorage.removeItem(REMEMBER_TENANT_KEY);
    }
  }

  private resolveError(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return this.translate.instant('auth.serverUnavailable');
    }
    const message = err.error?.message;
    if (typeof message === 'string' && message) {
      return message;
    }
    if (err.status === 401) return this.translate.instant('auth.invalidCredentials');
    return this.translate.instant('auth.requestFailed');
  }
}
