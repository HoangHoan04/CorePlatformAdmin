export const enumData = {
  PAGE: {
    PAGE_INDEX: 1,
    PAGE_SIZE: 10,
    PAGE_SIZE_MAX: 1000000,
    LST_PAGE_SIZE: [10, 20, 50, 100],
    TOTAL: 0,
    SORT_ORDER: {
      ASC: 'asc',
      DESC: 'desc',
    },

    SORT_FIELD: {
      CREATED_AT: 'createdAt',
      UPDATED_AT: 'updatedAt',
      NAME: 'name',
      CODE: 'code',
      ACTIVATE_STATUS: 'activateStatus',
      IS_DELETED: 'isDeleted',
      STATUS_LABEL: 'statusLabel',
      STATUS: 'status',
      YEAR: 'year',
      REMAINING_DAYS: 'remainingDays',
      WORK_DATE: 'workDate',
      REQUEST_DATE: 'requestDate',
      DISPLAY_ORDER: 'displayOrder',
      SLIP_DATE: 'slipDate',
      USERNAME: 'username',
    },
  },

  maxSizeUpload: 5 * 1024 * 1024,

  STATUS_FILTER_IS_DELETED: {
    ACTIVE: { code: 'ACTIVE', labelKey: 'enums.statusFilter.active', value: false },
    INACTIVE: { code: 'INACTIVE', labelKey: 'enums.statusFilter.inactive', value: true },
    ALL: { code: 'ALL', labelKey: 'enums.statusFilter.all', value: null },
  },

  STATUS_FILTER_IS_ACTIVE: {
    ACTIVE: { code: 'ACTIVE', labelKey: 'enums.statusFilter.active', value: true },
    INACTIVE: { code: 'INACTIVE', labelKey: 'enums.statusFilter.inactive', value: false },
    ALL: { code: 'ALL', labelKey: 'enums.statusFilter.all', value: null },
  },

  YES_NO_FILTER: {
    YES: { code: 'YES', labelKey: 'enums.yesNoFilter.yes', value: true },
    NO: { code: 'NO', labelKey: 'enums.yesNoFilter.no', value: false },
    ALL: { code: 'ALL', labelKey: 'enums.yesNoFilter.all', value: null },
  },

  GENDER: {
    MALE: { code: 'MALE', labelKey: 'enums.gender.male', value: 'MALE', color: '#1890ff' },
    FEMALE: { code: 'FEMALE', labelKey: 'enums.gender.female', value: 'FEMALE', color: '#faad14' },
    OTHER: { code: 'OTHER', labelKey: 'enums.gender.other', value: 'OTHER', color: '#722ed1' },
  },

  ACTION_TYPE: {
    CREATE: {
      code: 'CREATE',
      labelKey: 'enums.actionType.create',
      type: 'ThemMoi',
      color: '#00FF00',
    },
    APPROVE: {
      code: 'APPROVE',
      labelKey: 'enums.actionType.approve',
      type: 'Duyet',
      color: '#00FF00',
    },
    ACTIVATE: {
      code: 'ACTIVATE',
      labelKey: 'enums.actionType.activate',
      type: 'KichHoat',
      color: '#00FF00',
    },
    LOGIN: {
      code: 'LOGIN',
      labelKey: 'enums.actionType.login',
      type: 'DangNhap',
      color: '#00FF00',
    },

    UPDATE: {
      code: 'UPDATE',
      labelKey: 'enums.actionType.update',
      type: 'CapNhat',
      color: '#FFFF00',
    },
    EDIT: {
      code: 'EDIT',
      labelKey: 'enums.actionType.edit',
      type: 'ChinhSua',
      color: '#FFA500',
    },

    DELETE: {
      code: 'DELETE',
      labelKey: 'enums.actionType.delete',
      type: 'XoaBo',
      color: '#FF0000',
    },
    REJECT: {
      code: 'REJECT',
      labelKey: 'enums.actionType.reject',
      type: 'TuChoi',
      color: '#FF0000',
    },
    CANCEL: {
      code: 'CANCEL',
      labelKey: 'enums.actionType.cancel',
      type: 'Huy',
      color: '#78716C',
    },
    DEACTIVATE: {
      code: 'DEACTIVATE',
      labelKey: 'enums.actionType.deactivate',
      type: 'NgungHoatDong',
      color: '#808080',
    },
    LOGOUT: {
      code: 'LOGOUT',
      labelKey: 'enums.actionType.logout',
      type: 'DangXuat',
      color: '#78716C',
    },

    SYNC: {
      code: 'SYNC',
      labelKey: 'enums.actionType.sync',
      type: 'DongBo',
      color: '#0000FF',
    },
    SEND_APPROVE: {
      code: 'SEND_APPROVE',
      labelKey: 'enums.actionType.sendApprove',
      type: 'GuiDuyet',
      color: '#00FFFF',
    },
    RESTORE: {
      code: 'RESTORE',
      labelKey: 'enums.actionType.restore',
      type: 'KhoiPhuc',
      color: '#00FFFF',
    },
    REGISTER: {
      code: 'REGISTER',
      labelKey: 'enums.actionType.register',
      type: 'DangKy',
      color: '#4B0082',
    },
    IMPORT_EXCEL: {
      code: 'IMPORT_EXCEL',
      labelKey: 'enums.actionType.importExcel',
      type: 'NhapExcel',
      color: '#800080',
    },
    UPLOAD_FILE: {
      code: 'UPLOAD_FILE',
      labelKey: 'enums.actionType.uploadFile',
      type: 'TaiFileLen',
      color: '#800080',
    },
    LOCK: {
      code: 'LOCK',
      labelKey: 'enums.actionType.lock',
      color: '#FF0000',
    },
    UNLOCK: {
      code: 'UNLOCK',
      labelKey: 'enums.actionType.unlock',
      color: '#00FF00',
    },
  },

  DAY_OF_WEEK: {
    SUNDAY: {
      code: 'SUNDAY',
      key: 'CN',
      labelKey: 'enums.daysOfWeek.sun',
      value: 0,
    },
    MONDAY: {
      code: 'MONDAY',
      key: 'T2',
      labelKey: 'enums.daysOfWeek.mon',
      value: 1,
    },
    TUESDAY: {
      code: 'TUESDAY',
      key: 'T3',
      labelKey: 'enums.daysOfWeek.tue',
      value: 2,
    },
    WEDNESDAY: {
      code: 'WEDNESDAY',
      key: 'T4',
      labelKey: 'enums.daysOfWeek.wed',
      value: 3,
    },
    THURSDAY: {
      code: 'THURSDAY',
      key: 'T5',
      labelKey: 'enums.daysOfWeek.thu',
      value: 4,
    },
    FRIDAY: {
      code: 'FRIDAY',
      key: 'T6',
      labelKey: 'enums.daysOfWeek.fri',
      value: 5,
    },
    SATURDAY: {
      code: 'SATURDAY',
      key: 'T7',
      labelKey: 'enums.daysOfWeek.sat',
      value: 6,
    },
  },

  MONTH: {
    JANUARY: { code: 'JANUARY', labelKey: 'enums.month.january', value: 0 },
    FEBRUARY: { code: 'FEBRUARY', labelKey: 'enums.month.february', value: 1 },
    MARCH: { code: 'MARCH', labelKey: 'enums.month.march', value: 2 },
    APRIL: { code: 'APRIL', labelKey: 'enums.month.april', value: 3 },
    MAY: { code: 'MAY', labelKey: 'enums.month.may', value: 4 },
    JUNE: { code: 'JUNE', labelKey: 'enums.month.june', value: 5 },
    JULY: { code: 'JULY', labelKey: 'enums.month.july', value: 6 },
    AUGUST: { code: 'AUGUST', labelKey: 'enums.month.august', value: 7 },
    SEPTEMBER: { code: 'SEPTEMBER', labelKey: 'enums.month.september', value: 8 },
    OCTOBER: { code: 'OCTOBER', labelKey: 'enums.month.october', value: 9 },
    NOVEMBER: { code: 'NOVEMBER', labelKey: 'enums.month.november', value: 10 },
    DECEMBER: { code: 'DECEMBER', labelKey: 'enums.month.december', value: 11 },
  },
};
