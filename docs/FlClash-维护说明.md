# FlClash 维护说明

日常增删网站、调整策略组选项和同步客户端的方法参见 [FlClash 规则修改指南](FlClash-规则修改指南.md)。本文主要记录 Fork 的设计取舍、边界及上游同步约定。

## 当前改动

- AI 为手动选择组，候选是当前订阅的全部内联节点，保持订阅顺序。
- “外网通用”手动选择组按自动选择、故障转移、地区测速组、机场名称（全部节点）组排列；不再重复展示每一条内联节点。原机场名称组仍保留，可在组内手动挑选具体节点；只有存在并可识别的全节点组才会出现。
- 12 个业务分流组（含 AI）和“一键代理”均追加“外网通用”及当前订阅保留的自动选择、故障转移，替代原来的机场名称候选。AI 保留全部节点，其他业务保留地区与国内直连；追加选项不改变原候选顺序。
- 选择“外网通用”时，业务随该组选择自动选择、故障转移、地区测速组或机场名称组；具体原始节点请在机场名称组内选取，不再直接铺在“外网通用”。地区测速组和“国内直连”本身不加入这些引用。为防循环，引用任何业务组或“外网通用”的机场组都不会再被加入“外网通用”；业务组不直接加入机场名称组。原先业务若选中了机场名称组，更新后需重新选择“外网通用”或其他有效选项。
- 修正 DNS 分类键为 `geosite:geolocation-!cn`；境外域名与 fallback 的 DoH 通过 `#外网通用` 指定出口。代理节点域名仍使用独立的国内 DoH，避免解析依赖循环。
- Copilot 推理端点归入 AI；GitHub Pages、容器仓库、Web IDE 和周边域名归入 GitHub。VS Code、包源及其余 Microsoft 服务保持原策略。
- AI 明确规则覆盖 Google AI 专用域名和常用 AI 服务的核心入口/API/资源，保留 GeoSite 分类兜底；Google 共享登录和普通搜索仍归 Google。见 [AI 分流说明](AI-分流说明.md)。
- 移除脚本中强制启用 TUN 的整组参数（含 DNS 劫持、strict-route、虚拟网卡地址）；删除原始订阅继承的 TUN 设置，不在内核开放 53 端口 DNS 监听，Fake-IP 池改为 `198.18.0.1/16`。不影响现有分流顺序。

## 原生资源自动更新

在 FlClash 的“资源”页右上角更多菜单中：

1. 将“自动更新”设为开启。
2. 将“自动更新间隔”设为 24 小时，或按自己的使用频率调整。

GeoSite/GeoIP 的下载和加载使用 FlClash/Mihomo 原生更新器。没有附加下载器、备份服务、更新历史记录系统或独立定时任务。

这是客户端运行期间的资源更新安排，不是电脑关机后仍在执行的云端任务。不要把“已开启”当作每次下载都必然成功。

该开关还控制远程脚本、图标等资源的自动更新，不只更新 Geo 数据。机场订阅自己的自动更新和运行核心 rule-provider 的 interval 则是不同层次。

## 跟随上游、跟随 fork 与固定版本

| 方式 | URL 形态 | 更新后会发生什么 | 维护责任 |
|---|---|---|---|
| 跟随上游分支 | `n0de-sudo/Perfect-Rules@main` | 上游改文件后，后续下载可取得新内容；CDN 可能有缓存延迟 | 依赖上游的修改和维护节奏 |
| 跟随 fork 分支 | `BaiLiQX/Perfect-Rules@main` | 只取得 fork 上已有的内容；fork 不会自动合并上游提交 | fork 维护者选择何时同步上游 |
| 固定提交 | URL 中使用完整 commit SHA | 重复下载仍是同一内容 | 维护者主动提升版本，更新前较容易比较变化 |

当前 FlClash 脚本入口、规则 provider 和图标均指向本 fork 的 main。运行时不会直接跟随 n0de-sudo/Perfect-Rules main；GeoSite/GeoIP 仍由 FlClash 从原有 MetaCubeX 数据源原生更新。

多数 provider 仅引用 GEOSITE 分类。固定小 YAML 的版本，不等于固定客户端 GEOSITE.dat 的完整名单版本。

## 后续同步上游

需要同步时，由维护者先读取 `n0de-sudo/Perfect-Rules` 的 main 差异，再合并到本 fork。不会定时自动合并上游。

同步时保留这些定制：AI 全节点手动选择、外网通用（自动选择、故障转移、地区测速及机场名称组）、业务组的外网通用与自动/故障转移选项及防循环检查、正确的境外 DNS 分类键、AI/GitHub 明确例外、FlClash 规则与图标的 fork 地址。无 TUN 默认策略需保留；同步上游时不要重新引入 TUN 强制启用或 53 端口监听。

同步前保留工作区未提交改动；有冲突时逐项处理，不用强制同步或历史重写覆盖 fork。发布前运行 `node --test tests/flclash.test.cjs`，再验证修改涉及的实际规则名单和代表站点。

本地 checkout 的 `origin` 为本 fork，`upstream` 为 n0de-sudo/Perfect-Rules；新 checkout 需自行添加 upstream。FlClash 资源自动更新只下载本 fork 已发布的内容，不负责合并 Git 提交。

## Windows 系统代理与 DNS 边界

- Windows 日常在 FlClash 开启“系统代理”、保持规则模式，TUN 可保持关闭。脚本不再强制配置 TUN；需要手机 VPN 模式或特殊应用接管时，应由客户端明确管理。
- Mihomo DNS 仍保留 Fake-IP、按 GeoSite 分类的国内/境外 DoH 和节点域名的独立解析；境外 DoH 与 fallback 通过 `#外网通用` 使用该策略组所选出口。不要将该组设置成 DIRECT，否则境外 DNS 仍可从本机网络发出。
- 不再监听 `0.0.0.0:53`，也不做 DNS 劫持。经 HTTP 系统代理的浏览器通常把目标域名交给代理处理，但其他程序可能绕过系统代理并调用 Windows DNS。可在 Windows 11 开启系统 DoH 保护这些非代理 DNS 查询，但这不是全系统代理，也不能承诺零泄漏。
- 测试时检查 FlClash 最终生效配置、浏览器目标连接及物理网卡 DNS 流量；DNSLeakTest 只能反映看到的解析器，不能单独证明 DNS 数据包从哪个出口发出。
- 脚本为全平台共用：如果 Android 也加载此脚本，必须确保 FlClash 自身仍正确开启所需 VPN 接管，并以最终生效配置为准。

## 来源

- [FlClash 原生 Geo 更新入口](https://github.com/chen08209/FlClash/blob/main/core/geo.go)
- [资源自动更新](https://github.com/chen08209/FlClash/blob/main/lib/providers/actions/resources.dart)
- [资源页开关与周期](https://github.com/chen08209/FlClash/blob/main/lib/views/resources.dart)
- [Mihomo DNS](https://wiki.metacubex.one/config/dns/)
- [Mihomo TUN](https://wiki.metacubex.one/config/inbound/tun/)
