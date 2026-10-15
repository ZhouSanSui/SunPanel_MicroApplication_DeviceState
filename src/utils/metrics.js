/**
 * 指标块的百分比、告警与过滤。
 */
export function percentOf(v, t) { return t > 0 ? Math.min(Math.max(v / t * 100, 0), 100) : 0; }

// 磁盘告警：使用率达到阈值（默认 90%，0=关闭）时给指标块打警告标记
export function isDiskWarn(c, pct) {
  const th = parseInt(c && c.diskWarn);
  return isFinite(th) && th > 0 && pct >= th;
}

// 过滤接口未返回数据的指标块：_ok===false 的块不渲染（数据字段存在但值为 0 的块保留）
export function trimMetrics(arr) {
  if (!Array.isArray(arr)) return arr;
  for (let i = arr.length - 1; i >= 0; i--) {
    const m = arr[i];
    if (!m || m._ok === false) { arr.splice(i, 1); continue; }
    delete m._ok;
  }
  return arr;
}
