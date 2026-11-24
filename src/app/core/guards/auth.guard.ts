import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Trang quản trị chỉ vào được khi còn phiên đăng nhập hợp lệ (refresh token chưa hết hạn —
 * access token hết hạn sẽ được AuthInterceptor làm mới). Tài khoản phải đổi mật khẩu thì
 * bị chuyển sang màn hình đổi mật khẩu trước.
 */
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    if (!this.auth.isLoggedIn) {
      this.auth.clearSession();
      return this.router.createUrlTree(['/auth/login'], {
        queryParams: state.url && state.url !== '/' ? { returnUrl: state.url } : {},
      });
    }

    if (this.auth.mustChangePassword) {
      return this.router.createUrlTree(['/auth/change-password']);
    }

    return true;
  }
}
