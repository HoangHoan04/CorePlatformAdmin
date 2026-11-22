import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
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
  user: CurrentUser;
}

/**
 * Quản lý phiên đăng nhập: access token (JWT ngắn hạn) + refresh token (xoay vòng).
 * "Ghi nhớ đăng nhập" -> localStorage (giữ qua lần mở trình duyệt sau); ngược lại -> sessionStorage.
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
  ) {
    this.session = this.readSession();
    this.userSubject = new BehaviorSubject<CurrentUser | null>(this.session?.user ?? null);
    this.currentUser$ = this.userSubject.asObservable();
    if (this.session) {
      this.applyPermissions(this.session.user);
    }
  }

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

  login(request: LoginRequest, remember: boolean): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>(this.api.AUTH.LOGIN, {
        username: request.username,
        password: request.password,
        tenantCode: request.tenantCode || null,
      })
      .pipe(tap((res) => this.storeSession(res, remember)));
  }

  refreshTokens(refreshToken: string): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>(this.api.AUTH.REFRESH, { refreshToken })
      .pipe(tap((res) => this.storeSession(res, this.isRemembered())));
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
    return this.api.post<void>(this.api.AUTH.CHANGE_PASSWORD, body);
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
      type: user.userType,
    });
  }

  private isRemembered(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
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
