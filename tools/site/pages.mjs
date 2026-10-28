import { SITE } from './config.mjs'
import { renderPage, renderPhones } from './fragments.mjs'

export function renderIndexPage({ fileCount }) {
  const full = `
      <div class="wrap">
        <section class="hero" id="top">
          <div>
            <div class="kicker">HARMONYOS 应用官网</div>
            <h1>速记清单</h1>
            <p class="lead">程序员的口袋知识库。把编程语言、开发框架和常用工具整理成适合手机阅读的卡片，随时离线查阅，也支持测验巩固。</p>
            <div class="hero-actions">
              <a class="btn btn-primary" href="${SITE.appGallery}" target="_blank" rel="noreferrer">前往华为应用市场下载</a>
              <a class="btn" href="./files">查看备忘清单文件列表</a>
            </div>
            <div class="meta-list">
              <div>应用名称：速记清单</div>
              <div>英文名称：${SITE.appNameEn}</div>
              <div>应用包名：${SITE.bundleName}</div>
              <div>开发者：${SITE.developerEntity}（经营者：${SITE.operator}）</div>
              <div>当前收录备忘清单：${fileCount} 份 Markdown 文件</div>
            </div>
          </div>
          <div class="hero-aside">
            <div class="qr-card">
              <img src="./assets/app-icon.png" width="108" height="108" alt="速记清单" />
            </div>
            <div class="qr-card">
              <img src="./assets/appgallery-qr.png" alt="速记清单华为应用市场下载二维码" />
              <p>华为应用市场扫码下载速记清单</p>
            </div>
          </div>
        </section>

        <section class="section" id="intro">
          <h2>应用介绍</h2>
          <p class="section-lead">速记清单面向程序员、计算机专业学生、IT 运维人员和技术爱好者，把散落的速查表变成可以搜索、收藏、测验的手机知识库。应用以内置离线数据为主，不强制登录，打开即可使用。</p>
          <div class="grid-2">
            <article class="card">
              <h3>海量内容，一网打尽</h3>
              <ul>
                <li>收录 400+ 精选技术速查表，覆盖中文与英文文档</li>
                <li>涵盖 Python、Java、JavaScript、Go、Rust、C/C++ 等编程语言</li>
                <li>囊括 React、Vue、Docker、Git、MySQL、Redis 等常用技术栈</li>
                <li>从 Linux 命令、正则表达式到 Vim 快捷键，按卡片组织，方便检索</li>
              </ul>
            </article>
            <article class="card">
              <h3>卡片学习，离线可用</h3>
              <ul>
                <li>知识点按卡片展示，支持文档内搜索和章节跳转</li>
                <li>测验模式从问答卡片抽题，查看得分与答题详情</li>
                <li>收藏夹与阅读历史帮助建立个人知识库</li>
                <li>深色 / 浅色主题、中英界面、横屏适配，地铁飞机上也可离线查阅</li>
              </ul>
            </article>
          </div>
        </section>

        <section class="section" id="features">
          <h2>服务功能详情</h2>
          <p class="section-lead">速记清单提供以下核心功能。</p>
          <div class="grid-3">
            <article class="card">
              <h3>目录</h3>
              <p>按文档列表浏览与搜索，显示章节数和卡片数；支持收藏与最近阅读分组。</p>
            </article>
            <article class="card">
              <h3>清单阅读</h3>
              <p>按章节展示文本、代码和问答卡片，支持文档内搜索、章节 Chip 导航和目录面板。</p>
            </article>
            <article class="card">
              <h3>测验</h3>
              <p>从当前文档的问答卡片中随机抽题，完成知识测验并查看得分、用时和答题详情。</p>
            </article>
            <article class="card">
              <h3>集市</h3>
              <p>按名称、标签或地址搜索清单源，将收录的目录添加到应用中浏览，支持离线查看已缓存的集市列表。</p>
            </article>
            <article class="card">
              <h3>设置</h3>
              <p>切换中英文界面和深色/浅色主题，管理在线 Markdown 链接，查看业务与隐私声明。</p>
            </article>
            <article class="card">
              <h3>离线与在线文档</h3>
              <p>默认读取应用内离线 JSON；也可添加在线 Markdown 链接或导入本地 Markdown 文件。</p>
            </article>
          </div>
        </section>

        <section class="section" id="screens">
          <h2>应用界面</h2>
          <p class="section-lead">目录、清单阅读、测验和设置的主要界面。</p>
          ${renderPhones()}
        </section>

        <section class="section" id="flow">
          <h2>应用运行流程</h2>
          <p class="section-lead">用户打开速记清单后，先加载本地设置和离线清单，再进入目录选择文档阅读或测验。下图说明应用运行逻辑。</p>
          <img class="flow" src="./assets/runtime-flow.png" alt="速记清单应用运行流程图：启动后加载设置和离线清单，进入目录、阅读、测验或设置" />
        </section>

        <section class="section" id="about">
          <h2>开发者与版权信息</h2>
          <div class="grid-2">
            <article class="card">
              <h3>版权所有者</h3>
              <p>应用名称：速记清单</p>
              <p>版权所有者：${SITE.developerEntity}</p>
              <p>经营者：${SITE.operator}</p>
              <p>统一社会信用代码：${SITE.creditCode}</p>
              <p>联系邮箱：<a href="mailto:${SITE.email}">${SITE.email}</a></p>
            </article>
            <article class="card">
              <h3>开源与数据来源</h3>
              <p>应用源码以 GPL-3.0 协议发布：<a href="${SITE.github}" target="_blank" rel="noreferrer">${SITE.github}</a></p>
              <p>中文备忘清单来源：jaywcjlove/reference（MIT）</p>
              <p>英文备忘清单来源：Fechin/reference（GPL-3.0）</p>
              <p>本站提供这些备忘清单的 <a href="./files">Markdown 文件列表</a>。</p>
            </article>
          </div>
        </section>

        <section class="section" id="create">
          <h2>用大模型创建自己的清单</h2>
          <p class="section-lead">提供两份独立要求：创建 Markdown 清单，或创建汇总文件链接的清单列表。一键复制给大模型，再补充主题或文件信息。</p>
          <a class="btn btn-primary" href="./create">查看并复制创建要求</a>
        </section>

        <section class="section" id="files">
          <h2>备忘清单文件列表</h2>
          <p class="section-lead">速记清单收录的 Markdown 源文件已放到独立页面，避免首页过长。当前共 <strong>${fileCount}</strong> 个文件，可搜索、打开和下载。</p>
          <p><a class="btn btn-primary" href="./files">打开备忘清单文件列表</a></p>
        </section>
      </div>`

  return renderPage({
    title: '速记清单 - 应用官网',
    description: '速记清单官方网站：介绍 HarmonyOS 应用速记清单的功能、界面、用户协议、隐私政策和备忘清单文件列表。',
    active: 'home',
    body: full,
  })
}


