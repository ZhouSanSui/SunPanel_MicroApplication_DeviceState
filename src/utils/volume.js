/**
 * 实例选中的磁盘卷（兼容旧版单选字段 diskVolume）。
 */
// 实例选中的磁盘卷（兼容旧版单选字段 diskVolume）
export function selectedVolumes(s) {
  if (!s) return [];
  const arr = Array.isArray(s.diskVolumes) ? s.diskVolumes : [];
  const list = arr.length ? arr : (s.diskVolume ? [s.diskVolume] : []);
  return list.map(v => String(v).replace(/^\/+/, '')).filter(Boolean);
}
