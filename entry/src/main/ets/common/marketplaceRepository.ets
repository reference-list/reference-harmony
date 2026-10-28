import http from '@ohos.net.http';
import preferences from '@ohos.data.preferences';
import util from '@ohos.util';
import { MARKETPLACE_URL, parseMarketplaceIndex } from './marketplaceModels';
import type { MarketplaceCatalog } from './marketplaceModels';

/** 先展示缓存或随包目录，再由官网更新；网络请求有独立的总时限。 */
export class MarketplaceRepository {
  async getCached(context: Context): Promise<Array<MarketplaceCatalog>> {
    try {
      const prefs = await preferences.getPreferences(context, 'marketplace');
      const raw = await prefs.get('index', '');
      if (typeof raw === 'string' && raw) return parseMarketplaceIndex(raw);
    } catch (_) {
      // 本地缓存暂不可用时读取随包目录。
    }
    const bytes = await context.resourceManager.getRawFileContent('marketplace.json');
    return parseMarketplaceIndex(new util.TextDecoder('utf-8').decodeToString(bytes));
  }

  async fetchCatalogs(address: string = MARKETPLACE_URL): Promise<Array<MarketplaceCatalog>> {
    const request = http.createHttp();
    let timer: number = -1;
    try {
      const pending = request.request(address, {
        method: http.RequestMethod.GET,
        header: { 'Accept': 'application/json', 'User-Agent': 'QuickReference-HarmonyOS' },
        expectDataType: http.HttpDataType.STRING,
        connectTimeout: 5000,
        readTimeout: 8000,
      });
      const timeout = new Promise<http.HttpResponse>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('集市更新超时，请点击刷新重试')), 10000);
      });
      const response = await Promise.race([pending, timeout]);
      if (response.responseCode !== 200) throw new Error(`HTTP ${response.responseCode}`);
      return parseMarketplaceIndex(String(response.result ?? ''));
    } finally {
      if (timer >= 0) clearTimeout(timer);
      request.destroy();
    }
  }

  async saveCache(context: Context, catalogs: Array<MarketplaceCatalog>): Promise<void> {
    const prefs = await preferences.getPreferences(context, 'marketplace');
    await prefs.put('index', JSON.stringify({ version: 1, catalogs }));
    await prefs.flush();
  }
}
