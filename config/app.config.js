/**
 * 微应用配置文件
 * 应用基础配置
 */


export default {
  // =======================
  // 应用基础信息
  // =======================
  // 配置文件格式版本
  appJsonVersion: '1.1',
  // 作者标识
  author: '周三岁',
  // 应用唯一标识（作者标识-应用标识）
  microAppId: 'zhousansui-device-state',
  // 应用版本：<归档序号>.<打包序号>.<打包日期 YYMMDD>
  // 规则（2026-10-15 起）：第一位 = 确定归档后 +1；第二位 = 每次打包 +1；第三位 = 当天日期
  // 本次为重新归档（覆盖上一次归档内容），按用户要求重新从 1.0.261015 起编号。
  version: '1.0.261015',
  // 注：app.json 的 apiVersion 由构建脚本注入，固定为 SDK 版本（@sun-panel/micro-app 的 1.0.19），
  // 此处写 apiVersion 不生效，故不再配置。
  // 入口文件
  entry: 'main.js',
  // 图标
  icon: 'logo.png',
  // 调试模式（测试打包时自动强制为 true；正式发布请设置为 false）
  debug: false,

  // 应用信息（使用 '$t: xxx' 可以引用翻译）
  appInfo: {
    appName: '$t:APP_NAME',
    description: '$t:APP_DESCRIPTION',
    networkDescription: '$t:NETWORK_DESCRIPTION',
  },

  // 语言文件映射（appJsonVersion:1.1 新增）
  // 格式：{ 语言代码: 文件名 }
  // 文件名相对于 locales/ 目录，支持多语言代码指向同一文件
  locales: {
    'zh-CN': 'zh-CN.json',
    'en-US': 'en-US.json',
  },

  // 默认语言（当主应用语言在微应用中不存在时，回退到此语言）
  // 如果不设置，默认为 'en-US'
  defaultLocale: 'zh-CN',

  // 权限配置
  permissions: [
    'network',
    'dataNode',
  ],

  // 网络域名白名单
  networkDomains: [
    '*',
  ],

  // 数据节点配置
  dataNodes: {
    widgetConfig: {
      scope: 'user',
      isPublic: false,
    },
  },
};
