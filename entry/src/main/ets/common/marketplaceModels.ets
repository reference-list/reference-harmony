import { addCatalogSource, normalizeCatalogSourceUrl, restoreDefaultCatalogSource, DEFAULT_CATALOG_SOURCE_ID } from './catalogSourceModels';
import type { CatalogSource } from './catalogSourceModels';

export const MARKETPLACE_URL: string = 'https://reference.jqknono.com/marketplace.json';

export interface MarketplaceCatalog {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  catalogUrl: string;
  homepage: string;
  author: string;
  tags: Array<string>;
  languages: Array<string>;
  count: number;
}

interface MarketplaceIndex {
  version: number;
  catalogs: Array<MarketplaceCatalog>;
}

function text(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

function strings(values: Array<string> | undefined): Array<string> {
  return Array.isArray(values) ? values.filter((value: string): boolean => typeof value === 'string' && value.trim().length > 0)
    .map((value: string): string => value.trim()) : [];
}

/** 官网维护目录元数据；无效条目跳过，其余条目继续可用。 */
export function parseMarketplaceIndex(raw: string): Array<MarketplaceCatalog> {
  const index = JSON.parse(raw) as MarketplaceIndex;
  if (!index || index.version !== 1 || !Array.isArray(index.catalogs)) throw new Error('集市目录格式不正确');
  const result: Array<MarketplaceCatalog> = [];
  const ids = new Set<string>();
  const urls = new Set<string>();
  for (let i = 0; i < index.catalogs.length; i++) {
    const item = index.catalogs[i];
    if (!item || !text(item.id) || !text(item.name) || !text(item.catalogUrl)) continue;
    try {
      const address = normalizeCatalogSourceUrl(item.catalogUrl);
      const id = text(item.id);
      if (ids.has(id) || urls.has(address)) continue;
      let homepage = '';
      if (text(item.homepage)) homepage = normalizeCatalogSourceUrl(item.homepage);
      result.push({
        id, name: text(item.name), nameEn: text(item.nameEn), description: text(item.description),
        descriptionEn: text(item.descriptionEn), catalogUrl: address, homepage, author: text(item.author),
        tags: strings(item.tags), languages: strings(item.languages),
        count: typeof item.count === 'number' && Number.isFinite(item.count) && item.count > 0 ? Math.floor(item.count) : 0,
      });
      ids.add(id);
      urls.add(address);
    } catch (_) {
      // 保留已解析的有效目录。
    }
  }
  if (index.catalogs.length > 0 && result.length === 0) throw new Error('集市中暂时没有可读取的目录');
  return result;
}

export function searchMarketplace(items: Array<MarketplaceCatalog>, query: string): Array<MarketplaceCatalog> {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter((token: string): boolean => token.length > 0);
  return items.filter((item: MarketplaceCatalog): boolean => {
    const haystack = [item.name, item.nameEn, item.description, item.descriptionEn, item.catalogUrl,
      item.author, item.tags.join(' '), item.languages.join(' ')].join(' ').toLowerCase();
    return tokens.every((token: string): boolean => haystack.includes(token));
  });
}

export function marketplaceSource(sources: Array<CatalogSource>, item: MarketplaceCatalog): CatalogSource | undefined {
  return sources.find((source: CatalogSource): boolean => source.url === item.catalogUrl);
}

/** 复用设置页的命名和官方源恢复规则，重复添加保持原有身份。 */
export function addMarketplaceCatalog(sources: Array<CatalogSource>, item: MarketplaceCatalog): Array<CatalogSource> {
  const existing = marketplaceSource(sources, item);
  if (existing?.enabled) return sources;
  if (existing?.id === DEFAULT_CATALOG_SOURCE_ID) return restoreDefaultCatalogSource(sources);
  return addCatalogSource(sources, item.catalogUrl);
}
