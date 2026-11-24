/** config.languages + tiến độ dịch */
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  direction: 'LTR' | 'RTL';
  dateFormat: string;
  numberFormat?: string | null;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  translatedCount: number;
  totalKeys: number;
  createdAt: string;
  updatedAt?: string | null;
}

/** Ngôn ngữ đang hỗ trợ (bộ chọn ngôn ngữ) */
export interface ActiveLanguage {
  code: string;
  name: string;
  nativeName: string;
  direction: 'LTR' | 'RTL';
  dateFormat: string;
  isDefault: boolean;
}

export interface LanguageSaveRequest {
  code: string;
  name: string;
  nativeName: string;
  direction: 'LTR' | 'RTL';
  dateFormat: string;
  numberFormat?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface TranslationCell {
  id: string;
  value: string;
  isReviewed: boolean;
  isMachine: boolean;
}

export interface TranslationRow {
  keyId: string;
  fullKey: string;
  namespace: string;
  key: string;
  description?: string | null;
  platforms: string[];
  values: Record<string, TranslationCell>;
  createdAt: string;
}

export interface NamespaceCount {
  namespace: string;
  count: number;
}

export interface TranslationStats {
  totalKeys: number;
  translatedByLanguage: Record<string, number>;
}

export interface TranslationSyncItem {
  key: string;
  description?: string;
  /** mã ngôn ngữ (vi / vi-VN / en...) -> bản dịch mặc định */
  values?: Record<string, string>;
}

export interface TranslationSyncResult {
  received: number;
  createdKeys: number;
  existingKeys: number;
  createdTranslations: number;
  totalKeys: number;
  invalidKeys: string[];
}

export interface TranslationSaveItem {
  keyId: string;
  languageCode: string;
  value: string | null;
  isReviewed?: boolean;
}

export interface TranslationSaveResult {
  created: number;
  updated: number;
  deleted: number;
}

export interface TranslationKeySaveRequest {
  id?: string | null;
  fullKey: string;
  description?: string | null;
  platforms?: string[];
  values?: Record<string, string>;
}

export interface TranslationImportResult {
  total: number;
  createdKeys: number;
  created: number;
  updated: number;
  skipped: number;
}
