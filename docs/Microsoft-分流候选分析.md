# Microsoft 分流候选分析

第一批明确例外已实施，下面同时保留尚未实施的按需候选。分析依据为 2026-10-18 实际可读的 GEOSITE.dat：Microsoft 分类含 690 条匹配项，其中包含精确域名、后缀、关键词和正则，不等于 690 个独立网站。

分析基线的 GitHub provider 只有三个后缀；下表中的“原先”指基线状态。静态匹配不等于登录或功能验收。

## 已实施

- AI：copilot.microsoft.com、copilot.cloud.microsoft、copilot.microsoft、githubcopilot.com 的后缀，以及 copilot-proxy.githubusercontent.com、origin-tracker.githubusercontent.com 两个精确主机。
- GitHub：原有三个后缀，加 github.io、ghcr.io、github.dev、githubnext.com、githubstatus.com、github.blog。
- AI 规则仍早于 GitHub 和 Microsoft，因此特定 Copilot 推理端点会覆盖一般 GitHub 后缀。
- VS Code、开发包源、普通 Bing 搜索、共享认证、Office/OneDrive、Windows 更新、Azure 和游戏暂不迁移。

## 优先考虑的例外

| 服务 | 原先落入 Microsoft 的候选 | 建议分组 | 判断 |
|---|---|---|---|
| GitHub Copilot API | githubcopilot.com 及其子域（例如 api.githubcopilot.com） | AI；若需与 GitHub 共出口，也可选 GitHub | 值得优先明确；当前与已在 AI 的微软 Copilot 不同路由 |
| 微软 Copilot 入口候选 | copilot.cloud.microsoft、copilot.microsoft | AI | 当前均进入 Microsoft；是否实际使用及认证依赖需在服务使用中验证 |
| GitHub Pages / 容器仓库 / Web IDE | github.io、ghcr.io、github.dev | GitHub | 语义清楚，避免同一个 GitHub 工作流部分直连、部分代理 |
| GitHub 周边 | githubnext.com、githubstatus.com、github.blog | GitHub | 可与核心 GitHub 例外一起整理，优先级低于工作流必需项 |
| VS Code 扩展与同步 | marketplace.visualstudio.com、gallery.vsassets.io / gallerycdn.vsassets.io、vscode-cdn.net、vscode-unpkg.net、vscode.dev、vscode-sync.trafficmanager.net | 可选的开发工具组 | 仅在直连不稳定或需要独立控制时拆出；不必整体代理所有 Visual Studio 域名 |
| VS Code 更新和依赖 | update.code.visualstudio.com、vscode.download.prss.microsoft.com、download.visualstudio.microsoft.com | 开发工具组，或保留 Microsoft | 可能使用国内 CDN，不能默认代理一定更快 |
| npm / NuGet / PowerShell Gallery | npmjs.org、npmjs.com、nuget.org、powershellgallery.com | 开发工具组，或保留 Microsoft | 值得提供独立选择，但应按实际下载成功率和速度决定 |

copilot-proxy.githubusercontent.com、origin-tracker.githubusercontent.com 原先进入 GitHub，现已与 githubcopilot.com 一起归入 AI。共享 GitHub 认证和遥测没有整体迁移，不能仅凭名称认定它们都必须使用 AI 组。

微软 Copilot 的 copilot.microsoft.com 原本就被本机 AI 分类匹配，现增加明确后缀以稳定分类。Bing 的 cn.bing.com、sydney.bing.com、bingapis.com 仍进入 Microsoft。普通国内搜索和 AI 功能应区分需求，不宜仅因想用 Copilot 就把整个 Bing 分类搬到 AI。

## 暂不建议整类迁移

| 类型 | 例子 | 原因 |
|---|---|---|
| 共享登录认证 | login.microsoftonline.com、login.live.com、msauth.net、msftauth.net | Office、OneDrive、开发工具等共用；全改可能连带改变其他业务路径 |
| Office / OneDrive / 企业协作 | office.com、office.net、outlook.com、onedrive.live.com、1drv.ms、sharepoint.com | 先按实际使用判断，没必要为了 Copilot 一起迁移 |
| Windows 更新和证书服务 | windowsupdate.com、download.microsoft.com、ocsp.microsoft.com、crl.microsoft.com | 通常可直连；证书服务不应误放广告拦截 |
| Azure 公共托管域名 | blob.core.windows.net、azurewebsites.net、azureedge.net、trafficmanager.net | 承载大量不同租户与业务，域名归属不等于同一应用 |
| 游戏 | xboxlive.com、xbox.com、minecraft.net | 适合按游戏使用与 UDP 连通性另行判断，不应并入 Steam 或 AI |

尤其不建议直接用本机整个 GEOSITE,github 替换三个后缀而不复核：该数据里的 GitHub 分类包含 blob.core.windows.net 后缀，范围会扩展到大量 Azure Blob 流量。更稳妥的第一步是少量明确域名例外。

## 后续候选

第一批已按 AI/GitHub 实施。VS Code 和包源仍按实际使用情况决定是否拆出，不新建暂时不用的分组。

所有例外均应放在宽泛的 Microsoft 规则之前；若需要覆盖 githubusercontent.com 下的特定 Copilot 端点，也必须放在 GitHub 规则之前。

## 官方资料

- [GitHub Copilot 所需域名](https://docs.github.com/en/copilot/reference/copilot-allowlist-reference)：明确列出 githubcopilot.com、copilot-proxy.githubusercontent.com 等端点。
- [VS Code 网络连接](https://code.visualstudio.com/docs/setup/network)：列出 Marketplace、扩展资源、同步和更新主机。

这里的建议基于用途与实际静态名单推断；没有声称这些站点当前全部直连失败，也没有声称修改后一定更快。
