import { html } from 'lit';
import { SunPanelWidgetElement } from '@sun-panel/micro-app';

import { INTERVAL_DEFAULT, INTERVAL_MIN } from '../constants/limits.js';
import { DEFAULT_LEFT_ITEMS, DEFAULT_RIGHT_ITEMS, isSwitchMode } from '../constants/options.js';
import {
  iconCpu, iconDisk, iconGpu, iconLoad, iconMemory, iconNetwork, iconPlatformDsm,
  iconPlatformPve, iconPlatformWin, iconTemp,
} from '../constants/icons.js';
import {
  formatBytes, formatDuration, formatSpeed, formatSpeedOrNull, formatTraffic,
  formatUptime, rateOf, stripSequence, toNumber,
} from '../utils/format.js';
import { loopbackHostOf, normalizeWinUrl, parseHostList } from '../utils/host.js';
import { flattenLhmSensors, isLhmTree, lhmNumber, pickLhmSensor } from '../utils/lhm.js';
import { isDiskWarn, percentOf, trimMetrics } from '../utils/metrics.js';
import { selectedVolumes } from '../utils/volume.js';
import { renderFlipCard, renderUnsetCard } from '../ui/cards.js';
import {
  applyCompactDensity, applyOffset, fitContent, getRealCount, getState, getStep,
  getTrack, layoutHeight,
} from '../ui/scroller.js';
import { aggCss, cardCss, widgetCss } from '../styles/widget.css.js';

/**
 * 设备状态墙小部件：按实例渲染 PVE / DSM / Windows 状态卡片。
 */
export class ServerMonitorWidget extends SunPanelWidgetElement {
  static properties = {
    spCtx: { type: Object, attribute: false },
    ready: { type: Number },
    data: { type: Array },
    staticInfo: { type: Array },
    metrics: { type: Array },
  };

  static styles = [cardCss, widgetCss, aggCss];

  _title = '设备状态墙';

  _res = {};

  _curIdx = 0;

  _autoOn = false;

  _autoTimer = null;

  _fetchTimer = null;

  _laterIds = [];

