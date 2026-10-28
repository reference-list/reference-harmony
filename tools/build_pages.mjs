import { REQUIREMENTS, renderRequirementsPage } from './site/requirements.mjs'
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { renderIndexPage, renderFilesPage, renderTermsPage, renderPrivacyPage, renderNotFoundPage } from './site/pages.mjs'

const PROJECT_ROOT = process.cwd()
const SRC_MDS_DIR = path.join(PROJECT_ROOT, 'mds')
const DIST_DIR = path.join(PROJECT_ROOT, 'dist')
const DIST_MDS_DIR = path.join(DIST_DIR, 'mds')

function getArgValue(name) {
  const prefix = `--${name}=`
  const hit = process.argv.find((a) => a.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : ''
}

function normalizeDomain(domain) {
  let d = (domain || '').trim()
  if (!d) return ''
  if (!/^https?:\/\//i.test(d)) d = `https://${d}`
  if (!d.endsWith('/')) d += '/'
  return d
}

function toDownloadUrl(domain, relPath) {
  if (!domain) return relPath.replace(/\\/g, '/')
  return new URL(relPath.replace(/\\/g, '/'), domain).toString()
}

function humanKiB(bytes) {
  const kib = bytes / 1024
  if (kib < 1024) return `${kib.toFixed(1)} KiB`
  return `${(kib / 1024).toFixed(1)} MiB`
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

async function walkFiles(dirAbs, baseAbs) {
  const entries = await readdir(dirAbs, { withFileTypes: true })
  const out = []
  for (const e of entries) {
    const abs = path.join(dirAbs, e.name)
    if (e.isDirectory()) {
      out.push(...(await walkFiles(abs, baseAbs)))
      continue
    }
    if (e.isFile()) out.push(path.relative(baseAbs, abs))
  }
  return out
}

function detectLang(rel) {
  const normalized = rel.replace(/\\/g, '/')
  if (normalized.startsWith('zh/')) return 'zh'
  if (normalized.startsWith('en/')) return 'en'
  return '-'
}

function catalogScript() {
  return `<script>
      (function () {
        var tbody = document.getElementById('tbody');
        if (!tbody) return;
        var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr'));
        var input = document.getElementById('q');
        if (input) {
          input.addEventListener('input', function () {
            var q = (input.value || '').trim().toLowerCase();
            rows.forEach(function (tr) {
              var text = (tr.querySelector('.path') || tr).textContent.toLowerCase();
              tr.style.display = !q || text.indexOf(q) !== -1 ? '' : 'none';
            });
          });
        }
        tbody.addEventListener('click', function (e) {
          var btn = e.target.closest('.btn[data-url]');
          if (!btn) return;
          var url = btn.getAttribute('data-url');
          var abs = new URL(url, location.href).toString();
          navigator.clipboard.writeText(abs).then(function () {
            var orig = btn.textContent;
            btn.textContent = '已复制';
            btn.classList.add('copied');
            setTimeout(function () {
              btn.textContent = orig;
              btn.classList.remove('copied');
            }, 1500);
          });
        });
      })();
    </script>`
}

const domain = normalizeDomain(getArgValue('domain') || process.env.SITE_DOMAIN || '')
if (!domain) {
  console.warn(
    '未提供 --domain 或 SITE_DOMAIN：将生成相对链接（推荐用于 GitHub Pages / 自定义域名场景）。',
  )
}

await rm(DIST_DIR, { recursive: true, force: true })
await mkdir(DIST_MDS_DIR, { recursive: true })
await cp(SRC_MDS_DIR, DIST_MDS_DIR, { recursive: true })

const assetsDir = path.join(DIST_DIR, 'assets')
await mkdir(assetsDir, { recursive: true })
await cp(path.join(PROJECT_ROOT, 'AppScope/resources/base/media/app_icon.png'), path.join(assetsDir, 'app-icon.png'))
await cp(
  path.join(PROJECT_ROOT, 'assets/https___appgallery.huawei.com_app_detail_id=reference.app.jqknono.com.png'),
  path.join(assetsDir, 'appgallery-qr.png'),
)
await cp(path.join(PROJECT_ROOT, 'assets/runtime-flow.png'), path.join(assetsDir, 'runtime-flow.png'))
await cp(path.join(PROJECT_ROOT, 'tools/site/styles.css'), path.join(DIST_DIR, 'styles.css'))
await cp(path.join(PROJECT_ROOT, 'entry/src/main/resources/rawfile/marketplace.json'), path.join(DIST_DIR, 'marketplace.json'))
await cp(path.join(PROJECT_ROOT, 'tools/site/requirements'), path.join(DIST_DIR, 'requirements'), { recursive: true })
await cp(path.join(PROJECT_ROOT, 'tools/site/requirements.js'), path.join(DIST_DIR, 'requirements.js'))
const requirementDocuments = await Promise.all(REQUIREMENTS.map(async (doc) => ({
  ...doc,
  content: await readFile(path.join(PROJECT_ROOT, 'tools/site/requirements', `${doc.id}.md`), 'utf8'),
})))
await writeFile(path.join(DIST_DIR, 'create.html'), renderRequirementsPage(requirementDocuments), 'utf8')

const relFiles = (await walkFiles(SRC_MDS_DIR, SRC_MDS_DIR))
  .filter((p) => !p.startsWith('.') && !p.includes(`${path.sep}.`))
  .sort((a, b) => a.localeCompare(b))

const rows = []
const catalogItems = []
const catalogMetadata = new Map()
for (const lang of ['zh', 'en']) {
  const manifest = JSON.parse(await readFile(path.join(PROJECT_ROOT, 'entry/src/main/resources/rawfile/reference', lang, 'manifest.json'), 'utf8'))
  for (const doc of manifest.docs) catalogMetadata.set(`${lang}:${doc.id}`, doc)
}
for (const rel of relFiles) {
  const abs = path.join(SRC_MDS_DIR, rel)
  const s = await stat(abs)
  if (!s.isFile()) continue

  const relUrlPath = `mds/${rel}`.replace(/\\/g, '/')
  const downloadUrl = toDownloadUrl(domain, relUrlPath)
  const mtime = new Date(s.mtimeMs).toISOString().replace('T', ' ').replace('Z', '')
  const size = humanKiB(s.size)
  const lang = detectLang(rel)
  if (lang !== '-' && /\.(md|markdown)$/i.test(rel)) {
    const id = rel.replace(/\\/g, '/').replace(/^(zh|en)\//, '').replace(/\.(md|markdown)$/i, '')
    const metadata = catalogMetadata.get(`${lang}:${id}`)
    catalogItems.push({
      id, lang,
      name: metadata?.name || id,
      title: metadata?.title || metadata?.name || id,
      mdUrl: downloadUrl,
      sectionCount: metadata?.sectionCount || 0,
      cardCount: metadata?.cardCount || 0,
    })
  }

  rows.push(`              <tr>
                <td class="path"><a href="${escapeHtml(downloadUrl)}">${escapeHtml(relUrlPath)}</a></td>
                <td class="lang">${escapeHtml(lang)}</td>
                <td class="size">${escapeHtml(size)}</td>
                <td class="mtime">${escapeHtml(mtime)}</td>
                <td class="action">
                  <a class="btn" href="${escapeHtml(downloadUrl)}" download>下载</a>
                  <button class="btn" data-url="${escapeHtml(downloadUrl)}" type="button">复制链接</button>
                </td>
              </tr>`)
}

const filesHtml = renderFilesPage({
  fileCount: rows.length,
  tableRows: rows.join('\n'),
  catalogScript: catalogScript(),
})
const indexHtml = renderIndexPage({
  fileCount: rows.length,
})
if (!indexHtml.includes('速记清单') || !indexHtml.includes('用户协议')) {
  throw new Error('首页未包含应用名称或用户协议入口')
}
if (!filesHtml.includes('备忘清单文件列表')) {
  throw new Error('清单页未包含文件列表')
}

await writeFile(path.join(DIST_DIR, 'index.html'), indexHtml, 'utf8')
await writeFile(path.join(DIST_DIR, 'files.html'), filesHtml, 'utf8')
await writeFile(path.join(DIST_DIR, 'terms.html'), renderTermsPage(), 'utf8')
await writeFile(path.join(DIST_DIR, 'privacy.html'), renderPrivacyPage(), 'utf8')
await writeFile(path.join(DIST_DIR, '404.html'), renderNotFoundPage(), 'utf8')
await writeFile(path.join(DIST_DIR, 'catalog.json'), JSON.stringify({
  version: 1,
  name: '速记清单官方源',
  homepage: 'https://reference.jqknono.com/',
  items: catalogItems,
}, null, 2), 'utf8')

console.log(`已生成：${path.relative(PROJECT_ROOT, path.join(DIST_DIR, 'index.html'))}`)
console.log(`备忘清单文件数：${rows.length}`)
