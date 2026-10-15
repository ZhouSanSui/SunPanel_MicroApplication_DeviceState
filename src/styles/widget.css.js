import { css } from 'lit';

/**
 * 小部件样式：占位卡片（cardCss）、实例卡片（widgetCss）、聚合与切换动画（aggCss）。
 */
export const cardCss = css`  .container {\n    padding: 8px 12px;\n    height: 100%;\n    box-sizing: border-box;\n    position: relative;\n    overflow: hidden;\n    display: flex;\n    flex-direction: column;\n    align-items: stretch;\n    justify-content: flex-start;\n  }\n\n  .title {\n    text-align: right;\n    font-weight: bold;\n    font-size: 12px;\n  }\n\n  .content {\n    flex: 1;\n    flex-direction: column;\n    justify-content: center;\n    align-items: center;\n    height: 100%;\n    overflow: hidden;\n    text-align: center;\n\n  }\n\n  .info-item {\n    display: flex;\n    justify-content: space-between;\n    margin-top: 4px;\n  }\n\n  .info-item-clickable {\n    cursor: pointer;\n  }\n\n  .info-item-clickable:hover {\n    text-decoration: underline;\n  }\n\n  .label {\n    font-size: 12px;\n  }\n\n  .value {\n    font-size: 12px;\n    font-weight: 500;\n    overflow: hidden;\n  }\n\n  .label,\n  .value {\n    word-break: keep-all;\n    white-space: nowrap;\n    text-overflow: ellipsis;\n  }\n\n  .progress-bar {\n    height: 5px;\n    border-radius: 2.5px;\n  }\n\n  .progress-bar-line {\n    height: 5px;\n    line-height: 5px;\n    border-radius: 2.5px;\n    transition: max-width 0.1s ease-out;\n  }\n\n  .container {\n    background: #fff;\n  }\n\n  .title {\n    color: #333;\n  }\n\n  .label {\n    color: #666;\n  }\n\n  .value {\n    color: #333;\n  }\n\n  .progress-bar {\n    background-color: #eee;\n  }\n\n  .progress-bar-line {\n    background-color: #888;\n  }\n\n  .container.container-theme-dark {\n    background: #333;\n  }\n\n  .container.container-theme-dark .title {\n    color: #fff;\n  }\n\n  .container.container-theme-dark .value {\n    color: #eee;\n  }\n\n  .container.container-theme-dark .label {\n    color: #bbb;\n  }\n\n  .container.container-theme-dark .progress-bar {\n    background-color: #888;\n  }\n\n  .container.container-theme-dark .progress-bar-line {\n    background-color: #eee;\n  }\n\n  .container.container-theme-transparent {\n    background: rgba(255, 255, 255, 0.04);\n  }\n\n  .container.container-theme-transparent .title {\n    color: rgba(255, 255, 255, 0.8);\n  }\n\n  .container.container-theme-transparent .value {\n    color: rgba(255, 255, 255, 0.9);\n  }\n\n  .container.container-theme-transparent .label {\n    color: rgba(255, 255, 255, 0.7);\n  }\n\n  .container.container-theme-transparent .progress-bar {\n    background-color: rgba(255, 255, 255, 0.1)\n  }\n\n  .container.container-theme-transparent .progress-bar-line {\n    background-color: rgba(255, 255, 255, 0.9);\n  }`;