export function renderFilesPage({ fileCount, tableRows, catalogScript }) {
  const body = `
      <div class="wrap section">
        <section id="files">
          <h1>备忘清单文件列表</h1>
          <p class="section-lead">下列文件是速记清单收录的备忘清单源文件，可在线打开或下载。当前共 <strong>${fileCount}</strong> 个文件。</p>
          <p>在 App 中添加清单源时，请使用 <a href="./catalog.json">官方清单源目录（catalog.json）</a>，其中包含每个文件的名称、语言和链接。</p>
          <p>想创建自己的内容？<a href="./create">查看创建要求，一键复制给大模型</a>。</p>
          <div class="card catalog">
            <div class="toolbar">
              <div>
                <label for="q">搜索（按路径过滤）</label>
                <input id="q" type="search" placeholder="例如：mds/zh/git 或 docker" autocomplete="off" />
              </div>
            </div>
            <div style="overflow:auto">
              <table>
                <thead>
                  <tr>
                    <th>文件</th>
                    <th>语言</th>
                    <th>大小</th>
                    <th>修改时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody id="tbody">
${tableRows}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
      ${catalogScript}`
  return renderPage({
    title: '备忘清单文件列表 - 速记清单',
    description: '速记清单收录的备忘清单 Markdown 文件列表，支持搜索、打开和下载。',
    active: 'files',
    body,
  })
}

export function renderTermsPage() {
  const body = `
      <div class="wrap section">
        <article class="legal">
          <h1>速记清单用户协议</h1>
          <p>生效日期：2026 年 2 月 14 日。欢迎使用「速记清单」。请在使用本应用前阅读本协议。使用本应用即表示你理解并同意本协议。</p>
          <h2>一、协议主体</h2>
          <p>本应用名称为速记清单，由 ${SITE.developerEntity}（经营者：${SITE.operator}）提供。联系邮箱：${SITE.email}。</p>
          <h2>二、服务内容</h2>
          <p>速记清单向用户提供编程语言、开发工具和常用命令的备忘清单阅读、搜索、收藏、测验和自定义记忆功能。应用以离线内容为主，也可在用户主动操作后加载在线或本地 Markdown 文件。本应用不提供账号注册，不提供社交、支付或广告投放服务。</p>
          <h2>三、使用规范</h2>
          <ul>
            <li>你应在遵守中华人民共和国法律法规的前提下使用本应用。</li>
            <li>不得利用本应用传播违法信息，不得干扰应用正常运行。</li>
            <li>备忘清单内容来自开源项目，仅供学习参考，不构成任何专业建议。</li>
            <li>你导入的本地文件或添加的在线链接由你自行负责，请确保拥有相应权利。</li>
          </ul>
          <h2>四、知识产权</h2>
          <p>「速记清单」应用名称、应用图标、界面设计和应用源代码的权利归属 ${SITE.developerEntity}。应用源代码以 GPL-3.0 协议开源。中文备忘清单来源于 jaywcjlove/reference（MIT），英文备忘清单来源于 Fechin/reference（GPL-3.0）。转载或二次分发开源内容时，请遵守对应开源协议。</p>
          <h2>五、免责声明</h2>
          <p>备忘清单可能随上游项目更新而变化，我们不保证内容完整、及时或适用于特定生产环境。因使用或未能使用本应用造成的间接损失，在法律允许范围内由用户自行承担。应用按现状提供。</p>
          <h2>六、协议变更与终止</h2>
          <p>我们可能根据产品变化更新本协议，更新后的协议将在本网站公布。你可随时停止使用并卸载速记清单。如你继续使用，视为接受更新后的协议。</p>
          <h2>七、联系我们</h2>
          <p>关于本协议的问题，请发送邮件至 <a href="mailto:${SITE.email}">${SITE.email}</a>。</p>
        </article>
      </div>`
  return renderPage({
    title: '用户协议 - 速记清单',
    description: '速记清单用户协议，说明应用服务内容、使用规范、知识产权和免责条款。',
    active: 'terms',
    body,
  })
}

