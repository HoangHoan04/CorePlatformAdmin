import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, firstValueFrom, from, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import {
  AuthResponse,
  ChangePasswordRequest,
  CurrentUser,
  LoginRequest,
} from '../models/auth.models';
import { ApiService } from './api.service';
import { PermissionService } from './permission.service';

interface StoredSession {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  mustChangePassword: boolean;
  user: CurrentUser;
}

/** Làm mới access token sớm hơn hạn thật một chút để tránh request bị 401 giữa chừng. */
const ACCESS_TOKEN_SKEW_MS = 30_000;
const REFRESH_LOCK = 'core_auth_refresh';

/**
 * Quản lý phiên đăng nhập: access token (JWT ngắn hạn) + refresh token (xoay vòng, dùng một lần).
 *  - "Ghi nhớ đăng nhập" -> localStorage (giữ qua lần mở trình duyệt sau); ngược lại -> sessionStorage.
 *  - Nhiều tab dùng chung localStorage: việc làm mới token được khóa (Web Locks) để chỉ một tab gọi refresh,
 *    tab khác dùng lại token mới — tránh server phát hiện "tái sử dụng refresh token" và thu hồi cả phiên.
 *  - Đăng xuất ở một tab -> các tab khác cũng về trang đăng nhập.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'core_auth_session';

  private session: StoredSession | null;
  private readonly userSubject: BehaviorSubject<CurrentUser | null>;

  /** Người dùng hiện tại (null khi chưa đăng nhập). */
  readonly currentUser$: Observable<CurrentUser | null>;

  constructor(
    private readonly api: ApiService,
    private readonly permissionService: PermissionService,
    private readonly router: Router,
    private readonly zone: NgZone,
  ) {
    this.session = this.readSession();
    this.userSubject = new BehaviorSubject<CurrentUser | null>(this.session?.user ?? null);
    this.currentUser$ = this.userSubject.asObservable();
    if (this.session) {
      this.applyPermissions(this.session.user);
    }
    window.addEventListener('storage', (event) => this.onStorageChange(event));
  }

  /** Còn phiên hợp lệ (refresh token chưa hết hạn). Access token hết hạn sẽ được làm mới tự động. */
  get isLoggedIn(): boolean {
    if (!this.session) return false;
    return new Date(this.session.refreshTokenExpiresAt).getTime() > Date.now();
  }

  get token(): string | null {
    return this.session?.accessToken ?? null;
  }

  get refreshToken(): string | null {
    return this.session?.refreshToken ?? null;
  }

  get currentUser(): CurrentUser | null {
    return this.userSubject.value;
  }

  /** Tài khoản bắt buộc đổi mật khẩu trước khi dùng hệ thống (users.must_change_password). */
  get mustChangePassword(): boolean {
    return !!this.session?.mustChangePassword;
  }

  /** Access token đã (hoặc sắp) hết hạn. */
  get isAccessTokenExpired(): boolean {
    if (!this.session) return true;
    return new Date(this.session.accessTokenExpiresAt).getTime() - ACCESS_TOKEN_SKEW_MS <= Date.now();
  }

  login(request: LoginRequest, remember: boolean): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>(this.api.AUTH.LOGIN, {
        username: request.username,
        password: request.password,
        tenantCode: request.tenantCode || null,
      })
      .pipe(tap((res) => this.storeSession(res, remember)));
  }

  /**
   * Lấy access token mới bằng refresh token. `staleToken` là access token mà request vừa dùng:
   * nếu trong lúc chờ khóa, tab khác đã làm mới xong thì dùng luôn token đó thay vì gọi refresh lần nữa.
   */
  refreshSession(staleToken: string | null): Observable<string> {
    return from(
      this.withRefreshLock(async () => {
        this.reloadFromStorage();
        const current = this.session;
        if (!current) throw new Error('NO_SESSION');
        if (current.accessToken !== staleToken && !this.isAccessTokenExpired) {
          return current.accessToken;
        }
        const res = await firstValueFrom(
          this.api.post<AuthResponse>(this.api.AUTH.REFRESH, { refreshToken: current.refreshToken }),
        );
        this.storeSession(res, this.isRemembered());
        return res.accessToken;
      }),
    );
  }

  /** Lấy lại thông tin tài khoản + quyền từ server. */
  loadCurrentUser(): Observable<CurrentUser> {
    return this.api.get<CurrentUser>(this.api.AUTH.ME).pipe(
      tap((user) => {
        if (this.session) {
          this.session = { ...this.session, user };
          this.writeSession(this.session, this.isRemembered());
        }
        this.userSubject.next(user);
        this.applyPermissions(user);
      }),
    );
  }

  changePassword(body: ChangePasswordRequest): Observable<void> {
    return this.api.post<void>(this.api.AUTH.CHANGE_PASSWORD, body).pipe(
      tap(() => {
        if (this.session) {
          this.session = { ...this.session, mustChangePassword: false };
          this.writeSession(this.session, this.isRemembered());
        }
      }),
    );
  }

  /** Thu hồi phiên trên server (bỏ qua lỗi) rồi xóa phiên cục bộ. */
  logout(): Observable<void> {
    if (!this.token) {
      this.clearSession();
      return of(void 0);
    }
    return this.api.post<void>(this.api.AUTH.LOGOUT, {}).pipe(
      catchError(() => of(void 0)),
      map(() => void 0),
      tap(() => this.clearSession()),
    );
  }

  clearSession(): void {
    this.session = null;
    localStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.removeItem(this.STORAGE_KEY);
    this.permissionService.clear();
    this.userSubject.next(null);
  }

  private storeSession(res: AuthResponse, remember: boolean): void {
    this.session = {
      accessToken: res.accessToken,
      accessTokenExpiresAt: res.accessTokenExpiresAt,
      refreshToken: res.refreshToken,
      refreshTokenExpiresAt: res.refreshTokenExpiresAt,
      mustChangePassword: !!res.mustChangePassword,
      user: res.user,
    };
    this.writeSession(this.session, remember);
    this.userSubject.next(res.user);
    this.applyPermissions(res.user);
  }

  private applyPermissions(user: CurrentUser): void {
    this.permissionService.setAuthContext({
      roles: user.roles,
      permissions: user.permissions,
      isSuperAdmin: user.isPlatformAdmin,
    });
  }

  private isRemembered(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  /** Đồng bộ phiên mới nhất trong storage (tab khác có thể vừa làm mới token). */
  private reloadFromStorage(): void {
    const stored = this.readSession();
    if (stored) this.session = stored;
  }

  private onStorageChange(event: StorageEvent): void {
    if (event.storageArea !== localStorage || (event.key !== this.STORAGE_KEY && event.key !== null)) return;
    this.zone.run(() => {
      const stored = this.readSession();
      if (stored) {
        // Tab khác vừa làm mới token / đăng nhập lại
        this.session = stored;
        if (stored.user.id !== this.userSubject.value?.id) {
          this.userSubject.next(stored.user);
          this.applyPermissions(stored.user);
        }
        return;
      }
      // Tab khác đã đăng xuất (không còn phiên nào trong storage)
      if (this.session) {
        this.clearSession();
        if (!this.router.url.startsWith('/auth')) {
          this.router.navigate(['/auth/login']);
        }
      }
    });
  }

  private async withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
    const locks = (navigator as Navigator & { locks?: LockManager }).locks;
    if (!locks?.request) return task();
    return locks.request(REFRESH_LOCK, () => task()) as Promise<T>;
  }

  private writeSession(session: StoredSession, remember: boolean): void {
    const raw = JSON.stringify(session);
    if (remember) {
      localStorage.setItem(this.STORAGE_KEY, raw);
      sessionStorage.removeItem(this.STORAGE_KEY);
    } else {
      sessionStorage.setItem(this.STORAGE_KEY, raw);
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  private readSession(): StoredSession | null {
    try {
      const raw =
        localStorage.getItem(this.STORAGE_KEY) ?? sessionStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredSession;
      return parsed?.accessToken && parsed?.refreshToken && parsed?.user ? parsed : null;
    } catch {
      return null;
    }
  }
}
