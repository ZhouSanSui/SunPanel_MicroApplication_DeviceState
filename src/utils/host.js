/**
 * 取数地址解析：一个接口里可写多个地址（逗号 / 空格 / 分号分隔），
 * 并给出同端口的 127.0.0.1 回退候选（容器化部署下内网 IP 常不可达）。
 */
// —— 取数地址：一个「接口」里可以写多个地址（逗号/空格/分号分隔），按顺序尝试 ——
export function parseHostList(host) {
  const raw = String(host || '').trim();
  if (!raw) return [];
  const out = [];
  raw.split(/[\s,;]+/).forEach(p => {
    const h = p.replace(/\/+$/, '');
    if (h && out.indexOf(h) < 0) out.push(h);
  });
  return out;
}

// 这里给出同端口的 127.0.0.1 作为回退候选
export function loopbackHostOf(h) {
  const s = String(h || '');
  if (!s || /127\.0\.0\.1|localhost|\[::1\]/i.test(s)) return '';
  const m = s.match(/^([a-zA-Z][\w+.-]*:\/\/)?([^/:]+)(:\d+)?/);
  return m ? (m[1] || 'http://') + '127.0.0.1' + (m[3] || '') : '';
}

// —— Windows 取数地址归一化 ——
// 用户填的往往是 LiteMonitor / LibreHardwareMonitor 的网页根地址（如 http://ip:8081），
// 而真正的数据接口分别是 /api/snapshot 与 /data.json；不归一化时探测与小部件取数
// 都会去请求一个 HTML 页面，拿到的东西既不是 items 也不是传感器树，项目就被误判为「不可用」。
// 规则：已经带 /api/snapshot 或 /data.json 的原样用；否则保留 Origin 后按数据源补上默认路径。
export function normalizeWinUrl(u, src) {
  const raw = String(u || '').trim().replace(/\/+$/, '');
  if (!raw) return '';
  if (/\/api\/snapshot(\?|$)/i.test(raw) || /\/data\.json(\?|$)/i.test(raw)) return raw;
  let base = raw;
  // 用户可能顺手把别的 api 路径一起写进来，剥掉后再按数据源补默认路径
  if (/\/api\/[^/]*$/i.test(raw)) base = raw.replace(/\/api\/[^/]*$/i, '');
  const m = base.match(/^([a-zA-Z][\w+.-]*:\/\/[^/]+)/);
  if (!m) return base;
  const _s = String(src || 'auto');
  const path = _s === 'lhm' ? '/data.json' : '/api/snapshot';
  return m[1] + path;
}
