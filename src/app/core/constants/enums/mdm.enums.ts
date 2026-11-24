/**
 * Mã dùng chung của danh mục MDM — khớp ràng buộc CHECK trong database. Mã là dữ liệu;
 * tên hiển thị lấy từ khóa dịch. Khóa được ghi tường minh (không ghép chuỗi) để "Đồng bộ khóa" quét được.
 */

/** Vị trí ký hiệu tiền tệ (currencies.symbol_position) -> khóa dịch. */
export const SYMBOL_POSITION_KEYS = {
  PREFIX: 'enums.symbolPosition.PREFIX',
  SUFFIX: 'enums.symbolPosition.SUFFIX',
} as const;

export type SymbolPosition = keyof typeof SYMBOL_POSITION_KEYS;

export const SYMBOL_POSITIONS = Object.keys(SYMBOL_POSITION_KEYS) as SymbolPosition[];

export const symbolPositionKey = (code: string): string =>
  SYMBOL_POSITION_KEYS[code as SymbolPosition] ?? code;

/** Loại tỷ giá (exchange_rates.rate_type) -> khóa dịch. */
export const EXCHANGE_RATE_TYPE_KEYS = {
  BUY_CASH: 'enums.exchangeRateType.BUY_CASH',
  BUY_TRANSFER: 'enums.exchangeRateType.BUY_TRANSFER',
  SELL: 'enums.exchangeRateType.SELL',
  TRANSFER: 'enums.exchangeRateType.TRANSFER',
  CENTRAL: 'enums.exchangeRateType.CENTRAL',
  ACCOUNTING: 'enums.exchangeRateType.ACCOUNTING',
} as const;

export type ExchangeRateType = keyof typeof EXCHANGE_RATE_TYPE_KEYS;

export const EXCHANGE_RATE_TYPES = Object.keys(EXCHANGE_RATE_TYPE_KEYS) as ExchangeRateType[];

export const exchangeRateTypeKey = (code: string): string =>
  EXCHANGE_RATE_TYPE_KEYS[code as ExchangeRateType] ?? code;

/** Loại đơn vị hành chính (administrative_units.unit_type) -> khóa dịch tên loại. */
export const ADMIN_UNIT_TYPE_KEYS = {
  CENTRAL_CITY: 'enums.adminUnitType.CENTRAL_CITY',
  PROVINCE: 'enums.adminUnitType.PROVINCE',
  DISTRICT: 'enums.adminUnitType.DISTRICT',
  URBAN_DISTRICT: 'enums.adminUnitType.URBAN_DISTRICT',
  TOWN: 'enums.adminUnitType.TOWN',
  PROVINCIAL_CITY: 'enums.adminUnitType.PROVINCIAL_CITY',
  WARD: 'enums.adminUnitType.WARD',
  COMMUNE: 'enums.adminUnitType.COMMUNE',
  TOWNSHIP: 'enums.adminUnitType.TOWNSHIP',
  SPECIAL_ZONE: 'enums.adminUnitType.SPECIAL_ZONE',
} as const;

export type AdminUnitType = keyof typeof ADMIN_UNIT_TYPE_KEYS;

export const ADMIN_UNIT_TYPES = Object.keys(ADMIN_UNIT_TYPE_KEYS) as AdminUnitType[];

export const adminUnitTypeKey = (code: string): string =>
  ADMIN_UNIT_TYPE_KEYS[code as AdminUnitType] ?? code;

/** Cấp đơn vị hành chính: 1 = tỉnh, 2 = huyện / xã (mô hình 2 cấp), 3 = xã (mô hình 3 cấp). */
export const ADMIN_UNIT_LEVEL_KEYS: Record<number, string> = {
  1: 'enums.adminUnitLevel.level1',
  2: 'enums.adminUnitLevel.level2',
  3: 'enums.adminUnitLevel.level3',
};

export const ADMIN_UNIT_LEVELS = [1, 2, 3] as const;

export const adminUnitLevelKey = (level: number): string => ADMIN_UNIT_LEVEL_KEYS[level] ?? String(level);

/** Hình thức thay đổi địa giới (administrative_unit_mappings.mapping_type) -> khóa dịch. */
export const ADMIN_UNIT_MAPPING_TYPE_KEYS = {
  MERGE: 'enums.adminUnitMappingType.MERGE',
  SPLIT: 'enums.adminUnitMappingType.SPLIT',
  RENAME: 'enums.adminUnitMappingType.RENAME',
  PARTIAL: 'enums.adminUnitMappingType.PARTIAL',
} as const;

export type AdminUnitMappingType = keyof typeof ADMIN_UNIT_MAPPING_TYPE_KEYS;

export const ADMIN_UNIT_MAPPING_TYPES = Object.keys(ADMIN_UNIT_MAPPING_TYPE_KEYS) as AdminUnitMappingType[];

export const adminUnitMappingTypeKey = (code: string): string =>
  ADMIN_UNIT_MAPPING_TYPE_KEYS[code as AdminUnitMappingType] ?? code;
