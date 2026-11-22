import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/** Các API xác thực không được tự động refresh token khi bị 401. */
const AUTH_URLS = ['/auth/login', '/auth/refresh', '/auth/logout'];

/**
 * Gắn Bearer token vào request; khi gặp 401 thì dùng refresh token lấy access token mới (chỉ một lần
 * cho nhiều request đồng thời) rồi gửi lại request. Refresh thất bại -> xóa phiên và về trang đăng nhập.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private readonly refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.token;
    const authReq = token && !req.url.includes('/i18n/') ? this.addTokenHeader(req, token) : req;

    return next.handle(authReq).pipe(
      catchError((error: unknown) => {
        if (
          error instanceof HttpErrorResponse &&
          error.status === 401 &&
          !AUTH_URLS.some((url) => req.url.includes(url))
        ) {
          return this.handle401Error(req, next);
        }
        return throwError(() => error);
      }),
    );
  }

  private handle401Error(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    const refreshToken = this.authService.refreshToken;
    if (!refreshToken) {
      this.redirectToLogin();
      return throwError(() => new HttpErrorResponse({ status: 401 }));
    }

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshTokens(refreshToken).pipe(
        switchMap((res) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(res.accessToken);
          return next.handle(this.addTokenHeader(request, res.accessToken));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.redirectToLogin();
          return throwError(() => err);
        }),
      );
    }

    return this.refreshTokenSubject.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap((token) => next.handle(this.addTokenHeader(request, token))),
    );
  }

  private redirectToLogin(): void {
    this.authService.clearSession();
    if (!this.router.url.startsWith('/auth')) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
    }
  }

  private addTokenHeader(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
}
