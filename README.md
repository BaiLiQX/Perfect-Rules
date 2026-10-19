# Perfect-Rules · FlClash 个人维护版

> 基于 [n0de-sudo/Perfect-Rules](https://github.com/n0de-sudo/Perfect-Rules) 的 Fork。**本 Fork 主要维护 FlClash / Mihomo 分流**，并非原项目全部客户端的同步发行版。

## 项目定位

主要使用场景：**Windows + FlClash + 机场订阅 + 系统代理（不要求开启 TUN）**。

- 自动读取机场订阅中的**内联节点**，按名称识别香港、台湾、日本等地区，生成测速策略组。
- **AI 独立手动选节点**：ChatGPT、Gemini、Claude 等可固定出口，不必跟随地区测速组自动切换。
- YouTube、Google、GitHub、Microsoft 等使用独立业务组；「外网通用」按**自动选择 → 故障转移 → 地区测速组 → 机场名称（全部节点）组**排列，不在该组重复铺开原始节点。
- 维护 [AI 明确域名规则](Clash/rules/ai.yaml) 与 [GitHub 规则](Clash/rules/github.yaml)，避免专用服务被更宽泛的 Google、Microsoft 等规则抢先匹配。
- 内核 DNS 区分国内与境外 DoH，**境外 DNS 上游使用 `#外网通用` 选择出口**；脚本不强制开启 TUN，也不监听 53 端口做 DNS 劫持。

**边界说明：** 系统代理只能覆盖遵守代理设置的软件，不会接管整个 Windows 的 DNS；加密 DoH 不等于全系统无 DNS 泄漏。移动端若使用 VPN 接管，由 FlClash 客户端管理，并需另行核验实际生效配置。

## 快速开始（FlClash）

**脚本：[FlClash.js](Clash/FlClash.js) · [复制 Raw 地址](https://raw.githubusercontent.com/BaiLiQX/Perfect-Rules/main/Clash/FlClash.js)**

1. 在 FlClash 中先导入自己的机场订阅。
2. 打开「工具 / 进阶配置 / 脚本」（菜单名称随版本可能变化），通过上面的 **Raw 地址**导入 JavaScript 远程脚本。
3. **在该订阅的覆写设置中启用脚本**，更新订阅／重新应用配置；只导入脚本而不关联订阅不会生效。
4. Windows 日常使用：开启**系统代理**，选择**规则模式（Rule）**，TUN 按个人需要保持关闭。
5. 打开代理组：「**外网通用**」优先选择自动选择、故障转移或地区测速组；需要手动挑选具体节点时进入末尾的机场名称组。**AI** 组按「外网通用 → 自动选择 → 故障转移 → 地区测速组 → 真实机场节点」排列，过滤流量、到期和客户端说明等提示项；真实节点保持订阅顺序。自动选择、故障转移仅在订阅中存在且引用安全时显示，地区组仅显示订阅中存在的地区，已保存的手动选择仍由客户端保留。
6. 查看连接面板，确认 ChatGPT / Gemini 等命中 AI，YouTube 命中 YouTube，GitHub 命中 GitHub。修改远程规则文件后，还需更新对应的 Rule Provider。

业务组和“一键代理”的候选统一遵循“外网通用 → 自动选择 → 故障转移 → 地区测速组 → 国内直连 → 真实机场节点”。只重排已有候选，缺少的选项不会额外添加；原本未列出真实节点的组不会新增节点。

> **注意**：本脚本会重建部分策略组和分流规则。它主要适配节点存在于订阅 `proxies` 中的情形；仅使用 `proxy-providers` 的订阅需要单独检查生成结果。如果机场订阅没有可识别的全部节点组，「外网通用」不会凭空生成机场名称组，但仍保留可用的地区组。境外 DoH 依赖「外网通用」的出口，所选链路须有效且不要指向 DIRECT。

## 分流逻辑速览

```text
机场订阅（节点）
      ↓
Clash/FlClash.js（生成地区组、业务组与规则）
      ↓
局域网直连 → 网络检测 → AI → YouTube → Google → GitHub → ...
      ↓
Apple / Microsoft → GeoSite Private / CN → GeoIP Private / CN
      ↓
MATCH → 一键代理
```

**从上到下优先匹配。** 因此 Google AI 的专用域名放在 AI 规则内，并在一般 Google 规则之前匹配；不要随意颠倒顺序。

| 想修改什么 | 优先修改哪里 |
|---|---|
| ChatGPT、Gemini 或某网站归哪个业务组 | [`Clash/rules/*.yaml`](Clash/rules/)：增删域名 |
| 调整业务组优先级、添加整个策略组 | [`Clash/FlClash.js`](Clash/FlClash.js)：`config["rules"]` 和策略组生成逻辑 |
| 地区识别、测速组、节点候选 | [`Clash/FlClash.js`](Clash/FlClash.js)：`regionPatterns`、`regionOrder`、策略组生成部分 |
| DoH 上游、Fake-IP 等内核 DNS | [`Clash/FlClash.js`](Clash/FlClash.js)：`config["dns"]` |
| 仅将 AI 换成另一个机场节点 | **FlClash 客户端的 AI 策略组**，无需改 GitHub |

**第一次自行修改时，优先从修改已有 `rules/*.yaml` 入手，不要先改整套 JavaScript。**

详细说明：[**FlClash 规则修改指南**](docs/FlClash-规则修改指南.md)（场景判断、文件位置、规则示例、测试、同步、故障回退）。

## 仓库目录

| 位置 | 作用与维护范围 |
|---|---|
| [`Clash/FlClash.js`](Clash/FlClash.js) | **本 Fork 主入口**：FlClash 动态覆写脚本 |
| [`Clash/rules/`](Clash/rules/) | FlClash 引用的 YAML 规则；部分是简短的 GeoSite 引用，部分有明确域名 |
| [`Clash/icons/`](Clash/icons/) | 策略组图标；远程地址被脚本引用，**不要随意改路径** |
| [`tests/flclash.test.cjs`](tests/flclash.test.cjs) | 使用 Node.js 自带测试运行器检查生成策略、引用关系和 AI 域名 |
| [`docs/`](docs/) | 使用说明、维护记录和特殊分流案例 |
| [`Clash/Clash_mi.js`](Clash/Clash_mi.js)、[`Clash/Clash_merge.yaml`](Clash/Clash_merge.yaml) | 保留的其他 Clash 配置；**不承诺与 FlClash 定制同步** |
| [`Shadowrocket/`](Shadowrocket/)、[`V2rayN.json`](V2rayN.json) | 保留的上游兼容资料；非本 Fork 当前维护重点 |

原有规则文件和图标路径保持不变，避免破坏已经在使用的 Raw / CDN 地址。

## 修改、测试与更新

在仓库根目录运行（需要 Node.js 20+；实际使用 22 LTS 亦可）：

```bash
node --test tests/flclash.test.cjs
```

仓库的 [GitHub Actions 检查](.github/workflows/flclash-tests.yml) 会在 FlClash 脚本、规则或测试文件变更时运行同一套测试。**测试通过只能证明预设的静态与生成逻辑，不能代替 FlClash 实机、DNS 路径及网站功能验证。**

修改文件后，需根据变更对象区分更新：

- **改了 `FlClash.js`：** 在 FlClash 更新远程脚本，重新应用关联订阅。
- **改了 `Clash/rules/ai.yaml` 等：** 在 FlClash「资源 / 规则提供者」刷新相应 Provider；脚本更新与 GeoSite 更新不等于这份 YAML 已刷新。
- **改了脚本中的地区/节点逻辑：** 重载后检查策略组候选和已保存的实际选择。
- **改了 DNS：** 额外检查最终生效配置；必要时对照网卡抓包。GitHub Raw / jsDelivr 可能存在缓存延迟。

详细的维护原则与同步上游策略见 [FlClash 维护说明](docs/FlClash-维护说明.md)、[AI 分流说明](docs/AI-分流说明.md)、[Microsoft 分类说明](docs/Microsoft-分流候选分析.md)。

## 上游与声明

本仓库来自 [n0de-sudo/Perfect-Rules](https://github.com/n0de-sudo/Perfect-Rules)，感谢原项目维护者。Fork 的个性化修改由此仓库独立维护；**上游更新不会自动进入本 Fork**，同步前需要核对差异，避免覆盖 AI 节点策略、DNS、规则顺序等定制。

用于网络配置学习、规则管理与技术交流。请遵守所在地适用规定及相关服务条款。