export function renderPrivacyPage() {
  const body = `
      <div class="wrap section">
        <article class="legal">
          <h1>速记清单隐私政策</h1>
          <p>生效日期：2026 年 2 月 14 日。本政策说明「速记清单」如何处理信息。开发者：${SITE.developerEntity}（经营者：${SITE.operator}）。联系邮箱：${SITE.email}。</p>
          <h2>一、我们收集的信息</h2>
          <p>速记清单无需注册账号，默认在设备本地完成阅读和测验。可能涉及的信息包括：</p>
          <ul>
            <li>本地设置：界面语言、主题、学习模式开关、清单源名称和地址等，仅保存在本机。</li>
            <li>使用记录：收藏清单、最近阅读、测验记录、自定义记忆内容，仅保存在本机。</li>
            <li>你主动添加的在线 Markdown 链接，以及你主动导入的本地 Markdown 文件内容。</li>
          </ul>
          <p>我们不会要求你提供姓名、身份证号、手机号或精确位置，也不会以广告为目的收集个人信息。</p>
          <h2>二、权限与网络</h2>
          <p>应用使用网络权限同步已添加清单源的目录，并在你打开在线文档、添加在线 Markdown 链接或访问本官网时请求相应资源。默认包含 reference.jqknono.com 清单源，你可在设置中删除或恢复它。应用启动和切换语言时会同步当前已启用的清单源；源服务器会接收网络请求所必需的 IP 地址和所请求资源的路径。关闭网络后，已启用默认源的内置清单及已缓存文档仍可阅读。</p>
          <h2>三、信息存储与共享</h2>
          <p>上述设置与记录保存在设备本地存储中，不会默认上传到开发者服务器。我们不出售个人信息。除非法律要求或你明确同意，我们不会向第三方共享可识别个人身份的信息。</p>
          <h2>四、第三方说明</h2>
          <p>应用内「业务与隐私的声明」同时提供华为应用市场隐私声明页面，便于与应用商店审核材料保持一致。你也可以直接查看：<a href="${SITE.privacyAgc}" target="_blank" rel="noreferrer">业务与隐私的声明</a>。</p>
          <h2>五、未成年人</h2>
          <p>本应用提供技术文档查阅，不含社交、直播或向未成年人诱导消费的功能。如你是未成年人，请在监护人指导下使用。</p>
          <h2>六、你的权利</h2>
          <p>你可以在系统设置中卸载应用以删除本地数据，也可以通过应用内设置清理你添加的在线链接。如需行使查阅、更正或删除权利，请发送邮件至 <a href="mailto:${SITE.email}">${SITE.email}</a>。</p>
          <h2>七、政策更新</h2>
          <p>本政策更新后将在本页面公布。继续使用速记清单即表示你了解更新内容。</p>
        </article>
      </div>`
  return renderPage({
    title: '隐私政策 - 速记清单',
    description: '速记清单隐私政策，说明应用如何在本地保存设置与阅读记录，以及网络权限用途。',
    active: 'privacy',
    body,
  })
}

export function renderNotFoundPage() {
  const body = `
      <div class="wrap section">
        <article class="legal">
          <h1>页面不存在</h1>
          <p>你访问的页面不存在。请返回 <a href="./">速记清单官网首页</a> 查看应用介绍、用户协议、隐私政策或备忘清单文件列表。</p>
        </article>
      </div>`
  return renderPage({
    title: '页面不存在 - 速记清单',
    description: '速记清单官网 404 页面。',
    active: 'home',
    body,
  })
}
