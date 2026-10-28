# 清单源

在“设置 → 清单源”中填写目录地址即可添加。新源自动以地址的域名命名，同名时依次追加 `_2`、`_3` 等后缀，停用占位也保留其名称。已有源名称继续保留。默认源名为“速记清单官方源”，地址为 `https://reference.jqknono.com/catalog.json`。

默认源关联应用内置清单，离线时可以直接阅读。删除默认源后，目录与搜索隐藏该源的内置和在线清单，设置页保留“已移除 / 恢复默认源”占位。重启后仍保留删除状态；恢复时重新显示内容。自定义源可以添加和删除。收藏、阅读记录和缓存保留在本地。

每个源拥有稳定标识。在线文档标识包含源和语言，支持不同源收录同名文档。官方源与内置文档重合时优先展示内置版本，保持已有收藏身份和离线可用性。修改地址时通过添加新源完成，已有源保持现有名称、文档身份与缓存。

## 清单源协议

官网首页用于介绍应用，清单源使用独立的 `catalog.json` 目录；目录中每个 `items` 条目包含一个文件链接。官方目录为 `https://reference.jqknono.com/catalog.json`，文件列表网页为 `https://reference.jqknono.com/files`。

`catalog.json` 示例：

```json
{
  "version": 1,
  "name": "速记清单官方源",
  "items": [
    {
      "id": "git",
      "lang": "zh",
      "name": "Git 命令清单",
      "title": "常用 Git 操作",
      "mdUrl": "mds/zh/git.md"
    }
  ]
}
```

- `id` 和 `mdUrl` 为必填项；`id` 在同一源、同一语言中保持唯一、稳定。
- `lang` 使用 `zh` 或 `en`；省略时该条目在两种界面语言中均显示。
- `name` 和 `title` 为可选显示字段，省略时使用 `id`。
- `icon`、`sectionCount` 和 `cardCount` 可选。
- `mdUrl`、`icon` 支持绝对 HTTP(S) 地址或相对于目录文件的地址。

输入网站地址时，依次尝试 `catalog.json`、`api/v1/catalog?lang=zh|en` 和现有 `files.html` 文件列表。也可直接填写 JSON、API 或 HTML 文件地址。文件列表兼容 `/mds/zh/`、`/mds/en/` 下的 Markdown 链接，并按链接去重。

官网 `npm run build` 会生成 `dist/catalog.json`。App 默认源直接请求该 JSON 文件；升级时将旧官网入口迁移到目录地址，并保留名称和删除状态。远程目录优先读取本地缓存，再同步网络；单次网络同步总等待时间最多 20 秒，后续刷新优先复用成功入口。设置页显示同步状态并提供刷新按钮；网络诊断保留原生错误码和说明，完整文案可长按复制。目录请求与离线缓存保存分别报告结果。已打开的在线 Markdown 使用现有文档缓存支持离线阅读。

## 验证

```bash
npm run test:catalog-sources
# 额外验证当前公网默认源与真实 Markdown
TEST_LIVE_CATALOG=1 npm run test:catalog-sources
```

测试直接运行产品 `.ets` 模块，使用本地 HTTP 服务和磁盘 Preferences 适配器，覆盖默认源初始化、源自动命名与重名后缀、重启持久化、默认源删除与恢复、多源与语言隔离、Markdown 解析和缓存、目录格式兼容。测试运行器优先使用已安装的 TypeScript，其次从 `hvigorw` 所在的 DevEco Command Line Tools 目录读取；也可通过 `TYPESCRIPT_PATH` 指定 TypeScript 模块路径。

平台编译按仓库 `AGENTS.md` 的 `assembleHap` 命令执行。原生控件交互和真实 Preferences 行为由安装到设备后的验收覆盖：填写目录地址添加源 → 打开清单 → 删除默认源 → 重启检查占位 → 恢复默认源 → 检查收藏及横竖屏表单状态。
