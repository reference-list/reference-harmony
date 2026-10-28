# dev 本机鸿蒙签名

本机统一签名根目录：`/home/jqknono/Documents/HarmonyOS/signing`。

- debug/release 证书与密钥库：`machines/dev/`。
- 本应用 Profile：`profiles/reference.app.jqknono.com/debug.p7b`、`release.p7b`。
- `default` product 使用调试签名，`publish` product 使用发布签名；`buildMode` 独立控制优化模式。
- 各应用复用机器证书，并单独申请应用 Profile；新增应用时复用现有证书名额。
- 私钥、密码、Hvigor 解密材料和历史备份保存在上述仓库外目录，工程引用加密密码。

配置维护、签名助手及完整清单参见本机根目录的 `README.md`、`manifest.json`、`projects.json`。

```bash
node /home/jqknono/Documents/HarmonyOS/signing/tools/configure-projects.cjs
```

正式发布前核对证书/Profile 在线状态和包名，构建 release 模式，完成签名校验；更换公钥后另行验证应用覆盖升级。
