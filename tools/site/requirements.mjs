import { renderPage } from './fragments.mjs'

export const REQUIREMENTS = [
  { id: 'create-checklist', title: '创建清单', output: '一个 Markdown 文件',
    description: '给出主题、读者和适用范围，让大模型整理成适合速查、卡片阅读与自测的清单。',
    next: '粘贴后补充：请为我创建一份【主题】清单，面向【读者】，适用于【版本或环境】。' },
  { id: 'create-catalog', title: '创建清单列表', output: '一个 catalog.json 文件',
    description: '提供已有清单文件及链接，让大模型生成可添加到应用中的清单源目录。',
    next: '粘贴后补充：以下是我的清单文件、语言和链接，目录将发布在【地址】。' },
]

function escapeHtml(text) {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

export function renderRequirementsPage(documents) {
  return renderPage({
    title: '创建清单与清单列表 - 速记清单',
    description: '查看、下载或一键复制创建清单与清单列表的完整要求，粘贴给大模型即可开始。',
    active: 'create',
    body: `<div class="wrap section">
      <h1>让大模型帮你创建清单</h1>
      <p class="section-lead">选择一份要求，一键复制给大模型，再补充你的主题或文件链接。两份要求均可独立下载使用。</p>
      <p>单个清单用于阅读和自测；清单列表用于汇总多个清单的文件链接，作为应用的清单源。</p>
      <div class="grid-2 requirement-grid">
        ${documents.map((doc) => `<article class="card requirement-card" id="${doc.id}">
          <p class="kicker">${doc.output}</p>
          <h2>${doc.title}</h2>
          <p>${doc.description}</p>
          <div class="hero-actions">
            <button class="btn btn-primary" type="button" data-copy-requirement="${doc.id}" aria-label="一键复制给大模型：${doc.title}的要求">一键复制给大模型</button>
            <a class="btn" href="./requirements/${doc.id}.md" download>下载要求文件</a>
          </div>
          <p class="requirement-status" id="${doc.id}-status" role="status" aria-live="polite"></p>
          <p class="requirement-next">${doc.next}</p>
          <details>
            <summary>查看完整要求</summary>
            <label class="requirement-label" for="${doc.id}-content">${doc.title}的完整要求（可选中复制）</label>
            <textarea class="requirement-content" id="${doc.id}-content" readonly spellcheck="false" rows="20">${escapeHtml(doc.content)}</textarea>
          </details>
        </article>`).join('\n')}
      </div>
      <section class="section">
        <h2>生成后如何使用</h2>
        <ol>
          <li>将生成的 Markdown 文件通过应用“设置 → 导入本地 Markdown”打开，或托管后添加其在线链接。</li>
          <li>有多份清单时，让大模型生成 <code>catalog.json</code>，与清单文件一同托管。</li>
          <li>在“设置 → 清单源”填写目录地址，即可浏览其中的清单。</li>
        </ol>
        <p><a href="./files">浏览现有清单</a> · <a href="./catalog.json">查看官方目录示例</a></p>
      </section>
      <noscript><p>展开“查看完整要求”可手动选中复制，也可下载独立要求文件。启用 JavaScript 后可一键复制。</p></noscript>
    </div>
    <script src="./requirements.js" defer></script>`,
  })
}
