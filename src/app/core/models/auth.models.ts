export interface LoginRequest {
  username: string;
  password: string;
  tenantCode?: string | null;
}

export interface CurrentUser {
  id: string;
  username: string;
  fullName: string;
  displayName?: string | null;
  email?: string | null;
  jobTitle?: string | null;
  tenantId?: string | null;
  tenantCode?: string | null;
  tenantName?: string | null;
  userType: string;
  isPlatformAdmin: boolean;
  isTenantAdmin: boolean;
  lastLoginAt?: string | null;
  roles: string[];
  permissions: string[];
}

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  mustChangePassword: boolean;
  user: CurrentUser;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

/** Định dạng lỗi chuẩn của API: { code, message } */
export interface ApiError {
  code: string;
  message: string;
}
