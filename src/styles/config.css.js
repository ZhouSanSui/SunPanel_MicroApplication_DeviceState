import { css } from 'lit';

/**
 * 配置页样式（原产物的 Ui + Li 两段，选择器互不重叠）。
 */
export const configCss = css`
  .container {
    height: 100%;
    width: 100%;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    color: #1C1C1E;
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);
    border: 0.5px solid rgba(255,255,255,0.6);
    border-radius: 24px;
    box-shadow: 0 8px 32px rgba(17,24,39,0.08), 0 2px 8px rgba(17,24,39,0.05);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Helvetica Neue', sans-serif;
  }
  .content-wrapper {
    position: relative;
    z-index: 1;
    flex: 1;
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .content-wrapper::-webkit-scrollbar { width: 0; height: 0; display: none; }
  .form-group { margin-bottom: 12px; }
  .form-group label {
    display: block;
    font-size: 14px;
    color: #1C1C1E;
    margin-bottom: 5px;
    padding-left: 2px;
  }
  input.styled-input, select.styled-input, textarea.styled-input {
    width: 100%;
    background: rgba(0,0,0,0.04);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 0.5px solid rgba(0,0,0,0.08);
    border-radius: 12px;
    padding: 9px 12px;
    color: #1C1C1E;
    font-size: 14px;
    outline: none;
    box-sizing: border-box;
    transition: all 0.2s cubic-bezier(0.25,0.46,0.45,0.94);
    font-family: inherit;
  }
  input.styled-input:focus, select.styled-input:focus, textarea.styled-input:focus {
    background: rgba(255,255,255,0.9);
    border-color: #007AFF;
    box-shadow: 0 0 0 3px rgba(0,122,255,0.12);
  }
  select.styled-input { cursor: pointer; appearance: none; -webkit-appearance: none; background-image: linear-gradient(45deg, transparent 50%, rgba(0,0,0,0.25) 50%), linear-gradient(135deg, rgba(0,0,0,0.25) 50%, transparent 50%); background-position: calc(100% - 16px) 55%, calc(100% - 11px) 55%; background-size: 5px 5px; background-repeat: no-repeat; padding-right: 28px; }
  select.styled-input option { background: #fff; color: #1C1C1E; }
  input.styled-input::placeholder { color: rgba(28,28,30,0.4); }
  .info { background: rgba(0,0,0,0.04); border: 0.5px solid rgba(0,0,0,0.06); border-radius: 8px; padding: 10px; margin: 12px 0; font-size: 11px; color: rgba(28,28,30,0.55); }
  .ss-page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px 12px;
    border-bottom: 0.5px solid rgba(0,0,0,0.06);
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }
  .ss-page-header h1 { font-size: 20px; font-weight: 700; letter-spacing: -0.3px; color: #1C1C1E; margin: 0; }
  .ss-glass-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    line-height: 1;
    padding: 8px 18px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.25,0.46,0.45,0.94);
    border: 0.5px solid rgba(0,0,0,0.1);
    background: rgba(255,255,255,0.6);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    color: #1C1C1E;
    font-family: inherit;
  }
  .ss-glass-btn:hover { background: rgba(0,0,0,0.04); color: #1C1C1E; }
  .ss-glass-btn:active { background: rgba(0,0,0,0.04); }
  .ss-glass-btn .ss-back-arrow { display: inline-flex; align-items: center; line-height: 1; transform: translateY(-1px); }
  .ss-glass-btn.primary { background: #007AFF; border-color: #007AFF; color: #fff; }
  .ss-glass-btn.primary:hover { background: rgba(0,122,255,0.8); border-color: rgba(0,122,255,0.8); color: #fff; }
  .ss-glass-btn.primary:active { background: rgba(0,122,255,0.8); }
  .ss-module-selector {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    padding: 14px 20px;
    border-bottom: 0.5px solid rgba(0,0,0,0.06);
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }
  .ss-module-card {
    text-align: center;
    padding: 13px 10px;
    background: rgba(255,255,255,0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 0.5px solid rgba(0,0,0,0.08);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.35s cubic-bezier(0.25,0.46,0.45,0.94);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
  }
  .ss-module-card:hover { background: rgba(0,0,0,0.03); border-color: rgba(0,0,0,0.12); }
  .ss-module-card.on { background: rgba(0,122,255,0.08); border-color: rgba(0,122,255,0.3); box-shadow: 0 0 16px rgba(0,122,255,0.08); }
  .ss-module-card .ic { margin-bottom: 2px; }
  .ss-module-card svg { stroke: rgba(28,28,30,0.7); }
  .ss-module-card .nm { font-size: 12px; font-weight: 600; color: rgba(28,28,30,0.7); }
  .ss-module-card.on .nm { color: #007AFF; }
  .ss-module-card.on svg { stroke: #007AFF !important; }
  .ss-module-card .st { font-size: 10px; color: rgba(28,28,30,0.4); }
  .ss-view {
    flex: 1;
    overflow-y: auto;
    padding: 14px 20px 22px;
    position: relative;
    z-index: 1;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .ss-view::-webkit-scrollbar { width: 0; height: 0; display: none; }
  .ss-section-title {
    font-size: 12px;
    font-weight: 600;
    color: rgba(28,28,30,0.4);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin: 20px 0 8px;
  }
    .ss-section-title:first-child { margin-top: 0; }
  .ss-section-title { display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: pointer; user-select: none; }
  .ss-section-title .ss-sec-arrow { font-size: 10px; color: rgba(28,28,30,0.32); transition: transform .22s cubic-bezier(0.25,0.46,0.45,0.94); }
  .ss-section-title.collapsed .ss-sec-arrow { transform: rotate(-90deg); }
  .ss-sub-title {
    font-family: inherit;
    font-size: 14px;
    font-weight: 400;
    color: #1C1C1E;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin: 18px 0 10px;
    padding: 0 0 8px;
    border-bottom: 0.5px solid rgba(0,0,0,0.08);
  }
  .ss-inst-dot { font-size: 14px; font-weight: 700; line-height: 1; }
  .ss-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 0; min-height: 44px; gap: 10px; }
  .ss-row-left { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1 1 auto; }
  .ss-row > .ss-ios-switch { margin-left: auto; }
  .ss-row-label { font-size: 14px; color: #1C1C1E; }
  .ss-row-desc { font-size: 11px; color: rgba(28,28,30,0.55); }
  .ss-ios-switch {
    position: relative;
    display: inline-flex;
    width: 51px;
    height: 31px;
    background: rgba(120,120,128,0.32);
    border-radius: 31px;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.35s cubic-bezier(0.25,0.46,0.45,0.94);
  }
  .ss-ios-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
  .ss-ios-switch-slider { position: absolute; inset: 0; border-radius: 31px; }
  .ss-ios-switch-slider::before {
    content: '';
    position: absolute;
    width: 27px;
    height: 27px;
    background: #fff;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    transition: all 0.35s cubic-bezier(0.25,0.46,0.45,0.94);
    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
  }
  .ss-ios-switch input:checked + .ss-ios-switch-slider { background: #34C759; }
  .ss-ios-switch input:checked + .ss-ios-switch-slider::before { left: 22px; }
  .ss-cycle-wrap { display: flex; align-items: center; gap: 6px; flex: 0 0 auto; width: 152px; }
  .ss-cycle-input {
    flex: 1 1 auto;
    min-width: 0;
    width: auto;
    background: rgba(0,0,0,0.04);
    border: 0.5px solid rgba(0,0,0,0.08);
    border-radius: 8px;
    padding: 6px 10px;
    color: #1C1C1E;
    font-size: 14px;
    text-align: center;
    outline: none;
    transition: all 0.2s cubic-bezier(0.25,0.46,0.45,0.94);
  }
  .ss-cycle-input::placeholder { color: rgba(28,28,30,0.4); }
  .ss-cycle-input:focus { background: rgba(255,255,255,0.9); border-color: #007AFF; box-shadow: 0 0 0 3px rgba(0,122,255,0.12); }
  .ss-cycle-unit { font-size: 13px; color: rgba(28,28,30,0.55); }
  .ss-selector { position: relative; flex: 0 0 auto; width: 152px; }
  .ss-sel-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 7px 14px;
    width: 100%;
    min-width: 0;
    background: rgba(0,0,0,0.04);
    border: 0.5px solid rgba(0,0,0,0.08);
    border-radius: 10px;
    color: #1C1C1E;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.25,0.46,0.45,0.94);
    outline: none;
    font-family: inherit;
  }
  .ss-sel-trigger:hover { background: rgba(0,0,0,0.06); }
  .ss-sel-trigger .chevron { font-size: 10px; color: rgba(0,0,0,0.25); transition: transform 0.2s cubic-bezier(0.25,0.46,0.45,0.94); }
  .ss-sel-trigger.open .chevron { transform: rotate(180deg); }
  .ss-sel-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    min-width: 150px;
    background: #fff;
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 0.5px solid rgba(0,0,0,0.06);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(17,24,39,0.12);
    overflow: hidden;
    z-index: 100;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-8px);
    transition: all 0.2s cubic-bezier(0.25,0.46,0.45,0.94);
  }
  .ss-sel-dropdown.open { opacity: 1; visibility: visible; transform: translateY(0); }
  .ss-sel-option {
    padding: 9px 14px;
    font-size: 13px;
    color: #1C1C1E;
    cursor: pointer;
    transition: background 0.2s cubic-bezier(0.25,0.46,0.45,0.94);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .ss-sel-option:hover { background: rgba(0,0,0,0.04); }
  .ss-sel-option.selected { color: #007AFF; }
  .ss-sel-option.selected::after { content: '✓'; font-size: 12px; }
  /* 右侧控件统一宽度，让「仅当前」等短标签单行显示且各行对齐 */
  .ss-theme-toggle { display: flex; gap: 6px; flex: 0 0 auto; min-width: 152px; background: rgba(0,0,0,0.04); border-radius: 12px; padding: 3px; }
  .ss-theme-opt {
    flex: 1 1 0;
    padding: 6px 8px;
    text-align: center;
    white-space: nowrap;
    border-radius: 8px;
    font-size: 13px;
    color: rgba(28,28,30,0.6);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.25,0.46,0.45,0.94);
    border: none;
    background: none;
    font-family: inherit;
  }
  .ss-theme-opt.active { background: #fff; color: #1C1C1E; box-shadow: 0 1px 4px rgba(0,0,0,0.12); }
  .ss-brightness { display: flex; flex-wrap: nowrap; align-items: center; gap: 8px; flex: 1; justify-content: flex-end; position: relative; }
  .ss-bri-icon { font-size: 14px; color: rgba(28,28,30,0.4); flex-shrink: 0; }
  .ss-brightness-slider {
    -webkit-appearance: none;
    appearance: none;
    flex: 1 1 auto;
    min-width: 56px;
    height: 4px;
    border-radius: 4px;
    background: rgba(0,0,0,0.12);
    outline: none;
    cursor: pointer;
  }
  .ss-brightness-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    border: 0.5px solid rgba(0,0,0,0.15);
    cursor: pointer;
    box-shadow: 0 1px 4px rgba(0,0,0,0.15);
    transition: transform 0.2s cubic-bezier(0.25,0.46,0.45,0.94);
  }
  .ss-brightness-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
  .ss-brightness-slider::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #fff; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.15); }
  .ss-opacity-val {
    width: 44px;
    flex-shrink: 0;
    text-align: left;
    font-size: 11px;
    color: rgba(28,28,30,0.55);
    font-variant-numeric: tabular-nums;
    pointer-events: none;
    white-space: nowrap;
  }
  .ss-inst-list { margin-top: 4px; }
  .ss-order-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 14px;
    background: rgba(255,255,255,0.7);
    border: 0.5px solid rgba(0,0,0,0.06);
    border-radius: 12px;
    margin-bottom: 8px;
    transition: all 0.2s cubic-bezier(0.25,0.46,0.45,0.94);
    user-select: none;
    cursor: pointer;
  }
  .ss-order-item:hover { background: rgba(0,0,0,0.03); }
  .ss-order-item .left { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .ss-order-item .drag-handle { color: rgba(0,0,0,0.25); font-size: 14px; cursor: grab; opacity: 0.5; transition: opacity 0.2s; flex-shrink: 0; user-select: none; }
  .ss-order-item .drag-handle:active { cursor: grabbing; }
  .ss-order-item:hover .drag-handle { opacity: 1; }
  .ss-order-item .status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; animation: ssPulse 2s ease-in-out infinite; }
  .ss-order-item .name { font-size: 14px; color: #1C1C1E; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ss-order-item.dragging { opacity: 0.6; position: relative; z-index: 5; box-shadow: 0 8px 24px rgba(17,24,39,0.12); }
  @keyframes ssPulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
  .ss-inst-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    background: rgba(255,255,255,0.7);
    border: 0.5px solid rgba(0,0,0,0.06);
    border-radius: 12px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.25,0.46,0.45,0.94);
  }
  .ss-inst-item:hover { background: rgba(0,0,0,0.03); }
  .ss-i-left { display: flex; align-items: center; gap: 10px; font-weight: 500; }
  .ss-i-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; animation: ssPulse 2s ease-in-out infinite; }
  .ss-i-del {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: none;
    background: rgba(0,0,0,0.04);
    color: rgba(28,28,30,0.45);
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s cubic-bezier(0.25,0.46,0.45,0.94);
  }
  .ss-i-del:hover { background: rgba(255,59,95,0.12); color: #FF3B5F; }
  .ss-inst-add {
    width: 100%;
    padding: 12px;
    background: rgba(0,0,0,0.02);
    border: 1px dashed rgba(0,0,0,0.15);
    border-radius: 12px;
    color: rgba(28,28,30,0.45);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.25,0.46,0.45,0.94);
    text-align: center;
    box-sizing: border-box;
    font-family: inherit;
  }
  .ss-inst-add:hover { background: rgba(0,0,0,0.05); border-color: rgba(0,0,0,0.25); color: rgba(28,28,30,0.7); }
  .ss-empty-tip { text-align: center; color: rgba(28,28,30,0.4); font-size: 12px; padding: 16px 0; }
  .ss-instance-title {
    font-size: 16px;
    font-weight: 600;
    color: #1C1C1E;
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 0.5px solid rgba(0,0,0,0.06);
  }
  .ss-info-group-title {
    font-size: 12px;
    font-weight: 600;
    color: rgba(28,28,30,0.4);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin: 18px 0 8px;
    padding: 0;
    border-bottom: none;
  }
  .ss-split-row { display: flex; gap: 12px; align-items: flex-start; }
  .ss-split-col { flex: 1; min-width: 0; }
  .ss-drag-ph { visibility: hidden; }
  .ss-inst-list { position: relative; }
  .ss-chip.dragging, .ss-order-item.dragging { opacity: .9; box-shadow: 0 8px 24px rgba(0,0,0,0.18); }
  .ss-chip .drag-handle, .ss-order-item .drag-handle { touch-action: none; }
  .ss-drag-line {
    position: absolute;
    height: 2px;
    border-radius: 1px;
    background: #007AFF;
    box-shadow: 0 0 6px rgba(0,122,255,0.45);
    pointer-events: none;
    z-index: 50;
  }
  .ss-chip-grid { display: grid; grid-template-columns: 1fr; gap: 8px; position: relative; }
  .ss-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.25,0.46,0.45,0.94);
    user-select: none;
    border: 0.5px solid transparent;
    min-width: 0;
  }
  .ss-chip .drag-handle { color: rgba(0,0,0,0.25); font-size: 12px; cursor: grab; opacity: 0.5; transition: opacity 0.2s; display: flex; align-items: center; flex-shrink: 0; user-select: none; }
  .ss-chip .drag-handle:active { cursor: grabbing; }
  .ss-chip:hover .drag-handle { opacity: 1; }
  .ss-chip:not(.selected) { background: rgba(0,0,0,0.04); color: rgba(28,28,30,0.55); border-color: rgba(0,0,0,0.06); }
  .ss-chip:not(.selected):hover { background: rgba(0,0,0,0.06); color: rgba(28,28,30,0.75); }
  .ss-chip.selected { background: rgba(0,122,255,0.08); border-color: #007AFF; color: #007AFF; box-shadow: 0 1px 4px rgba(0,122,255,0.15); }
  .ss-chip.selected .drag-handle { opacity: 0.7; }
  .ss-chip .lbl { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ss-chip.dragging { opacity: 0.6; position: relative; z-index: 5; transform: scale(0.97); }
  .ss-sort-hint { font-size: 10px; color: rgba(28,28,30,0.4); margin-top: 8px; }
.ss-vol-grid { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0 2px; }
.ss-vol-chip { display: inline-flex; align-items: center; gap: 4px; padding: 6px 10px; border-radius: 10px; background: rgba(0,0,0,0.04); border: 0.5px solid rgba(0,0,0,0.08); font-size: 12px; color: rgba(28,28,30,0.85); cursor: pointer; user-select: none; }
.ss-vol-chip.on { background: rgba(0,122,255,0.12); border-color: rgba(0,122,255,0.45); color: #007AFF; font-weight: 600; }
.ss-vol-row { display: flex; gap: 8px; align-items: center; margin-top: 8px; }
.ss-vol-row .styled-input { flex: 1; }
.ss-mini-btn { flex-shrink: 0; padding: 8px 12px; border-radius: 10px; border: 0.5px solid rgba(0,0,0,0.10); background: rgba(0,0,0,0.04); font-size: 12px; color: #1C1C1E; cursor: pointer; }
.ss-mini-btn:disabled { opacity: .5; }
.ss-field-hint { font-size: 10px; color: rgba(28,28,30,0.42); margin-top: 4px; line-height: 1.55; }
.ss-test-row { display: flex; align-items: center; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
.ss-test-msg { font-size: 12px; color: rgba(28,28,30,0.6); }
.ss-test-msg.ok { color: #34C759; }
.ss-test-msg.bad { color: #FF3B5F; }
  .ss-color-dots { display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap; align-items: center; }
  .ss-cd {
    box-shadow: inset 0 0 0 0.5px rgba(0,0,0,0.08);
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2.5px solid transparent;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.25,0.46,0.45,0.94);
    position: relative;
  }
  .ss-cd:hover { transform: scale(1.1); }
  .ss-cd.on { border-color: #007AFF; transform: scale(1.15); box-shadow: 0 0 0 2px rgba(0,122,255,0.2); }
  .ss-cd-picker { position: relative; overflow: hidden; background: conic-gradient(#ff5b5b, #ffb347, #ffec5b, #5bff7a, #5bd0ff, #8a5bff, #ff5b5b); }
  .ss-cd-picker input[type="color"] { position: absolute; inset: -8px; width: 150%; height: 150%; opacity: 0; cursor: pointer; }
`;
