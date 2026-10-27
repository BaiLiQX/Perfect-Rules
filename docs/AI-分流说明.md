# AI 分流说明

AI provider 在 FlClash 的 Google、GitHub、Microsoft provider 之前匹配。明确域名规则用于减少 GeoSite 更新延迟或名单变化对核心 AI 服务的影响，`GEOSITE,category-ai-!cn` 继续补充其他国际 AI 服务。

## 明确覆盖

- Google AI：Gemini 网页、静态资源、移动端后端、生成接口、AI Studio、NotebookLM、Google AI 编程及实验产品的专用域名。46 条名单来自 [MetaCubeX google-gemini](https://github.com/MetaCubeX/meta-rules-dat/blob/4e2d588bcd4c0e6cbd7f45f30999b30812b9af09/geo/geosite/google-gemini.yaml) 的 2026-10-18 快照；保留精确主机与后缀两种匹配语义，未将整个 google.com、googleapis.com、gstatic.com 并入 AI。
- OpenAI / Claude：核心站点、API、专用静态资源及用户内容域名。
- Grok / Perplexity / OpenRouter：核心站点和 API 所在专用域名。
- Copilot：保留现有 Microsoft 与 GitHub Copilot 明确例外。

这份明确名单随 fork 维护，不会随客户端 GeoSite 更新自动改写；GeoSite 兜底仍由原生资源更新器更新。更新名单时复核专用与共享服务边界，并运行 `node --test tests/flclash.test.cjs`。

## 更新到客户端

AI 规则保存在 `Clash/rules/ai.yaml`，由 `FlClash.js` 生成的 AI rule-provider 下载。AI 和其他业务规则 Provider 均使用本 fork 的 GitHub Raw 地址。AI 缓存路径为 `./rules/ai-github.yaml`，避免分支 CDN 仍返回旧版内容或继续复用旧的 `./rules/ai.yaml`。

对于“通过 URL 导入 JS，再给机场订阅设置脚本覆写”的用法，本次修复只需进入原先导入脚本的列表，打开 **FlClash** 脚本的菜单并执行**同步**。正在使用该脚本时，FlClash 会重新应用当前订阅，核心再按新的 URL 和缓存路径下载 AI YAML；不需要单独导入 `ai.yaml`、修改机场订阅 URL 或切换节点。同步后应核对最终 AI provider 的 URL、缓存内容和连接命中，不能仅凭脚本更新时间判断下载已成功。

今后只修改 `ai.yaml` 时，核心按 provider 的 24 小时间隔尝试更新；脚本同步本身并不保证每次强制刷新已有 YAML。脚本生成的 provider 也不一定出现在客户端“资源”页的独立规则列表中，不以该页面存在 AI 更新按钮为前提。GeoSite 更新同样不等于更新此 YAML。

## Gemini 跳转到异常流量页

`gemini.google.com` 命中 AI 后，如果站点重定向到 `www.google.com/sorry/`，新请求会按新域名匹配 Google。共享登录 `accounts.google.com`、普通搜索和通用 Google 静态资源也继续归 Google。

HTTPS 的路径和查询参数不属于这里的域名分流条件，无法只把 Google 的 `/sorry/` 页面划给 AI 而保持同一主机的普通搜索原路由。需要验证出口一致性时，可以在客户端将 AI 和 Google 暂时固定到同一个实际节点，重新打开 Gemini；如果仍出现异常流量提示，再比较其他节点。地区测速池可能自动换节点，不能保证固定出口。

Google 官方说明：共享网络或 VPN 出口上疑似自动化流量可能触发异常流量提示，见 [Google 搜索帮助](https://support.google.com/websearch/answer/86640?hl=zh-Hans)。补规则可以稳定分类，不能保证解除 IP 风控、获得地区资格或通过账户验证。静态匹配检查也不等于浏览器会话或 Gemini 对话功能已验收。
