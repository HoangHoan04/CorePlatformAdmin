import { PERMISSION_CODES } from './permission-codes';

export interface RouteConfig {
  key: string;
  /** Nhãn mặc định (dùng khi API chưa có bản dịch cho translationKey) */
  label: string;
  translationKey: string;
  path: string;
  icon?: string;
  isShow?: boolean;
  permission?: string;
  children?: Record<string, RouteConfig>;
}

export interface SidebarMenuItem {
  key: string;
  label: string;
  translationKey: string;
  path: string;
  icon?: string;
  isShow?: boolean;
  permission?: string;
  children?: SidebarMenuItem[];
}

/**
 * Menu theo các phần của docs/base_erp_core.sql. Mỗi mục là một màn hình chức năng,
 * các bảng liên quan nằm chung màn hình dưới dạng tab.
 */
export const ROUTES_CONFIG: Record<string, RouteConfig> = {
  HOME: {
    key: 'HOME',
    label: 'Tổng quan',
    translationKey: 'routes.home',
    path: '/',
    icon: 'dashboard',
  },

  // ── 0. CORE — tiện ích ───────────────────────────────────────────────
  CORE: {
    key: 'CORE',
    label: 'Tiện ích hệ thống',
    translationKey: 'menu.core',
    path: '/core',
    icon: 'tool',
    children: {
      CORE_SYSTEM: {
        key: 'CORE_SYSTEM',
        label: 'Tình trạng hệ thống',
        translationKey: 'menu.core.system',
        path: '/core/system',
        icon: 'heart',
      },
      CORE_DATABASE: {
        key: 'CORE_DATABASE',
        label: 'Hàm & phân vùng dữ liệu',
        translationKey: 'menu.core.database',
        path: '/core/database',
        icon: 'database',
      },
    },
  },

  // ── 1. MDM — danh mục dùng chung ─────────────────────────────────────
  MDM: {
    key: 'MDM',
    label: 'Danh mục dùng chung',
    translationKey: 'menu.mdm',
    path: '/mdm',
    icon: 'appstore',
    children: {
      MDM_GEOGRAPHY: {
        key: 'MDM_GEOGRAPHY',
        label: 'Quốc gia & địa giới hành chính',
        translationKey: 'menu.mdm.geography',
        path: '/mdm/geography',
        icon: 'global',
        children: {
          COUNTRIES: {
            key: 'countries',
            label: 'Quốc gia',
            translationKey: 'menu.mdm.geography.countries',
            path: '/mdm/geography/countries',
            permission: PERMISSION_CODES.MDM_COUNTRY_VIEW,
          },
          ADMINISTRATIVE_UNITS: {
            key: 'administrative_units',
            label: 'Đơn vị hành chính',
            translationKey: 'menu.mdm.geography.administrative_units',
            path: '/mdm/geography/administrative_units',
            permission: PERMISSION_CODES.MDM_ADMIN_UNIT_VIEW,
          },
          UNIT_MERGE_MAPPINGS: {
            key: 'administrative_unit_mappings',
            label: 'Ánh xạ sáp nhập',
            translationKey: 'menu.mdm.geography.administrative_unit_mappings',
            path: '/mdm/geography/administrative_unit_mappings',
            permission: PERMISSION_CODES.MDM_ADMIN_UNIT_MAPPING_VIEW,
          },
        },
      },
      MDM_CURRENCY: {
        key: 'MDM_CURRENCY',
        label: 'Tiền tệ & ngân hàng',
        translationKey: 'menu.mdm.currency',
        path: '/mdm/currency',
        icon: 'dollar',
        children: {
          CURRENCIES: {
            key: 'currencies',
            label: 'Tiền tệ',
            translationKey: 'menu.mdm.currency.currencies',
            path: '/mdm/currency/currencies',
            permission: PERMISSION_CODES.MDM_CURRENCY_VIEW,
          },
          EXCHANGE_RATES: {
            key: 'exchange_rates',
            label: 'Tỷ giá',
            translationKey: 'menu.mdm.currency.exchange_rates',
            path: '/mdm/currency/exchange_rates',
            permission: PERMISSION_CODES.MDM_EXCHANGE_RATE_VIEW,
          },
          BANKS: {
            key: 'banks',
            label: 'Ngân hàng',
            translationKey: 'menu.mdm.currency.banks',
            path: '/mdm/currency/banks',
            permission: PERMISSION_CODES.MDM_BANK_VIEW,
          },
        },
      },
      MDM_TAX: {
        key: 'MDM_TAX',
        label: 'Thuế',
        translationKey: 'menu.mdm.tax',
        path: '/mdm/tax',
        icon: 'percentage',
        children: {
          TAX_TYPES: {
            key: 'tax_types',
            label: 'Loại thuế',
            translationKey: 'menu.mdm.tax.tax_types',
            path: '/mdm/tax/tax_types',
          },
          TAX_RATES: {
            key: 'tax_rates',
            label: 'Thuế suất',
            translationKey: 'menu.mdm.tax.tax_rates',
            path: '/mdm/tax/tax_rates',
          },
        },
      },
      MDM_UOM: {
        key: 'MDM_UOM',
        label: 'Đơn vị tính',
        translationKey: 'menu.mdm.uom',
        path: '/mdm/uom',
        icon: 'column-width',
        children: {
          UOM_CATEGORIES: {
            key: 'uom_categories',
            label: 'Nhóm đơn vị tính',
            translationKey: 'menu.mdm.uom.uom_categories',
            path: '/mdm/uom/uom_categories',
          },
          UOMS: {
            key: 'uoms',
            label: 'Đơn vị tính',
            translationKey: 'menu.mdm.uom.uoms',
            path: '/mdm/uom/uoms',
          },
          UOM_CONVERSIONS: {
            key: 'uom_conversions',
            label: 'Quy đổi',
            translationKey: 'menu.mdm.uom.uom_conversions',
            path: '/mdm/uom/uom_conversions',
          },
        },
      },
      MDM_CALENDAR: {
        key: 'MDM_CALENDAR',
        label: 'Lịch làm việc & ngày lễ',
        translationKey: 'menu.mdm.calendar',
        path: '/mdm/calendar',
        icon: 'calendar',
        children: {
          WORK_CALENDARS: {
            key: 'work_calendars',
            label: 'Lịch làm việc',
            translationKey: 'menu.mdm.calendar.work_calendars',
            path: '/mdm/calendar/work_calendars',
          },
          WORK_CALENDAR_WEEKDAYS: {
            key: 'work_calendar_weekdays',
            label: 'Ngày trong tuần',
            translationKey: 'menu.mdm.calendar.work_calendar_weekdays',
            path: '/mdm/calendar/work_calendar_weekdays',
          },
          WORK_CALENDAR_EXCEPTIONS: {
            key: 'work_calendar_exceptions',
            label: 'Ngày ngoại lệ',
            translationKey: 'menu.mdm.calendar.work_calendar_exceptions',
            path: '/mdm/calendar/work_calendar_exceptions',
          },
          HOLIDAYS: {
            key: 'holidays',
            label: 'Ngày lễ',
            translationKey: 'menu.mdm.calendar.holidays',
            path: '/mdm/calendar/holidays',
          },
        },
      },
      MDM_NUMBERING: {
        key: 'MDM_NUMBERING',
        label: 'Chứng từ & quy tắc sinh mã',
        translationKey: 'menu.mdm.numbering',
        path: '/mdm/numbering',
        icon: 'field-number',
        children: {
          DOCUMENT_TYPES: {
            key: 'document_types',
            label: 'Loại chứng từ',
            translationKey: 'menu.mdm.numbering.document_types',
            path: '/mdm/numbering/document_types',
          },
          NUMBERING_RULES: {
            key: 'numbering_rules',
            label: 'Quy tắc sinh mã',
            translationKey: 'menu.mdm.numbering.numbering_rules',
            path: '/mdm/numbering/numbering_rules',
          },
          NUMBERING_COUNTERS: {
            key: 'numbering_counters',
            label: 'Bộ đếm',
            translationKey: 'menu.mdm.numbering.numbering_counters',
            path: '/mdm/numbering/numbering_counters',
          },
        },
      },
    },
  },

  // ── 2. ORG — cấu trúc tổ chức ────────────────────────────────────────
  ORG: {
    key: 'ORG',
    label: 'Tổ chức',
    translationKey: 'menu.org',
    path: '/org',
    icon: 'apartment',
    children: {
      ORG_TENANTS: {
        key: 'ORG_TENANTS',
        label: 'Đơn vị thuê bao (Tenant)',
        translationKey: 'menu.org.tenants',
        path: '/org/tenants',
        icon: 'cluster',
        children: {
          TENANTS: {
            key: 'tenants',
            label: 'Tenant',
            translationKey: 'menu.org.tenants.tenants',
            path: '/org/tenants/tenants',
          },
          TENANT_MODULES: {
            key: 'tenant_modules',
            label: 'Phân hệ đăng ký',
            translationKey: 'menu.org.tenants.tenant_modules',
            path: '/org/tenants/tenant_modules',
          },
        },
      },
      ORG_STRUCTURE: {
        key: 'ORG_STRUCTURE',
        label: 'Cơ cấu tổ chức',
        translationKey: 'menu.org.structure',
        path: '/org/structure',
        icon: 'partition',
        children: {
          COMPANIES: {
            key: 'companies',
            label: 'Công ty',
            translationKey: 'menu.org.structure.companies',
            path: '/org/structure/companies',
          },
          BRANCHES: {
            key: 'branches',
            label: 'Chi nhánh',
            translationKey: 'menu.org.structure.branches',
            path: '/org/structure/branches',
          },
          DEPARTMENTS: {
            key: 'departments',
            label: 'Phòng ban',
            translationKey: 'menu.org.structure.departments',
            path: '/org/structure/departments',
          },
        },
      },
    },
  },

  // ── 3. IAM — tài khoản, xác thực, phân quyền ─────────────────────────
  IAM: {
    key: 'IAM',
    label: 'Tài khoản & phân quyền',
    translationKey: 'menu.iam',
    path: '/iam',
    icon: 'safety-certificate',
    children: {
      IAM_USERS: {
        key: 'IAM_USERS',
        label: 'Người dùng',
        translationKey: 'menu.iam.users',
        path: '/iam/users',
        icon: 'user',
        children: {
          USERS: {
            key: 'users',
            label: 'Tài khoản',
            translationKey: 'menu.iam.users.users',
            path: '/iam/users/users',
          },
          USER_ORG_ASSIGNMENTS: {
            key: 'user_org_assignments',
            label: 'Phân công tổ chức',
            translationKey: 'menu.iam.users.user_org_assignments',
            path: '/iam/users/user_org_assignments',
          },
          USER_ROLES: {
            key: 'user_roles',
            label: 'Vai trò được gán',
            translationKey: 'menu.iam.users.user_roles',
            path: '/iam/users/user_roles',
          },
          USER_PERMISSION_OVERRIDES: {
            key: 'user_permission_overrides',
            label: 'Quyền ngoại lệ',
            translationKey: 'menu.iam.users.user_permission_overrides',
            path: '/iam/users/user_permission_overrides',
          },
          USER_EXTERNAL_LOGINS: {
            key: 'user_external_logins',
            label: 'Đăng nhập liên kết',
            translationKey: 'menu.iam.users.user_external_logins',
            path: '/iam/users/user_external_logins',
          },
        },
      },
      IAM_ROLES: {
        key: 'IAM_ROLES',
        label: 'Vai trò & phân quyền',
        translationKey: 'menu.iam.roles',
        path: '/iam/roles',
        icon: 'team',
        children: {
          ROLES: {
            key: 'roles',
            label: 'Vai trò',
            translationKey: 'menu.iam.roles.roles',
            path: '/iam/roles/roles',
          },
          ROLE_PERMISSIONS: {
            key: 'role_permissions',
            label: 'Quyền của vai trò',
            translationKey: 'menu.iam.roles.role_permissions',
            path: '/iam/roles/role_permissions',
          },
          ROLE_PERMISSION_SCOPES: {
            key: 'role_permission_scopes',
            label: 'Phạm vi dữ liệu',
            translationKey: 'menu.iam.roles.role_permission_scopes',
            path: '/iam/roles/role_permission_scopes',
          },
        },
      },
      IAM_PERMISSIONS: {
        key: 'IAM_PERMISSIONS',
        label: 'Phân hệ & danh mục quyền',
        translationKey: 'menu.iam.permissions',
        path: '/iam/permissions',
        icon: 'key',
        children: {
          MODULES: {
            key: 'modules',
            label: 'Phân hệ',
            translationKey: 'menu.iam.permissions.modules',
            path: '/iam/permissions/modules',
          },
          RESOURCES: {
            key: 'resources',
            label: 'Chức năng',
            translationKey: 'menu.iam.permissions.resources',
            path: '/iam/permissions/resources',
          },
          PERMISSION_ACTIONS: {
            key: 'permission_actions',
            label: 'Hành động',
            translationKey: 'menu.iam.permissions.permission_actions',
            path: '/iam/permissions/permission_actions',
          },
          PERMISSIONS: {
            key: 'permissions',
            label: 'Quyền',
            translationKey: 'menu.iam.permissions.permissions',
            path: '/iam/permissions/permissions',
          },
        },
      },
      IAM_SECURITY_POLICIES: {
        key: 'IAM_SECURITY_POLICIES',
        label: 'Chính sách bảo mật',
        translationKey: 'menu.iam.securityPolicies',
        path: '/iam/security-policies',
        icon: 'lock',
        children: {
          SECURITY_POLICIES: {
            key: 'security_policies',
            label: 'Chính sách',
            translationKey: 'menu.iam.securityPolicies.security_policies',
            path: '/iam/security-policies/security_policies',
          },
        },
      },
      IAM_CLIENTS: {
        key: 'IAM_CLIENTS',
        label: 'Ứng dụng & SSO',
        translationKey: 'menu.iam.clients',
        path: '/iam/clients',
        icon: 'api',
        children: {
          OAUTH_CLIENTS: {
            key: 'oauth_clients',
            label: 'Ứng dụng (OAuth client)',
            translationKey: 'menu.iam.clients.oauth_clients',
            path: '/iam/clients/oauth_clients',
          },
          API_SCOPES: {
            key: 'api_scopes',
            label: 'API scope',
            translationKey: 'menu.iam.clients.api_scopes',
            path: '/iam/clients/api_scopes',
          },
          SIGNING_KEYS: {
            key: 'signing_keys',
            label: 'Khóa ký token',
            translationKey: 'menu.iam.clients.signing_keys',
            path: '/iam/clients/signing_keys',
          },
        },
      },
      IAM_SESSIONS: {
        key: 'IAM_SESSIONS',
        label: 'Phiên đăng nhập & thiết bị',
        translationKey: 'menu.iam.sessions',
        path: '/iam/sessions',
        icon: 'desktop',
        children: {
          USER_SESSIONS: {
            key: 'user_sessions',
            label: 'Phiên đăng nhập',
            translationKey: 'menu.iam.sessions.user_sessions',
            path: '/iam/sessions/user_sessions',
          },
          USER_DEVICES: {
            key: 'user_devices',
            label: 'Thiết bị',
            translationKey: 'menu.iam.sessions.user_devices',
            path: '/iam/sessions/user_devices',
          },
          REFRESH_TOKENS: {
            key: 'refresh_tokens',
            label: 'Refresh token',
            translationKey: 'menu.iam.sessions.refresh_tokens',
            path: '/iam/sessions/refresh_tokens',
          },
          REVOKED_ACCESS_TOKENS: {
            key: 'revoked_access_tokens',
            label: 'Token đã thu hồi',
            translationKey: 'menu.iam.sessions.revoked_access_tokens',
            path: '/iam/sessions/revoked_access_tokens',
          },
        },
      },
      IAM_CREDENTIALS: {
        key: 'IAM_CREDENTIALS',
        label: 'Xác thực & khôi phục',
        translationKey: 'menu.iam.credentials',
        path: '/iam/credentials',
        icon: 'safety',
        children: {
          VERIFICATION_TOKENS: {
            key: 'verification_tokens',
            label: 'Mã xác thực',
            translationKey: 'menu.iam.credentials.verification_tokens',
            path: '/iam/credentials/verification_tokens',
          },
          USER_RECOVERY_CODES: {
            key: 'user_recovery_codes',
            label: 'Mã khôi phục 2FA',
            translationKey: 'menu.iam.credentials.user_recovery_codes',
            path: '/iam/credentials/user_recovery_codes',
          },
          PASSWORD_HISTORIES: {
            key: 'password_histories',
            label: 'Lịch sử mật khẩu',
            translationKey: 'menu.iam.credentials.password_histories',
            path: '/iam/credentials/password_histories',
          },
        },
      },
    },
  },

  // ── 4. STORAGE — lưu trữ file ────────────────────────────────────────
  STORAGE: {
    key: 'STORAGE',
    label: 'Lưu trữ file',
    translationKey: 'menu.storage',
    path: '/storage',
    icon: 'cloud',
    children: {
      STORAGE_CONFIG: {
        key: 'STORAGE_CONFIG',
        label: 'Cấu hình lưu trữ',
        translationKey: 'menu.storage.config',
        path: '/storage/config',
        icon: 'cloud-server',
        children: {
          STORAGE_PROVIDERS: {
            key: 'storage_providers',
            label: 'Nhà cung cấp',
            translationKey: 'menu.storage.config.providers',
            path: '/storage/config/providers',
          },
          BUCKETS: {
            key: 'buckets',
            label: 'Bucket',
            translationKey: 'menu.storage.config.buckets',
            path: '/storage/config/buckets',
          },
          UPLOAD_POLICIES: {
            key: 'upload_policies',
            label: 'Chính sách upload',
            translationKey: 'menu.storage.config.upload_policies',
            path: '/storage/config/upload_policies',
          },
        },
      },
      STORAGE_FILES: {
        key: 'STORAGE_FILES',
        label: 'Quản lý file',
        translationKey: 'menu.storage.files',
        path: '/storage/files',
        icon: 'file',
        children: {
          FILES: {
            key: 'files',
            label: 'File',
            translationKey: 'menu.storage.files.files',
            path: '/storage/files/files',
          },
          FILE_VARIANTS: {
            key: 'file_variants',
            label: 'Biến thể ảnh',
            translationKey: 'menu.storage.files.file_variants',
            path: '/storage/files/file_variants',
          },
          FILE_SHARE_LINKS: {
            key: 'file_share_links',
            label: 'Link chia sẻ',
            translationKey: 'menu.storage.files.file_share_links',
            path: '/storage/files/file_share_links',
          },
          FILE_ACCESS_LOGS: {
            key: 'file_access_logs',
            label: 'Nhật ký truy cập',
            translationKey: 'menu.storage.files.file_access_logs',
            path: '/storage/files/file_access_logs',
          },
        },
      },
    },
  },

  // ── 5. NOTIFY — thông báo ────────────────────────────────────────────
  NOTIFY: {
    key: 'NOTIFY',
    label: 'Thông báo',
    translationKey: 'menu.notify',
    path: '/notify',
    icon: 'notification',
    children: {
      NOTIFY_TEMPLATES: {
        key: 'NOTIFY_TEMPLATES',
        label: 'Sự kiện & mẫu thông báo',
        translationKey: 'menu.notify.templates',
        path: '/notify/templates',
        icon: 'layout',
        children: {
          NOTIFY_EVENT_TYPES: {
            key: 'notify_event_types',
            label: 'Loại sự kiện',
            translationKey: 'menu.notify.templates.event_types',
            path: '/notify/templates/event_types',
          },
          TEMPLATES: {
            key: 'templates',
            label: 'Mẫu thông báo',
            translationKey: 'menu.notify.templates.templates',
            path: '/notify/templates/templates',
          },
        },
      },
      NOTIFY_CHANNELS: {
        key: 'NOTIFY_CHANNELS',
        label: 'Kênh gửi',
        translationKey: 'menu.notify.channels',
        path: '/notify/channels',
        icon: 'send',
        children: {
          SMTP_CONFIGS: {
            key: 'smtp_configs',
            label: 'Email (SMTP)',
            translationKey: 'menu.notify.channels.smtp_configs',
            path: '/notify/channels/smtp_configs',
          },
          PUSH_CONFIGS: {
            key: 'push_configs',
            label: 'Push (FCM/APNs)',
            translationKey: 'menu.notify.channels.push_configs',
            path: '/notify/channels/push_configs',
          },
          DEVICE_TOKENS: {
            key: 'device_tokens',
            label: 'Device token',
            translationKey: 'menu.notify.channels.device_tokens',
            path: '/notify/channels/device_tokens',
          },
        },
      },
      NOTIFY_HISTORY: {
        key: 'NOTIFY_HISTORY',
        label: 'Lịch sử thông báo',
        translationKey: 'menu.notify.history',
        path: '/notify/history',
        icon: 'history',
        children: {
          NOTIFICATIONS: {
            key: 'notifications',
            label: 'Thông báo',
            translationKey: 'menu.notify.history.notifications',
            path: '/notify/history/notifications',
          },
          USER_NOTIFICATIONS: {
            key: 'user_notifications',
            label: 'Hộp thư người dùng',
            translationKey: 'menu.notify.history.user_notifications',
            path: '/notify/history/user_notifications',
          },
          DELIVERIES: {
            key: 'deliveries',
            label: 'Lượt gửi',
            translationKey: 'menu.notify.history.deliveries',
            path: '/notify/history/deliveries',
          },
          DELIVERY_ATTACHMENTS: {
            key: 'delivery_attachments',
            label: 'File đính kèm',
            translationKey: 'menu.notify.history.delivery_attachments',
            path: '/notify/history/delivery_attachments',
          },
          USER_PREFERENCES: {
            key: 'user_preferences',
            label: 'Tùy chọn nhận',
            translationKey: 'menu.notify.history.user_preferences',
            path: '/notify/history/user_preferences',
          },
        },
      },
    },
  },

  // ── 6. WORKFLOW — quy trình phê duyệt ────────────────────────────────
  WORKFLOW: {
    key: 'WORKFLOW',
    label: 'Quy trình phê duyệt',
    translationKey: 'menu.workflow',
    path: '/workflow',
    icon: 'deployment-unit',
    children: {
      WORKFLOW_DESIGN: {
        key: 'WORKFLOW_DESIGN',
        label: 'Thiết kế quy trình',
        translationKey: 'menu.workflow.design',
        path: '/workflow/design',
        icon: 'apartment',
        children: {
          WORKFLOW_DEFINITIONS: {
            key: 'workflow_definitions',
            label: 'Quy trình',
            translationKey: 'menu.workflow.design.definitions',
            path: '/workflow/design/definitions',
          },
          DEFINITION_VERSIONS: {
            key: 'definition_versions',
            label: 'Phiên bản',
            translationKey: 'menu.workflow.design.definition_versions',
            path: '/workflow/design/definition_versions',
          },
          STEPS: {
            key: 'steps',
            label: 'Bước duyệt',
            translationKey: 'menu.workflow.design.steps',
            path: '/workflow/design/steps',
          },
          STEP_APPROVERS: {
            key: 'step_approvers',
            label: 'Người duyệt',
            translationKey: 'menu.workflow.design.step_approvers',
            path: '/workflow/design/step_approvers',
          },
          TRANSITIONS: {
            key: 'transitions',
            label: 'Rẽ nhánh',
            translationKey: 'menu.workflow.design.transitions',
            path: '/workflow/design/transitions',
          },
        },
      },
      WORKFLOW_RUNTIME: {
        key: 'WORKFLOW_RUNTIME',
        label: 'Phiếu & công việc duyệt',
        translationKey: 'menu.workflow.runtime',
        path: '/workflow/runtime',
        icon: 'check-circle',
        children: {
          INSTANCES: {
            key: 'instances',
            label: 'Phiếu duyệt',
            translationKey: 'menu.workflow.runtime.instances',
            path: '/workflow/runtime/instances',
          },
          INSTANCE_STEPS: {
            key: 'instance_steps',
            label: 'Tiến trình bước',
            translationKey: 'menu.workflow.runtime.instance_steps',
            path: '/workflow/runtime/instance_steps',
          },
          TASKS: {
            key: 'tasks',
            label: 'Công việc',
            translationKey: 'menu.workflow.runtime.tasks',
            path: '/workflow/runtime/tasks',
          },
          ACTION_LOGS: {
            key: 'action_logs',
            label: 'Lịch sử thao tác',
            translationKey: 'menu.workflow.runtime.action_logs',
            path: '/workflow/runtime/action_logs',
          },
        },
      },
      WORKFLOW_DELEGATIONS: {
        key: 'WORKFLOW_DELEGATIONS',
        label: 'Ủy quyền duyệt',
        translationKey: 'menu.workflow.delegations',
        path: '/workflow/delegations',
        icon: 'swap',
        children: {
          DELEGATIONS: {
            key: 'delegations',
            label: 'Ủy quyền',
            translationKey: 'menu.workflow.delegations.delegations',
            path: '/workflow/delegations/delegations',
          },
        },
      },
    },
  },

  // ── 7. INTEGRATION — tích hợp ────────────────────────────────────────
  INTEGRATION: {
    key: 'INTEGRATION',
    label: 'Tích hợp',
    translationKey: 'menu.integration',
    path: '/integration',
    icon: 'api',
    children: {
      INTEGRATION_EVENTS: {
        key: 'INTEGRATION_EVENTS',
        label: 'Event bus',
        translationKey: 'menu.integration.events',
        path: '/integration/events',
        icon: 'thunderbolt',
        children: {
          INTEGRATION_EVENT_TYPES: {
            key: 'integration_event_types',
            label: 'Loại sự kiện',
            translationKey: 'menu.integration.events.event_types',
            path: '/integration/events/event_types',
          },
          EVENT_SUBSCRIPTIONS: {
            key: 'event_subscriptions',
            label: 'Đăng ký nhận',
            translationKey: 'menu.integration.events.event_subscriptions',
            path: '/integration/events/event_subscriptions',
          },
          OUTBOX_MESSAGES: {
            key: 'outbox_messages',
            label: 'Outbox',
            translationKey: 'menu.integration.events.outbox_messages',
            path: '/integration/events/outbox_messages',
          },
          INBOX_MESSAGES: {
            key: 'inbox_messages',
            label: 'Inbox',
            translationKey: 'menu.integration.events.inbox_messages',
            path: '/integration/events/inbox_messages',
          },
        },
      },
      INTEGRATION_WEBHOOKS: {
        key: 'INTEGRATION_WEBHOOKS',
        label: 'Webhook',
        translationKey: 'menu.integration.webhooks',
        path: '/integration/webhooks',
        icon: 'link',
        children: {
          WEBHOOK_ENDPOINTS: {
            key: 'webhook_endpoints',
            label: 'Webhook gửi đi',
            translationKey: 'menu.integration.webhooks.webhook_endpoints',
            path: '/integration/webhooks/webhook_endpoints',
          },
          WEBHOOK_DELIVERIES: {
            key: 'webhook_deliveries',
            label: 'Lịch sử gửi',
            translationKey: 'menu.integration.webhooks.webhook_deliveries',
            path: '/integration/webhooks/webhook_deliveries',
          },
          INBOUND_SOURCES: {
            key: 'inbound_sources',
            label: 'Nguồn nhận vào',
            translationKey: 'menu.integration.webhooks.inbound_sources',
            path: '/integration/webhooks/inbound_sources',
          },
          INBOUND_REQUESTS: {
            key: 'inbound_requests',
            label: 'Request nhận vào',
            translationKey: 'menu.integration.webhooks.inbound_requests',
            path: '/integration/webhooks/inbound_requests',
          },
        },
      },
      INTEGRATION_API_KEYS: {
        key: 'INTEGRATION_API_KEYS',
        label: 'API key',
        translationKey: 'menu.integration.apiKeys',
        path: '/integration/api-keys',
        icon: 'key',
        children: {
          API_KEYS: {
            key: 'api_keys',
            label: 'API key',
            translationKey: 'menu.integration.apiKeys.api_keys',
            path: '/integration/api-keys/api_keys',
          },
        },
      },
      INTEGRATION_CONNECTIONS: {
        key: 'INTEGRATION_CONNECTIONS',
        label: 'Kết nối bên thứ 3',
        translationKey: 'menu.integration.connections',
        path: '/integration/connections',
        icon: 'disconnect',
        children: {
          CONNECTIONS: {
            key: 'connections',
            label: 'Kết nối',
            translationKey: 'menu.integration.connections.connections',
            path: '/integration/connections/connections',
          },
          EXTERNAL_MAPPINGS: {
            key: 'external_mappings',
            label: 'Ánh xạ mã ngoài',
            translationKey: 'menu.integration.connections.external_mappings',
            path: '/integration/connections/external_mappings',
          },
        },
      },
    },
  },

  // ── 8. AI — AI Gateway ───────────────────────────────────────────────
  AI: {
    key: 'AI',
    label: 'AI Gateway',
    translationKey: 'menu.ai',
    path: '/ai',
    icon: 'robot',
    children: {
      AI_MODELS: {
        key: 'AI_MODELS',
        label: 'Nhà cung cấp & model',
        translationKey: 'menu.ai.models',
        path: '/ai/models',
        icon: 'experiment',
        children: {
          AI_PROVIDERS: {
            key: 'ai_providers',
            label: 'Nhà cung cấp',
            translationKey: 'menu.ai.models.providers',
            path: '/ai/models/providers',
          },
          PROVIDER_CREDENTIALS: {
            key: 'provider_credentials',
            label: 'Khóa truy cập',
            translationKey: 'menu.ai.models.provider_credentials',
            path: '/ai/models/provider_credentials',
          },
          MODELS: {
            key: 'models',
            label: 'Model',
            translationKey: 'menu.ai.models.models',
            path: '/ai/models/models',
          },
          MODEL_ALIASES: {
            key: 'model_aliases',
            label: 'Alias',
            translationKey: 'menu.ai.models.model_aliases',
            path: '/ai/models/model_aliases',
          },
          MODEL_ALIAS_TARGETS: {
            key: 'model_alias_targets',
            label: 'Model đích',
            translationKey: 'menu.ai.models.model_alias_targets',
            path: '/ai/models/model_alias_targets',
          },
        },
      },
      AI_PROMPTS: {
        key: 'AI_PROMPTS',
        label: 'Prompt & guardrail',
        translationKey: 'menu.ai.prompts',
        path: '/ai/prompts',
        icon: 'file-text',
        children: {
          PROMPT_TEMPLATES: {
            key: 'prompt_templates',
            label: 'Prompt',
            translationKey: 'menu.ai.prompts.prompt_templates',
            path: '/ai/prompts/prompt_templates',
          },
          PROMPT_VERSIONS: {
            key: 'prompt_versions',
            label: 'Phiên bản prompt',
            translationKey: 'menu.ai.prompts.prompt_versions',
            path: '/ai/prompts/prompt_versions',
          },
          GUARDRAIL_POLICIES: {
            key: 'guardrail_policies',
            label: 'Guardrail',
            translationKey: 'menu.ai.prompts.guardrail_policies',
            path: '/ai/prompts/guardrail_policies',
          },
          PROMPT_GUARDRAILS: {
            key: 'prompt_guardrails',
            label: 'Gắn guardrail',
            translationKey: 'menu.ai.prompts.prompt_guardrails',
            path: '/ai/prompts/prompt_guardrails',
          },
        },
      },
      AI_CLIENTS: {
        key: 'AI_CLIENTS',
        label: 'Client & hạn mức',
        translationKey: 'menu.ai.clients',
        path: '/ai/clients',
        icon: 'fund',
        children: {
          GATEWAY_CLIENTS: {
            key: 'gateway_clients',
            label: 'Client',
            translationKey: 'menu.ai.clients.gateway_clients',
            path: '/ai/clients/gateway_clients',
          },
          QUOTAS: {
            key: 'quotas',
            label: 'Hạn mức',
            translationKey: 'menu.ai.clients.quotas',
            path: '/ai/clients/quotas',
          },
        },
      },
      AI_USAGE: {
        key: 'AI_USAGE',
        label: 'Thống kê sử dụng',
        translationKey: 'menu.ai.usage',
        path: '/ai/usage',
        icon: 'bar-chart',
        children: {
          USAGE_DAILY: {
            key: 'usage_daily',
            label: 'Theo ngày',
            translationKey: 'menu.ai.usage.usage_daily',
            path: '/ai/usage/usage_daily',
          },
          USAGE_LOGS: {
            key: 'usage_logs',
            label: 'Nhật ký gọi',
            translationKey: 'menu.ai.usage.usage_logs',
            path: '/ai/usage/usage_logs',
          },
        },
      },
      AI_KNOWLEDGE: {
        key: 'AI_KNOWLEDGE',
        label: 'Kho tri thức (RAG)',
        translationKey: 'menu.ai.knowledge',
        path: '/ai/knowledge',
        icon: 'book',
        children: {
          KNOWLEDGE_BASES: {
            key: 'knowledge_bases',
            label: 'Kho tri thức',
            translationKey: 'menu.ai.knowledge.knowledge_bases',
            path: '/ai/knowledge/knowledge_bases',
          },
          KNOWLEDGE_BASE_ACCESS: {
            key: 'knowledge_base_access',
            label: 'Phân quyền',
            translationKey: 'menu.ai.knowledge.knowledge_base_access',
            path: '/ai/knowledge/knowledge_base_access',
          },
          KB_DOCUMENTS: {
            key: 'kb_documents',
            label: 'Tài liệu',
            translationKey: 'menu.ai.knowledge.kb_documents',
            path: '/ai/knowledge/kb_documents',
          },
          KB_CHUNKS: {
            key: 'kb_chunks',
            label: 'Đoạn tài liệu',
            translationKey: 'menu.ai.knowledge.kb_chunks',
            path: '/ai/knowledge/kb_chunks',
          },
        },
      },
      AI_CONVERSATIONS: {
        key: 'AI_CONVERSATIONS',
        label: 'Hội thoại',
        translationKey: 'menu.ai.conversations',
        path: '/ai/conversations',
        icon: 'message',
        children: {
          CONVERSATIONS: {
            key: 'conversations',
            label: 'Hội thoại',
            translationKey: 'menu.ai.conversations.conversations',
            path: '/ai/conversations/conversations',
          },
          MESSAGES: {
            key: 'messages',
            label: 'Tin nhắn',
            translationKey: 'menu.ai.conversations.messages',
            path: '/ai/conversations/messages',
          },
        },
      },
    },
  },

  // ── 9. CONFIG — cấu hình động, feature flag, đa ngôn ngữ ─────────────
  CONFIG: {
    key: 'CONFIG',
    label: 'Cấu hình',
    translationKey: 'menu.config',
    path: '/config',
    icon: 'setting',
    children: {
      CONFIG_SETTINGS: {
        key: 'CONFIG_SETTINGS',
        label: 'Tham số hệ thống',
        translationKey: 'menu.config.settings',
        path: '/config/settings',
        icon: 'sliders',
        children: {
          SETTING_DEFINITIONS: {
            key: 'setting_definitions',
            label: 'Định nghĩa',
            translationKey: 'menu.config.settings.setting_definitions',
            path: '/config/settings/setting_definitions',
          },
          SETTING_VALUES: {
            key: 'setting_values',
            label: 'Giá trị',
            translationKey: 'menu.config.settings.setting_values',
            path: '/config/settings/setting_values',
          },
        },
      },
      CONFIG_FEATURE_FLAGS: {
        key: 'CONFIG_FEATURE_FLAGS',
        label: 'Feature flag',
        translationKey: 'menu.config.featureFlags',
        path: '/config/feature-flags',
        icon: 'flag',
        children: {
          FEATURE_FLAGS: {
            key: 'feature_flags',
            label: 'Flag',
            translationKey: 'menu.config.featureFlags.feature_flags',
            path: '/config/feature-flags/feature_flags',
          },
          FEATURE_FLAG_RULES: {
            key: 'feature_flag_rules',
            label: 'Quy tắc bật',
            translationKey: 'menu.config.featureFlags.feature_flag_rules',
            path: '/config/feature-flags/feature_flag_rules',
          },
        },
      },
      CONFIG_I18N: {
        key: 'CONFIG_I18N',
        label: 'Ngôn ngữ & bản dịch',
        translationKey: 'menu.config.i18n',
        path: '/config/i18n',
        icon: 'translation',
        children: {
          LANGUAGES: {
            key: 'languages',
            label: 'Cài đặt ngôn ngữ',
            translationKey: 'menu.config.i18n.languages',
            path: '/config/i18n/languages',
            permission: PERMISSION_CODES.CONFIG_LANGUAGE_VIEW,
          },
          // Khóa dịch + bản dịch nằm chung một màn hình (nút "Đồng bộ khóa" nạp khóa từ ứng dụng)
          TRANSLATIONS: {
            key: 'translations',
            label: 'Bản dịch',
            translationKey: 'menu.config.i18n.translations',
            path: '/config/i18n/translations',
            permission: PERMISSION_CODES.CONFIG_TRANSLATION_VIEW,
          },
        },
      },
    },
  },

  // ── 10. JOB — tác vụ nền ─────────────────────────────────────────────
  JOB: {
    key: 'JOB',
    label: 'Tác vụ nền',
    translationKey: 'menu.job',
    path: '/job',
    icon: 'field-time',
    children: {
      JOB_DEFINITIONS: {
        key: 'JOB_DEFINITIONS',
        label: 'Lịch chạy job',
        translationKey: 'menu.job.definitions',
        path: '/job/definitions',
        icon: 'schedule',
        children: {
          JOBS: {
            key: 'job_definitions',
            label: 'Job',
            translationKey: 'menu.job.definitions.definitions',
            path: '/job/definitions/definitions',
          },
          TENANT_OVERRIDES: {
            key: 'tenant_overrides',
            label: 'Cấu hình theo tenant',
            translationKey: 'menu.job.definitions.tenant_overrides',
            path: '/job/definitions/tenant_overrides',
          },
          EXECUTIONS: {
            key: 'executions',
            label: 'Lịch sử chạy',
            translationKey: 'menu.job.definitions.executions',
            path: '/job/definitions/executions',
          },
        },
      },
    },
  },

  // ── 11. GATEWAY — API Gateway ────────────────────────────────────────
  GATEWAY: {
    key: 'GATEWAY',
    label: 'API Gateway',
    translationKey: 'menu.gateway',
    path: '/gateway',
    icon: 'gateway',
    children: {
      GATEWAY_ROUTING: {
        key: 'GATEWAY_ROUTING',
        label: 'Định tuyến',
        translationKey: 'menu.gateway.routing',
        path: '/gateway/routing',
        icon: 'fork',
        children: {
          ROUTES: {
            key: 'routes',
            label: 'Route',
            translationKey: 'menu.gateway.routing.routes',
            path: '/gateway/routing/routes',
          },
          CLUSTERS: {
            key: 'clusters',
            label: 'Cluster',
            translationKey: 'menu.gateway.routing.clusters',
            path: '/gateway/routing/clusters',
          },
          DESTINATIONS: {
            key: 'destinations',
            label: 'Destination',
            translationKey: 'menu.gateway.routing.destinations',
            path: '/gateway/routing/destinations',
          },
        },
      },
      GATEWAY_POLICIES: {
        key: 'GATEWAY_POLICIES',
        label: 'Chính sách bảo vệ',
        translationKey: 'menu.gateway.policies',
        path: '/gateway/policies',
        icon: 'safety',
        children: {
          RATE_LIMIT_POLICIES: {
            key: 'rate_limit_policies',
            label: 'Rate limit',
            translationKey: 'menu.gateway.policies.rate_limit_policies',
            path: '/gateway/policies/rate_limit_policies',
          },
          TENANT_RATE_LIMITS: {
            key: 'tenant_rate_limits',
            label: 'Rate limit theo tenant',
            translationKey: 'menu.gateway.policies.tenant_rate_limits',
            path: '/gateway/policies/tenant_rate_limits',
          },
          CORS_POLICIES: {
            key: 'cors_policies',
            label: 'CORS',
            translationKey: 'menu.gateway.policies.cors_policies',
            path: '/gateway/policies/cors_policies',
          },
          SECURITY_HEADER_POLICIES: {
            key: 'security_header_policies',
            label: 'Security header',
            translationKey: 'menu.gateway.policies.security_header_policies',
            path: '/gateway/policies/security_header_policies',
          },
        },
      },
      GATEWAY_ERROR_CODES: {
        key: 'GATEWAY_ERROR_CODES',
        label: 'Mã lỗi chuẩn',
        translationKey: 'menu.gateway.errorCodes',
        path: '/gateway/error-codes',
        icon: 'warning',
        children: {
          ERROR_CODES: {
            key: 'error_codes',
            label: 'Mã lỗi',
            translationKey: 'menu.gateway.errorCodes.error_codes',
            path: '/gateway/error-codes/error_codes',
          },
        },
      },
    },
  },

  // ── 12. AUDIT — nhật ký ──────────────────────────────────────────────
  AUDIT: {
    key: 'AUDIT',
    label: 'Nhật ký hệ thống',
    translationKey: 'menu.audit',
    path: '/audit',
    icon: 'file-search',
    children: {
      AUDIT_SECURITY: {
        key: 'AUDIT_SECURITY',
        label: 'Đăng nhập & bảo mật',
        translationKey: 'menu.audit.security',
        path: '/audit/security',
        icon: 'login',
        children: {
          LOGIN_LOGS: {
            key: 'login_logs',
            label: 'Nhật ký đăng nhập',
            translationKey: 'menu.audit.security.login_logs',
            path: '/audit/security/login_logs',
          },
          SECURITY_EVENTS: {
            key: 'security_events',
            label: 'Sự kiện bảo mật',
            translationKey: 'menu.audit.security.security_events',
            path: '/audit/security/security_events',
          },
        },
      },
      AUDIT_DATA_CHANGES: {
        key: 'AUDIT_DATA_CHANGES',
        label: 'Lịch sử thay đổi dữ liệu',
        translationKey: 'menu.audit.dataChanges',
        path: '/audit/data-changes',
        icon: 'diff',
        children: {
          DATA_CHANGE_LOGS: {
            key: 'data_change_logs',
            label: 'Lịch sử thay đổi',
            translationKey: 'menu.audit.dataChanges.data_change_logs',
            path: '/audit/data-changes/data_change_logs',
          },
          AUDIT_POLICIES: {
            key: 'audit_policies',
            label: 'Chính sách ghi log',
            translationKey: 'menu.audit.dataChanges.audit_policies',
            path: '/audit/data-changes/audit_policies',
          },
        },
      },
      AUDIT_API_REQUESTS: {
        key: 'AUDIT_API_REQUESTS',
        label: 'Nhật ký request API',
        translationKey: 'menu.audit.apiRequests',
        path: '/audit/api-requests',
        icon: 'api',
        children: {
          API_REQUEST_LOGS: {
            key: 'api_request_logs',
            label: 'Request API',
            translationKey: 'menu.audit.apiRequests.api_request_logs',
            path: '/audit/api-requests/api_request_logs',
          },
        },
      },
    },
  },

  // ── 13. MONITOR — giám sát ───────────────────────────────────────────
  MONITOR: {
    key: 'MONITOR',
    label: 'Giám sát dịch vụ',
    translationKey: 'menu.monitor',
    path: '/monitor',
    icon: 'monitor',
    children: {
      MONITOR_SERVICES: {
        key: 'MONITOR_SERVICES',
        label: 'Dịch vụ & health check',
        translationKey: 'menu.monitor.services',
        path: '/monitor/services',
        icon: 'cloud-server',
        children: {
          SERVICES: {
            key: 'services',
            label: 'Dịch vụ',
            translationKey: 'menu.monitor.services.services',
            path: '/monitor/services/services',
          },
          HEALTH_CHECKS: {
            key: 'health_checks',
            label: 'Health check',
            translationKey: 'menu.monitor.services.health_checks',
            path: '/monitor/services/health_checks',
          },
        },
      },
      MONITOR_INCIDENTS: {
        key: 'MONITOR_INCIDENTS',
        label: 'Sự cố',
        translationKey: 'menu.monitor.incidents',
        path: '/monitor/incidents',
        icon: 'bug',
        children: {
          INCIDENTS: {
            key: 'incidents',
            label: 'Sự cố',
            translationKey: 'menu.monitor.incidents.incidents',
            path: '/monitor/incidents/incidents',
          },
        },
      },
    },
  },
};

