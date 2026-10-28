import { SITE } from './config.mjs'

const NAV_ICONS = {
  home: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/>',
  features: '<rect x="4" y="4" width="7" height="7" rx="1.2"/><rect x="13" y="4" width="7" height="7" rx="1.2"/><rect x="4" y="13" width="7" height="7" rx="1.2"/><rect x="13" y="13" width="7" height="7" rx="1.2"/>',
  screens: '<rect x="8" y="3" width="8" height="18" rx="2"/><path d="M11 18.5h2"/>',
  files: '<path d="M7 4h7l4 4v12H7z"/><path d="M14 4v4h4"/><path d="M9.5 12h5M9.5 15.5h5"/>',
  create: '<path d="M12 5v14M5 12h14"/>',
  terms: '<path d="M7 3.5h7l4 4V20.5H7z"/><path d="M14 3.5V8h4"/><path d="M9.5 12h5M9.5 15h3.5"/>',
  privacy: '<path d="M12 3.5 19 6.5v5.2c0 4.3-2.8 7.4-7 8.8-4.2-1.4-7-4.5-7-8.8V6.5z"/><path d="M9.5 12.2 11.3 14l3.4-3.6"/>',
  store: '<path d="M4.5 10h15l-1.2 8.2a2 2 0 0 1-2 1.8H7.7a2 2 0 0 1-2-1.8z"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/>',
}

function navIcon(id) {
  return `<svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">${NAV_ICONS[id]}</svg>`
}

export function renderHeader(active) {
  const item = (href, id, label) => {
    const cls = active === id ? ' class="active"' : ''
    return `<a${cls} href="${href}">${navIcon(id)}${label}</a>`
  }
  return `<header class="site-header">
      <div class="header-inner">
        <a class="brand" href="./">
          <img src="./assets/app-icon.png" alt="速记清单应用图标" />
          <span>速记清单</span>
        </a>
        <nav class="nav" aria-label="网站导航">
          ${item('./', 'home', '首页')}
          ${item('./#features', 'features', '功能介绍')}
          ${item('./#screens', 'screens', '应用界面')}
          ${item('./files', 'files', '备忘清单')}
          ${item('./create', 'create', '创建清单')}
          ${item('./terms', 'terms', '用户协议')}
          ${item('./privacy', 'privacy', '隐私政策')}
          <a href="${SITE.appGallery}" target="_blank" rel="noreferrer">${navIcon('store')}华为应用市场</a>
        </nav>
      </div>
    </header>`
}

export function renderFooter() {
  return `<footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-grid">
          <div>
            <h2>速记清单</h2>
            <p>应用名称：速记清单（${SITE.appNameEn}）</p>
            <p>应用包名：${SITE.bundleName}</p>
            <p>版权所有者：${SITE.developerEntity}</p>
            <p>经营者：${SITE.operator}</p>
            <p>统一社会信用代码：${SITE.creditCode}</p>
          </div>
          <div>
            <h2>联系方式</h2>
            <p>电子邮箱：<a href="mailto:${SITE.email}">${SITE.email}</a></p>
            <p>开源地址：<a href="${SITE.github}" target="_blank" rel="noreferrer">GitHub</a></p>
            <p>应用下载：<a href="${SITE.appGallery}" target="_blank" rel="noreferrer">华为应用市场</a></p>
          </div>
          <div>
            <h2>网站信息</h2>
            <ul>
              <li><a href="./files">备忘清单文件列表</a></li>
              <li><a href="./create">创建清单与清单列表</a></li>
              <li><a href="./terms">用户协议</a></li>
              <li><a href="./privacy">隐私政策</a></li>
              <li>网站备案：<a href="${SITE.beianUrl}" target="_blank" rel="noreferrer">${SITE.icp}</a></li>
              <li>App 备案：<a href="${SITE.beianUrl}" target="_blank" rel="noreferrer">${SITE.appIcp}</a></li>
            </ul>
          </div>
        </div>
        <div class="copyright">
          © ${SITE.year} ${SITE.developerEntity} 版权所有 ·
          网站备案：<a href="${SITE.beianUrl}" target="_blank" rel="noreferrer">${SITE.icp}</a> ·
          App 备案：<a href="${SITE.beianUrl}" target="_blank" rel="noreferrer">${SITE.appIcp}</a>
        </div>
      </div>
    </footer>`
}

function phone(title, selectedTab, inner) {
  const tabs = ['目录', '清单', '测验', '集市', '设置']
    .map((name) => (name === selectedTab ? `<b>${name}</b>` : `<span>${name}</span>`))
    .join('')
  return `<figure class="phone-card">
            <figcaption>速记清单 · ${title}</figcaption>
            <div class="phone" role="img" aria-label="速记清单${title}界面示意图">
              <div class="status"><span>09:41</span><span>100%</span></div>
              ${inner}
              <div class="tabs">${tabs}</div>
            </div>
          </figure>`
}

export function renderPhones() {
  return `<div class="phones">
        ${phone(
          '目录',
          '目录',
          `<div class="app-head">目录</div>
              <div class="search-fake">搜索清单</div>
              <div class="row"><div><b>Git</b><span>12章 / 36卡片</span></div><span>›</span></div>
              <div class="row"><div><b>Docker</b><span>9章 / 28卡片</span></div><span>›</span></div>
              <div class="row"><div><b>Python</b><span>15章 / 42卡片</span></div><span>›</span></div>
              <div class="row"><div><b>Linux 命令</b><span>18章 / 51卡片</span></div><span>›</span></div>`,
        )}
        ${phone(
          '清单阅读',
          '清单',
          `<div class="app-head">Git</div>
              <div class="chip-row"><span class="chip">常用命令</span><span class="chip">分支</span><span class="chip">远程</span></div>
              <div class="code-card"><b>查看状态</b><pre>git status</pre></div>
              <div class="code-card"><b>添加文件</b><pre>git add .</pre></div>
              <div class="code-card"><b>提交更改</b><pre>git commit -m "msg"</pre></div>`,
        )}
        ${phone(
          '测验',
          '测验',
          `<div class="app-head">测验</div>
              <div class="qa"><b>Git · 第 2 / 10 题</b><p>下列哪条命令用于查看工作区状态？</p>
                <div class="option">A. git log</div>
                <div class="option on">B. git status</div>
                <div class="option">C. git push</div>
                <div class="option">D. git clone</div>
              </div>
              <div class="confirm">确认答案</div>`,
        )}
        ${phone(
          '设置',
          '设置',
          `<div class="app-head">设置</div>
              <div class="setting"><b>语言</b><span>中文</span></div>
              <div class="setting"><b>主题</b><span>浅色</span></div>
              <div class="setting"><b>业务与隐私的声明</b><span>›</span></div>
              <div class="setting">
                <img class="about-icon" src="./assets/app-icon.png" alt="" />
                <b>速记清单</b>
                <span>版本 0.23.0 · ${SITE.operator}</span>
              </div>`,
        )}
      </div>`
}

export function renderPage({ title, description, active, body }) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="author" content="${SITE.developerEntity}" />
    <link rel="icon" href="./assets/app-icon.png" />
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <a class="skip" href="#main">跳到正文</a>
    ${renderHeader(active)}
    <main id="main">
      ${body}
    </main>
    ${renderFooter()}
  </body>
</html>
`
}
