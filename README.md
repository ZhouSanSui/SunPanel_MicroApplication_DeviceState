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
- 指标卡 hover 上移高亮，切换显示用量/总量，进度条荧光绿渐变
- 三平台 Config 主题、衬底透明度滑块（数值越大越透明）
- 修复：透明度 style 写法不生效、DSM 卷 API 103 权限错误改用 real_path、指标卡 hover 上移被父容器 overflow 裁切
- 标题统一：群晖 DSM → 群晖（显示卡片、设置界面、app.json 组件注册表）
- 图标方案：维持原单色图标，未作改动