/**
 * Nhãn hiển thị: bản dịch từ API; chưa có bản dịch thì hiện nguyên translationKey.
 */
export function resolveRouteLabel(
  route: { label: string; translationKey: string },
  translate: (key: string) => string,
): string {
  if (!route.translationKey) return route.label;
  return translate(route.translationKey) || route.translationKey;
}

export function getRouteByPath(path: string): RouteConfig | undefined {
  let bestMatch: RouteConfig | undefined = undefined;

  const traverse = (routeList: Record<string, RouteConfig>) => {
    for (const key of Object.keys(routeList)) {
      const r = routeList[key];
      if (path === r.path) {
        bestMatch = r;
        return;
      }
      if (r.path !== '/' && path.startsWith(r.path + '/')) {
        if (!bestMatch || r.path.length > bestMatch.path.length) {
          bestMatch = r;
        }
      }
      if (r.children) {
        traverse(r.children);
      }
    }
  };

  traverse(ROUTES_CONFIG);
  return bestMatch;
}

export function getFirstNavigableRoute(route: RouteConfig): RouteConfig {
  if (!route.children || Object.keys(route.children).length === 0) {
    return route;
  }
  const childKeys = Object.keys(route.children);
  for (const k of childKeys) {
    const child = route.children[k];
    if (child && child.isShow !== false) {
      return getFirstNavigableRoute(child);
    }
  }
  return childKeys.length > 0 ? getFirstNavigableRoute(route.children[childKeys[0]]) : route;
}