export const widgetCss = css`
.ss2-card {
  --ss2-bg: linear-gradient(145deg, rgba(30,32,38,0.52), rgba(20,22,28,0.42));
  --ss2-border: rgba(255,255,255,0.10);
  --ss2-text: #fff;
  --ss2-plat-color: #fff;
  --ss2-title: #fff;
  --ss2-divider: linear-gradient(90deg, rgba(255,255,255,0.26), rgba(255,255,255,0.06));
  --ss2-panel-bg: rgba(255,255,255,0.08);
  --ss2-panel-border: rgba(255,255,255,0.10);
  --ss2-label: rgba(255,255,255,0.50);
  --ss2-value: rgba(255,255,255,0.90);
  --ss2-mname: rgba(255,255,255,0.70);
  --ss2-mvalue: rgba(255,255,255,0.92);
  --ss2-sub: rgba(255,255,255,0.80);
  --ss2-track: rgba(255,255,255,0.10);
  --ss2-fill: #52c41a;
  --ss2-hover-bg: rgba(255,255,255,0.12);
  --ss2-hover-border: rgba(255,255,255,0.15);
  --ss2-hover-shadow: 0 6px 18px rgba(0,0,0,0.35), 0 0 12px rgba(82,196,26,0.15);
  --ss2-mline: rgba(255,255,255,0.80);
  --ss2-ml-label: rgba(255,255,255,0.40);
  --ss2-ml-value: rgba(255,255,255,0.80);
  --ss2-mhead-ic: #e5e5e5;
  background: var(--ss2-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 22px;
  border: 1px solid var(--ss2-border);
  padding: 4px 8px 7px;
  position: relative;
  height: 100%;
  box-sizing: border-box;
  color: var(--ss2-text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
  display: flex;
  flex-direction: column;
}
.ss2-body {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: stretch;
  gap: 10px;
}
.ss2-info {
  flex: 0 0 38%;
  min-width: 0;
  max-width: none;
  background: var(--ss2-panel-bg);
  border: 1px solid var(--ss2-panel-border);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.ss2-plat {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  margin-bottom: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--ss2-title, #fff);
  text-decoration: none;
  flex-shrink: 0;
  min-width: 0;
}
.ss2-plat svg {
  flex-shrink: 0;
}
/* 标题前图标：跟随实例的「标题颜色」设置（图标本身用 currentColor 描边） */
.ss2-plat .ss2-plat-ic { display: inline-flex; align-items: center; flex-shrink: 0; color: var(--ss2-plat-color); }
.ss2-plat span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
a.ss2-plat {
  cursor: pointer;
}
a.ss2-plat:hover span {
  text-decoration: underline;
}
.ss2-divider {
  height: 1px;
  background: var(--ss2-divider);
  margin: 6px 0 4px;
  flex-shrink: 0;
}
.ss2-infos {
  flex: 1;
  min-height: 0;
  position: relative;
  display: block;
  overflow: hidden;
  overflow: clip;
  overscroll-behavior: contain;
  scrollbar-width: none;
  scrollbar-color: transparent transparent;
}
.ss2-infos-track {
  display: flex;
  flex-direction: column;
  gap: 4px;
  transform: translateY(0);
  will-change: transform;
}
.ss2-info-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  height: 15px;
  flex-shrink: 0;
}
.ss2-infos.ss2-fit .ss2-clone, .ss2-metrics.ss2-fit .ss2-clone { display: none; }
/* 滑动时右侧极细进度条：提示「还有更多内容」 */
.ss2-minbar { position: absolute; right: 1px; top: 0; width: 2px; border-radius: 2px; background: var(--ss2-panel-border); pointer-events: none; opacity: .9; transition: transform .3s cubic-bezier(.22,.61,.36,1); }
.ss2-fit .ss2-minbar { display: none; }
/* 磁盘容量告警：达到阈值时描边高亮 + 轻微呼吸 */
.ss2-mblock.ss2-warn { border-color: rgba(255,77,79,0.65); animation: ss2warn 1.8s ease-in-out infinite; }
@keyframes ss2warn { 0%, 100% { box-shadow: inset 0 0 0 1px rgba(255,77,79,0.35); } 50% { box-shadow: inset 0 0 0 1px rgba(255,77,79,0.75), 0 0 8px rgba(255,77,79,0.35); } }
@media (prefers-reduced-motion: reduce) { .ss2-mblock.ss2-warn { animation: none; box-shadow: inset 0 0 0 1px rgba(255,77,79,0.6); } }
@media (prefers-reduced-motion: reduce) {
  .ss2-mblock { transition: none; }
  .ss2-mblock:hover { transform: none; }
  .ss2-infos-track, .ss2-mtrack, .ss2-minbar { transition: none !important; }
}
.ss2-info-label {
  font-size: 10px;
  color: var(--ss2-label);
  white-space: nowrap;
}
.ss2-info-value {
  font-size: 11px;
  font-weight: 500;
  color: var(--ss2-value);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ss2-metrics {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-sizing: border-box;
  padding-top: 0;
  padding-bottom: 0;
}
.ss2-metrics.ss2-cnt-1, .ss2-metrics.ss2-cnt-2 {
  justify-content: flex-start;
}
.ss2-metrics .ss2-mblock {
  flex: 1;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
}
.ss2-mblock {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  min-width: 0;
  padding: 10px 12px;
  background: var(--ss2-panel-bg);
  border: 1px solid var(--ss2-panel-border);
  border-radius: 10px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  cursor: pointer;
  transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease;
}
.ss2-mblock:hover {
  background: var(--ss2-hover-bg);
  border-color: var(--ss2-hover-border);
  transform: translateY(-1px);
}
.ss2-infos::-webkit-scrollbar, .ss2-metrics::-webkit-scrollbar { width: 0; display: none; }
.ss2-infos::-webkit-scrollbar-track, .ss2-metrics::-webkit-scrollbar-track { background: transparent; }
.ss2-infos::-webkit-scrollbar-thumb, .ss2-metrics::-webkit-scrollbar-thumb { background: transparent; border-radius: 999px; }
.ss2-metrics.ss2-compact {
  gap: 4px;
}
.ss2-metrics.ss2-compact .ss2-mblock {
  flex: 1 1 0;
  min-height: 0;
  padding: 3px 6px;
  gap: 2px;
}
.ss2-metrics.ss2-compact .ss2-mtop { gap: 3px; margin-bottom: 0; }
.ss2-metrics.ss2-compact .ss2-mhead svg { width: 10px; height: 10px; }
.ss2-metrics.ss2-compact .ss2-mname { font-size: 9px; line-height: 1; }
.ss2-metrics.ss2-compact .ss2-mvalue { font-size: 10px; line-height: 1; }
.ss2-metrics.ss2-compact .ss2-sub { font-size: 9px; line-height: 1; }
/* 紧凑模式：磁盘IO / 网络 / 流量 的两排数据合并为一排（上排在前、下排在后） */
.ss2-metrics.ss2-compact .ss2-mlines { flex-direction: row; flex-wrap: nowrap; align-items: baseline; gap: 8px; }
.ss2-metrics.ss2-compact .ss2-mline { flex: 0 0 auto; min-width: 0; font-size: 8px; line-height: 1.15; gap: 3px; }
.ss2-metrics.ss2-compact .ss2-track { height: 3px; }
/* 密度分级：dense 收紧行高、名称与多排数据并成一行；ultra 隐藏进度条，只留名称与数值 */
.ss2-metrics.ss2-compact.ss2-dense .ss2-mblock { padding: 2px 4px; gap: 1px; }
.ss2-metrics.ss2-compact.ss2-dense .ss2-mname { font-size: 8px; }
.ss2-metrics.ss2-compact.ss2-dense .ss2-mvalue { font-size: 9px; }
.ss2-metrics.ss2-compact.ss2-dense .ss2-sub { font-size: 8px; }
.ss2-metrics.ss2-compact.ss2-dense .ss2-mline { font-size: 8px; line-height: 1; }
.ss2-metrics.ss2-compact.ss2-dense .ss2-track { height: 2px; }
.ss2-metrics.ss2-compact.ss2-dense .ss2-mblock.ss2-haslines { flex-direction: row; align-items: center; justify-content: space-between; gap: 6px; }
/* 窄卡片里双排数值容易超宽：隐藏图标、缩小两值间距，并允许数值收缩省略而不是越过块边界 */
.ss2-metrics.ss2-compact.ss2-dense .ss2-mblock.ss2-haslines .ss2-mhead svg { display: none; }
.ss2-metrics.ss2-compact.ss2-ultra .ss2-mblock.ss2-haslines .ss2-mhead svg { display: none; }
.ss2-metrics.ss2-compact.ss2-dense .ss2-mblock.ss2-haslines .ss2-mtop { flex: 1 1 auto; min-width: 0; margin-bottom: 0; }
.ss2-metrics.ss2-compact.ss2-dense .ss2-mblock.ss2-haslines .ss2-mlines { flex: 0 1 auto; min-width: 0; gap: 4px; }
.ss2-metrics.ss2-compact.ss2-dense .ss2-mline { flex: 0 1 auto; gap: 2px; }
.ss2-metrics.ss2-compact.ss2-ultra .ss2-mline { flex: 0 1 auto; gap: 2px; }
.ss2-metrics.ss2-compact.ss2-ultra .ss2-mblock { padding: 0 4px; gap: 0; }
.ss2-metrics.ss2-compact.ss2-ultra .ss2-track { display: none; }
.ss2-metrics.ss2-compact.ss2-ultra .ss2-mblock.ss2-haslines { flex-direction: row; align-items: center; justify-content: space-between; gap: 5px; }
.ss2-metrics.ss2-compact.ss2-ultra .ss2-mblock.ss2-haslines .ss2-mtop { flex: 1 1 auto; min-width: 0; margin-bottom: 0; }
.ss2-metrics.ss2-scroll {
  position: relative;
  display: block;
  overflow: hidden;
  overflow: clip;
  overflow-clip-margin: 4px;
  overscroll-behavior: contain;
  scrollbar-width: none;
  scrollbar-color: transparent transparent;
}
.ss2-metrics.ss2-scroll .ss2-mtrack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  transform: translateY(0);
  will-change: transform;
}
.ss2-metrics.ss2-scroll .ss2-mblock {
  flex: 0 0 var(--ss2-vh, 48px);
  min-height: 0;
}
.ss2-mtop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 2px;
  min-width: 0;
}
.ss2-mhead {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}
.ss2-mhead svg {
  flex-shrink: 0;
}
.ss2-mname {
  font-size: 11px;
  color: var(--ss2-mname);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ss2-mvalue {
  font-size: 12px;
  font-weight: 700;
  color: var(--ss2-mvalue);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ss2-sub {
  display: none;
  font-size: 11px;
  font-weight: 500;
  color: var(--ss2-sub);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.ss2-mblock.ss2-hassub:hover .ss2-mvalue {
  display: none;
}
.ss2-mblock.ss2-hassub:hover .ss2-sub {
  display: inline-block;
}
.ss2-mblock.ss2-hassub:hover .ss2-mname {
  display: none;
}
.ss2-track {
  height: 4px;
  background: var(--ss2-track);
  border-radius: 2px;
  overflow: hidden;
}
.ss2-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--ss2-fill);
  transition: width 0.5s ease;
}
.ss2-mlines {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.ss2-mline {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  font-size: 10px;
  line-height: 1.4;
  color: var(--ss2-mline);
  white-space: nowrap;
}
.ss2-mline .ss2-ml-label {
  color: var(--ss2-ml-label);
  flex-shrink: 0;
}
.ss2-mline .ss2-ml-value {
  color: var(--ss2-ml-value);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ss2-card.ss2-theme-light {
  --ss2-bg: linear-gradient(145deg, rgba(255,255,255,0.52), rgba(240,242,246,0.40));
  --ss2-border: rgba(17,24,39,0.08);
  --ss2-text: #1f2937;
  --ss2-plat-color: #1f2937;
  --ss2-title: #1f2937;
  --ss2-divider: linear-gradient(90deg, rgba(17,24,39,0.22), rgba(17,24,39,0.05));
  --ss2-panel-bg: rgba(17,24,39,0.04);
  --ss2-panel-border: rgba(17,24,39,0.08);
  --ss2-label: rgba(17,24,39,0.42);
  --ss2-value: rgba(17,24,39,0.78);
  --ss2-mname: rgba(17,24,39,0.55);
  --ss2-mvalue: rgba(17,24,39,0.88);
  --ss2-sub: rgba(17,24,39,0.72);
  --ss2-track: rgba(17,24,39,0.10);
  --ss2-fill: #52c41a;
  --ss2-hover-bg: rgba(17,24,39,0.06);
  --ss2-hover-border: rgba(17,24,39,0.15);
  --ss2-hover-shadow: 0 6px 18px rgba(17,24,39,0.12), 0 0 12px rgba(82,196,26,0.20);
  --ss2-mline: rgba(17,24,39,0.72);
  --ss2-ml-label: rgba(17,24,39,0.40);
  --ss2-ml-value: rgba(17,24,39,0.72);
  --ss2-mhead-ic: rgba(17,24,39,0.65);
}
@media (prefers-color-scheme: light) {
  .ss2-card.ss2-theme-auto {
    --ss2-bg: linear-gradient(145deg, rgba(255,255,255,0.52), rgba(240,242,246,0.40));
    --ss2-border: rgba(17,24,39,0.08);
    --ss2-text: #1f2937;
    --ss2-plat-color: #1f2937;
  --ss2-title: #1f2937;
    --ss2-divider: linear-gradient(90deg, rgba(17,24,39,0.22), rgba(17,24,39,0.05));
    --ss2-panel-bg: rgba(17,24,39,0.04);
    --ss2-panel-border: rgba(17,24,39,0.08);
    --ss2-label: rgba(17,24,39,0.42);
    --ss2-value: rgba(17,24,39,0.78);
    --ss2-mname: rgba(17,24,39,0.55);
    --ss2-mvalue: rgba(17,24,39,0.88);
    --ss2-sub: rgba(17,24,39,0.72);
    --ss2-track: rgba(17,24,39,0.10);
    --ss2-fill: #52c41a;
    --ss2-hover-bg: rgba(17,24,39,0.06);
    --ss2-hover-border: rgba(17,24,39,0.15);
    --ss2-hover-shadow: 0 6px 18px rgba(17,24,39,0.12), 0 0 12px rgba(82,196,26,0.20);
    --ss2-mline: rgba(17,24,39,0.72);
    --ss2-ml-label: rgba(17,24,39,0.40);
    --ss2-ml-value: rgba(17,24,39,0.72);
    --ss2-mhead-ic: rgba(17,24,39,0.65);
  }
}
.ss2-watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9;
  pointer-events: none;
  user-select: none;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 1px;
  font-variant-numeric: tabular-nums;
  font-family: 'SF Mono', 'Cascadia Mono', Consolas, 'Courier New', monospace;
  color: var(--ss2-text);
  opacity: 0.22;
  text-shadow: 0 1px 2px rgba(0,0,0,0.18);
  white-space: nowrap;
}

`;

