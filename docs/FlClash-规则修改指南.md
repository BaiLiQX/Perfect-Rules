# FlClash 分流规则修改指南

这份指南针对 [BaiLiQX/Perfect-Rules](https://github.com/BaiLiQX/Perfect-Rules) 的 **Windows FlClash + 系统代理 + Rule 模式**。目标是用**最小改动**处理误分流，保留已验证的机场节点选择与 DNS 方案。

## 先判断：是否真的需要改代码？

| 现象 / 目标 | 修改位置 | 是否需要提交 |
|---|---|---|
| AI 想换成某条美国／日本节点 | FlClash 面板 → AI → 选择实际节点 | **不需要** |
| YouTube 想改用「外网通用」 | FlClash 面板 → YouTube → 外网通用 | **不需要** |
| 某网站命中了错误的业务组 | `Clash/rules/<业务>.yaml`，必要时检查脚本内规则顺序 | 通常需要 |
| 新增一种独立业务组 | `Clash/FlClash.js` 的策略组、Provider、`rules` 多处 | 需要，影响较大 |
| 机场节点地区误识别 | `FlClash.js` 的 `regionPatterns` / `regionOrder` | 需要 |
| DNS 路径异常 | 先检查系统代理、客户端最终 DNS、`#外网通用` 出口；必要时再改 `config["dns"]` | 视情况 |

**诊断的第一步：** 打开 FlClash「连接」页面，找到目标网站请求，记录**实际主机名、命中的规则/策略组、最终节点**。仅凭网页显示异常，不足以断定域名规则写错；也可能是节点 IP 被服务限制、订阅未更新或应用绕过系统代理。

## 一、最常见：给已有业务组添加一个域名

假设某个**示例域名** `api.example-ai.test` 应由 AI 组代理。修改仓库中的 [`Clash/rules/ai.yaml`](../Clash/rules/ai.yaml)：

```yaml
payload:
  - DOMAIN,api.example-ai.test
  # 如果确实需要覆盖 example-ai.test 及其所有子域名，再考虑：
  # - DOMAIN-SUFFIX,example-ai.test
  - GEOSITE,category-ai-!cn
```

这是**局部示例，不要把整个文件替换成这三行**；实际操作只需在原 `payload:` 下追加一条。

- `DOMAIN,api.example-ai.test`：匹配精确主机，不自动覆盖其他兄弟子域名。
- `DOMAIN-SUFFIX,example-ai.test`：匹配根域名及其下属子域名，影响范围更大。
- `GEOSITE,category-ai-!cn`：由客户端的 GeoSite 资源提供分类兜底，不等于显式域名列表。

**最小匹配原则：** 优先精确域名；确认服务专用、子域名确实需要相同出口后，再扩大为后缀。不要为了 Gemini 把 `google.com`、`googleapis.com` 或 `gstatic.com` 整体划给 AI：这些域名包含大量 Google 共享服务。

其他已有业务规则放在 [`Clash/rules/`](../Clash/rules/)：例如 `github.yaml`、`network-test.yaml`、`google.yaml`。部分文件只有 `GEOSITE,...`，需要明确覆盖时，可以**在其上方追加 `DOMAIN` 或 `DOMAIN-SUFFIX`**。

**特别注意优先级：** [`FlClash.js`](../Clash/FlClash.js) 中的 `config["rules"]` 是从上到下首次命中生效。AI 先于 Google / GitHub / Microsoft，YouTube 先于 Google。若一个域名同时被上游与下游规则命中，**只改靠后的 provider 通常无效**，还应检查靠前 provider 是否先匹配它。

## 二、只想修改已有策略组的出站节点

直接在 FlClash 面板操作，不改 GitHub：

1. 在「AI」组中手动选一个有效的订阅节点，以固定 AI 出口。
2. 在「外网通用」组中依次可选机场的自动选择、故障转移、各地区测速组、机场名称（全部节点）组；不再直接铺开每条订阅节点。若需手动选择具体节点，进入机场名称组，或在 AI 组直接手动选节点。该组也是境外 DoH 上游的指定出口。
3. YouTube / Google / GitHub 等业务组可以各自选地区、国内直连或外网通用（具体候选由当前订阅生成）。
4. 避免把「剩余流量」「到期时间」等非真实节点选为出口。

只改变节点选择并不会改变 `ai.yaml`、`github.yaml` 中域名属于哪个组。

## 三、什么时候才改 FlClash.js？

| 目标 | 搜索关键词 | 注意事项 |
|---|---|---|
| 修改地区识别 | `regionPatterns`、`regionOrder` | 测试机场节点命名变体；不要误把公告节点当地区节点 |
| 修改地区测速策略 | `regionGroups`、`url-test` | 会影响地区池的自动切换行为 |
| 修改 AI 的候选节点模式 | `createBusinessGroup`、`proxyNames` | 目前 AI 手动列出全部内联节点，这是刻意设计 |
| 修改「外网通用」 | `generalProxyGroup` | 被业务组和境外 DNS 引用，避免引入循环 |
| 改业务组优先级 | `config["rules"]` | 需保留 AI / YouTube 的专用优先级 |
| 加一整个新业务组 | `managedGroups`、`createRuleProvider`、`businessGroups`、`config["rules"]` | 通常还需新增 `Clash/rules/xxx.yaml`、图标映射与测试 |
| 修改 DNS | `config["dns"]` | 保留 `proxy-server-nameserver` 的代理节点域名解析路径，勿引入代理前 DNS 依赖循环 |

**不要把整个 `FlClash.js` 粘贴到 `ai.yaml`，也不要把 `payload` 规则当成脚本顶层 `config["rules"]` 的格式。** 一个是 JavaScript 生成配置，另一个是远程 rule-provider 的 YAML 规则集合。

## 四、两种维护方式

### 方式 A：GitHub 网页直接改（偶尔修改一条规则）

1. 打开仓库的 `Clash/rules/ai.yaml`（或目标文件）。
2. 点击右上角编辑（铅笔），在原有 `payload` 内添加规则。
3. 填写说明性的 Commit 信息，例如 `fix(ai): route dedicated example API via AI group`。
4. 变更较大时优先提交新分支并创建 Pull Request；待测试检查通过后再合并。
5. 让核心更新 AI rule-provider 的 YAML，然后观察连接日志确认命中。脚本生成的 provider 不一定出现在「资源」页的独立规则列表中；具体同步方式见下节和 [AI 分流说明](AI-分流说明.md)。

### 方式 B：本地修改（适合多文件、长期维护）

```bash
git clone https://github.com/BaiLiQX/Perfect-Rules.git
cd Perfect-Rules

# 用编辑器修改 Clash/rules/*.yaml 或 Clash/FlClash.js
node --test tests/flclash.test.cjs

git diff --check
git diff
git add Clash/rules/ai.yaml
git commit -m "fix(ai): update dedicated domain routing"
git push origin main
```

**命令仅为示例：** `git add` 应替换成实际修改的文件，正式改动可使用新分支和 PR。上述命令不会自动验证在线 DNS、防泄漏或机场节点连接。

你也可以直接在 ChatGPT 对话中说明：
> 检查 BaiLiQX/Perfect-Rules 的 FlClash 分流；某域名被错误分到 Google，希望改为 AI。先读取现有规则，只调整最小必要文件，检查测试并提交，给出 Commit 链接。

连接 GitHub 后，可由 ChatGPT 读取和修改仓库；无需在聊天内粘贴 Token。

## 五、改完以后怎样生效？

| 修改了什么 | 客户端操作 | 验证点 |
|---|---|---|
| `Clash/FlClash.js` | 更新远程脚本，重新应用订阅覆写 | 最终生效配置、策略组、规则顺序 |
| `Clash/rules/ai.yaml`、`github.yaml` 等 | 核心按 provider 的 24 小时间隔更新；若客户端提供该运行资源的更新入口，也可手动触发 | 规则 Provider 最新内容、连接面板命中 |
| 客户端自身 GeoSite / GeoIP 分类资源 | 使用 FlClash 的原生资源更新 | 类别规则匹配有无变化 |
| 只是面板里切换节点 | 通常直接生效；已有长连接可断开重连 | 连接面板显示目标实际出口 |

此 Fork 的远程入口均跟随 `BaiLiQX/Perfect-Rules` 的 main。AI YAML 使用 GitHub Raw 和独立缓存路径，其余规则与图标仍使用 jsDelivr 分支地址；CDN 可能缓存旧版本。修改 GitHub 的源文件**不保证 FlClash 立即下载到新版本**。

从旧版 AI CDN 配置迁移时，在原先导入 JS 的脚本列表，对 **FlClash** 执行**同步**即可重新应用当前订阅，新生成的 AI provider 使用新地址和新缓存路径。无需单独导入 AI YAML，也不用重新添加机场订阅。后续只修改 YAML 内容时，仍按上表的 provider 更新机制生效。

## 六、提交前后核对清单

1. **先看 diff：** 没有无意修改其他客户端文件；没有修改 Raw / CDN 被引用的规则路径。
2. **运行测试：** `node --test tests/flclash.test.cjs`；GitHub Actions 也会自动运行这套测试。
3. **审查规则交叠：** 同一域名是否已被优先级更高的 provider 匹配；`DOMAIN-SUFFIX` 是否范围过大。
4. **观察目标网站：** 分流是否按预期，实际节点是否可用；必要时断开旧连接重试。
5. **若修改 DNS：** 最终配置中是否意外出现 `system://`、TUN 或 53 端口 DNS 监听；物理网卡是否存在非预期 DNS 流量。系统代理无法为不遵守代理的软件提供全系统 DNS 防泄漏。
6. **若失败：** 查看最近一次 GitHub Commit 的 diff，使用 GitHub 的 Revert 或 `git revert <commit>` 回退，再刷新客户端相应资源。不要用强制推送重写历史。

## 七、上游同步原则

上游仓库是 [n0de-sudo/Perfect-Rules](https://github.com/n0de-sudo/Perfect-Rules)。本 Fork 不会自动同步上游；更新前先比较差异，保留 AI 手动节点、外网通用、无 TUN 默认、境外 DoH 指定出口、规则顺序与 Fork 地址等定制。不要因为上游推出新版本，就直接用它整份覆盖 `Clash/FlClash.js`。

技术背景与当前限制见 [FlClash 维护说明](FlClash-维护说明.md)、[AI 分流说明](AI-分流说明.md)、[Microsoft 分类说明](Microsoft-分流候选分析.md)。