export function getRouteByKey(key: string): RouteConfig | undefined {
  let foundRoute: RouteConfig | undefined = undefined;

  const traverse = (routeList: Record<string, RouteConfig>) => {
    for (const k of Object.keys(routeList)) {
      if (foundRoute) return;
      const r = routeList[k];
      if (r.key === key) {
        foundRoute = r;
        return;
      }
      if (r.children) {
        traverse(r.children);
      }
    }
  };

  traverse(ROUTES_CONFIG);
  return foundRoute;
}

export function convertRoutesToMenuItems(routes: Record<string, RouteConfig>): SidebarMenuItem[] {
  const toMenuItem = (route: RouteConfig, depth: number): SidebarMenuItem | null => {
    if (route.isShow === false) return null;

    const item: SidebarMenuItem = {
      key: route.key,
      label: route.label,
      translationKey: route.translationKey,
      path: route.path,
      icon: route.icon,
      isShow: route.isShow,
      permission: route.permission,
    };

    if (route.children && depth < 3) {
      const children = Object.keys(route.children)
        .map((childKey) => toMenuItem(route.children![childKey], depth + 1))
        .filter((child): child is SidebarMenuItem => child !== null);
      if (children.length > 0) {
        item.children = children;
      }
    }

    return item;
  };

  const items: SidebarMenuItem[] = [];
  const home = routes['HOME'];
  if (home && home.isShow !== false) {
    items.push({
      key: home.key,
      label: home.label,
      translationKey: home.translationKey,
      path: home.path,
      icon: home.icon,
      isShow: home.isShow,
      permission: home.permission,
    });
  }

  for (const key of Object.keys(routes)) {
    if (key === 'HOME') continue;
    const item = toMenuItem(routes[key], 1);
    if (item) items.push(item);
  }
  return items;
}

export function filterMenuByPermission(
  items: SidebarMenuItem[],
  canAccess: (permission?: string) => boolean,
): SidebarMenuItem[] {
  const filterItem = (item: SidebarMenuItem): SidebarMenuItem | null => {
    if (item.permission && !canAccess(item.permission)) {
      return null;
    }

    if (item.children?.length) {
      const children = item.children
        .map((child) => filterItem(child))
        .filter((child): child is SidebarMenuItem => child !== null);
      if (children.length === 0) {
        return null;
      }
      return { ...item, children };
    }

    return item;
  };

  return items
    .map((item) => filterItem(item))
    .filter((item): item is SidebarMenuItem => item !== null);
}
