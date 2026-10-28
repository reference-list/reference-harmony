# 集市

App 第四个入口为“集市”，原“记忆”入口隐藏。已有自定义清单数据继续保留，并可通过目录阅读。

集市收录的是清单源目录（catalog），搜索匹配名称、中英文简介、标签、作者、语言和地址；多个关键词同时匹配，英文忽略大小写。点击“添加”复用设置页的清单源规则：从域名生成名称，重名追加后缀；已添加的源显示“已添加”，已移除的官方源显示“恢复”。添加后在“目录”中浏览文件，在“设置”中管理清单源。

## 数据维护

单一源文件：`entry/src/main/resources/rawfile/marketplace.json`。网站构建会原样发布为 `https://reference.jqknono.com/marketplace.json`，App 内也包含启动用的离线副本。首次打开先显示缓存或随包列表，再请求官网更新；刷新总时限为 10 秒，更新失败时保留已展示的数据。成功数据写入 Preferences，下次打开可离线搜索。

当前首批收录已验证的官方目录，不把未提供 catalog 的普通网站当作可添加来源。后续加入来源后构建并发布官网，已安装 App 刷新集市即可取得新条目。

根对象包含 `version: 1` 与 `catalogs` 数组。每个条目包括：

- 必填：`id`（稳定且唯一）、`name`（显示名称）、`catalogUrl`（可读取的 HTTP(S) 目录地址）。
- 描述：`description`、`nameEn`、`descriptionEn`、`author`。
- 搜索与展示：`tags`（字符串数组）、`languages`（如 `zh`、`en`）、`count`（已核实的总清单数，未知时省略）。
- `homepage`：来源网站的 HTTP(S) 地址。

收录前使用真实请求确认目录符合 `docs/catalog-sources.md` 协议，抽查文件链接和 Markdown 正文；简介说明来源和覆盖范围。维护时保持 `id` 和 `catalogUrl` 稳定。

## 验证

`npm run test:catalog-sources` 覆盖随包目录、官网构建产物、在线读取、缓存重启、关键词搜索、重复添加、官方源恢复，以及添加后读取 Markdown。修改 `.ets` 后执行 HarmonyOS 编译并在设备核对集市入口、搜索、空结果、已添加状态及横竖屏切换。
