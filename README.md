# 设备状态墙 — Sun-Panel 微应用

获取并展示多种设备运行状态的 Sun-Panel V2 微应用，支持 **Proxmox VE / 群晖 DSM / Windows** 三类数据源。

- 应用 ID：`zhousansui-device-state`
- 应用名称：设备状态墙
- 作者：周三岁
- 当前版本：`1.0.261015`（版本号规则见下）
- 基于官方模板：[microapp-hello-world](https://github.com/Sun-Panel/microapp-hello-world)（templateVersion 1.1.2）
- 开发文档：https://doc.sun-panel.top/v2/zh_cn/micro_app_dev/

---

## 快速开始

前置要求：Node.js >= 18.20

```bash
npm install
npm run dev        # 在线运行（微应用 ID 自动加 -dev 后缀）
npm run build      # 构建生产版本到 dist/
npm run pack       # 构建并打包到 packages/*.zip
npm run pack:test  # 测试包（ID 加 -test 后缀，debug 强制开启）
npm run lint       # 代码检查
```

打包产物位于 `packages/`，可直接上传到 Sun-Panel 应用商店。

---

## 版本号规则

```
1.3.261015
│ │ └────── 打包日期 YYMMDD（26 = 2026，10 = 月，15 = 日）
│ └──────── 每次打包 +1
└────────── 每次「确定归档」后 +1
```

- **第一位**：每次确定归档后 +1
- **第二位**：每次打包 +1（归档后的第一次打包从 `0` 开始）
- **第三位**：当天日期 YYMMDD
- 例：`1.1.261014` → 同一天再打一次包是 `1.2.261014` → 次日打包 `1.2.261015` → 确定归档后第一位 +1
- 例外（2026-10-15，用户要求）：重新归档并**覆盖上一次归档内容**时，版本号按用户指定值起算，本次即从 `1.0.261015` 重新开始

发版前同步 `version`（`node tools/sync-version.mjs <旧版本> <新版本>` 可自动改后两处）：

1. `config/app.config.js` 的 `version`
2. `package.json` 的 `version`
3. `package-lock.json` 的 `version` 与 `packages[""].version`

改完跑 `node tools/check-version.mjs` 校验。

> **关于 `apiVersion`**：它**不是**应用版本，而是微应用所依赖的 SDK 接口版本，由构建脚本固定注入为 `@sun-panel/micro-app` 的版本号（当前 `1.0.19`）。`config/app.config.js` 里写 `apiVersion` **不会生效**（会被 `build/generators/app-json.js` 覆盖），请勿配置。官方文档的 `app.config.js` 参数表中也没有这个字段。

---

## 目录结构

```text
server-status/
├── config/
│   ├── app.config.js            # 应用配置（ID、版本、权限、数据节点）
│   └── components.config.js     # 组件注册（页面 / 小部件）
├── locales/
│   ├── zh-CN.js                 # 中文语言包
│   └── en-US.js                 # 英文语言包
├── public/
│   ├── icon.png                 # 应用图标
│   └── logo.png                 # 应用 Logo
├── src/
│   ├── main.js                  # ⚙️ 框架入口（不要修改）
│   ├── components/
│   │   ├── widget.js            # 🧩 小部件（卡片主体）
│   │   └── widgetConfig.js      # 🧩 配置页面
│   ├── constants/
│   │   ├── limits.js            # 轮询间隔上下限 / 默认值
│   │   ├── options.js           # 可监控项目表、能力兜底表、切换方式
│   │   └── icons.js             # 指标图标与平台图标（SVG）
│   ├── styles/
│   │   ├── widget.css.js        # 小部件样式（卡片 / 指标块 / 滚动区）
│   │   └── config.css.js        # 配置页样式
│   ├── ui/
│   │   ├── cards.js             # 卡片渲染（含「组件未设置」占位卡）
│   │   ├── chart.js             # Canvas 折线图
│   │   └── scroller.js          # 步进式循环滚动器
│   └── utils/
│       ├── format.js            # 字节 / 速率 / 流量 / 运行时间格式化
│       ├── host.js              # 多地址解析与 127.0.0.1 回退
│       ├── lhm.js               # LibreHardwareMonitor 传感器树解析
│       ├── metrics.js           # 指标过滤与速率换算
│       └── volume.js            # 磁盘卷选择（兼容旧单选字段）
├── build/                       # ⚙️ 构建脚本（不要修改）
├── app.json                     # ⚙️ 自动生成（不要修改）
└── vite.config.js               # ⚙️ 构建配置（不要修改）
```

---

## 功能说明

### 数据源

| 类型 | 说明 | 主要接口 |
|------|------|----------|
| **Proxmox VE** | 支持节点（node）、虚拟机（qemu）、容器（lxc）三种视图 | `/api2/json/nodes/{node}/status`、`/storage`、`/network`、`/qemu/{id}/status/current`、`/lxc/{id}/status/current` |
| **群晖 DSM** | 登录获取 sid 后并发拉取 | `auth.cgi`（登录）、`entry.cgi` × 7（Utilization / Core.Share / FileStation.List / Storage.CGI.Volume / DSM.Info / FileStation.Info / Core.Network.Interface） |
| **Windows** | 三种数据源可手动指定或自动识别 | LiteMonitor `/api/snapshot`、LibreHardwareMonitor `/data.json`、通用 JSON |

### 可监控项目

**左侧信息**：平台、主机名、内网 IP、运行时间、系统版本、内核版本、架构、型号、CPU 核心、序列号、固件版本

**右侧指标**：CPU、内存、磁盘、网络、交换分区、负载、磁盘 IO、IO 等待、根分区、温度、流量、显卡，以及每个勾选磁盘卷独立的「磁盘(卷名)」

> 配置页会在打开实例详情时探测当前接口的实际能力，自动隐藏拿不到的项目；探测失败时回退到按类型预设的兜底表。

### 显示与交互

- **紧凑模式**：右侧指标超过 3 条时一律压缩显示，并按每块可用高度自动分级（≥26px 常规 / 17~26px 收紧 / <17px 极简）；密集档下名称与多排数据并成一行
- **滑动模式**：紧凑模式关闭且指标超过 3 条时，改为步进式循环滚动——滚轮每次移动「一项 + 该项间距」，首尾无缝轮询，视口内恰好 3 块，支持触屏
- **切换方式**：淡入淡出（默认）、翻页效果、缩放切换、翻牌切换、模糊过渡、上下滑动
- **磁盘告警**：达到阈值（默认 90%，0 = 关闭）时对应磁盘块描边高亮并轻微呼吸
- **标题跳转**：点击标题可跳转到该实例的平台管理页
- **指针拖拽排序**：实例顺序 / 左侧信息 / 右侧信息均支持拖拽（鼠标整条按下，触摸需 `⋮⋮` 手柄）
- **分区折叠**：设置页各分区可点标题展开收起

### 接口配置

- **测试连接**：按当前填写内容实际请求一次，显示成功/失败原因、识别到的平台与耗时；PVE 会额外校验令牌权限并提示是否建议授予 PVEAuditor
- **多地址回退**：一个接口可填多个地址（逗号 / 空格 / 分号分隔），按顺序尝试；容器化部署（Sun-Panel 装在群晖 Docker / 套件）下访问宿主机内网 IP 不通时，自动改用同端口 `127.0.0.1`，并在后续刷新中记住可用地址
- **磁盘卷多选 + 自定义**：可勾选探测到的卷，也可手动填写 `/volume3`、`local-lvm` 等；每个勾选的卷在右侧信息中生成独立选项，便于分别显示与排序

### 性能

- 多实例错峰取数（首个立即、其余按序延后），非当前实例降频到 `max(30s, 4×轮询间隔)`
- 可设为「仅刷新当前实例」（实例多时更省资源，切过去时立即补数据）
- PVE / DSM 请求并发（DSM 由 6 次串行改为 1 次往返）
- 运行时间由 1 秒 ticker 就地刷新，不触发整卡重渲染
- 断连时清理全部定时器；支持 `prefers-reduced-motion`

---

## 修改日志

### 1.2.261015 · 2026-10-15（初始化时序加固 + 未配置卡深色实底 + 主题位置还原）

- **修「点应用后重开配置仍是空的」**：SDK 的 `SunPanelPageElement.onConnected()` 在 `connectedCallback` 里就调 `onInitialized({ widgetInfo, customParam })`，而宿主常常是在**之后**才 `updateContext()` 把真正的 `spCtx.widgetInfo` 送进来。此前 `onInitialized` 直接拿构造器默认值 `{ widgetInfo: {} }` 初始化，配置页打开后 `servers` 为空、点「应用」也没有可存的数据。现在改成：`onInitialized` 只在真的拿到 `widgetInfo.config` 时初始化，否则等 `updated()` 里 `spCtx` 变化时再初始化（`_cfgReady` 守卫，避免重复初始化；`widgetInfo` 被换成新对象时刷新数据源）。`handleSaveOrCreateWidget()` 增加 `_cfgReady` 前置判断，未初始化完成时点应用直接返回。小部件侧同样处理（`_widgetReady` + `updated()` 兜底），避免 `render()` 读到空的 `config`。
- **未配置 / 异常卡改为深色实底**：不再跟随「主题 / 亮度」，固定 `linear-gradient(145deg, #1e2026, #14161c)` + 白字，并显式关掉 `backdrop-filter`（此前虽已去掉毛玻璃，但底色仍是半透明渐变，在浅色面板上发灰）。
- **主题按钮位置还原**：「浅色」在左、「深色」在右，只动位置、不改功能（点击「浅色」仍生效 light）。
- **版本号规则调整**：改为 `<归档序号>.<打包序号>.<打包日期 YYMMDD>`，第一位确定归档后 +1、第二位每次打包 +1、第三位当天日期。

### 1.1.261014 · 2026-10-14（应用信息调整 + 修复 PVE 获取失败 + 默认值/文案优化 + 未配置卡片毛玻璃化 + 应用落盘 + 主题对调）

> 版本号规则：`<语义版本>.<打包日期 YYMMDD>`，故同一天多次打包版本号相同。

**应用信息调整**

- 作者改为「周三岁」，应用 ID 改为 `zhousansui-server-status`（2026-10-15 又改为 `zhousansui-device-state`，见下文 `1.0.261015`）
- 应用名称改为「设备状态墙」，简介「查看PVE、DSM、Win\Linux状态」，网络说明「PVE、DSM、Win\Linux对应接口」
- 同时更新中英双语 `locales/*.js`

**修复 PVE「一直获取失败」**

- **根因**：PVE 令牌存放在用户数据节点 `widgetConfig.<widgetId>_token_<idx>` 里，而保存时只认 `widget.save()` 返回的 `t.id`。部分宿主环境保存返回值不带 `id`，导致令牌实际写到 `undefined_token_0`，而读取时用的是真实 `widgetId`，两边对不上 → 请求发不出（26ms 就被拒），表现就是「配置都对但一直获取失败」。现保存时回退到当前 `widgetInfo.widgetId`，并在拿到 `t.id` 后同步 `widgetInfo.widgetId`（`widgetConfig.js:675-683`）
- **测试连接支持未落盘的密钥**：详情页刚输入的令牌还没写入数据节点，此时「测试连接」会取不到 `{{token}}`。现在直接用输入框里的字面量做请求（`widgetConfig.js:449-454`），保存前也能测通
- **失败原因透传到卡片**：原来任何失败都只显示「组件未设置或异常」，无法区分是没填、密钥错还是接口不通。现在每种失败都会带上具体原因（`widget.js` 的 `errMsg`），卡片显示为「获取失败：接口无响应或密钥无效」等；覆盖 PVE / DSM / Windows 三平台共 9 个失败分支

**`apiVersion` 说明（未改动）**

- `app.json` 的 `apiVersion` 由构建脚本固定注入为 SDK 版本 `1.0.19`，**不是**应用版本，`config/app.config.js` 里配置它不生效
- 曾短暂尝试把它改成与 `version` 同步，已还原：`build/generators/app-json.js` 与 `src/main.js` 现与官方模板逐字节一致（便于 `npm run update`）

**基础设置默认值调整**

- 主题默认**浅色**。此前配置页默认深色、而小部件在 `config.theme` 缺省时按浅色渲染，两边正好相反 —— 新建的实例「设置里显示深色、卡片实际是浅色」。现在统一为浅色（`widgetConfig.js:51-53`），小部件侧缺省也按浅色（`widget.js:586`）
- 紧凑模式缺省改为**关闭**（原来默认开启）：`widgetConfig.js:57` 与 `widget.js:610` 两处同步
- 轮询范围缺省改为**仅当前实例**（原来默认全部实例）：`widgetConfig.js:58`
- 磁盘告警阈值缺省改为 **80%**（原来 90%）：`widgetConfig.js:59` 与 `widget.js:606` 两处同步
- 自动切换 / 切换周期 3 秒 / 淡入淡出 / 亮度 100% 原本已符合，本次顺带在配置层校验里显式化

**测试连接后自动刷新**

- 连接成功后重新探测一次该实例：磁盘卷列表与「显示信息管理」中的左右侧可选项目都会刷新，页面提示「· 已刷新卷与可选项」（`widgetConfig.js:525-536`）
- 探测到的每个卷会自动补进右侧信息勾选，同时去掉通用的「磁盘」项，避免出现两个同名磁盘块；全部取消勾选时再把「磁盘」还原回来（`_syncVolItems`，`widgetConfig.js:283-301`）

**新建 Windows 实例接口密码预填问题**

- 新建实例时对象字面量漏了 `win_pwd` 字段，密码输入框会把 `undefined` 当成值回显。现在新建时显式初始化为 `''`（`widgetConfig.js:315`），并且加载/保存阶段只接受字符串（`widgetConfig.js:41`、`widgetConfig.js:690`）

**未配置 / 失败卡片的观感统一（历史记录，后续已被「右键进入配置」方案取代）**

- 未配置卡标题由「服务器监控」改为应用名「设备状态墙」，与 appName 一致
- 未配置（`servers` 为空）或某实例取数失败时，原来渲染成一张白底的 `.container` 小卡片，观感与配置后的卡片完全不一致；现在改用与实例卡片同一套观感（`ui/cards.js` 的 `renderUnsetCard(n, reason)`，`styles/widget.css.js` 的 `.ss2-empty*` 一组规则）
- 文案为居中的三段式：**标题 → 状态 → 「右键进入配置」**；失败实例的 `reason` 只用于测试断言，界面不显示具体原因
- 未配置时卡片通过 `.ss2-agg-wrap:not(.ss2-sw) > .ss2-card:only-child { flex-basis: 100% }` 铺满整个小部件区域
- 历史：这一版曾通过 `_openConfig()` 调 `api.window.open` 实现「点击卡片打开配置」，后因 SDK 1.0.19 无该 API、且宿主只在右键路径送 `widgetInfo` 而删除，详见下面「未配置卡文案改为『右键进入配置』」
- 实测页：`ss2-refactor/test/empty-show.html`（视觉）、`empty.html` / `emptyglass.html` / `emptybg.html`（卡片类名 / 图标色 / `fillRatio: 1` / 点击后无 `windowOpen` / `cursor=default` / 深色主题 `rgb(255,255,255)`）

**未配置卡文案改为「右键进入配置」，点击入口关闭（2026-10-15）**

- 现象：从主页面小部件点开配置页，标题栏 / 取消 / 应用都在，但三个类型卡下面空白、正文显示「实例不存在」，点「应用」也没有数据可存；从右键菜单「小部件配置」进入则完全正常（用户图 1）
- **根因**：读 SDK 1.0.19 源码 `node_modules/@sun-panel/micro-app/dist/index.esm.js`，基类 `class ct extends at`（LitElement 4.2.2）的 `connectedCallback()` 顺序是 `super.connectedCallback()` → `initializeMicroApp()` → `onConnected()`；页面基类 `class Et extends ct` 的 `onConnected()` 里直接调 `onInitialized({ widgetInfo: this.spCtx.widgetInfo, ... })`，而宿主只在**右键路径**上打开配置窗口时才会先 `updateContext()` 送入真 `widgetInfo`。构造器默认值是 `widgetInfo: {}`，所以从小部件点击打开时 `config` 为空 → `_cfgReady` 永远 false → `_cur()` 返回 null → 正文渲染「实例不存在」，且 `handleSaveOrCreateWidget()` 首行 `if (!this._cfgReady) return` 让「应用」静默无效
- 该 SDK 版本**没有** `api.window.open`（`window` 只出现在 `removeEventListener`/`location` 上），也**没有** `widget.close`；宿主提供的配置入口只有右键这一条，且那条路径一定会先 `updateContext()`
- **处理**：采纳用户给的退路，不再自己开窗 —— 删除 `widget.js` 的 `_openConfig()`（原实现调用的 `api.window.open` 在 SDK 里不存在），`renderUnsetCard` 去掉 `onClick` / `@click` / `role` / `tabindex` / `@keydown`，卡片不再可点、`cursor: default`；提示文案由「点击打开配置」统一为「右键进入配置」。配置入口统一走宿主「右键 → 小部件配置」
- 顺带修正失败卡语义：某实例取数失败（`rr.ready === -1`）时不再整卡替换成占位卡，仍渲染实例卡（标题 / 接口信息照常，信息与指标传空数组），失败不再遮挡已有内容
- 实测：`ss2-refactor/test/initorder.html`（24 项全通过，含 `e-tip` 断言文案）、`empty.html` / `emptyglass.html` / `emptybg.html`（点击后无 `windowOpen`、`cursor=default`、失败仍渲染实例卡）

**未配置卡底色改为 #2a2a2a6b（2026-10-15）**

- 按用户要求，`.ss2-card.ss2-empty` 的 `--ss2-bg` 由渐变 `linear-gradient(145deg,#1e2026,#14161c)` 改为纯色 **`#2a2a2a6b`**（42% 不透明度），不跟随「主题 / 亮度」设置；同时把文字 / 边框 / 胶囊变量略提亮，保证在这个半透明深色底上仍然可读
- 浅色主题变量集在这里不适用，`.ss2-card.ss2-theme-light.ss2-empty` 显式覆盖 `--ss2-title` / `--ss2-value` / `--ss2-label` 为白系
- 实测：`initorder.html` 的 `e-opaque-bg` 断言 `backgroundColor === 'rgba(42, 42, 42, 0.42)'`、`e-no-backdrop` 断言 `backdropFilter === 'none'`、`e-white-text` 断言 `color === 'rgb(255, 255, 255)'`

**「应用」按钮语义：只有公共设置视图才真正落盘（2026-10-15，用户要求）**

- 用户要求：「停在『公共设置』视图时才真正调用 `widget.save()`；在『实例详情』『实例列表』点应用只写进草稿区就切回上一级」
- **改动**：`handleSaveOrCreateWidget()` 按当前视图分流 —— `_commitDraft()` 后若 `_view === 'detail'` 直接 `_goList()` 返回、`_view === 'list'` 直接 `_showPublic()` 返回（均不落盘）；只有 `public` 视图才 `await this._persistDraft()` 再 `_closeConfig()`，并把保存结果作为返回值交回调用方（`widgetConfig.js:772-786`）
- 覆盖到 2026-10-14 上一轮「三个视图都立即落盘」的结论：那一轮是为绕开「点一次应用就关窗 → 兜底保存被掐断」，现在按用户意愿回到 detail/list 只写草稿；真正保存的统一入口是**公共设置视图的应用按钮**（或关窗时 `disconnectedCallback()` 的兜底保存）
- `_persistDraft()` 的脏检查不变（无改动时不重复保存），令牌写入路径不变
- 实测：`ss2-refactor/test/applybeh.html`（A 场景无 `widget.close` / B 场景有 close：detail 点应用后 `view='list'`、`saveCalls===0`、`draftDirty===true`；public 点应用后 `saveCalls>=1`、`draftDirty===false`）；`applychain.html` / `applyentry.html` / `applydiag.html` / `applydiff.html` / `applynew.html` / `applynewid.html` / `applytheme.html` 全量通过

**主题默认改为深色（2026-10-15，用户要求）**

- `_loadFromConfig` 的主题缺省由 `'light'` 改为 `'dark'`：`this.theme = i.theme === undefined ? 'dark' : (i.theme === 'dark' ? 'dark' : 'light')`（`widgetConfig.js:84`）
- 向后兼容：已有 config 里带 `theme` 字段的实例沿用原值，只有**从未设置过主题的新实例**才落到深色
- 小部件侧无需改动，`widget.js` 本来就是读 `config.theme === 'dark' ? 'dark' : 'light'`，两边的默认值现在一致
- 实测：`initorder.html` 的 `c-theme-default-dark`（`config: {}` → `el2.theme === 'dark'`）、`c-theme-loaded`（`config.theme = 'light'` 的旧实例仍是 light）、`t-light-active` / `t-dark-inactive` 已随语义反转为「深色默认高亮」

**首次配置 PVE / Windows 时「测试连接」不刷新卷与可选项（2026-10-15 修复）**

- 现象：第一次配置 ProxmoxVE 和 Windows，点「测试连接」界面上的「刷新卷和可选项」没有真实刷新，应用后重新打开才刷新
- **根因两条**：
  1. PVE 探测用的请求头密钥走 `{{token}}` 占位符 + `dataNodeKey`，而新实例的密钥**还没落盘**，`dataNode` 里取不到值 → 探测请求 401 → 卷列表与能力项都拿不到。`_testConn()` 已经支持「本次输入的密钥字面量化」（`_typed`），但 `_loadMeta()` 内部又走回了占位符模板
  2. Windows 探测直接用 `s.url` 原值请求，而用户常填的是网页根地址（如 `http://192.168.1.5:8080`），返回的是 HTML 页面而非 JSON；归一化只在 `_buildConfig()` 保存时才做，探测时不归一化
- **修复**：
  - `utils/host.js` 新增 `normalizeWinUrl(u, src)`：已是数据接口（`/api/snapshot` 或 `/data.json`）原样返回；否则剥掉末尾 `/api/xxx` 段，按数据源补上 `/api/snapshot`（默认 / LiteMonitor）或 `/data.json`（LibreHardwareMonitor）
  - `_loadMeta()` 的 PVE 分支改为：`_typed`（本次输入密钥）非空时用字面量密钥且不带占位符模板，为空时才回退 `_tokenTmpl()`
  - `_loadMeta()` / `_buildConfig()` / `_testConn()` 的 Windows 分支统一走 `normalizeWinUrl`，探测与保存口径一致
  - `widget.js` 的 `_fetchWin` 同样改用 `normalizeWinUrl`（含回退到 `127.0.0.1` 时再归一化一次），老实例存的是网页根地址也能正常取数
- 实测：`caps.html`（9 项）、`feat.html` / `feat2.html`（`testMsg` 末尾带「· 已刷新卷与可选项」、`rightItems` 自动补 `disk:volume1` / `disk:volume2`）、`compare-ref` 8 页一致、`verify-modules` 无未解析标识符

**主题「浅色 / 深色」位置与功能对调**

- 按用户要求把「深色」按钮移到左侧、「浅色」移到右侧，点击语义与高亮保持正确（`widgetConfig.js:841-842`）
- 同时说明：渲染侧本来就是对的 —— `widget.js` 与 `ui/cards.js` 都以 `theme === 'dark'` 走深色变量集（`.ss2-card` 基类）、`'light'` 走 `.ss2-theme-light`；此前「反了」的观感来自配置页默认深色与小部件缺省浅色不一致，该默认值已在上一轮统一为浅色

**未配置卡去掉毛玻璃（保留半透明底色）**

- 按用户要求，未配置卡不再启用 `backdrop-filter: blur(20px)`，只保留半透明底色 + 22px 圆角 + 1px 细边框，能透出面板背景但不糊成一片；已配置卡片仍是原来的毛玻璃（`styles/widget.css.js:441-466`）
- 实测：`ss2-refactor/test/emptybg.html`（未配置浅色 / 深色均 `backdropFilter=none`，已配置卡仍为 `blur(20px)`，点击后无 `windowOpen`）

**Windows 文案调整**

- 类型选择卡片副标题：`LiteMonitor` → `LiteMonitor\LibreHardwareMonitor`
- 实例接口栏提示：`Windows需要安装LiteMonitor并打开网页版显示` → `Windows需安装LiteMonitor\LibreHardwareMonitor并打开网页端`
- 删除「数据源」下方的长提示（LiteMonitor / LibreHardwareMonitor 的地址与端口说明）

**「应用」按钮失效排查（Sun-Panel v2.0.2-beta260912 现场复现）**

- 现象：从主页面小部件直接点开配置页，「应用」点下去完全没反应；从右键菜单「小部件配置」进入则正常
- 定位结论：三条路径（detail / list / public）的「应用」语义与重构前逐字一致 —— detail/list 只写入草稿区并返回上一级，public 才真正调用 `widget.save()`。用 headless Chrome 逐按钮实跑 `ss2-refactor/test/applynew.html`（新建小部件 → 填接口 → 测试连接 → detail 应用 → list 应用 → public 应用）确认最终 `save` 1 次、`draftDirty` 归零、新值持久化正确
- 与宿主差异有关的一点：SDK 只声明了 `window.open` / `widget.save`，**没有** `widget.close`；因此点「应用」落盘后 `_closeConfig()` 找不到可用的关闭入口，会退化为 `_showPublic()`（界面停在公共设置页）
- **后续修正（2026-10-15）**：这一轮的「点开配置无数据」根因不是保存语义，而是宿主只在**右键路径**上才 `updateContext()` 送真 `widgetInfo`；已改为统一走右键入口，详见上文「未配置卡文案改为『右键进入配置』」

**未配置卡改为「一层透明玻璃」**

- 按用户要求去掉二级内层面板：`.ss2-empty-box` 不再有背景 / 边框 / 模糊 / 内边距，卡片本体就是一层半透明深色底（`--ss2-bg: #2a2a2a6b`，见上文），`.ss2-body` 恢复为整体居中（`styles/widget.css.js:441-469`）
- 视觉页 `ss2-refactor/test/emptyglass-show.html`（1150×280 三态截图）与断言页 `ss2-refactor/test/emptyglass.html`（4 项：`boxBg=none` / `boxBorder=0px` / `boxFilter=none` / `bodyAlign=center`、深色主题白字、点击后无 `windowOpen`、失败仍渲染实例卡）均已通过

- 未配置卡文案由「点击打开配置」统一为「右键进入配置」，卡片不再可点（SDK 1.0.19 无 `api.window.open`，宿主只在右键路径送入真 `widgetInfo`）
- 未配置卡底色改为 `#2a2a2a6b`（42% 不透明深色），不跟随主题 / 亮度；文字与胶囊变量提亮保证可读
- 取数失败时不再整卡替换成占位卡，仍渲染实例卡，失败不再遮挡已有内容

### 1.0.261015 · 2026-10-15（重新归档，覆盖上一次归档内容）

**用户要求：「将显示信息中的有关 Linux 都先移除」「ID 改为 zhousansui-device-state」「版本改为 1.0.261015」「改好后归档，归档方式同上一次，覆盖上一次的归档类容」。**

- **移除 Linux 字样**：`locales/zh-CN.js` 与 `locales/en-US.js` 三处文案里的 `Win\Linux` 全部改为 `Win`，即
  - `APP_DESCRIPTION`：`查看PVE、DSM、Win状态` / `View PVE, DSM, Win status`
  - `NETWORK_DESCRIPTION`：`PVE、DSM、Win对应接口` / `PVE, DSM, Win endpoints`
  - `WIDGET_DESCRIPTION`：`监控Proxmox VE 、 群晖 DSM 、 Windows 主机的运行状态` / `Monitor Proxmox VE, Synology DSM, Windows hosts`
  - 说明：`src/**` 内并无 Linux 字样（`grep Linux` 0 命中），左侧 / 右侧「显示信息管理」的可选项表（`src/constants/options.js`）里也从来没有 Linux 条目，因此只需改语言包。
- **应用 ID 改名**：`zhousansui-server-status` → `zhousansui-device-state`，改 `config/app.config.js:16` 的 `microAppId` 与 `package.json` / `package-lock.json` 的 `name`/`version`；`app.json` 的 `microAppId` 由 `build/build.js` 重新生成，`packages/` 下的 zip 名随之变为 `zhousansui-device-state-1.0.261015.zip`
  - **不影响已有实例**：数据节点 `widgetConfig.<widgetId>_token_<idx>` 用的是宿主分配的 `widgetInfo.widgetId`，与 `microAppId` 无关；组件注册名仍是 `server-monitor-config` / `server-monitor-widget`（`config/components.config.js`），改名只影响应用商店里的标识与包名
- **版本号重新起算**：按用户要求改为 `1.0.261015`（上一次归档是 `2.0.261015`，本次覆盖该归档，故第一位回到 1、第二位归零）
- **README 同步**：应用 ID 行、当前版本行、标题行描述（`Windows（含 Linux）` → `Windows`）
- 归档方式同上一轮：zip + 桌面项目目录 `_archive/` 快照，**覆盖**上一次 `2.0.261015` 的归档内容
- 代码行为与 `2.0.261015` **完全一致**（仅语言包文案、应用 ID、版本号与文档变化），回归：28 页全绿，`compare-ref` 8/11 一致

### v1.4.261015 · 2026-10-15

- **「应用」语义**：只有停在公共设置视图才真正调用 `widget.save()`；实例详情 / 实例列表点应用只写草稿区并切回上一级（用户要求）
- **主题默认深色**：新实例（config 无 `theme`）默认深色，已有实例沿用原值
- **测试连接真实刷新**：新增 `normalizeWinUrl()` 统一 Windows 地址归一化（探测 / 保存 / 取数同一口径）；PVE 探测支持本次输入密钥字面量化，新实例密钥未落盘也能拉到卷与可选项
- 回归：28 页全绿，`compare-ref` 8/11 一致（3 处 DIFF 为上述预期语义变化）

### v1.261021 · 2026-10-14（重构）

- 由混淆单文件产物重构为标准微应用工程：拆分为 `constants / styles / ui / utils / components` 模块，改用官方 `@sun-panel/micro-app` SDK（1.0.19）替代内联的 lit + SDK 运行时
- 配置层迁移到 `config/app.config.js` 与 `config/components.config.js`，文案迁移到 `locales/*.js`，构建链与打包流程沿用官方模板
- 行为与重构前逐项对齐：11 个回归页全部通过，10 个页面的渲染结果与重构前逐字段一致

### v1.261020 · 2026-10-08

- 设置页右侧控件统一加宽到 152px 并禁止换行（「仅当前」等短标签单行显示，各行控件对齐）
- 设置页分区支持折叠：基础设置 / 外观 / 实例顺序 / 接口配置 / 标题跳转 / 显示信息管理，点标题即可展开收起，箭头随之旋转

### v1.261019 · 2026-10-08

- 拖拽排序重做：去掉与自定义拖拽冲突的 HTML5 拖拽，改为指针拖拽（阈值触发 + 蓝色落点线 + 拖完屏蔽误触点击），实例顺序 / 左侧信息 / 右侧信息 现在一次就能拖到位
- 新增「轮询范围」：可设为仅刷新当前实例（实例多时更省资源，切过去时立即补数据）
- 新增「磁盘告警阈值」（默认 90%，0 = 关闭）：达标磁盘块描边高亮 + 轻微呼吸
- PVE 测试连接补充令牌权限校验（提示是否建议授予 PVEAuditor）
- Windows 新增 LibreHardwareMonitor（data.json）数据源，可读到温度/显卡/风扇等更多传感器，数据源可手动指定或自动识别

### v1.261018 · 2026-10-07

- 接口配置新增「测试连接」按钮：按当前填写内容实际请求一次，显示成功/失败原因、识别到的平台与耗时
- 取数地址支持多地址（逗号分隔）并自动回退：容器化部署（Sun-Panel 装在群晖 Docker/套件）下访问宿主机内网 IP 不通时，自动改用同端口 127.0.0.1，并在后续刷新中记住可用地址
- 磁盘卷改为多选 + 自定义（可手动填写 /volume3、local-lvm 等），每个勾选的卷在右侧信息中生成独立的「磁盘(卷名)」选项，便于分别显示与排序
- 右切换箭头颜色固定为与页码一致（不再跟随「标题颜色」变化）

### v1.261016 · 2026-10-07

- 标题行按「右切换」箭头的实际占位高度（24px）固定，两种情况下分割线完全对齐

### v1.261015 · 2026-10-07

- 标题行固定 22px 高度：有无「右切换」图标时，分割线位置保持一致
- 标题文字固定白色（浅色主题保持深色），标题前图标改为 currentColor 并跟随「标题颜色」设置

### v1.261014 · 2026-10-07

- 紧凑密集档再收紧内边距/数值间距，保证双排行右对齐后不会被省略号截断

### v1.261013 · 2026-10-07

- 紧凑密集档的双排指标（磁盘IO/网络/流量）改为与群晖一致：名称靠左、数值贴右对齐

### v1.261012 · 2026-10-07

- 修复：紧凑密集档下 磁盘IO/网络/流量 等双排指标被水平居中（改为名称靠左、数值靠右）
- 切换方式：移除实际选不中的「左右切换」，新增 缩放切换 / 翻牌切换 / 模糊过渡 / 上下滑动 四种

### v1.261011 · 2026-10-07

- 紧凑模式改为「右侧指标超过 3 条一律压缩」，并按每块可用高度自动分级（±26px 常规 / 17~26px 收紧 / <17px 极简），解决 PVE 选满 7 项时压缩不生效、退回滑动模式的问题；密集模式下名称与多排数据并成一行
- 修复：群晖内存百分比与子行数值口径不一致（50% 却显示 6.09/7.56GB），子行改为与百分比同口径

### v1.261010 · 2026-10-07

- 修复：fade 切换模式下非当前卡片带 scale(.92)，用 getBoundingClientRect 量高度会偏小，导致切过去时指标块比正常小、第 4 块露出，要等下一次刷新才恢复；改用布局高度

### v1.261009 · 2026-10-07

- 修复：运行时间秒级刷新误写 Lit 节点的 textContent，破坏模板节点标记导致约 1 分钟后整卡渲染抛错（表现为：向右切换按钮点不动、紧凑模式/显示项改动不生效，必须刷新页面）
- 紧凑模式下 磁盘IO/网络/流量 的多排数据合并为一排显示（上排在前、下排在后）

### v1.261008 · 2026-10-07

- 新增可监控项目：左侧 平台/内核版本/CPU核心/序列号/固件版本，右侧 交换分区/磁盘IO/IO等待/根分区/显卡
- 实例设置里按当前接口实际能力自动隐藏拿不到的项目（打开详情时探测，探测失败回退到类型兜底表）
- 性能：多实例错峰取数 + 非当前实例降频；PVE/DSM 请求改并发（DSM 6 次串行 → 1 次往返）
- 运行时间改为 1 秒就地刷新，不再为它整卡重渲染；断连时清理全部定时器
- hover 过渡去掉 box-shadow 动画并支持 prefers-reduced-motion；滑动区新增极细进度条

### v1.261007 · 2026-10-07

- 信息区 / 指标区改为步进式循环滚动：滚轮每次固定移动「一项 + 该项间距」，滚过最后一项无缝回到第一项，反向越过顶部回到最后一项（首尾轮询），并支持触屏
- 滑动视口内恰好显示 3 个指标块：首块顶边与左侧信息卡顶边、第三块底边与信息卡底边严格对齐
- 修复：滑动模式下首个指标块 hover 上移 1px 被视口裁切（overflow: clip + overflow-clip-margin）
- 修复：紧凑模式指标超过 6 条时块高溢出卡片；现在超过 6 条自动改为滑动模式
- 一屏放得下时不再渲染重复副本，滚轮交还页面，触屏不再被拦截

### v1.261001 · 2026-10-02

- 卡片 UI 重构：左信息卡 + 右指标卡毛玻璃拟态，左右列 40%/60%、中缝 10px、卡片 padding 8px
- 指标卡 hover 上移高亮，切换显示用量/总量，进度条荧光绿渐变
- 三平台 Config 主题、衬底透明度滑块（数值越大越透明）
- 修复：透明度 style 写法不生效、DSM 卷 API 103 权限错误改用 real_path、指标卡 hover 上移被父容器 overflow 裁切
- 标题统一：群晖 DSM → 群晖（显示卡片、设置界面、app.json 组件注册表）
- 图标方案：维持原单色图标，未作改动