  _upTimer = null;
  _initRes(idx) {
    if (!this._res[idx]) this._res[idx] = { ready: -1, data: [], staticInfo: [], metrics: [], upBase: null, upStart: 0, upRaw: '', sid: '', _prev: {}, _ts: 0, errMsg: '' };
    return this._res[idx];
  }
  // SDK 的小部件基类在 connectedCallback → onConnected() 里调 onInitialized()，
  // 但宿主可能在此之前还没 updateContext()（见 dist/index.esm.js 里 wt.onConnected）。
  // 此时 this.spCtx.widgetInfo 还是构造器默认值 {}，直接读 config 会漏掉整个实例列表，
  // 因此这里做一次「是否真的拿到了 widgetInfo」的判断，没有就等 updated() 里再初始化。
  _widgetReady = false;
  async onInitialized() {
    if (this.spCtx && this.spCtx.widgetInfo && this.spCtx.widgetInfo.config) this._initWidget();
  }
  _initWidget() {
    if (this._widgetReady) return;
    this._widgetReady = true;
    const c = this.spCtx.widgetInfo.config || {};
    const arr = c.servers || [];
    arr.forEach((s, idx) => { this._initRes(idx); });
    // 优化：当前实例立即取数，其余实例错峰预热，避免同一时刻把全部服务器打满
    arr.forEach((s, idx) => {
      if (idx === this._curIdx) this.getServerStatus(idx);
      else this._later(() => this.getServerStatus(idx), 800 * (idx + 1));
    });
    this._startAuto();
    this._startUptime();
    const t = c.interval;
    if (t >= INTERVAL_MIN) this._fetchTimer = this.spCtx.api.timer.setInterval(() => { this._tickFetch(); }, t * 1e3);
  }
  // 优化：定时刷新时当前实例按 interval 走，其余实例降频（≥4 倍间隔且不低于 30s），
  // 切到某个实例时 _goTo 会立即补一次，保证看到的是新数据
  _tickFetch() {
    const c = this.spCtx.widgetInfo.config || {};
    const arr = c.servers || [];
    // 仅当前实例模式：只刷新正在显示的实例，切过去时 _goTo 会立即补一次
    if (c.pollCurrentOnly) { this.getServerStatus(this._curIdx); return; }
    const now = Date.now();
    const gap = Math.max(30000, (parseInt(c.interval) || INTERVAL_DEFAULT) * 1000 * 4);
    arr.forEach((s, idx) => {
      const r = this._initRes(idx);
      if (idx === this._curIdx || !r._ts || now - r._ts > gap) this.getServerStatus(idx);
    });
  }
  _later(fn, ms) {
    const tm = this.spCtx && this.spCtx.api && this.spCtx.api.timer;
    const id = tm && tm.setTimeout ? tm.setTimeout(fn, ms) : setTimeout(fn, ms);
    (this._laterIds || (this._laterIds = [])).push(id);
    return id;
  }
  _stopFetch() {
    const tm = this.spCtx && this.spCtx.api && this.spCtx.api.timer;
    if (this._fetchTimer) {
      try { tm && tm.clearInterval && tm.clearInterval(this._fetchTimer); } catch { /* 忽略：失败时保持上一次状态 */ }
      this._fetchTimer = null;
    }
    (this._laterIds || []).forEach(id => { try { tm && tm.clearTimeout && tm.clearTimeout(id); } catch { /* 忽略：失败时保持上一次状态 */ } });
    this._laterIds = [];
  }
  // 优化：运行时间单独 1 秒刷新，只改这一行的文本，不触发整卡重渲染
  _startUptime() {
    if (this._upTimer) return;
    const tm = this.spCtx && this.spCtx.api && this.spCtx.api.timer;
    const fn = () => this._tickUptime();
    this._upTimer = tm && tm.setInterval ? tm.setInterval(fn, 1000) : setInterval(fn, 1000);
  }
  _tickUptime() {
    const root = this.renderRoot;
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('.ss2-card[data-ss2-srv]').forEach(card => {
      const rr = this._res[parseInt(card.getAttribute('data-ss2-srv'), 10)];
      if (!rr || rr.ready !== 1) return;
      // 只写这些没有任何 Lit 绑定的 span（真实行 + 轮询副本行），
      // 绝不能写 Lit 管理的节点，否则会破坏其节点标记导致后续渲染全部抛错
      const els = card.querySelectorAll('.ss2-uptime');
      if (!els.length) return;
      const v = this._uptimeText(rr)();
      els.forEach(el => { if (el.textContent !== v) el.textContent = v; });
    });
  }
  onDisconnected() {
    this._stopAuto();
    this._stopFetch();
    if (this._upTimer) {
      try { this.spCtx.api.timer.clearInterval && this.spCtx.api.timer.clearInterval(this._upTimer); } catch { /* 忽略：失败时保持上一次状态 */ }
      this._upTimer = null;
    }
  }
  onWidgetInfoChanged(t, e) {
    JSON.stringify(t.config) !== JSON.stringify(e?.config) && ((t.config?.servers || []).forEach((s, idx) => { this.getServerStatus(idx); }), this._stopAuto(), this._startAuto()),
    JSON.stringify(t) !== JSON.stringify(e) && this.requestUpdate();
  }
  /**
   * 配置入口说明：宿主只在「右键 → 设置」时以窗口形式打开 configComponentName 指向的组件，
   * 并在此之前 updateContext() 送入真正的 widgetInfo（含 config）。
   * SDK 1.0.19 并没有提供 api.window.open；若从小部件点击直接调用，宿主不会送 widgetInfo，
   * 配置页拿到的就是构造器默认值 {widgetInfo:{}}，打开后是空的、点「应用」也没有可存的数据
   * （用户实测：从小部件点开的配置页，实例区显示「实例不存在」、应用无效）。
   * 因此不再自己开配置窗口，配置入口统一走宿主右键菜单。
   */
  async getServerStatus(idx) {
    const c = this.spCtx.widgetInfo.config || {};
    const s = (c.servers || [])[idx];
    if (!s) return;
    const r = this._initRes(idx);
    r.ready = 0;
    r.errMsg = '';
    r._ts = Date.now();
    try {
      s.type === 'pve' ? await this._fetchPve(c, s, r, idx) : s.type === 'dsm' ? await this._fetchDsm(c, s, r) : s.type === 'win' ? await this._fetchWin(c, s, r) : (r.ready = -1, r.errMsg = '未知的接口类型');
      r.ready !== -1 && (r.ready = 1);
    } catch (e) {
      r.ready = -1;
      r.errMsg = '请求异常：' + ((e && e.message) || e);
    }
    this.requestUpdate();
  }
  async _fetchPve(c, s, r, idx) {
    const host = s.host
      , node = s.node
      , qemuid = s.qemuid
      , lxcid = s.lxcid;
    if (!host || !node) {
      r.ready = -1;
      r.errMsg = '未填写接口或节点';
      return;
    }
    const tok = () => ({ placeholder: '{{token}}', fields: ['headers'], dataNodeKey: 'widgetConfig.' + this.spCtx.widgetInfo.widgetId + '_token_' + idx });
    const get = url => this.spCtx.api.network.request({ request: { targetUrl: url, method: 'GET', headers: { Authorization: 'PVEAPIToken {{token}}' } }, templateReplacements: [tok()] }).then(x => (x ? x.data : null)).catch(() => null);
    let _path = `/api2/json/nodes/${node}/status`
      , kind = 'node'
      , kindName = '节点';
    qemuid ? (_path = `/api2/json/nodes/${node}/qemu/${qemuid}/status/current`,
    kind = 'vm',
    kindName = '虚拟机') : lxcid && (_path = `/api2/json/nodes/${node}/lxc/${lxcid}/status/current`,
    kind = 'lxc',
    kindName = '容器');
    // 地址回退：上次成功的地址优先 → 配置里的地址 → 同端口 127.0.0.1
    const _hosts = parseHostList(host);
    const _alt = loopbackHostOf(_hosts[0] || host);
    if (_alt && _hosts.indexOf(_alt) < 0) _hosts.push(_alt);
    const _order = (r._hostOk && _hosts.indexOf(r._hostOk) >= 0) ? [r._hostOk].concat(_hosts.filter(h => h !== r._hostOk)) : _hosts;
    let l = null;
    for (const _h of _order) { l = await get(_h + _path); if (l) { r._hostOk = _h; break; } }
    if (!r._hostOk) r._hostOk = _order[0] || host;
    const _base = r._hostOk;
    if (!l) {
      r.ready = -1;
      r.errMsg = '接口无响应或密钥无效';
      return;
    }
    // 优化：存储 / 网络接口互不依赖，并发请求
    const [stR, niR] = await Promise.all([
      kind === 'node' ? get(`${_base}/api2/json/nodes/${node}/storage`) : Promise.resolve(null),
      kind === 'node' ? get(`${_base}/api2/json/nodes/${node}/network`) : Promise.resolve(null),
    ]);
    const _d = (l && l.data) || {};
    let nodeIp = '未知'
      , pveVols = [];
    try {
      const _all = ((stR && stR.data) || []).filter(x => parseFloat(x.total) > 0 && x.used !== undefined).map(x => ({ vol: String(x.storage || ''), used: parseFloat(x.used) || 0, total: parseFloat(x.total) || 0 }));
      const _sel = selectedVolumes(s);
      pveVols = _sel.length ? _all.filter(v => _sel.indexOf(v.vol) > -1) : [];
      if (!pveVols.length) pveVols = _all.slice(0, 1);
    } catch { /* 忽略：失败时保持上一次状态 */ }
    if (kind === 'node') {
      const nic = ((niR && niR.data) || []).filter(x => x.address && x.address !== '127.0.0.1');
      if (nic[0]) nodeIp = nic[0].address;
    }
    const _now = Date.now()
      , _pct = (v, t) => (t > 0 ? Math.min(Math.max(v / t * 100, 0), 100) : 0)
      , _rIn = rateOf(r, 'netin', toNumber(_d.netin), _now)
      , _rOut = rateOf(r, 'netout', toNumber(_d.netout), _now)
      , _rRd = rateOf(r, 'diskread', toNumber(_d.diskread), _now)
      , _rWr = rateOf(r, 'diskwrite', toNumber(_d.diskwrite), _now)
      , _netOk = _d.netin != null || _d.netout != null
      , _ioOk = _d.diskread != null || _d.diskwrite != null;
    if (kind === 'node') {
      const _sw = _d.swap || {}, _rt = _d.rootfs || {}, _ci = _d.cpuinfo || {};
      r.staticInfo = [
        { key: 'platform', label: '平台', value: 'Proxmox VE' },
        { key: 'hostname', label: '主机名', value: node },
        { key: 'uptime', label: '运行时间', value: '未知' },
        { key: 'ip', label: '内网IP', value: nodeIp },
        { key: 'version', label: '系统版本', value: 'PVE ' + (_d.pveversion || '未知').replace(/^pve-manager\//, '').split('/')[0] },
        { key: 'kernel', label: '内核版本', value: _d.kversion || '未知' },
        { key: 'arch', label: '架构', value: String(_ci.model || '').indexOf('ARM') > -1 ? 'aarch64' : 'x86_64' },
        { key: 'model', label: '型号', value: _ci.model || '未知' },
        { key: 'cores', label: 'CPU核心', value: _ci.cpus ? _ci.cpus + ' 核' + (parseInt(_ci.sockets) > 1 ? ' × ' + _ci.sockets + ' 路' : '') : '未知' },
      ];
      const _swTotal = parseFloat(_sw.total) || 0, _rtTotal = parseFloat(_rt.total) || 0;
      r.metrics = [
        { key: 'cpu', name: 'CPU', icon: iconCpu, value: ((_d.cpu || 0) * 100).toFixed(1) + '%', percent: Math.min((_d.cpu || 0) * 100, 100), _ok: _d.cpu != null },
        { key: 'memory', name: '内存', icon: iconMemory, value: `${_d.memory && _d.memory.total ? Math.round(parseFloat(_d.memory.used) / parseFloat(_d.memory.total) * 100) : 0}%`, sub: `${formatBytes(_d.memory && _d.memory.used, 1)}/${formatBytes(_d.memory && _d.memory.total, 1)}`, percent: _pct(parseFloat(_d.memory && _d.memory.used), parseFloat(_d.memory && _d.memory.total)), _ok: !!(_d.memory && _d.memory.total) },
        { key: 'disk', name: pveVols[0] && pveVols[0].vol ? `磁盘(${pveVols[0].vol})` : '磁盘', icon: iconDisk, value: pveVols[0] && pveVols[0].total > 0 ? `${Math.round(_pct(pveVols[0].used, pveVols[0].total))}%` : '--', sub: pveVols[0] && pveVols[0].total > 0 ? `${formatBytes(pveVols[0].used, 1)}/${formatBytes(pveVols[0].total, 1)}` : '', percent: pveVols[0] && pveVols[0].total > 0 ? _pct(pveVols[0].used, pveVols[0].total) : 0, warn: pveVols[0] && pveVols[0].total > 0 && isDiskWarn(c, _pct(pveVols[0].used, pveVols[0].total)), _ok: !!(pveVols[0] && pveVols[0].total > 0) },
        { key: 'swap', name: '交换分区', icon: iconMemory, value: `${Math.round(_pct(parseFloat(_sw.used), _swTotal))}%`, sub: `${formatBytes(_sw.used, 1)}/${formatBytes(_sw.total, 1)}`, percent: _pct(parseFloat(_sw.used), _swTotal), _ok: _swTotal > 0 },
        { key: 'rootfs', name: '根分区', icon: iconDisk, value: `${Math.round(_pct(parseFloat(_rt.used), _rtTotal))}%`, sub: `${formatBytes(_rt.used, 1)}/${formatBytes(_rt.total, 1)}`, percent: _pct(parseFloat(_rt.used), _rtTotal), _ok: _rtTotal > 0 },
        { key: 'load', name: '负载', icon: iconLoad, value: (_d.loadavg || []).join(', ') || '--', _ok: !!((_d.loadavg || []).length) },
        { key: 'iowait', name: 'IO等待', icon: iconLoad, value: `${(parseFloat(_d.wait) || 0).toFixed(1)}%`, percent: Math.min(parseFloat(_d.wait) || 0, 100), _ok: _d.wait != null },
        { key: 'diskio', name: '磁盘IO', icon: iconDisk, value: '', lines: [{ label: '读', value: formatSpeedOrNull(_rRd) }, { label: '写', value: formatSpeedOrNull(_rWr) }], percent: 0, _ok: _ioOk },
        { key: 'network', name: '网络', icon: iconNetwork, value: '', lines: [{ label: '上传', value: formatSpeedOrNull(_rOut) }, { label: '下载', value: formatSpeedOrNull(_rIn) }], percent: 0, _ok: _netOk },
      ];
      // 每个选中的存储各生成一个独立磁盘指标（key = disk:<存储名>）
      pveVols.forEach(v => { if (v && v.vol) r.metrics.push({ key: 'disk:' + v.vol, name: `磁盘(${v.vol})`, icon: iconDisk, value: `${Math.round(percentOf(v.used, v.total))}%`, sub: `${formatBytes(v.used, 1)}/${formatBytes(v.total, 1)}`, percent: percentOf(v.used, v.total), warn: isDiskWarn(c, percentOf(v.used, v.total)), _ok: v.total > 0 }); });
      trimMetrics(r.metrics);
    } else {
      const _msw = parseFloat(_d.maxswap) || 0;
      r.staticInfo = [
        { key: 'platform', label: '平台', value: 'Proxmox VE' },
        { key: 'hostname', label: '主机名', value: _d.name || '未知' },
        { key: 'uptime', label: '运行时间', value: '未知' },
        { key: 'model', label: '型号', value: `${kindName} ${_d.name} (${_d.vmid})` },
      ];
      r.metrics = [
        { key: 'cpu', name: 'CPU', icon: iconCpu, value: ((_d.cpu || 0) * 100).toFixed(1) + '%', percent: Math.min((_d.cpu || 0) * 100, 100), _ok: _d.cpu != null },
        { key: 'memory', name: '内存', icon: iconMemory, value: `${_d.maxmem ? Math.round(parseFloat(_d.mem) / parseFloat(_d.maxmem) * 100) : 0}%`, sub: `${formatBytes(_d.mem, 1)}/${formatBytes(_d.maxmem, 1)}`, percent: _pct(parseFloat(_d.mem), parseFloat(_d.maxmem)), _ok: !!_d.maxmem },
        { key: 'disk', name: '磁盘', icon: iconDisk, value: `${Math.round(_pct(parseFloat(_d.disk), parseFloat(_d.maxdisk)))}%`, sub: `${formatBytes(_d.disk, 1)}/${formatBytes(_d.maxdisk, 1)}`, percent: _pct(parseFloat(_d.disk), parseFloat(_d.maxdisk)), warn: isDiskWarn(c, _pct(parseFloat(_d.disk), parseFloat(_d.maxdisk))), _ok: _d.disk != null && parseFloat(_d.maxdisk) > 0 },
        { key: 'swap', name: '交换分区', icon: iconMemory, value: `${Math.round(_pct(parseFloat(_d.swap), _msw))}%`, sub: `${formatBytes(_d.swap, 1)}/${formatBytes(_msw, 1)}`, percent: _pct(parseFloat(_d.swap), _msw), _ok: _msw > 0 },
        { key: 'diskio', name: '磁盘IO', icon: iconDisk, value: '', lines: [{ label: '读', value: formatSpeedOrNull(_rRd) }, { label: '写', value: formatSpeedOrNull(_rWr) }], percent: 0, _ok: _ioOk },
        { key: 'network', name: '网络', icon: iconNetwork, value: '', lines: [{ label: '上传', value: formatSpeedOrNull(_rOut) }, { label: '下载', value: formatSpeedOrNull(_rIn) }], percent: 0, _ok: _netOk },
      ];
      trimMetrics(r.metrics);
    }
    if (r.upBase === null && _d.uptime != null) { r.upBase = parseFloat(_d.uptime); r.upStart = Date.now(); }
  }
  async _fetchDsm(c, s, r) {
    const host = s.host
      , account = s.account
      , password = s.password;
    if (!host || !account || !password) {
      r.ready = -1;
      r.errMsg = '未填写接口、账号或密码';
      return;
    }
    const get = url => this.spCtx.api.network.request({ request: { targetUrl: url, method: 'GET' } }).then(x => (x ? x.data : null)).catch(() => null);
    // 地址回退：上次成功的地址优先 → 配置里的地址 → 同端口 127.0.0.1
    const _hosts = parseHostList(host);
    const _alt = loopbackHostOf(_hosts[0] || host);
    if (_alt && _hosts.indexOf(_alt) < 0) _hosts.push(_alt);
    const _order = (r._hostOk && _hosts.indexOf(r._hostOk) >= 0) ? [r._hostOk].concat(_hosts.filter(h => h !== r._hostOk)) : _hosts;
    let sid = r.sid, _base = r._hostOk || _order[0] || host;
    if (!sid) {
      let o = null;
      for (const _h of _order) {
        o = await get(`${_h}/webapi/auth.cgi?api=SYNO.API.Auth&version=6&method=login&account=${encodeURIComponent(account)}&passwd=${encodeURIComponent(password)}&session=FileStation&format=sid`);
        if (o && o.success === true && o.data && o.data.sid) { _base = _h; break; }
        o = null;
      }
      if (!o) {
        r.ready = -1;
        r.errMsg = '登录失败（接口地址 / 账号 / 密码或权限）';
        return;
      }
      sid = r.sid = o.data.sid;
      r._hostOk = _base;
    }
    const hostOk = _base;
    // 优化：登录后 6 个接口互不依赖，改为并发请求（原来串行 6 次往返）
    const [cR, csR, fsR, stR, diR, fiR, niR] = await Promise.all([
      get(`${hostOk}/webapi/entry.cgi?api=SYNO.Core.System.Utilization&version=1&method=get&_sid=${sid}`),
      get(`${hostOk}/webapi/entry.cgi?api=SYNO.Core.Share&version=1&method=list&_sid=${sid}`),
      get(`${hostOk}/webapi/entry.cgi?api=SYNO.FileStation.List&version=2&method=list_share&additional=%5B%22volume_status%22%5D&_sid=${sid}`),
      get(`${hostOk}/webapi/entry.cgi?api=SYNO.Storage.CGI.Volume&version=1&method=list&_sid=${sid}`),
      get(`${hostOk}/webapi/entry.cgi?api=SYNO.DSM.Info&version=2&method=getinfo&_sid=${sid}`),
      get(`${hostOk}/webapi/entry.cgi?api=SYNO.FileStation.Info&version=2&method=get&_sid=${sid}`),
      get(`${hostOk}/webapi/entry.cgi?api=SYNO.Core.Network.Interface&version=1&method=list&_sid=${sid}`),
    ]);
    if (!cR || cR.success !== true || !cR.data) {
      r.sid = '',
      r.ready = -1;
      r.errMsg = '接口未返回数据（会话可能已过期）';
      return;
    }
    const d = cR.data
      , p = d.cpu || {}
      , cpuPct = Math.min(Math.max((parseFloat(p.user_load) || 0) + (parseFloat(p.system_load) || 0) + (parseFloat(p.other_load) || 0), 0), 100)
      , mm = d.memory || {}
      , l = (parseFloat(mm.total_real) || 0) * 1024
      , mu = Math.min(Math.max(parseFloat(mm.real_usage) || 0, 0), 100)
      // 口径说明：DSM 的 real_usage 已扣除 cache/buffer，而 avail_real 只是空闲内存，
      // 两者差值就是文件缓存；子行改用与百分比同口径的已用量，避免出现「50% 却 6.09/7.56GB」
      , u = l * mu / 100
      , dkArr = Array.isArray(d.disk && d.disk.disk) ? d.disk.disk : []
      , dvSel = selectedVolumes(s)
      , nt = Array.isArray(d.network) ? (d.network.find(b => b.device === 'total') || d.network[0] || {}) : (d.network || {})
      , E = parseFloat(nt.rx) || 0
      , x = parseFloat(nt.tx) || 0;
    let volSel = null
      , volList = []
      , du = Math.min(Math.max(parseFloat((d.disk && (d.disk.total || dkArr[0]))?.utilization) || 0, 0), 100)
      , dsmHost = '未知'
      , dsmModel = '未知'
      , dsmVer = '未知'
      , dsmSerial = ''
      , dsmFw = ''
      , dsmTemp = null
      , dsmUp = null
      , dsmIp = '未知';
    try {
      const volOf = {};
      ((csR && csR.data && csR.data.shares) || []).forEach(sh => { if (sh.vol_path) volOf[sh.name] = sh.vol_path; });
      const volMap = {};
      if (stR && stR.success === true && Array.isArray(stR.data?.volumes)) {
        (stR.data.volumes || []).forEach(v => {
          const vp = v.path || ('/' + String(v.id || '').replace(/^volume_/, 'volume'));
          const tt = parseFloat(v.total_space || v.totalSpace || 0);
          if (vp && !volMap[vp]) volMap[vp] = { free: parseFloat(v.free_space || v.freeSpace) || (tt ? tt - (parseFloat(v.used_space || v.usedSpace) || 0) : 0), total: tt };
        });
      }
      ((fsR && fsR.data && fsR.data.shares) || []).forEach(sh => { const vp = volOf[sh.name], vs = sh.additional && sh.additional.volume_status; if (vp && vs && !volMap[vp] && parseFloat(vs.totalspace) > 0) volMap[vp] = { free: parseFloat(vs.freespace) || 0, total: parseFloat(vs.totalspace) || 0 }; });
      const volInfo = Object.keys(volMap).map(vp => ({ vol: vp.replace(/^\//, ''), free: volMap[vp].free, total: volMap[vp].total }));
      volList = Array.isArray(dvSel) && dvSel.length ? volInfo.filter(b => dvSel.indexOf(b.vol) > -1) : [];
      if (!volList.length) volList = volInfo.slice(0, 1);
      volSel = volList[0] || null;
      if (volSel && volSel.total > 0) du = Math.min(Math.max((volSel.total - volSel.free) / volSel.total * 100, 0), 100);
    } catch { /* 忽略：失败时保持上一次状态 */ }
    try {
      if (diR && diR.success && diR.data) {
        dsmModel = diR.data.model || '未知';
        dsmVer = diR.data.version_string || '未知';
        dsmSerial = diR.data.serial || '';
        dsmFw = diR.data.firmware_ver || '';
        if (diR.data.temperature != null) dsmTemp = parseFloat(diR.data.temperature);
        if (diR.data.uptime != null) dsmUp = parseFloat(diR.data.uptime);
      }
    } catch { /* 忽略：失败时保持上一次状态 */ }
    try { if (fiR && fiR.success && fiR.data && fiR.data.hostname) dsmHost = fiR.data.hostname; } catch { /* 忽略：失败时保持上一次状态 */ }
    try {
      const ifc = ((niR && niR.data) || []).find(x => x.ip && x.ip !== '127.0.0.1');
      if (ifc) dsmIp = ifc.ip;
    } catch { /* 忽略：失败时保持上一次状态 */ }
    if (r.upBase === null && dsmUp !== null) { r.upBase = dsmUp; r.upStart = Date.now(); }
    r.staticInfo = [
      { key: 'platform', label: '平台', value: '群晖' },
      { key: 'hostname', label: '主机名', value: dsmHost },
      { key: 'uptime', label: '运行时间', value: dsmUp === null ? '未知' : formatUptime(dsmUp) },
      { key: 'ip', label: '内网IP', value: dsmIp },
      { key: 'version', label: '系统版本', value: dsmVer.split('-')[0] },
      { key: 'arch', label: '架构', value: 'x86_64' },
      { key: 'model', label: '型号', value: dsmModel },
      { key: 'serial', label: '序列号', value: dsmSerial || '未知' },
      { key: 'firmware', label: '固件版本', value: dsmFw || '未知' },
    ];
    r.metrics = [
      { key: 'cpu', name: 'CPU', icon: iconCpu, value: `${cpuPct.toFixed(1)}%`, percent: cpuPct, _ok: !!(d.cpu && (p.user_load != null || p.system_load != null || p.other_load != null)) },
      { key: 'memory', name: '内存', icon: iconMemory, value: `${mu}%`, sub: `${formatBytes(u)}/${formatBytes(l)}`, percent: mu, _ok: !!(mm.total_real) },
      { key: 'disk', name: volSel && volSel.vol ? `磁盘(/${volSel.vol})` : '磁盘', icon: iconDisk, value: `${Math.round(du)}%`, sub: volSel && volSel.total > 0 ? `${formatBytes(volSel.total - volSel.free)}/${formatBytes(volSel.total)}` : '', percent: Math.min(du, 100), warn: isDiskWarn(c, Math.min(du, 100)), _ok: !!volSel },
      { key: 'network', name: '网络', icon: iconNetwork, value: '', lines: [{ label: '上传', value: formatSpeed(x) }, { label: '下载', value: formatSpeed(E) }], percent: 0, _ok: !!(Array.isArray(d.network) ? d.network.some(b => b && (b.rx != null || b.tx != null)) : (d.network && (d.network.rx != null || d.network.tx != null))) },
      { key: 'temp', name: '温度', icon: iconTemp, value: dsmTemp == null ? '--' : dsmTemp.toFixed(0) + '°C', percent: dsmTemp == null ? 0 : Math.min(Math.max(dsmTemp / 90 * 100, 0), 100), _ok: dsmTemp != null },
    ];
    // 每个选中的卷各生成一个独立磁盘指标（key = disk:<卷名>）
    volList.forEach(v => { if (v && v.vol) r.metrics.push({ key: 'disk:' + v.vol, name: `磁盘(/${v.vol})`, icon: iconDisk, value: `${Math.round(percentOf(v.total - v.free, v.total))}%`, sub: `${formatBytes(v.total - v.free)}/${formatBytes(v.total)}`, percent: percentOf(v.total - v.free, v.total), warn: isDiskWarn(c, percentOf(v.total - v.free, v.total)), _ok: v.total > 0 }); });
    trimMetrics(r.metrics);
  }
  async _fetchWin(c, s, r) {
    // 与配置页同一套归一化：旧实例存的可能是网页根地址，也能自动补成数据接口
    const _u = normalizeWinUrl(s.url, s.winSource);
    if (!_u) {
      r.ready = -1;
      r.errMsg = '未填写接口地址';
      return;
    }
    // 地址回退：上次成功的地址优先 → 配置里的地址 → 同端口 127.0.0.1
    const _hosts = parseHostList(_u);
    const _alt = loopbackHostOf(_hosts[0] || _u);
    if (_alt && _hosts.indexOf(_alt) < 0) _hosts.push(_alt);
    const _order = (r._hostOk && _hosts.indexOf(r._hostOk) >= 0) ? [r._hostOk].concat(_hosts.filter(h => h !== r._hostOk)) : _hosts;
    let e = null;
    for (const _h of _order) {
      // 回退地址是 127.0.0.1 + 原路径，这里按数据源再归一化一次，避免退化成网页地址
      const _t = normalizeWinUrl(_h, s.winSource);
      e = await this.spCtx.api.network.request({ request: { targetUrl: _t + (s.win_pwd ? (_t.includes('?') ? '&' : '?') + 'pwd=' + encodeURIComponent(s.win_pwd) : ''), method: 'GET' } }).then(x => (x ? x.data : null)).catch(() => null);
      if (e) { r._hostOk = _t; break; }
    }
    if (!e) {
      r.ready = -1;
      r.errMsg = '接口无响应（地址 / 端口 / 密码）';
      return;
    }
    // 数据源：LibreHardwareMonitor（data.json）自动识别
    const _src = String(s.winSource || 'auto');
    if (_src === 'lhm' || (_src === 'auto' && isLhmTree(e))) {
      const L = flattenLhmSensors(e)
        , _c = pickLhmSensor(L, /^(CPU Total|Total CPU Load|CPU Load)$/i, /%/)
        , _mu = pickLhmSensor(L, /^Memory Used$/i, /(GB|MB)/i)
        , _ma = pickLhmSensor(L, /^Memory Available$/i, /(GB|MB)/i)
        , _du = pickLhmSensor(L, /^Used Space$/i, /%/, /Storage|HDD|SSD|Volume/i)
        , _gp = pickLhmSensor(L, /^GPU Core$/i, /%/, /GPU/i)
        , _tp = pickLhmSensor(L, /Package|Temperature/i, /°C/, /CPU/i)
        , _gpT = pickLhmSensor(L, /Core|Temperature/i, /°C/, /GPU/i);
      const cpuV = lhmNumber(_c && _c.value)
        , usedV = lhmNumber(_mu && _mu.value)
        , availV = lhmNumber(_ma && _ma.value)
        , memV = usedV != null && availV != null && usedV + availV > 0 ? usedV / (usedV + availV) * 100 : null
        , diskV = lhmNumber(_du && _du.value)
        , gpuV = lhmNumber(_gp && _gp.value)
        , tempV = lhmNumber((_tp || _gpT || {}).value)
        , _hn = (e.Children && e.Children[0] && e.Children[0].Text) || 'Windows';
      r.staticInfo = [
        { key: 'platform', label: '平台', value: 'Windows' },
        { key: 'hostname', label: '主机名', value: _hn },
        { key: 'arch', label: '架构', value: 'x86_64' },
        { key: 'version', label: '系统版本', value: 'Windows' },
        { key: 'model', label: '型号', value: 'LibreHardwareMonitor' },
      ];
      r.metrics = [
        { key: 'cpu', name: 'CPU', icon: iconCpu, value: cpuV == null ? '--' : cpuV.toFixed(1) + '%', percent: cpuV == null ? 0 : Math.min(cpuV, 100), _ok: cpuV != null },
        { key: 'memory', name: '内存', icon: iconMemory, value: memV == null ? '--' : memV.toFixed(0) + '%', sub: usedV != null && availV != null ? `${usedV.toFixed(1)} GB/${(usedV + availV).toFixed(1)} GB` : '', percent: memV == null ? 0 : Math.min(memV, 100), _ok: memV != null },
        { key: 'disk', name: '磁盘', icon: iconDisk, value: diskV == null ? '--' : diskV.toFixed(0) + '%', percent: diskV == null ? 0 : Math.min(diskV, 100), warn: diskV != null && isDiskWarn(c, diskV), _ok: diskV != null },
        { key: 'gpu', name: '显卡', icon: iconGpu, value: gpuV == null ? '--' : gpuV.toFixed(1) + '%', percent: gpuV == null ? 0 : Math.min(gpuV, 100), _ok: gpuV != null },
        { key: 'temp', name: '温度', icon: iconTemp, value: tempV == null ? '--' : tempV.toFixed(0) + '°C', percent: tempV == null ? 0 : Math.min(Math.max(tempV / 90 * 100, 0), 100), _ok: tempV != null },
      ];
      trimMetrics(r.metrics);
      r.ready = 1;
      return;
    }
    const i = parseFloat(e?.cpu ?? e?.cpu_percent ?? e?.cpuPercent ?? 0) || 0
      , s2 = parseFloat(e?.mem_used ?? e?.memory_used ?? e?.mem?.used ?? 0) || 0
      , a = parseFloat(e?.mem_total ?? e?.memory_total ?? e?.mem?.total ?? 0) || 0
      , o = parseFloat(e?.disk_used ?? e?.disk?.used ?? 0) || 0
      , r2 = parseFloat(e?.disk_total ?? e?.disk?.total ?? 0) || 0
      , c2 = parseFloat(e?.uptime ?? 0) || 0
      , d = e?.name || '服务器状态';
    const l = Array.isArray(e?.items) ? e.items : [];
    if (l.length) {
      const lm = q => {
          const x2 = l.find(n => n.k === q);
          return x2 ? { v: x2.v, pct: parseFloat(x2.pct) || 0, u: x2.u || '' } : null;
        }
        , host = lm('DASH.HOST')
        , lip = lm('DASH.IP')
        , lup = lm('DASH.Uptime')
        , lcpu = lm('CPU.Load')
        , lmem = lm('MEM.Load')
        , lrd = lm('DISK.Read')
        , lwr = lm('DISK.Write')
        , lnu = lm('NET.Up')
        , lnd = lm('NET.Down')
        , ltrUp = lm('DATA.DayUp') || lm('NET.UpTotal') || lm('NET.Tx')
        , ltrDown = lm('DATA.DayDown') || lm('NET.DownTotal') || lm('NET.Rx');
      // 新增：LiteMonitor 面板里存在温度 / 显卡项目时才显示，不存在则由能力探测隐藏
      const _lTemp = l.find(n => /^CPU[.\-_]?TEMP/i.test(String(n.k || ''))) || l.find(n => /TEMP/i.test(String(n.k || '')))
        , _lGpu = l.find(n => /GPU/i.test(String(n.k || '')) && (n.pct != null || n.v != null));
      const lupIsNum = lup && /^[\d.]+$/.test(String(lup.v).trim());
      if (r.upBase === null && lupIsNum) { r.upBase = parseFloat(lup.v); r.upStart = Date.now(); }
      r.upRaw = lup && !lupIsNum ? lup.v : '';
      r.staticInfo = [{ key: 'platform', label: '平台', value: 'Windows' }, { key: 'hostname', label: '主机名', value: host ? host.v : '未知' }, { key: 'ip', label: '内网IP', value: lip ? lip.v : '未知' }, { key: 'uptime', label: '运行时间', value: lup ? lup.v : '未知' }, { key: 'arch', label: '架构', value: 'x86_64' }, { key: 'version', label: '系统版本', value: 'Windows 11' }, { key: 'model', label: '型号', value: '未知' }];
      r.metrics = [{ key: 'cpu', name: 'CPU', icon: iconCpu, value: `${lcpu ? lcpu.pct.toFixed(1) : '0.0'}%`, percent: lcpu ? Math.min(lcpu.pct, 100) : 0, _ok: !!lcpu }, { key: 'memory', name: '内存', icon: iconMemory, value: `${lmem ? lmem.pct.toFixed(1) : '0.0'}%`, percent: lmem ? Math.min(lmem.pct, 100) : 0, _ok: !!lmem }, { key: 'disk', name: '磁盘IO', icon: iconDisk, value: '', lines: [{ label: '读', value: formatSpeed(lrd ? parseFloat(lrd.v) : 0) }, { label: '写', value: formatSpeed(lwr ? parseFloat(lwr.v) : 0) }], percent: 0, _ok: !!(lrd || lwr) }, { key: 'network', name: '网络', icon: iconNetwork, value: '', lines: [{ label: '上传', value: formatSpeed(lnu ? parseFloat(lnu.v) : 0) }, { label: '下载', value: formatSpeed(lnd ? parseFloat(lnd.v) : 0) }], percent: 0, _ok: !!(lnu || lnd) }];
      if (ltrUp || ltrDown) r.metrics.push({ key: 'traffic', name: '流量', icon: iconNetwork, value: '', lines: [{ label: '上传', value: formatTraffic(ltrUp ? parseFloat(ltrUp.v) * (((ltrUp.u || '').trim() === 'GB') ? 1073741824 : ((ltrUp.u || '').trim() === 'MB' ? 1048576 : 1)) : 0) }, { label: '下载', value: formatTraffic(ltrDown ? parseFloat(ltrDown.v) * (((ltrDown.u || '').trim() === 'GB') ? 1073741824 : ((ltrDown.u || '').trim() === 'MB' ? 1048576 : 1)) : 0) }], percent: 0 });
      if (_lTemp) r.metrics.push({ key: 'temp', name: '温度', icon: iconTemp, value: `${_lTemp.v}${_lTemp.u || ''}`, percent: 0 });
      if (_lGpu) r.metrics.push({ key: 'gpu', name: '显卡', icon: iconGpu, value: _lGpu.pct != null && parseFloat(_lGpu.pct) > 0 ? parseFloat(_lGpu.pct).toFixed(1) + '%' : `${_lGpu.v}${_lGpu.u || ''}`, percent: _lGpu.pct != null ? Math.min(parseFloat(_lGpu.pct) || 0, 100) : 0 });
      trimMetrics(r.metrics);
      r.ready = 1;
      return;
    }
    r.staticInfo = [{ key: 'platform', label: '平台', value: e?.platform || 'Windows' }, { key: 'hostname', label: '主机名', value: d }, { key: 'arch', label: '架构', value: e?.arch || '未知' }, { key: 'uptime', label: '运行时间', value: c2 ? formatDuration(c2) : '未知' }, { key: 'ip', label: '内网IP', value: e?.ip || '未知' }, { key: 'version', label: '系统版本', value: e?.version || 'Windows 11' }, { key: 'model', label: '型号', value: e?.model || '未知' }];
    r.metrics = [{ key: 'cpu', name: 'CPU', icon: iconCpu, value: i.toFixed(1) + '%', percent: Math.min(i, 100), _ok: !!(e && (e.cpu != null || e.cpu_percent != null || e.cpuPercent != null)) }, { key: 'memory', name: '内存', icon: iconMemory, value: `${a ? Math.round(s2 / a * 100) : 0}%`, sub: `${formatBytes(s2)}/${formatBytes(a)}`, percent: a ? Math.min(s2 / a * 100, 100) : 0, _ok: !!a }, { key: 'disk', name: '磁盘', icon: iconDisk, value: `${r2 ? Math.round(o / r2 * 100) : 0}%`, sub: `${formatBytes(o)}/${formatBytes(r2)}`, percent: r2 ? Math.min(o / r2 * 100, 100) : 0, _ok: !!r2 }];
    // 通用接口若额外提供读写速率 / 温度，也一并支持
    const _dr = parseFloat(e?.disk_read ?? e?.diskread), _dw = parseFloat(e?.disk_write ?? e?.diskwrite), _tp = parseFloat(e?.temperature ?? e?.temp);
    if (isFinite(_dr) || isFinite(_dw)) r.metrics.push({ key: 'diskio', name: '磁盘IO', icon: iconDisk, value: '', lines: [{ label: '读', value: formatSpeed(isFinite(_dr) ? _dr : 0) }, { label: '写', value: formatSpeed(isFinite(_dw) ? _dw : 0) }], percent: 0 });
    if (isFinite(_tp)) r.metrics.push({ key: 'temp', name: '温度', icon: iconTemp, value: _tp.toFixed(0) + '°C', percent: 0 });
    trimMetrics(r.metrics);
    r.upRaw = '';
    if (r.upBase === null && c2) { r.upBase = c2; r.upStart = Date.now(); }
  }
  _uptimeText(rr) {
    return () => rr.upRaw ? rr.upRaw : (rr.upBase === null || rr.upBase === undefined ? '未知' : formatUptime(rr.upBase + (Date.now() - rr.upStart) / 1e3));
  }
  _cardTitle(s) {
    return s && s.name ? stripSequence(s.name) : s.type === 'pve' ? 'Proxmox VE' : s.type === 'dsm' ? '群晖' : '服务器状态';
  }
  _platformInfo(s, accent) {
    const _n = s && s.name ? stripSequence(s.name) : s.type === 'pve' ? 'Proxmox VE' : s.type === 'dsm' ? '群晖' : 'Windows';
    const _cl = s && s.color ? s.color : '';
    return s.type === 'pve' ? { icon: iconPlatformPve, name: _n, url: s.url || '', accent, color: _cl } : s.type === 'dsm' ? { icon: iconPlatformDsm, name: _n, url: s.url || '', accent, color: _cl } : { icon: iconPlatformWin, name: _n, url: s.platformUrl || '', accent, color: _cl };
  }
  _goTo(n) {
    const arr = (this.spCtx.widgetInfo.config || {}).servers || [];
    if (!arr.length) return;
    this._curIdx = ((n % arr.length) + arr.length) % arr.length;
    // 优化：切到的实例数据若已陈旧，立刻补一次
    const r = this._initRes(this._curIdx);
    const iv = Math.max(1000, (parseInt((this.spCtx.widgetInfo.config || {}).interval) || INTERVAL_DEFAULT) * 1000);
    if (!r._ts || Date.now() - r._ts > iv) this.getServerStatus(this._curIdx);
    this.requestUpdate();
  }
  _startAuto() {
    const c = this.spCtx.widgetInfo.config || {};
    if (!c.autoSwitch) { this._stopAuto(); return; }
    if (this._autoOn) return;
    this._autoOn = true;
    this._autoTimer = this.spCtx.api.timer.setInterval(() => {
      if (!this._autoOn) return;
      const cc = this.spCtx.widgetInfo.config || {};
      if (!cc.autoSwitch) { this._stopAuto(); return; }
      const arr = cc.servers || [];
      arr.length > 1 && this._goTo(this._curIdx + 1);
    }, 8e3);
  }
  _stopAuto() {
    this._autoOn = false;
    if (this._autoTimer) {
      try { this.spCtx.api.timer.clearInterval && this.spCtx.api.timer.clearInterval(this._autoTimer); } catch { /* 忽略：失败时保持上一次状态 */ }
      this._autoTimer = null;
    }
  }
  // 滑动模式下把「每屏 3 块」的块高写进 CSS 变量，保证首块顶边与信息卡顶边、
  // 第三块底边与信息卡底边严格对齐（元素高度是 100%，无法用百分比表达）
  _ss2Sync() {
    const root = this.renderRoot;
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('.ss2-metrics.ss2-scroll').forEach(el => {
      const gap = parseFloat(getComputedStyle(el).rowGap) || 8;
      const h = Math.max(24, (layoutHeight(el) - gap * 2) / 3);
      const want = h.toFixed(2) + 'px';
      // 用内联实际值判断：Lit 重写 style 属性会清掉自定义属性
      if (el.style.getPropertyValue('--ss2-vh') !== want) el.style.setProperty('--ss2-vh', want);
    });
    root.querySelectorAll('.ss2-metrics.ss2-compact').forEach(el => { applyCompactDensity(el); });
    root.querySelectorAll('.ss2-infos, .ss2-metrics.ss2-scroll').forEach(el => {
      const fit = fitContent(el);
      el.style.touchAction = fit ? '' : 'none';
      const st = getState(el);
      if (st.anim) return;
      const n = getRealCount(el).length;
      const idx = fit ? 0 : (n > 0 ? Math.min(st.idx, n - 1) : 0);
      const track = getTrack(el);
      if (!track) return;
      const want = 'translateY(' + (-idx * getStep(el)).toFixed(2) + 'px)';
      if (track.style.transform !== want) applyOffset(el, idx, false);
    });
  }
  _ss2Observe() {
    const root = this.renderRoot;
    if (!root || !root.querySelectorAll || typeof ResizeObserver === 'undefined') return;
    if (!this._ss2ro) this._ss2ro = new ResizeObserver(() => { this._ss2Sync(); });
    if (!this._ss2seen) this._ss2seen = new WeakSet();
    root.querySelectorAll('.ss2-infos, .ss2-metrics.ss2-scroll, .ss2-metrics.ss2-compact').forEach(el => {
      if (!this._ss2seen.has(el)) { this._ss2seen.add(el); this._ss2ro.observe(el); }
    });
  }
  updated(t) {
    super.updated(t);
    if (!this._widgetReady && this.spCtx && this.spCtx.widgetInfo && this.spCtx.widgetInfo.config) this._initWidget();
    this._ss2Sync();
    this._ss2Observe();
    this._tickUptime();
  }
  render() {
    const _c0 = (this.spCtx && this.spCtx.widgetInfo && this.spCtx.widgetInfo.config) || {};
    const c = _c0;
    const arr = Array.isArray(c.servers) ? c.servers : [];
    if (!arr.length) {
      // 未配置：整张卡铺满。配置入口只用宿主的「右键 → 设置」，
      // 不再自己点开窗口（SDK 1.0.19 没有 api.window.open，那样打开会拿到空 widgetInfo）。
      return html`<div class="ss2-agg-wrap">${renderUnsetCard('设备状态墙')}</div>`;
    }
    const _theme = c.theme === 'dark' ? 'dark' : 'light';
    const accent = this.spCtx.accentColor || this.spCtx.themeColor || this.spCtx.primaryColor || '';
    const _multi = arr.length > 1;
    const _sm = isSwitchMode(c.switchMode) ? c.switchMode : 'fade';
    this._curIdx >= arr.length && (this._curIdx = 0);
    const _cur = this._curIdx || 0;
    const _cards = arr.map((s, idx) => {
      const l = new Set(Array.isArray(s.leftItems) && s.leftItems.length ? s.leftItems : (Array.isArray(c.leftItems) && c.leftItems.length ? c.leftItems : DEFAULT_LEFT_ITEMS));
      const r = new Set(Array.isArray(s.rightItems) && s.rightItems.length ? s.rightItems : (Array.isArray(c.rightItems) && c.rightItems.length ? c.rightItems : DEFAULT_RIGHT_ITEMS));
      const rr = this._res[idx] || this._initRes(idx);
      let _card;
      if (rr.ready === -1) {
        // 取数失败：卡片仍展示（标题/接口信息照常渲染），不再整卡替换成占位卡，
        // 配置入口统一走宿主「右键 → 设置」
        _card = renderFlipCard(this._cardTitle(s), [], [], this._platformInfo(s, accent), _theme, c.bgOpacity, _cur + 1, arr.length, () => this._goTo(_cur + 1), c.compactMode === undefined ? false : !!c.compactMode, idx);
      }
      else {
        const infoK = [...l].filter(k => (rr.staticInfo || []).some(i => i.key === k));
        const info = (infoK.length ? infoK : [...r]).map(k => (rr.staticInfo || []).find(i => i.key === k)).filter(Boolean).map(i => i.key === 'uptime' ? { ...i, value: this._uptimeText(rr)() } : i);
        // 右侧若勾了「磁盘(卷名)」这类按卷项，就跳过通用 disk，避免出现两个同名磁盘块
        const _rKeys = [...r].filter(k => !(k === 'disk' && [...r].some(x => String(x).indexOf('disk:') === 0)));
        const mfK = _rKeys.filter(k => (rr.metrics || []).some(i => i.key === k));
        const _wth = Math.min(100, Math.max(0, parseInt(c.diskWarn === undefined ? 80 : c.diskWarn) || 0));
        const mf = (mfK.length ? mfK : [...l]).map(k => (rr.metrics || []).find(i => i.key === k)).filter(Boolean)
          .map(i => (String(i.key).indexOf('disk') === 0 ? { ...i, warn: _wth > 0 && parseFloat(i.percent) >= _wth } : i));
        const metrics = mf.length ? mf : (rr.metrics || []).slice(0, 3);
        // 与配置页保持一致：紧凑模式缺省视为关闭
        _card = renderFlipCard(this._cardTitle(s), info, metrics, this._platformInfo(s, accent), _theme, c.bgOpacity, _cur + 1, arr.length, () => this._goTo(_cur + 1), c.compactMode === undefined ? false : !!c.compactMode, idx);
      }
      if (!_multi) {
        return _card;
      }
      const _off = idx - _cur;
      let _st;
      if (_sm === 'curl') {
        _st = _off === 0 ? 'opacity:1;transform:perspective(900px) rotateY(0deg) translateZ(0)' : (_off > 0 ? 'opacity:0;transform:perspective(900px) rotateY(-14deg) translateX(-6%)' : 'opacity:0;transform:perspective(900px) rotateY(14deg) translateX(6%)');
      }
      else if (_sm === 'zoom') {
        _st = _off === 0 ? 'opacity:1;transform:scale(1)' : 'opacity:0;transform:scale(1.16)';
      }
      else if (_sm === 'flip') {
        _st = _off === 0 ? 'opacity:1;transform:perspective(900px) rotateY(0deg)' : (_off > 0 ? 'opacity:0;transform:perspective(900px) rotateY(86deg)' : 'opacity:0;transform:perspective(900px) rotateY(-86deg)');
      }
      else if (_sm === 'blur') {
        _st = _off === 0 ? 'opacity:1;filter:blur(0px);transform:none' : 'opacity:0;filter:blur(10px);transform:scale(1.05)';
      }
      else if (_sm === 'drop') {
        _st = _off === 0 ? 'opacity:1;transform:none' : (_off > 0 ? 'opacity:0;transform:translateY(100%)' : 'opacity:0;transform:translateY(-100%)');
      }
      else {
        _st = _off === 0 ? 'opacity:1;transform:none' : 'opacity:0;transform:scale(.92)';
      }
      return html`<div class="ss2-sw-item ${_off === 0 ? 'ss2-sw-cur' : ''}" style="${_st}">${_card}</div>`;
    });
    return html`
   <div class="ss2-agg-wrap ${_multi ? 'ss2-sw ss2-sw-' + _sm : ''}">
    ${_cards}
   </div>
  `;
  }
  disconnectedCallback() {
    if (this._ss2ro) { try { this._ss2ro.disconnect(); } catch { /* 忽略：失败时保持上一次状态 */ } this._ss2ro = null; this._ss2seen = null; }
    super.disconnectedCallback && super.disconnectedCallback();
  }
}
