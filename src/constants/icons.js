import { html } from 'lit';

/**
 * 指标图标与平台图标（内联 SVG）。
 */
export const iconCpu = html`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round"><rect x="7" y="7" width="10" height="10" rx="1.5"/><rect x="11" y="11" width="2" height="2" fill="#52c41a" stroke="none"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/></svg>`;
export const iconMemory = html`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#1890ff" stroke-width="2" stroke-linecap="round"><rect x="2" y="6" width="20" height="12" rx="1.5"/><path d="M6 9v6M10 9v6M14 9v6M18 9v6"/></svg>`;
export const iconDisk = html`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#faad14" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.2" fill="#faad14" stroke="none"/><path d="M12 3v2.4"/></svg>`;
export const iconNetwork = html`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3.5 12h17M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9s1.3-6.2 3.8-9z"/></svg>`;
export const iconLoad = html`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fb923c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l4-6 4 3 5-8 5 5"/></svg>`;
export const iconTemp = html`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ff7875" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13.5V5a2 2 0 0 1 4 0v8.5a4 4 0 1 1-4 0z"/><path d="M12 9.5v5"/></svg>`;
export const iconGpu = html`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#b37feb" stroke-width="2" stroke-linecap="round"><rect x="3" y="7" width="18" height="11" rx="2"/><circle cx="12" cy="12.5" r="3"/><path d="M7 7V5M12 7V5"/></svg>`;

export const iconPlatformPve = html`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v4H4zM4 11h16v8H4z"/><path d="M9 5v-2M15 5v-2"/></svg>`;
export const iconPlatformDsm = html`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>`;
export const iconPlatformWin = html`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 5.5l6.2-.9v6H4zM12 4.3l8-1.1v7.3h-8zM4 12.9h6.2v6L4 18zM12 12.9h8v7.1l-8-1.1z"/></svg>`;
