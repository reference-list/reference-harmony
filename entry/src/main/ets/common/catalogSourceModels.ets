import url from '@ohos.url';
import type { ReferenceDocSummary, ReferenceLang } from './referenceModels';

export const DEFAULT_CATALOG_SOURCE_ID: string = 'reference';
export const DEFAULT_CATALOG_SOURCE_URL: string = 'https://reference.jqknono.com/catalog.json';

export interface CatalogSource {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

export interface CatalogSourceStatus {
  sourceId: string;
  loading: boolean;
  count: number;
  error: string;
}

export function defaultCatalogSource(): CatalogSource {
  return { id: DEFAULT_CATALOG_SOURCE_ID, name: '速记清单官方源', url: DEFAULT_CATALOG_SOURCE_URL, enabled: true };
}

/** 将旧官方源入口升级为目录文件，同时保留用户的名称、删除状态和文档身份。 */
export function migrateCatalogSource(source: CatalogSource): CatalogSource {
  if (source.id !== DEFAULT_CATALOG_SOURCE_ID) return source;
  return { id: source.id, name: source.name, url: DEFAULT_CATALOG_SOURCE_URL, enabled: source.enabled };
}

export function normalizeCatalogSourceUrl(input: string): string {
  const raw = input.trim();
  if (!raw) throw new Error('请填写清单源地址');
  const parsed = new url.URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
  if ((parsed.protocol !== 'https:' && parsed.protocol !== 'http:') || !parsed.hostname || parsed.username || parsed.password) {
    throw new Error('请使用有效的 HTTP 或 HTTPS 清单源地址');
  }
  parsed.hash = '';
  return parsed.toString().replace(/\/+$/g, '');
}

/** 由域名自动命名，所有已保存的源（含停用占位）共同保留名称。 */
export function addCatalogSource(sources: Array<CatalogSource>, address: string): Array<CatalogSource> {
  const normalized = normalizeCatalogSourceUrl(address);
  if (sources.some((source: CatalogSource): boolean => source.url === normalized)) {
    throw new Error('该地址已添加，请使用或恢复已有清单源');
  }
  const baseName = new url.URL(normalized).hostname;
  const names = new Set<string>(sources.map((source: CatalogSource): string => source.name));
  let name = baseName;
  let suffix = 2;
  while (names.has(name)) {
    name = `${baseName}_${suffix}`;
    suffix++;
  }
  const source: CatalogSource = {
    id: `source_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    name,
    url: normalized,
    enabled: true,
  };
  return sources.concat([source]);
}

export function removeCatalogSource(sources: Array<CatalogSource>, id: string): Array<CatalogSource> {
  return sources.filter((source: CatalogSource): boolean => source.id !== id || id === DEFAULT_CATALOG_SOURCE_ID)
    .map((source: CatalogSource): CatalogSource => source.id === id
      ? { id: source.id, name: source.name, url: source.url, enabled: false } : source);
}

export function restoreDefaultCatalogSource(sources: Array<CatalogSource>): Array<CatalogSource> {
  return sources.map((source: CatalogSource): CatalogSource => source.id === DEFAULT_CATALOG_SOURCE_ID
    ? { id: source.id, name: source.name, url: DEFAULT_CATALOG_SOURCE_URL, enabled: true } : source);
}

/** 官方源优先保留内置文档的稳定标识，使已有收藏与离线阅读继续可用。 */
export function mergeCatalogSourceDocs(source: CatalogSource, docs: Array<ReferenceDocSummary>,
  offlineDocs: Array<ReferenceDocSummary>, currentDocs: Array<ReferenceDocSummary>, lang: ReferenceLang,
  excludedIds: ReadonlySet<string>): Array<ReferenceDocSummary> {
  const offlineIds: Set<string> = new Set<string>(offlineDocs.map((doc: ReferenceDocSummary): string => doc.id));
  const next = docs.filter((doc: ReferenceDocSummary): boolean => {
    const baseId = decodeURIComponent(doc.id.slice(`cloud_${source.id}_${lang}_`.length));
    return source.enabled && !excludedIds.has(baseId) && !(source.id === DEFAULT_CATALOG_SOURCE_ID && offlineIds.has(baseId));
  }).map((doc: ReferenceDocSummary): ReferenceDocSummary => ({
    id: doc.id, name: doc.name, title: doc.title, icon: doc.icon, file: doc.file,
    sectionCount: doc.sectionCount, cardCount: doc.cardCount, sourceId: source.id, sourceName: source.name,
  }));
  return currentDocs.filter((doc: ReferenceDocSummary): boolean => doc.sourceId !== source.id).concat(next);
}
