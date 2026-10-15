import { html } from 'lit';

import { formatWatermark, usageColor } from '../utils/format.js';
import { onTouchMove, onTouchStart, onWheel } from './scroller.js';

/**
 * 卡片渲染：实例卡片（renderFlipCard）与占位卡片。
 */
export function renderFlipCard(n, t, e, p, s, o, pg, pgTotal, onNext, compact, cardKey) {
  const _compact = compact === undefined ? true : !!compact;
  const _msAll = e || [];
  const _cnt = _msAll.length;
  // 开启紧凑模式：超过 3 条一律等分压缩（按每块可用高度自动分级收紧）；
  // 关闭时超过 3 条走「每屏 3 条 + 轮询滑动」
  const _cmp = _compact && _cnt > 3;
  const _scr = !_cmp && _cnt > 3;
  const _opN = parseFloat(o);
  const _opRaw = Math.max(0, Math.min(100, isNaN(_opN) ? 52 : _opN));
  const _op = (100 - _opRaw) / 100;
  const _bgD = 'linear-gradient(145deg, rgba(30,32,38,' + _op.toFixed(3) + '), rgba(20,22,28,' + (_op * .8).toFixed(3) + '))';
  const _bgL = 'linear-gradient(145deg, rgba(255,255,255,' + _op.toFixed(3) + '), rgba(240,242,246,' + (_op * .77).toFixed(3) + '))';
  const _bg = s === 'light' ? _bgL : _bgD;
  const _st = ['--ss2-bg:' + _bg, 'background:' + _bg];
  (p && p.accent) && _st.push('--ss2-fill:' + p.accent, '--ss2-hover-border:' + p.accent + 'cc', '--ss2-hover-shadow:0 6px 18px rgba(0,0,0,0.35), 0 0 12px ' + p.accent + '33');
  (p && p.color) && _st.push('--ss2-plat-color:' + p.color);
  // 信息行：超过一行时渲染两份（第二份为无缝轮询副本，一屏放得下时由 ss2-fit 隐藏）
  const _infoAll = t || [];
  const _infoN = _infoAll.length;
  const _infoLoop = _infoN > 1;
  const _infoRows = _infoLoop ? _infoAll.concat(_infoAll) : _infoAll;
  // 指标块：滑动模式下渲染两份，第二份为轮询副本
  const _mkBlock = (i, clone) => {
    const _uc = i.percent > 0 ? usageColor(i.percent) : '';
    return html`
        <div class="ss2-mblock ${i.sub ? 'ss2-hassub' : ''}${i.lines ? ' ss2-haslines' : ''}${i.warn ? ' ss2-warn' : ''}${clone ? ' ss2-clone' : ''}">
          <div class="ss2-mtop">
            <span class="ss2-mhead">${i.icon}<span class="ss2-mname">${i.name}</span></span>
            ${i.lines ? html`<div class="ss2-mlines">${i.lines.map(ln => html`<div class="ss2-mline"><span class="ss2-ml-label">${ln.label}</span><span class="ss2-ml-value">${ln.value}</span></div>`)}</div>` : html`<span class="ss2-mvalue" style="${_uc ? `color:${_uc}` : ''}">${i.value}</span><span class="ss2-sub">${i.sub || ''}</span>`}
          </div>
     ${i.percent > 0 ? html`
          <div class="ss2-track"><div class="ss2-fill" style="width:${Math.max(0, Math.min(100, i.percent))}%;${_uc ? `background:${_uc};` : ''}"></div></div>` : ''}
        </div>`;
  };
  const _mBlocks = _scr ? _msAll.concat(_msAll).map((i, k) => _mkBlock(i, k >= _cnt)) : _msAll.map(i => _mkBlock(i, false));
  return html`
  <div class="ss2-card ss2-theme-${s || 'dark'}" data-ss2-srv="${cardKey === undefined ? '' : cardKey}" style="${_st.join(';')}">
    <div class="ss2-body">
      <div class="ss2-info" style="padding:10px 12px !important">
        <div class="ss2-title-row">
    ${p && p.url ? html`
        <a class="ss2-plat" href="${p.url}" target="_blank" rel="noopener"><span class="ss2-plat-ic">${p.icon}</span><span>${p.name}</span></a>` : html`
        <div class="ss2-plat"><span class="ss2-plat-ic">${p && p.icon ? p.icon : ''}</span><span>${p && p.name ? p.name : ''}</span></div>`}
    ${pgTotal > 1 ? html`<div class="ss2-next"><span class="ss2-pageno">${pg}/${pgTotal}</span><span class="ss2-arrow" @click="${onNext}">▶</span></div>` : ''}
        </div>
        <div class="ss2-divider"></div>
        <div class="ss2-infos${_infoLoop ? '' : ' ss2-fit'}" @wheel=${onWheel} @touchstart=${onTouchStart} @touchmove=${onTouchMove}>
          <div class="ss2-infos-track">
      ${_infoRows.map((i, k) => html`
            <div class="ss2-info-row${k >= _infoN ? ' ss2-clone' : ''}">
              <span class="ss2-info-label">${i.label}</span>
       ${i.key === 'uptime'
    ? html`<span class="ss2-info-value ss2-uptime" data-ss2-key="uptime"></span>`
    : html`<span class="ss2-info-value" data-ss2-key="${i.key || ''}">${i.value}</span>`}
            </div>`)}
     </div>
          ${_infoLoop ? html`<i class="ss2-minbar"></i>` : ''}
        </div>
      </div>
      <div class="ss2-metrics ss2-cnt-${_cnt}${_cmp ? ' ss2-compact' : ''}${_scr ? ' ss2-scroll' : ''}" style="padding-top:0 !important;padding-bottom:0 !important;${_cmp ? 'gap:4px !important' : 'gap:8px !important'}" @wheel=${onWheel} @touchstart=${onTouchStart} @touchmove=${onTouchMove}>
        ${_scr ? html`<div class="ss2-mtrack">${_mBlocks}</div><i class="ss2-minbar"></i>` : _mBlocks}
      </div>
    </div>
    <div class="ss2-watermark">${formatWatermark()}</div>
 </div>
`;
}

