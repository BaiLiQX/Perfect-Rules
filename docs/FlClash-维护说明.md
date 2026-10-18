# FlClash 维护说明

## 当前改动

- AI 为手动选择组，候选是当前订阅的全部内联节点，保持订阅顺序。
- 新增“外网通用”手动选择组：先列出各地区测速组，再列出当前订阅的全部内联节点，节点保留订阅顺序并去重，避免新组默认选中流量提示项；原机场名称组仍在面板中保留。
- 12 个业务分流组（含 AI）和“一键代理”均追加“外网通用”及当前订阅保留的自动选择、故障转移，替代原来的机场名称候选。AI 保留全部节点，其他业务保留地区与国内直连；追加选项不改变原候选顺序。
- 选择“外网通用”时，该业务跟随该组的选择：可固定单个节点，也可交给某地区测速组自动选节点；选择自动选择/故障转移时，跟随对应机场策略。地区测速组和“国内直连”本身不加入这些引用。为防循环，回指任一业务组的自动选择/故障转移不会作为业务候选。原先业务若选中了机场名称组，更新后需重新选择“外网通用”或其他有效选项。
- 修正 DNS 分类键：`geolocation-!cn` 改为 `geosite:geolocation-!cn`。其余 DNS 参数不变。
- Copilot 推理端点归入 AI；GitHub Pages、容器仓库、Web IDE 和周边域名归入 GitHub。VS Code、包源及其余 Microsoft 服务保持原策略。
- AI 明确规则覆盖 Google AI 专用域名和常用 AI 服务的核心入口/API/资源，保留 GeoSite 分类兜底；Google 共享登录和普通搜索仍归 Google。见 [AI 分流说明](AI-分流说明.md)。
- 保留上游原有 TUN、端口、IPv6 和其他网络参数。

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

同步时保留这些定制：AI 全节点手动选择、外网通用（全节点及地区测速）、业务组的外网通用与自动/故障转移选项及防循环检查、正确的境外 DNS 分类键、AI/GitHub 明确例外、FlClash 规则与图标的 fork 地址。TUN 参数遵循上游；若上游修改 TUN，合并前说明影响。

同步前保留工作区未提交改动；有冲突时逐项处理，不用强制同步或历史重写覆盖 fork。发布前运行 `node --test tests/flclash.test.cjs`，再验证修改涉及的实际规则名单和代表站点。

本地 checkout 的 `origin` 为本 fork，`upstream` 为 n0de-sudo/Perfect-Rules；新 checkout 需自行添加 upstream。FlClash 资源自动更新只下载本 fork 已发布的内容，不负责合并 Git 提交。

## TUN 与系统代理

系统代理服务于遵守代理设置的程序；TUN 通过虚拟网卡和路由覆盖更多程序及 UDP。两者都仍由规则决定直连或代理，开启 TUN 不表示所有流量都走机场，也不保证更快。

脚本中 TUN 原始设置包括 gvisor、MTU 1280、strict-route、固定 IPv4 地址与 DNS 劫持等；最终启用状态与部分字段还受 FlClash 本机设置覆盖。应以客户端生成配置和实际接管路径为准。

TUN 关闭时，这些 TUN 参数通常不参与当前代理流量。开启后，MTU 影响虚拟网卡包大小，严格路由影响绕行和局域网兼容，虚拟地址与其他 VPN/容器网络可能需要协调。DNS 劫持无法等同于接管应用自带的所有加密 DNS。

如果正在试用 TUN，尽量先保持节点、DNS 和脚本版本不变；暂不手动同步新脚本，以便区分 TUN 本身的影响。将来若改成完全由客户端管理 TUN，应单独验证高级参数回到客户端/核心默认后的行为。

## 来源

- [FlClash 原生 Geo 更新入口](https://github.com/chen08209/FlClash/blob/main/core/geo.go)
- [资源自动更新](https://github.com/chen08209/FlClash/blob/main/lib/providers/actions/resources.dart)
- [资源页开关与周期](https://github.com/chen08209/FlClash/blob/main/lib/views/resources.dart)
- [Mihomo DNS](https://wiki.metacubex.one/config/dns/)
- [Mihomo TUN](https://wiki.metacubex.one/config/inbound/tun/)
