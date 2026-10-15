/**
 * 数值 / 时间格式化工具。
 * 对应原产物的 C、Ae、X 及 _fmt* 系列函数。
 */
export function formatBytes(n, t=2) {
  if (n === 0 || !n || isNaN(n))
  {return '0 B';}
  const e = 1024
    , i = t < 0 ? 0 : t
    , s = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    , a = Math.floor(Math.log(n) / Math.log(e));
  return parseFloat((n / Math.pow(e, a)).toFixed(i)) + ' ' + s[a];
}

export function formatDuration(n) {
  const t = Math.floor(n / 86400)
    , e = Math.floor(n / 3600) % 24
    , i = Math.floor(n / 60) % 60;
  return `${t}\u5929 ${e}\u65F6 ${i}\u5206`;
}

export function downsampleSeries(n, t) {
  if (!n || n.length === 0)
  {return [];}
  const e = n.length > 1 && n[0].timestamp > n[1].timestamp ? [...n].sort( (r, o) => r.timestamp - o.timestamp) : n
    , i = [];
  let s = Math.floor(e[0].timestamp / t) * t
    , a = e[0].value;
  for (let r = 1; r < e.length; r++) {
    const o = e[r]
      , c = Math.floor(o.timestamp / t) * t;
    c !== s ? (i.push({
      timestamp: s,
      value: a,
    }),
    s = c,
    a = o.value) : a = Math.max(a, o.value);
  }
  return i.push({
    timestamp: s,
    value: a,
  }),
  i;
}

// 监控指标使用率变色：<80 绿 / <90 黄 / >=90 红（参考 sun-panel 色阶）
export function usageColor(p) {
  const v = parseFloat(p) || 0;
  return v < 80 ? '#52c41a' : v < 90 ? '#faad14' : '#ff4d4f';
}


// 显示界面中心水印：固定为程序构建时间（YYYY-MM-DD HH:MM:SS），用于部署成功与否的校验标记
export function formatWatermark() {
  //return "2026-10-07 22:16:10"
}

export function stripSequence(n) {
  return String(n || '').replace(/\s*·\s*\d+\s*$/, '').trim() || n;
}
export function formatSpeed(n) {
  const t = parseFloat(n) || 0;
  return t >= 1024 ? (t / 1024).toFixed(1) + ' MB/s' : t.toFixed(2) + ' KB/s';
}
// 无速率数据（首个采样点 / 计数器回绕）时显示 --，避免误报 0
export function formatSpeedOrNull(v) { return v == null ? '--' : formatSpeed(v); }
export function toNumber(v) { const n = parseFloat(v); return isFinite(n) ? n : null; }
// PVE 的 netin/netout、diskread/diskwrite 是「自进程启动以来的累计字节」，
// 用相邻两次采样的差值换算成速率；首个采样返回 null（显示 --）。计数器回绕时也返回 null。
export function rateOf(r, key, val, now) {
  if (!r._prev) r._prev = {};
  const p = r._prev[key];
  r._prev[key] = { v: val, t: now };
  if (val == null || !p || p.v == null || now <= p.t) return null;
  const dt = (now - p.t) / 1000;
  return val >= p.v && dt > 0 ? (val - p.v) / dt / 1024 : null;   // 返回值单位 KB/s，与 _fmtSpeed 口径一致
}
export function formatTraffic(n) {
  const t = parseFloat(n) || 0;
  return t >= 1073741824 ? (t / 1073741824).toFixed(2) + ' GB' : t >= 1048576 ? (t / 1048576).toFixed(1) + ' MB' : (t / 1024).toFixed(1) + ' KB';
}
export function parseUptime(n) {
  if (typeof n === 'number' && isFinite(n))
  {return Math.max(0, Math.floor(n));}
  if (typeof n !== 'string')
  {return null;}
  const t = n.match(/(?:(\d+)\s*天)?\s*(?:(\d+)\s*时)?\s*(?:(\d+)\s*分)?\s*(?:(\d+)\s*秒)?/);
  if (!t || !(t[1] || t[2] || t[3] || t[4]))
  {return null;}
  return (parseInt(t[1] || 0) || 0) * 86400 + (parseInt(t[2] || 0) || 0) * 3600 + (parseInt(t[3] || 0) || 0) * 60 + (parseInt(t[4] || 0) || 0);
}
export function formatUptime(n) {
  const t = Math.max(0, Math.floor(n || 0)),
    e = Math.floor(t / 86400),
    i = Math.floor(t % 86400 / 3600),
    s = Math.floor(t % 3600 / 60);
  return `${e}天 ${i}时 ${s}分`;
}
