/**
 * 信息区 / 指标区 循环滚动。
 * 容器只作裁剪视口，真正的位移由内部 track 的 translateY 完成：
 *   · 每次滚轮固定移动「一项 + 该项间距」的距离；
 *   · 末尾追加一份副本，走完副本首项后无过渡跳回第一项，末尾→首项轮询且无回弹；
 *   · 反向越过顶部时先瞬移到 n*step 再动画到 n-1，同样轮询。
 */
// ===== 信息区 / 指标区 循环滚动 =====
// 容器只作裁剪视口，真正的位移由内部 track 的 translateY 完成：
//   · 每次滚轮固定移动「一项 + 该项间距」的距离；
//   · 末尾追加一份副本，走完副本首项后无过渡跳回第一项，末尾→首项轮询且无回弹；
//   · 反向越过顶部时先瞬移到 n*step 再动画到 n-1，同样轮询。
export const EASE = 'cubic-bezier(.22,.61,.36,1)';
export const DURATION_MS = 300;
export function getTrack(host) { return host ? (host.querySelector('.ss2-infos-track, .ss2-mtrack') || host.firstElementChild) : null; }
// 取「布局高度」：必须用 getComputedStyle 而非 getBoundingClientRect，
// 多实例切换过渡中卡片可能带 scale(.92)，rect 会量到缩小后的高度，导致滑窗高度算小
export function layoutHeight(el) {
  const h = parseFloat(getComputedStyle(el).height);
  return isFinite(h) && h > 0 ? h : el.getBoundingClientRect().height;
}
// 紧凑模式按「每块可用高度」自动分级：≥26px 常规、17~26px 收紧(dense)、<17px 极简(ultra)
export function applyCompactDensity(el) {
  const n = el.children.length;
  if (!n) return;
  const gap = parseFloat(getComputedStyle(el).rowGap) || 0;
  const h = (layoutHeight(el) - gap * (n - 1)) / n;
  el.classList.toggle('ss2-dense', h < 26);
  el.classList.toggle('ss2-ultra', h < 17);
}
export function getItems(host) { const t = getTrack(host); return t ? Array.prototype.slice.call(t.children) : []; }
export function getRealCount(host) { return getItems(host).filter((el) => { return !el.classList.contains('ss2-clone'); }); }
export function isListMode(host) { return !!host && !!host.classList && (host.classList.contains('ss2-infos') || (host.classList.contains('ss2-metrics') && host.classList.contains('ss2-scroll'))); }
export function getState(host) {
  if (!host._ss2st) host._ss2st = { idx: 0, acc: 0, anim: false, rest: 0, timer: null, ty: 0 };
  return host._ss2st;
}
// 单步距离 = 相邻两项的 offsetTop 差（= 项高 + 间距），实时量取，避免写死尺寸
export function getStep(host) {
  const items = getItems(host);
  if (items.length < 2) return 0;
  const d = items[1].offsetTop - items[0].offsetTop;
  if (d > 0) return d;
  const track = getTrack(host);
  const gap = track ? (parseFloat(getComputedStyle(track).rowGap) || 0) : 0;
  return items[0].offsetHeight + gap;
}
export function applyOffset(host, idx, animate) {
  const track = getTrack(host);
  if (!track) return;
  const st = getState(host);
  st.idx = idx;
  const y = -idx * getStep(host);
  track.style.transition = animate ? 'transform ' + DURATION_MS + 'ms ' + EASE : 'none';
  track.style.transform = 'translateY(' + y.toFixed(2) + 'px)';
  if (!animate) { void track.offsetWidth; }
  // 极细滚动指示条：长度 = 1/总项数，位置 = 当前项序号
  const bar = host.querySelector('.ss2-minbar');
  if (bar) {
    const n = getRealCount(host).length || 1;
    const h = 100 / n;
    if (bar._ss2h !== h) { bar._ss2h = h; bar.style.height = h.toFixed(3) + '%'; }
    bar.style.transition = animate ? '' : 'none';
    bar.style.transform = 'translateY(' + (idx * 100).toFixed(3) + '%)';
  }
}
// 一屏放得下时无需轮询：隐藏副本、位移归零，滚轮交还页面
export function fitContent(host) {
  if (!isListMode(host)) return false;
  const real = getRealCount(host);
  const st = getState(host);
  let fit = true;
  if (real.length > 1) {
    const step = getStep(host);
    const contentH = (real.length - 1) * step + real[0].offsetHeight;
    fit = contentH <= layoutHeight(host) + 0.5;
  }
  host.classList.toggle('ss2-fit', fit);
  if (fit && st.idx !== 0) applyOffset(host, 0, false);
  return fit;
}
export function goStep(host, dir, rest) {
  const n = getRealCount(host).length;
  if (n < 2) return;
  const st = getState(host);
  if (st.idx >= n) applyOffset(host, 0, false);
  let target = st.idx + dir;
  if (target < 0) { applyOffset(host, n, false); target = n - 1; }
  st.anim = true;
  st.rest = rest || 0;
  applyOffset(host, target, true);
  clearTimeout(st.timer);
  st.timer = setTimeout(() => { settle(host); }, DURATION_MS + 40);
}
export function settle(host) {
  const st = getState(host);
  if (!st.anim) return;
  st.anim = false;
  const n = getRealCount(host).length;
  if (n > 0 && st.idx >= n) applyOffset(host, 0, false);
  const rest = st.rest || 0;
  st.rest = 0;
  if (rest) goStep(host, rest > 0 ? 1 : -1, rest > 0 ? rest - 1 : rest + 1);
}
export function queueStep(host, dir) {
  const st = getState(host);
  st.rest += dir;
  if (st.rest > 6) st.rest = 6;
  else if (st.rest < -6) st.rest = -6;
}
export function onWheel(e) {
  const host = e.currentTarget;
  if (!isListMode(host)) return;
  if (host.classList.contains('ss2-fit')) return;
  const step = getStep(host);
  if (!step || getRealCount(host).length < 2) return;
  let d = e.deltaY;
  if (e.deltaMode === 1) d *= 16;
  else if (e.deltaMode === 2) d *= layoutHeight(host);
  if (e.cancelable) e.preventDefault();
  const st = getState(host);
  st.acc += d;
  const th = Math.max(14, Math.min(step, 56));
  if (Math.abs(st.acc) < th) return;
  const dir = st.acc > 0 ? 1 : -1;
  st.acc = 0;
  if (st.anim) { queueStep(host, dir); return; }
  goStep(host, dir, 0);
}
export function onTouchStart(e) {
  const host = e.currentTarget;
  if (!isListMode(host) || host.classList.contains('ss2-fit')) return;
  const st = getState(host);
  st.ty = e.touches && e.touches[0] ? e.touches[0].clientY : 0;
  st.acc = 0;
}
export function onTouchMove(e) {
  const host = e.currentTarget;
  if (!isListMode(host) || host.classList.contains('ss2-fit')) return;
  const step = getStep(host);
  if (!step || getRealCount(host).length < 2) return;
  const st = getState(host);
  const y = e.touches && e.touches[0] ? e.touches[0].clientY : st.ty;
  st.acc += st.ty - y;
  st.ty = y;
  if (e.cancelable) e.preventDefault();
  const th = Math.max(14, Math.min(step, 56));
  if (Math.abs(st.acc) < th) return;
  const dir = st.acc > 0 ? 1 : -1;
  st.acc = 0;
  if (st.anim) { queueStep(host, dir); return; }
  goStep(host, dir, 0);
}
