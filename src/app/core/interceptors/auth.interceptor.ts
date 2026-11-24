import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, shareReplay, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/** API xác thực: không gắn token cũ, không tự làm mới token khi bị 401. */
const AUTH_URLS = ['/auth/login', '/auth/refresh'];

/**
 * Gắn Bearer token cho request tới API của hệ thống (không gửi token sang domain khác).
 *  - Access token đã hết hạn -> làm mới trước rồi mới gửi request.
 *  - Bị 401 -> làm mới token (một lần cho mọi request đồng thời) rồi gửi lại request.
 *  - Làm mới thất bại -> xóa phiên, về trang đăng nhập (kèm returnUrl).
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private refresh$: Observable<string> | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.isApiRequest(req) || this.isAuthRequest(req)) {
      return next.handle(req);
    }

    const token = this.authService.token;
    if (!token) {
      return next.handle(req);
    }

    if (this.authService.isAccessTokenExpired) {
      return this.refreshAccessToken(token).pipe(
        switchMap((fresh) => this.sendWithRetry(req, next, fresh)),
      );
    }

    return this.sendWithRetry(req, next, token);
  }

  private sendWithRetry(
    req: HttpRequest<unknown>,
    next: HttpHandler,
    token: string,
  ): Observable<HttpEvent<unknown>> {
    return next.handle(this.withToken(req, token)).pipe(
      catchError((error: unknown) => {
        if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
          return throwError(() => error);
        }
        return this.refreshAccessToken(token).pipe(
          switchMap((fresh) => next.handle(this.withToken(req, fresh))),
        );
      }),
    );
  }

  /** Dùng chung một lần làm mới cho mọi request đang chờ. */
  private refreshAccessToken(staleToken: string): Observable<string> {
    if (!this.authService.refreshToken) {
      this.redirectToLogin();
      return throwError(() => new HttpErrorResponse({ status: 401, error: { code: 'AUTH_UNAUTHORIZED' } }));
    }

    if (!this.refresh$) {
      this.refresh$ = this.authService.refreshSession(staleToken).pipe(
        catchError((err) => {
          this.redirectToLogin();
          return throwError(() => err);
        }),
        finalize(() => (this.refresh$ = null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.refresh$;
  }

  private redirectToLogin(): void {
    this.authService.clearSession();
    const url = this.router.url;
    if (!url.startsWith('/auth')) {
      this.router.navigate(['/auth/login'], {
        queryParams: url && url !== '/' ? { returnUrl: url } : {},
      });
    }
  }

  private isApiRequest(req: HttpRequest<unknown>): boolean {
    return req.url.startsWith(environment.apiUrl);
  }

  private isAuthRequest(req: HttpRequest<unknown>): boolean {
    return AUTH_URLS.some((url) => req.url.includes(url));
  }

  private withToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
}
