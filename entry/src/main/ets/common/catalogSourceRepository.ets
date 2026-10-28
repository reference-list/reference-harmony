import preferences from '@ohos.data.preferences';
import { defaultCatalogSource, DEFAULT_CATALOG_SOURCE_ID, migrateCatalogSource } from './catalogSourceModels';
import type { CatalogSource } from './catalogSourceModels';
import type { ReferenceDocSummary, ReferenceLang } from './referenceModels';

/** 清单源配置和按语言隔离的目录缓存，默认源以停用状态保留恢复入口。 */
export class CatalogSourceRepository {
  async getSources(context: Context): Promise<Array<CatalogSource>> {
    const prefs = await preferences.getPreferences(context, 'catalog_sources');
    const raw = await prefs.get('sources', '');
    if (raw === '') {
      const sources = [defaultCatalogSource()];
      await this.saveSources(context, sources);
      return sources;
    }
    const sources = JSON.parse(String(raw)) as Array<CatalogSource>;
    if (!Array.isArray(sources)) throw new Error('清单源配置格式错误');
    if (!sources.some((source: CatalogSource): boolean => source.id === DEFAULT_CATALOG_SOURCE_ID)) {
      const placeholder = defaultCatalogSource();
      placeholder.enabled = false;
      sources.unshift(placeholder);
    }
    const migrated = sources.map((source: CatalogSource): CatalogSource => migrateCatalogSource(source));
    if (JSON.stringify(migrated) !== String(raw)) await this.saveSources(context, migrated);
    return migrated;
  }

  async saveSources(context: Context, sources: Array<CatalogSource>): Promise<void> {
    const prefs = await preferences.getPreferences(context, 'catalog_sources');
    await prefs.put('sources', JSON.stringify(sources));
    await prefs.flush();
  }

  async getCatalog(context: Context, sourceId: string, lang: ReferenceLang): Promise<Array<ReferenceDocSummary>> {
    const prefs = await preferences.getPreferences(context, 'catalog_sources');
    const raw = await prefs.get(`catalog:${sourceId}:${lang}`, '[]');
    return JSON.parse(String(raw)) as Array<ReferenceDocSummary>;
  }

  async saveCatalog(context: Context, sourceId: string, lang: ReferenceLang, docs: Array<ReferenceDocSummary>): Promise<void> {
    const prefs = await preferences.getPreferences(context, 'catalog_sources');
    await prefs.put(`catalog:${sourceId}:${lang}`, JSON.stringify(docs));
    await prefs.flush();
  }
}
