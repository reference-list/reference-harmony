# 应用图标

SVG 是应用图标的源文件。PNG 由 `npm run export:app-icon` 导出，不要直接改 PNG。

| 文件 | 用途 |
| --- | --- |
| `paper.svg` | 清单纸、减号镂空和折角的公共图形 |
| `app-icon.svg` | 合成图标，导出 216/108/28 PNG |
| `background.svg` | HarmonyOS 分层背景，1024 PNG |
| `foreground.svg` | HarmonyOS 分层前景，1024 PNG |

前景按参考图重绘：薄荷绿主体斜向右下收尾，深绿后折面从左下露出，中间为圆头减号，无描边。

合成图和分层图共用 `paper.svg`、`background.svg`。外部引用使用带 ID 的 SVG 片段；导出脚本会将片段内联后交给 `rsvg-convert`，避免不同查看器的外部引用限制。

`preview.svg` 是可独立打开的内联合成 SVG，`preview.png` 是 1024×1024 预览，均由脚本生成。合成图四角透明；HarmonyOS 分层背景铺满，由系统裁切。参考截图中的白色画布和灰白棋盘格不属于图标。

依赖：Node.js 22+、librsvg 的 `rsvg-convert`（可用 `RSVG_CONVERT` 指定可执行文件）。

改图标时先改源 SVG，再在 `reference-harmony` 目录运行：

```bash
npm run export:app-icon
npm run test:app-icon
```