/**
 * 未配置/异常占位卡。
 * 固定深色、不跟随主题/亮度；底色 #2a2a2a6b 见 styles/widget.css.js 的 .ss2-empty。
 * 不响应点击：宿主的窗口型配置入口只在「右键 → 设置」时提供（SDK 1.0.19 里
 * 并没有 api.window.open，从小部件直接点开会拿到空 widgetInfo，配置页因此是空的、
 * 点「应用」也不生效——用户实测如此），因此界面只提示右键进入。
 * reason 仅用于测试页断言保留，界面上不显示失败原因（失败仍由实例卡展示）。
 */
export function renderUnsetCard(n, reason) {
  return html`
  <div class="ss2-card ss2-theme-dark ss2-empty" data-ss2-srv="unset">
    <div class="ss2-body">
      <div class="ss2-empty-box">
        <div class="ss2-empty-ic">${emptyIcon}</div>
        <div class="ss2-empty-title">${n}</div>
        <div class="ss2-empty-msg">${reason ? '获取失败：' + reason : '配置异常或还未配置'}</div>
        <div class="ss2-empty-tip">右键进入配置</div>
      </div>
    </div>
  </div>`;
}

// 与实例卡片标题前的占位图标同风格（currentColor，跟随主题）
const emptyIcon = html`
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="4" width="18" height="12.5" rx="2"/>
    <path d="M3 9h18"/>
    <path d="M8.5 21h7M12 16.5V21"/>
  </svg>`;

export function renderSimpleCard(n, t, e) {
  return html`\n  <div class="container container-theme-${e ?? 'system'}">\n    <div class="title">\n      ${n}\n    </div>\n    <div class="content">\n      <div class="info-item">\n        <span class="label"></span>\n        <span class="value">${t}</span>\n      </div>\n    </div>\n  </div>\n`;
}

export function renderInfoCard(n, t, e) {
  return html`\n  <div class="container container-theme-${e ?? 'system'}">\n    <div class="title">\n      ${n}\n    </div>\n    ${t && t.map && t.map(i => {
    if (i.type === 'progress-bar')
    {return html`\n      <div class="progress-bar">\n        <div class="progress-bar-line" style="max-width: ${i.value * 100}%"></div>\n      </div>`;}
    if (i.type === 'key-value')
    {return html`\n      <div class="info-item">\n        <span class="label">${i.key}</span>\n        <span class="value ${i.click ? 'info-item-clickable' : ''}" @click="${s => i.click && i.click(s)}">${i.value}</span>\n      </div>`;}
    if (i.type === 'text')
    {return html`\n      <div class="info-item">\n        <span class="value ${i.click ? 'info-item-clickable' : ''}" @click="${s => i.click && i.click(s)}">${i.value}</span>\n      </div>`;}
    if (i.type === 'canvas')
    {return html`\n      <div class="content">\n        <canvas></canvas>\n      </div>`;}
  },
  )}\n  </div>\n`;
}
