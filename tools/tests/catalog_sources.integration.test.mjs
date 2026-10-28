import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import vm from 'node:vm'

// 执行产品 .ets 模块；平台 HTTP/Preferences 由本地 HTTP 和磁盘适配，ArkTS 兼容性另由 hvigor 验证。
const require = createRequire(import.meta.url)
function loadTypeScript() {
  if (process.env.TYPESCRIPT_PATH) return require(process.env.TYPESCRIPT_PATH)
  try { return require('typescript') } catch {}
  const wrapper = realpathSync(execFileSync(process.platform === 'win32' ? 'where' : 'which', ['hvigorw'], { encoding: 'utf8' }).trim().split(/\r?\n/)[0])
  return require(path.resolve(path.dirname(wrapper), '../codelinter/node_modules/typescript'))
}
const ts = loadTypeScript()
const root = path.resolve(import.meta.dirname, '../..')
const prefsDir = mkdtempSync(path.join(tmpdir(), 'catalog-sources-'))
const preferenceStores = new Map()
const platform = {
  '@ohos.url': { URL },
  '@ohos.util': { TextDecoder: class { decodeToString(bytes) { return new TextDecoder().decode(bytes) } } },
  '@ohos.data.preferences': {
    async getPreferences(_context, name) {
      if (!preferenceStores.has(name)) {
        const file = path.join(prefsDir, `${encodeURIComponent(name)}.json`)
        const data = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {}
        preferenceStores.set(name, {
          async get(key, fallback) { return data[key] ?? fallback },
          async put(key, value) { data[key] = value },
          async flush() { writeFileSync(file, JSON.stringify(data)) },
        })
      }
      return preferenceStores.get(name)
    },
  },
  '@ohos.net.http': {
    RequestMethod: { GET: 'GET' },
    HttpDataType: { STRING: 0 },
    createHttp() {
      return {
        async request(address) {
          const response = await fetch(address, { signal: AbortSignal.timeout(20000) })
          return { responseCode: response.status, result: await response.text() }
        },
        destroy() {},
      }
    },
  },
}
const modules = new Map()
function loadEts(file) {
  if (modules.has(file)) return modules.get(file)
  const module = { exports: {} }
  const output = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    fileName: file.replace(/\.ets$/, '.ts'),
  }).outputText
  vm.runInThisContext(`(function(require, module, exports) {${output}\n})`, { filename: file })(
    (id) => platform[id] || loadEts(path.resolve(path.dirname(file), `${id}.ets`)), module, module.exports,
  )
  modules.set(file, module.exports)
  return module.exports
}
const persisted = (value) => JSON.parse(JSON.stringify(value))
const load = (name) => loadEts(path.join(root, 'entry/src/main/ets/common', `${name}.ets`))
const models = load('catalogSourceModels')
const marketModels = load('marketplaceModels')
const { MarketplaceRepository } = load('marketplaceRepository')
const { CatalogSourceRepository } = load('catalogSourceRepository')
const { OnlineCatalogRepository } = load('onlineCatalogRepository')
const { OnlineMdRepository } = load('onlineMdRepository')
const { formatCatalogError } = load('catalogError')
const storage = new CatalogSourceRepository()
const network = new OnlineCatalogRepository()
const markdown = new OnlineMdRepository()
const fixture = { items: [
  { id: 'cloud_git', lang: 'zh', name: 'Git 清单', mdUrl: './mds/zh/git.md' },
  { id: 'cloud_git', lang: 'en', name: 'Git cheatsheet', mdUrl: './mds/en/git.md' },
] }
const requestedPaths = []
const server = createServer((req, res) => {
  requestedPaths.push(req.url)
  if (req.url === '/marketplace.json') {
    res.end(JSON.stringify({ version: 1, catalogs: [
      { id: 'team-tools', name: '团队工具清单', nameEn: 'Team Tools', description: '开发速查与工作流', catalogUrl: `${origin}/catalog.json`, author: '示例团队', tags: ['Git', '开发工具'], languages: ['zh', 'en'] },
      { id: 'linux-tools', name: 'Linux 终端清单', description: '终端命令', catalogUrl: `${origin}/files.html`, tags: ['Linux', '终端'], languages: ['zh'] },
    ] }))
  } else if (['/create.html', '/requirements/create-checklist.md', '/requirements/create-catalog.md'].includes(req.url)) {
    res.end(readFileSync(path.join(root, 'dist', req.url)))
  } else if (req.url === '/requirements-example/catalog.json') {
    const prompt = readFileSync(path.join(root, 'tools/site/requirements/create-catalog.md'), 'utf8')
    res.end(prompt.match(/```json\n([\s\S]*?)\n```/)[1])
  } else if (req.url.startsWith('/requirements-example/mds/')) {
    const prompt = readFileSync(path.join(root, 'tools/site/requirements/create-checklist.md'), 'utf8')
    res.end(prompt.match(/````markdown\n([\s\S]*?)\n````/)[1])
  } else if (req.url.endsWith('.md')) {
    res.end('# Git 清单\n\n## 常用命令\n\n| 命令 | 说明 |\n| --- | --- |\n| git status | 查看状态 |\n')
  } else if (req.url.startsWith('/api/v1/catalog')) {
    res.end(JSON.stringify(fixture))
  } else if (req.url === '/files.html' || req.url === '/legacy/files.html') {
    res.end('<h1>备忘清单文件列表</h1><a href="mds/zh/git.md">Git</a><a href="mds/zh/git.md">下载</a><a href="mds/en/git.md">EN</a>')
  } else if (req.url === '/catalog.json') {
    res.end(JSON.stringify(fixture))
  } else if (req.url === '/built/catalog.json') {
    res.end(readFileSync(path.join(root, 'dist/catalog.json')))
  } else {
    res.writeHead(404).end()
  }
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`
after(async () => {
  await new Promise((resolve) => server.close(resolve))
  rmSync(prefsDir, { recursive: true, force: true })
})

let sources
let custom
let zhDocs

test('首次初始化官方源，仅用地址添加源并在重启后保留自动名称', async () => {
  sources = await storage.getSources({})
  assert.equal(sources.length, 1)
  assert.equal(sources[0].url, 'https://reference.jqknono.com/catalog.json')
  assert.equal(sources[0].enabled, true)
  assert.ok(sources[0].name)
  sources = models.addCatalogSource(sources, origin)
  await storage.saveSources({}, sources)
  preferenceStores.clear()
  sources = await new CatalogSourceRepository().getSources({})
  custom = sources[1]
  assert.equal(custom.name, '127.0.0.1')
  const sameHost = models.addCatalogSource(sources, `${origin}/catalog.json`)
  assert.equal(sameHost[2].name, '127.0.0.1_2')
  assert.equal(sources.length, 2)
})

test('从具名源读取目录、打开 Markdown、生成卡片并持久化离线缓存', async () => {
  zhDocs = await network.fetchCatalog('zh', custom)
  assert.equal(zhDocs.length, 1)
  assert.equal(zhDocs[0].sourceName, '127.0.0.1')
  assert.equal(zhDocs[0].file, `cloud:${origin}/mds/zh/git.md`)
  const parsed = await markdown.fetchAndParse(zhDocs[0].file.slice('cloud:'.length))
  assert.equal(parsed.success, true)
  assert.ok(parsed.doc.cards.length > 0)
  await markdown.saveDocToCache({}, zhDocs[0].id, parsed.doc)
  await storage.saveCatalog({}, custom.id, 'zh', zhDocs)
  preferenceStores.clear()
  assert.deepEqual(await storage.getCatalog({}, custom.id, 'zh'), persisted(zhDocs))
  assert.deepEqual(await markdown.getDocFromCache({}, zhDocs[0].id), persisted(parsed.doc))
})

test('自动名称跳过已有名称与停用占位，追加后缀并持久化和读取目录', async () => {
  const previous = await storage.getSources({})
  const reserved = [
    { ...models.defaultCatalogSource(), name: '127.0.0.1', enabled: false },
    { ...custom, name: '127.0.0.1_2' },
  ]
  let named = models.addCatalogSource(reserved, `${origin}/catalog.json`)
  named = models.addCatalogSource(named, `${origin}/files.html`)
  assert.deepEqual(named.map((source) => source.name), ['127.0.0.1', '127.0.0.1_2', '127.0.0.1_3', '127.0.0.1_4'])
  assert.equal(named[0].enabled, false)
  try {
    await storage.saveSources({}, named)
    preferenceStores.clear()
    const reloaded = await new CatalogSourceRepository().getSources({})
    assert.deepEqual(reloaded, persisted(named))
    const docs = await network.fetchCatalog('zh', reloaded[2])
    assert.equal(docs[0].sourceName, '127.0.0.1_3')
    assert.equal(docs[0].file, `cloud:${origin}/mds/zh/git.md`)
  } finally {
    await storage.saveSources({}, previous)
  }
})

test('多个源同名清单和中英文目录保持独立身份与缓存', async () => {
  const second = { ...custom, id: 'second', name: '另一个团队' }
  const secondDocs = await network.fetchCatalog('zh', second)
  const enDocs = await network.fetchCatalog('en', custom)
  assert.equal(enDocs.length, 1)
  assert.equal(enDocs[0].name, 'Git cheatsheet')
  assert.equal(new Set([zhDocs[0].id, secondDocs[0].id, enDocs[0].id]).size, 3)
  await storage.saveCatalog({}, custom.id, 'en', enDocs)
  assert.deepEqual(await storage.getCatalog({}, custom.id, 'zh'), persisted(zhDocs))
  assert.deepEqual(await storage.getCatalog({}, custom.id, 'en'), persisted(enDocs))
  const merged = models.mergeCatalogSourceDocs(second, secondDocs, [], zhDocs, 'zh', new Set())
  assert.equal(merged.length, 2)
})

test('删除默认源后重启保留占位，恢复后复用文档身份与收藏记录', async () => {
  const original = sources[0]
  const officialDocs = await network.fetchCatalog('zh', original, origin)
  const favorites = [officialDocs[0].id]
  await storage.saveCatalog({}, original.id, 'zh', officialDocs)
  sources = models.removeCatalogSource(sources, original.id)
  await storage.saveSources({}, sources)
  preferenceStores.clear()
  sources = await storage.getSources({})
  assert.equal(sources[0].enabled, false)
  assert.equal(sources[0].name, original.name)
  assert.equal(models.mergeCatalogSourceDocs(sources[0], officialDocs, [], officialDocs, 'zh', new Set()).length, 0)
  sources = models.restoreDefaultCatalogSource(sources)
  await storage.saveSources({}, sources)
  preferenceStores.clear()
  assert.equal((await storage.getSources({}))[0].enabled, true)
  const restored = await storage.getCatalog({}, original.id, 'zh')
  assert.equal(restored[0].id, favorites[0])
  // 官方源与内置同名文档保持一个入口，旧收藏使用的 git 标识继续有效。
  const offline = [{ ...restored[0], id: 'git', file: 'reference/zh/git.json' }]
  assert.equal(models.mergeCatalogSourceDocs(sources[0], restored, offline, [], 'zh', new Set()).length, 0)
})

test('兼容已有静态文件列表和 API，链接去重并按语言加载', async () => {
  const htmlDocs = await network.fetchCatalog('zh', { ...custom, url: `${origin}/files.html` })
  const apiDocs = await network.fetchCatalog('zh', { ...custom, url: `${origin}/api/v1/catalog` })
  assert.equal(htmlDocs.length, 1)
  assert.equal(htmlDocs[0].id, apiDocs[0].id)
  assert.equal(htmlDocs[0].file, zhDocs[0].file)
})

test('官网构建产物可作为清单源读取，源删除后重启保留其缓存', async () => {
  const built = await network.fetchCatalog('zh', { ...custom, url: `${origin}/built/catalog.json` })
  assert.ok(built.length > 100)
  assert.ok(built.every((doc) => doc.file.startsWith(`cloud:${origin}/built/mds/zh/`)))
  sources = models.removeCatalogSource(sources, custom.id)
  await storage.saveSources({}, sources)
  preferenceStores.clear()
  assert.equal((await storage.getSources({})).length, 1)
  assert.deepEqual(await storage.getCatalog({}, custom.id, 'zh'), persisted(zhDocs))
})

if (process.env.TEST_LIVE_CATALOG === '1') {
  test('默认公网源完整读取中英文目录并打开真实 Markdown', async () => {
    const source = models.defaultCatalogSource()
    const zh = await network.fetchCatalog('zh', source)
    const en = await network.fetchCatalog('en', source)
    assert.ok(zh.length > 100)
    assert.ok(en.length > 100)
    const parsed = await markdown.fetchAndParse(zh[0].file.slice('cloud:'.length))
    assert.equal(parsed.success, true)
    assert.ok(parsed.doc.cards.length > 0)
    console.log(`公网源校验：中文 ${zh.length}，英文 ${en.length}，首篇 ${parsed.doc.cards.length} 张卡片`)
  })
}


test('原生网络诊断经目录层和显示层转换后完整保留错误码及说明', () => {
  const nativeError = { code: 2300007, message: 'Failed to connect to the server.' }
  const catalogMessage = formatCatalogError(nativeError, 'zh')
  const displayedMessage = formatCatalogError(new Error(`/files.html: ${catalogMessage}`), 'zh')
  assert.ok(displayedMessage.includes('无法连接清单源'))
  assert.ok(displayedMessage.includes('2300007'))
  assert.ok(displayedMessage.includes('Failed to connect to the server.'))
  assert.ok(displayedMessage.includes('/files.html'))
  assert.equal(displayedMessage.includes('[object Object]'), false)
})

test('自动发现静态文件列表并在后续刷新复用成功入口', async () => {
  const source = { ...custom, url: `${origin}/legacy` }
  const discovered = await network.fetchCatalog('zh', source)
  assert.equal(discovered.length, 1)
  const start = requestedPaths.length
  const refreshed = await network.fetchCatalog('zh', source)
  assert.equal(refreshed[0].id, discovered[0].id)
  assert.deepEqual(requestedPaths.slice(start), ['/legacy/files.html'])
})


test('旧官方源迁移到 catalog 文件，保留名称、移除状态及稳定标识', async () => {
  const previous = [{ id: 'reference', name: '我的官方目录', url: 'https://reference.jqknono.com', enabled: false }]
  await storage.saveSources({}, previous)
  preferenceStores.clear()
  const migrated = await storage.getSources({})
  assert.equal(migrated[0].url, 'https://reference.jqknono.com/catalog.json')
  assert.equal(migrated[0].name, previous[0].name)
  assert.equal(migrated[0].id, previous[0].id)
  assert.equal(migrated[0].enabled, false)
  preferenceStores.clear()
  assert.deepEqual(await storage.getSources({}), migrated)
  const catalog = JSON.parse(readFileSync(path.join(root, 'dist/catalog.json'), 'utf8'))
  assert.equal(catalog.name, '速记清单官方源')
  assert.equal(catalog.items.length, 402)
  for (const item of catalog.items) {
    assert.ok(item.name && item.lang && item.mdUrl)
    assert.ok(existsSync(path.join(root, 'dist', item.mdUrl)))
  }
})


test('官网提供两份独立要求，网页展示正文与下载文件保持一致', async () => {
  const page = await (await fetch(`${origin}/create.html`)).text()
  for (const id of ['create-checklist', 'create-catalog']) {
    const source = readFileSync(path.join(root, 'tools/site/requirements', `${id}.md`), 'utf8')
    const downloaded = await (await fetch(`${origin}/requirements/${id}.md`)).text()
    assert.equal(downloaded, source)
    const escaped = source.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
    assert.ok(page.includes(escaped))
    assert.ok(page.includes(`data-copy-requirement="${id}"`))
    assert.ok(page.includes(`href="./requirements/${id}.md" download`))
  }
  assert.ok(page.includes('一键复制给大模型'))
  assert.ok(page.includes('aria-live="polite"'))
  assert.ok(readFileSync(path.join(root, 'dist/index.html'), 'utf8').includes('href="./create"'))
  assert.ok(readFileSync(path.join(root, 'dist/files.html'), 'utf8').includes('href="./create"'))
})

test('要求中的目录和 Markdown 示例可由应用读取并生成章节与卡片', async () => {
  const source = models.addCatalogSource([], `${origin}/requirements-example/catalog.json`)[0]
  const docs = await network.fetchCatalog('zh', source)
  const english = await network.fetchCatalog('en', source)
  assert.equal(docs.length, 1)
  assert.equal(english.length, 1)
  assert.equal(docs[0].name, 'Git 常用命令')
  assert.equal(english[0].name, 'Git Basics')
  const parsed = await markdown.fetchAndParse(docs[0].file.slice('cloud:'.length))
  assert.equal(parsed.success, true)
  assert.ok(parsed.doc.sections.some(section => section.title === '工作区'))
  assert.ok(parsed.doc.sections.some(section => section.title === '历史记录'))
  assert.ok(parsed.doc.cards.length >= 2)
  assert.ok(JSON.stringify(parsed.doc).includes('git'))
})


test('集市从随包目录启动，在线更新后可跨重启搜索缓存', async () => {
  const bundled = readFileSync(path.join(root, 'entry/src/main/resources/rawfile/marketplace.json'), 'utf8')
  assert.equal(readFileSync(path.join(root, 'dist/marketplace.json'), 'utf8'), bundled)
  const context = { resourceManager: { async getRawFileContent() { return new TextEncoder().encode(bundled) } } }
  const market = new MarketplaceRepository()
  const initial = await market.getCached(context)
  assert.equal(initial[0].catalogUrl, models.DEFAULT_CATALOG_SOURCE_URL)
  const online = await market.fetchCatalogs(`${origin}/marketplace.json`)
  assert.equal(online.length, 2)
  await market.saveCache(context, online)
  preferenceStores.clear()
  const cached = await new MarketplaceRepository().getCached(context)
  assert.deepEqual(cached, persisted(online))
  assert.equal(marketModels.searchMarketplace(cached, '  工具   gIT  ')[0].id, 'team-tools')
  assert.equal(marketModels.searchMarketplace(cached, 'TEAM')[0].id, 'team-tools')
  assert.equal(marketModels.searchMarketplace(cached, '127.0.0.1').length, 2)
  assert.equal(marketModels.searchMarketplace(cached, 'linux 终端')[0].id, 'linux-tools')
  assert.equal(marketModels.searchMarketplace(cached, '   ').length, 2)
})

test('集市添加目录后可读取清单，重复添加和恢复官方源保留身份', async () => {
  const officialItem = marketModels.parseMarketplaceIndex(readFileSync(path.join(root, 'dist/marketplace.json'), 'utf8'))[0]
  const original = models.defaultCatalogSource()
  const removed = models.removeCatalogSource([original], original.id)
  const restored = marketModels.addMarketplaceCatalog(removed, officialItem)
  assert.deepEqual(restored, [original])
  assert.equal(marketModels.addMarketplaceCatalog(restored, officialItem), restored)
  const market = new MarketplaceRepository()
  const item = (await market.fetchCatalogs(`${origin}/marketplace.json`))[0]
  const added = marketModels.addMarketplaceCatalog(restored, item)
  const subscribed = marketModels.marketplaceSource(added, item)
  assert.equal(subscribed.name, '127.0.0.1')
  assert.equal(marketModels.addMarketplaceCatalog(added, item), added)
  const before = await storage.getSources({})
  try {
    await storage.saveSources({}, added)
    preferenceStores.clear()
    const reloaded = await storage.getSources({})
    const source = marketModels.marketplaceSource(reloaded, item)
    assert.equal(source.id, subscribed.id)
    const docs = await network.fetchCatalog('zh', source)
    assert.equal(docs.length, 1)
    const parsed = await markdown.fetchAndParse(docs[0].file.slice('cloud:'.length))
    assert.equal(parsed.success, true)
    assert.ok(parsed.doc.cards.length > 0)
  } finally {
    await storage.saveSources({}, before)
  }
})
