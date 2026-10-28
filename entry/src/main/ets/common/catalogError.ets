import type { ReferenceLang } from './referenceModels';

interface CatalogErrorDetails {
  code?: number | string;
  message?: string;
}

export function catalogErrorCode(error: Object | undefined | null): number {
  if (!error || typeof error === 'string') return 0;
  const details = error as CatalogErrorDetails;
  return Number(details.code) || 0;
}

/** 鸿蒙 BusinessError 通常是普通对象，显式读取 message/code 才能保留诊断信息。 */
export function formatCatalogError(error: Object | undefined | null, lang: ReferenceLang = 'zh'): string {
  const details = error as CatalogErrorDetails | undefined | null;
  const raw = typeof error === 'string' ? error.trim() : typeof details?.message === 'string' ? details.message.trim() : '';
  const message = raw === '[object Object]' || raw === 'Error: [object Object]' ? '' : raw;
  const code = catalogErrorCode(error);
  let hint = '';
  switch (code) {
    case 2300005:
    case 2300006:
      hint = lang === 'en' ? 'Could not resolve the source address. Check your network or DNS.' : '无法解析清单源地址，请检查网络或 DNS。';
      break;
    case 2300007:
      hint = lang === 'en' ? 'Could not connect to the source. Check your network and try Refresh.' : '无法连接清单源，请检查网络后点击刷新。';
      break;
    case 2300028:
      hint = lang === 'en' ? 'The source request timed out. Try Refresh.' : '清单源请求超时，请点击刷新重试。';
      break;
    case 2300060:
    case 2300077:
      hint = lang === 'en' ? 'Could not verify the server certificate.' : '无法验证清单源的服务器证书。';
      break;
    default:
      hint = message || (lang === 'en' ? 'The source is temporarily unavailable. Try Refresh.' : '清单源暂时不可用，请点击刷新重试。');
  }
  const diagnostic = message && message !== hint ? `\n${message}` : '';
  const codeText = code ? (lang === 'en' ? ` (code ${code})` : `（错误码 ${code}）`) : '';
  return `${hint}${codeText}${diagnostic}`;
}