export const aggCss = css`
.ss2-agg-wrap { display: flex; flex-wrap: wrap; gap: 8px; align-items: stretch; width: 100%; height: 100%; box-sizing: border-box; }
.ss2-agg-wrap > .ss2-card, .ss2-agg-wrap > .container { flex: 1 1 220px; min-width: 0; }
/* 单实例/未配置时铺满整个小部件区域 */
.ss2-agg-wrap:not(.ss2-sw) > .ss2-card:only-child { flex-basis: 100%; }
/* min-height 固定为「右切换」箭头占位高度（22px + 1px 边框），
   保证「有/无右切换图标」时下面的分割线位置完全一致 */
.ss2-title-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; min-width: 0; min-height: 24px; flex-shrink: 0; }
.ss2-next { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.ss2-pageno { font-size: 11px; font-weight: 600; color: var(--ss2-label); letter-spacing: .3px; }
.ss2-arrow { width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; background: var(--ss2-panel-bg); border: 1px solid var(--ss2-panel-border); color: var(--ss2-label); cursor: pointer; font-size: 11px; line-height: 1; transition: background .2s ease, border-color .2s ease; user-select: none; }
.ss2-arrow:hover { background: var(--ss2-hover-bg); border-color: var(--ss2-hover-border); }
.ss2-focus { outline: 2px solid var(--ss2-fill); outline-offset: 2px; }
.ss2-agg-wrap.ss2-sw { flex-wrap: nowrap; gap: 0; position: relative; overflow: hidden; }
.ss2-sw-item { position: absolute; inset: 0; box-sizing: border-box; transition: transform .55s cubic-bezier(.4,0,.2,1), opacity .5s ease; will-change: transform, opacity; z-index: 1; }
.ss2-sw-item.ss2-sw-cur { z-index: 2; }
.ss2-sw-item > .ss2-card, .ss2-sw-item > .container { width: 100%; height: 100%; }
.ss2-agg-wrap.ss2-sw-zoom .ss2-sw-item { transition: transform .55s cubic-bezier(.4,0,.2,1), opacity .45s ease; }
.ss2-agg-wrap.ss2-sw-flip .ss2-sw-item { transition: transform .6s cubic-bezier(.4,0,.2,1), opacity .4s ease; transform-style: preserve-3d; backface-visibility: hidden; }
.ss2-agg-wrap.ss2-sw-blur .ss2-sw-item { transition: transform .5s cubic-bezier(.4,0,.2,1), opacity .5s ease, filter .5s ease; }
.ss2-agg-wrap.ss2-sw-drop .ss2-sw-item { transition: transform .5s cubic-bezier(.4,0,.2,1), opacity .45s ease; }
/* —— 未配置 / 异常占位卡 ——
   固定深色实底（#2a2a2a 配 42% 不透明度），不跟随「主题 / 亮度」设置，
   在浅色面板上也保持稳定可读。 */
.ss2-card.ss2-empty {
  --ss2-bg: #2a2a2a6b;
  --ss2-border: rgba(255,255,255,0.14);
  --ss2-text: #fff;
  --ss2-plat-color: #fff;
  --ss2-title: #fff;
  --ss2-divider: linear-gradient(90deg, rgba(255,255,255,0.26), rgba(255,255,255,0.06));
  --ss2-panel-bg: rgba(255,255,255,0.12);
  --ss2-panel-border: rgba(255,255,255,0.18);
  --ss2-label: rgba(255,255,255,0.62);
  --ss2-value: rgba(255,255,255,0.92);
  --ss2-hover-border: rgba(255,255,255,0.26);
  background: var(--ss2-bg);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
.ss2-card.ss2-empty .ss2-body { align-items: center; justify-content: center; gap: 0; }
.ss2-empty-box {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;
  user-select: none;
}
.ss2-empty-ic { display: flex; align-items: center; justify-content: center; color: var(--ss2-plat-color, currentColor); opacity: .75; }
.ss2-empty-title { font-size: 15px; font-weight: 700; letter-spacing: .2px; color: var(--ss2-title); }
.ss2-empty-msg { font-size: 12.5px; line-height: 1.45; color: var(--ss2-value); max-width: 240px; word-break: break-word; }
.ss2-empty-tip { margin-top: 2px; font-size: 11px; color: var(--ss2-label); border: 1px solid var(--ss2-panel-border); background: var(--ss2-panel-bg); border-radius: 999px; padding: 2px 10px; }
.ss2-card.ss2-empty:hover { border-color: var(--ss2-hover-border); }
/* 未配置卡固定深色实底，浅色主题变量集在这里不适用，需覆盖掉 */
.ss2-card.ss2-theme-light.ss2-empty { --ss2-title: #fff; --ss2-value: rgba(255,255,255,0.90); --ss2-label: rgba(255,255,255,0.55); }
/* 「右键进入配置」胶囊：未配置卡不做毛玻璃，小面板也改为不透明一点的底色，
   避免在没有 backdrop-filter 时显得过透 */
.ss2-card.ss2-empty .ss2-empty-tip { background: var(--ss2-panel-bg); }
/* 未配置卡不响应点击，指针样式回到默认，避免误以为可以点 */
.ss2-card.ss2-empty { cursor: default; }
`;
