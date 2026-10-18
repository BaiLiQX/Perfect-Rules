# FlClash 维护说明

## 当前改动

- AI 为手动选择组，候选是当前订阅的全部内联节点，保持订阅顺序。
- 修正 DNS 分类键：`geolocation-!cn` 改为 `geosite:geolocation-!cn`。其余 DNS 参数不变。
- 保留原有 TUN、端口、IPv6 和其他网络参数。本次没有删除 TUN，也没有增加 Microsoft 分流例外。

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

当前脚本入口来自本 fork，但规则 provider 和图标继续引用上游 main。这种组合可以使用：本 fork 管理分组逻辑，上游维护小 YAML。若以后要独立修改这些 YAML，再调整其来源；仅 fork 仓库不会自动改变脚本里的 URL。

多数 provider 仅引用 GEOSITE 分类。固定小 YAML 的版本，不等于固定客户端 GEOSITE.dat 的完整名单版本。

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
