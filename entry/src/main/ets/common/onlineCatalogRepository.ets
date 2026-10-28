/** 读取具名清单源：静态 JSON、目录 API 与现有网站文件列表共用文档模型。 */
import http from '@ohos.net.http';
import url from '@ohos.url';
import type { ReferenceDocSummary, ReferenceLang } from './referenceModels';
import type { CatalogSource } from './catalogSourceModels';
import { formatCatalogError } from './catalogError';

interface OnlineCatalogItemLike {
  id?: string;
  mdUrl?: string;
  name?: string;
  title?: string;
  icon?: string;
  lang?: string;
  sectionCount?: number;
  cardCount?: number;
}

interface OnlineCatalogResponseLike {
  items?: Array<OnlineCatalogItemLike>;
}

export class OnlineCatalogRepository {
  private successfulEndpoints: Map<string, string> = new Map<string, string>();

  private async requestText(address: string, timeoutMs: number, lang: ReferenceLang): Promise<string> {
    const request = http.createHttp();
    let timer: number = -1;
    try {
      const pending = request.request(address, {
        method: http.RequestMethod.GET,
        header: { 'Accept': 'application/json, text/html', 'User-Agent': 'QuickReference-HarmonyOS' },
        expectDataType: http.HttpDataType.STRING,
        connectTimeout: Math.min(5000, timeoutMs),
        readTimeout: timeoutMs,
      });
      const deadline = new Promise<http.HttpResponse>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(lang === 'en'
          ? 'The source request timed out. Check your network and try Refresh.'
          : '清单源请求超时，请检查网络后点击刷新。')), timeoutMs);
      });
      const response = await Promise.race([pending, deadline]);
      if (response.responseCode !== 200) throw new Error(`HTTP ${response.responseCode}`);
      return String(response.result ?? '');
    } finally {
      if (timer >= 0) clearTimeout(timer);
      request.destroy();
    }
  }

  private resolveUrl(value: string, base: string): string {
    const resolved = new url.URL(value, base);
    if (resolved.protocol !== 'https:' && resolved.protocol !== 'http:') throw new Error('文档链接需使用 HTTP 或 HTTPS');
    return resolved.toString();
  }

  private parseItems(text: string, address: string, lang: ReferenceLang): Array<OnlineCatalogItemLike> {
    if (!/\.html(?:\?|$)/i.test(address)) {
      const parsed = JSON.parse(text) as OnlineCatalogResponseLike;
      if (!Array.isArray(parsed.items)) throw new Error('目录文件需要包含 items 列表');
      return parsed.items;
    }
    // 兼容已发布的文件列表页，按 Markdown 链接去重。
    const items: Array<OnlineCatalogItemLike> = [];
    const seen: Set<string> = new Set<string>();
    const pattern = /href=["']([^"']+\.(?:md|markdown))["']/gi;
    let match = pattern.exec(text);
    while (match !== null) {
      const link = match[1].replace(/&amp;/g, '&');
      const path = new url.URL(link, address).pathname;
      if (path.indexOf(`/mds/${lang}/`) >= 0 && !seen.has(link)) {
        seen.add(link);
        const file = path.substring(path.indexOf(`/mds/${lang}/`) + `/mds/${lang}/`.length);
        const id = decodeURIComponent(file.replace(/\.(md|markdown)$/i, ''));
        items.push({ id: id, name: id, title: id, mdUrl: link, lang: lang });
      }
      match = pattern.exec(text);
    }
    if (!text.includes('备忘清单文件列表') && items.length === 0) throw new Error('未找到清单文件列表');
    return items;
  }

  async fetchCatalog(lang: ReferenceLang, source: CatalogSource, override?: string): Promise<Array<ReferenceDocSummary>> {
    const base = (override || source.url).replace(/\/+$/g, '');
    const explicit = /(?:\.json|\.html|\/api\/v1\/catalog)(?:\?|$)/i.test(base);
    let candidates = explicit ? [base] : [`${base}/catalog.json`, `${base}/files.html`, `${base}/api/v1/catalog`];
    const preferred = this.successfulEndpoints.get(base);
    if (preferred) candidates = [preferred].concat(candidates.filter((candidate: string): boolean => candidate !== preferred));
    const errors: Array<string> = [];
    const deadline = Date.now() + 20000;
    for (let index = 0; index < candidates.length; index++) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      let address = candidates[index];
      if (/\/api\/v1\/catalog(?:\?|$)/i.test(address)) {
        address += `${address.includes('?') ? '&' : '?'}lang=${lang}`;
      }
      try {
        const items = this.parseItems(await this.requestText(address, Math.min(8000, remaining), lang), address, lang);
        const docs: Array<ReferenceDocSummary> = [];
        const seen: Set<string> = new Set<string>();
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.lang && item.lang !== lang) continue;
          const rawId = String(item.id ?? '').trim().replace(/^cloud_/, '');
          const mdUrl = String(item.mdUrl ?? '').trim();
          if (!rawId || !mdUrl || seen.has(rawId)) continue;
          seen.add(rawId);
          docs.push({
            id: `cloud_${source.id}_${lang}_${encodeURIComponent(rawId)}`,
            sourceId: source.id,
            sourceName: source.name,
            name: item.name || item.title || rawId,
            title: item.title || item.name || rawId,
            file: `cloud:${this.resolveUrl(mdUrl, address)}`,
            icon: item.icon ? this.resolveUrl(item.icon, address) : undefined,
            sectionCount: Number(item.sectionCount) > 0 ? Math.floor(Number(item.sectionCount)) : 0,
            cardCount: Number(item.cardCount) > 0 ? Math.floor(Number(item.cardCount)) : 0,
          });
        }
        this.successfulEndpoints.set(base, candidates[index]);
        return docs;
      } catch (error) {
        const reason = formatCatalogError(error, lang);
        const endpoint = new url.URL(address).pathname;
        errors.push(`${endpoint}: ${reason}`);
      }
    }
    throw new Error(errors.join('\n') || (lang === 'en' ? 'The source request timed out. Try Refresh.' : '清单源请求超时，请点击刷新重试。'));
  }
}
