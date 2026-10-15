/**
 * 组件配置文件
 * 类似于 vue 路由配置，name 值全局不可以重复
 */

// 导入组件对象（只在浏览器环境使用）
import { ServerMonitorWidget } from '../src/components/widget.js';
import { ServerMonitorConfig } from '../src/components/widgetConfig.js';

export default {
  // =======================
  // 页面注册
  // =======================
  pages: {
    'server-monitor-config': {
      // 组件对象（直接引用）
      component: ServerMonitorConfig,
    },
  },

  // =======================
  // 小部件（卡片）注册
  // =======================
  widgets: {
    'server-monitor-widget': {
      // 组件对象（直接引用）widgetId
      component: ServerMonitorWidget,
      // 绑定的小部件配置 Page 组件名字
      // 当主平台添加当前应用的小部件时会以窗口的形式打开此组件页面进行配置
      configComponentName: 'server-monitor-config',
      // 卡片尺寸：当前卡片布局按 2x4 设计
      size: ['2x4'],
      // 为空使用Sun-Panel默认背景颜色作为底色 支持css样式
      background: '',
      // v1.1 新增字段
      widgetName: '$t:WIDGET_NAME',
      widgetDescription: '$t:WIDGET_DESCRIPTION',
      sort: 10, // 排序权重，数字越小越靠前
    },
  },
};
