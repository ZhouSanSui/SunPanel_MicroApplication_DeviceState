/**
 * LibreHardwareMonitor /data.json 传感器树解析。
 * 结构是「组件 → 传感器」的树，这里拍平成 [{path, name, value}]，
 * value 形如 "12.3 %" / "45.0 °C" / "1.5 GB"。
 */
// 结构是「组件 → 传感器」的树，这里拍平成 [{path, name, value}]，value 形如 "12.3 %" / "45.0 °C" / "1.5 GB"
export function flattenLhmSensors(root) {
  const out = [];
  const walk = (n, path) => {
    if (!n) return;
    const t = String(n.Text == null ? '' : n.Text).trim();
    const p = t ? path.concat([t]) : path;
    const kids = Array.isArray(n.Children) ? n.Children : [];
    if (!kids.length && n.Value != null) out.push({ path: p, name: p[p.length - 1] || '', value: String(n.Value) });
    kids.forEach(ch => walk(ch, p));
  };
  walk(root, []);
  return out;
}
export function lhmNumber(v) { const m = String(v == null ? '' : v).match(/-?[\d.]+/); return m ? parseFloat(m[0]) : null; }
export function isLhmTree(e) { return !!e && !Array.isArray(e.items) && (Array.isArray(e.Children) || (e.Children && typeof e.Children === 'object')); }
export function pickLhmSensor(list, nameRe, unitRe, pathRe) {
  for (const s of list) {
    if (!nameRe.test(s.name)) continue;
    if (unitRe && !unitRe.test(s.value)) continue;
    if (pathRe && !pathRe.test(s.path.join('/'))) continue;
    return s;
  }
  return null;
}
