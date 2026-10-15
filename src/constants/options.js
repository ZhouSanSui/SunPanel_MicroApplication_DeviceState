/**
 * 显示信息管理（左侧静态信息 / 右侧监控指标）的选项表、
 * 默认勾选、接口能力兜底表与实例切换动画表。
 */
// 左侧信息（静态信息）可选项：platform/kernel/cores/serial/firmware 为本次新增
export const LEFT_ITEM_OPTIONS = [
  { key: 'platform', label: '平台' },
  { key: 'hostname', label: '主机名' },
  { key: 'ip', label: '内网IP' },
  { key: 'uptime', label: '运行时间' },
  { key: 'version', label: '系统版本' },
  { key: 'kernel', label: '内核版本' },
  { key: 'arch', label: '架构' },
  { key: 'model', label: '型号' },
  { key: 'cores', label: 'CPU核心' },
  { key: 'serial', label: '序列号' },
  { key: 'firmware', label: '固件版本' },
];
// 右侧信息（监控指标）可选项：swap/diskio/iowait/rootfs/gpu 为本次新增
export const RIGHT_ITEM_OPTIONS = [
  { key: 'cpu', label: 'CPU' },
  { key: 'memory', label: '内存' },
  { key: 'disk', label: '磁盘' },
  { key: 'network', label: '网络' },
  { key: 'swap', label: '交换分区' },
  { key: 'load', label: '负载' },
  { key: 'diskio', label: '磁盘IO' },
  { key: 'iowait', label: 'IO等待' },
  { key: 'rootfs', label: '根分区' },
  { key: 'temp', label: '温度' },
  { key: 'traffic', label: '流量' },
  { key: 'gpu', label: '显卡' },
];
// 默认勾选项：与升级前保持一致，新增项按需勾选
export const DEFAULT_LEFT_ITEMS = ['hostname', 'uptime', 'ip', 'version', 'arch', 'model'];
export const DEFAULT_RIGHT_ITEMS = ['cpu', 'memory', 'disk', 'network', 'load', 'temp', 'traffic'];
// 各接口类型「理论上能提供」的项目（探测失败时的兜底，避免用户无法配置）
export const FALLBACK_LEFT_CAPS = {
  pveNode: ['platform', 'hostname', 'uptime', 'ip', 'version', 'kernel', 'arch', 'model', 'cores'],
  pveGuest: ['platform', 'hostname', 'uptime', 'model'],
  dsm: ['platform', 'hostname', 'uptime', 'ip', 'version', 'arch', 'model', 'serial', 'firmware'],
  win: ['platform', 'hostname', 'ip', 'uptime', 'arch', 'version', 'model'],
};
export const FALLBACK_RIGHT_CAPS = {
  pveNode: ['cpu', 'memory', 'disk', 'network', 'swap', 'load', 'diskio', 'iowait', 'rootfs'],
  pveGuest: ['cpu', 'memory', 'disk', 'network', 'swap', 'diskio'],
  dsm: ['cpu', 'memory', 'disk', 'network', 'temp'],
  win: ['cpu', 'memory', 'disk', 'network', 'diskio', 'traffic', 'temp', 'gpu'],
};
// 实例切换动画（原「左右切换」因为配置层会把它规范化成 fade、实际永远选不中，已移除）
export const SWITCH_MODES = [
  { key: 'fade', label: '淡入淡出' },
  { key: 'curl', label: '翻页效果' },
  { key: 'zoom', label: '缩放切换' },
  { key: 'flip', label: '翻牌切换' },
  { key: 'blur', label: '模糊过渡' },
  { key: 'drop', label: '上下滑动' },
];
export const isSwitchMode = k => SWITCH_MODES.some(m => m.key === k);
export const switchModeLabel = k => (SWITCH_MODES.find(m => m.key === k) || SWITCH_MODES[0]).label;

export const PVE_DEFAULT_LEFT = ['cpu', 'memory', 'disk'];
