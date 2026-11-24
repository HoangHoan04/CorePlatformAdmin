#!/usr/bin/env node
/**
 * Quét mã nguồn Angular (src/app) để lấy danh sách khóa dịch đang dùng, ghi ra
 * src/app/core/i18n/i18n-keys.generated.ts. Nút "Đồng bộ khóa" ở màn hình Bản dịch gửi danh sách này
 * lên API (POST /api/i18n/translations/sync) để tạo các khóa còn thiếu trong config.translation_keys.
 *
 * Cách nhận diện khóa: mọi chuỗi trong nháy đơn/kép có dạng `namespace.path.to.key`
 * (bắt đầu bằng chữ thường, các đoạn ngăn bởi dấu chấm, không có khoảng trắng / dấu "/").
 * Chỉ lấy khóa — không có văn bản mặc định trong mã nguồn; mọi bản dịch nhập ở màn hình Bản dịch (database).
 * Khóa ghép động (template literal) không quét được — được bắt lúc chạy bởi MissingKeyCollector.
 *
 * Chạy: yarn i18n:extract (tự chạy trước start/build).
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'src', 'app');
const outFile = join(srcDir, 'core', 'i18n', 'i18n-keys.generated.ts');

const KEY_RE = /^[a-z][A-Za-z0-9_-]*(\.[A-Za-z0-9_-]+)+$/;
const IGNORE_EXT =
  /\.(ts|js|mjs|cjs|html|scss|css|json|svg|png|jpe?g|gif|webp|ico|xlsx?|csv|pdf|docx?|pptx?|txt|md|zip|woff2?|ttf|eot|map)$/i;
const IGNORE_PREFIX = /^(www\.|e\.g|i\.e)/i;
// Định dạng ngày giờ như dd.MM.yyyy, yyyy.MM.dd
const IGNORE_DATE_FORMAT = /^[dMyHhmsS]+(\.[dMyHhmsS]+)+$/;
// Chỉ lấy chuỗi nháy đơn: TS theo prettier dùng nháy đơn; trong template, nháy kép là giá trị thuộc tính
// (biểu thức như "item.icon"), còn literal bên trong biểu thức luôn là nháy đơn.
const STRING_RE = /'((?:\\.|[^'\\\r\n])*)'/g;

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walk(full, files);
    } else if (/\.(ts|html)$/.test(name) && !/\.spec\.ts$/.test(name) && full !== outFile) {
      files.push(full);
    }
  }
  return files;
}

function isKey(text) {
  return (
    KEY_RE.test(text) &&
    !IGNORE_EXT.test(text) &&
    !IGNORE_PREFIX.test(text) &&
    !IGNORE_DATE_FORMAT.test(text)
  );
}

/** key -> { sources:Set<string> } */
const found = new Map();

for (const file of walk(srcDir)) {
  const rel = relative(root, file).split(sep).join('/');
  const content = readFileSync(file, 'utf8')
    // bỏ comment để không lấy nhầm ví dụ trong chú thích
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  for (const m of content.matchAll(STRING_RE)) {
    const text = m[1];
    if (!isKey(text)) continue;
    const entry = found.get(text) ?? { sources: new Set() };
    entry.sources.add(rel);
    found.set(text, entry);
  }
}

const keys = [...found.keys()].sort();
const lines = keys.map((key) => {
  const src = [...found.get(key).sources].sort()[0];
  return `  { key: ${JSON.stringify(key)}, source: ${JSON.stringify(src)} },`;
});

const output = `// FILE TỰ SINH bởi scripts/extract-i18n-keys.mjs — KHÔNG sửa tay. Chạy lại: yarn i18n:extract
// Danh sách khóa dịch quét được từ mã nguồn (${keys.length} khóa).

export interface ExtractedI18nKey {
  key: string;
  /** File đầu tiên dùng khóa này */
  source: string;
}

export const EXTRACTED_I18N_KEYS: ExtractedI18nKey[] = [
${lines.join('\n')}
];
`;

let previous = '';
try {
  previous = readFileSync(outFile, 'utf8');
} catch {
  /* chưa có file */
}
if (previous !== output) {
  writeFileSync(outFile, output, 'utf8');
}
console.log(`[i18n] ${keys.length} khóa dịch -> ${relative(root, outFile)}`);
