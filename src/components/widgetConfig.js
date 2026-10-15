import { html } from 'lit';
import { SunPanelPageElement } from '@sun-panel/micro-app';

import { INTERVAL_DEFAULT, INTERVAL_MAX, INTERVAL_MIN } from '../constants/limits.js';
import {
  DEFAULT_LEFT_ITEMS, DEFAULT_RIGHT_ITEMS, FALLBACK_LEFT_CAPS, FALLBACK_RIGHT_CAPS,
  LEFT_ITEM_OPTIONS, RIGHT_ITEM_OPTIONS, SWITCH_MODES, isSwitchMode, switchModeLabel,
} from '../constants/options.js';
import { loopbackHostOf, normalizeWinUrl, parseHostList } from '../utils/host.js';
import { flattenLhmSensors, isLhmTree } from '../utils/lhm.js';
import { selectedVolumes } from '../utils/volume.js';
import { configCss } from '../styles/config.css.js';

/**
 * 设备状态墙小部件的配置页：实例增删改、显示信息管理、取数地址与测试连接。
 */
export class ServerMonitorConfig extends SunPanelPageElement {
  static properties = {
    spCtx: { type: Object, attribute: false },
    widgetInfo: { type: Object },
  };

  static styles = [configCss];
  // SDK 的页面基类在 onConnected() 里调 onInitialized({ widgetInfo, customParam })，
  // 而宿主常常是在 connectedCallback 之后才 updateContext() 把真正的 spCtx 塞进来
  // （见 SDK dist/index.esm.js 里 Et.onConnected 的顺序）。
  // 因此 onInitialized 拿到的可能是构造器默认值 { widgetInfo: {}, customParam: {} }，
  // 这里只在真的拿到 widgetInfo 时初始化，否则等 updated() 里 spCtx 变化时再初始化，
  // 避免「配置页打开后是空的、点应用也没东西可存」。
  _cfgReady = false;
  servers = [];
  leftItems = [];
  rightItems = [];
  onInitialized({ widgetInfo: t, customParam: _e }) {
    if (t && t.config) this._initConfig(t);
  }
  updated(t) {
    super.updated(t);
    const w = this.spCtx && this.spCtx.widgetInfo;
    if (!this._cfgReady && w && w.config) this._initConfig(w);
  }
  _initConfig(t) {
    if (this._cfgReady) {
      // 已初始化过：宿主换了 widgetInfo（例如重新打开配置）时刷新数据源
      if (this.widgetInfo !== t) {
        this.widgetInfo = t;
        this._loadFromConfig(t.config || {});
        this.requestUpdate();
      }
      return;
    }
    this._cfgReady = true;
    this.widgetInfo = t;
    this._loadFromConfig(t.config || {});
    this.requestUpdate();
  }
  _loadFromConfig(i) {
    const raw = Array.isArray(i.servers) ? i.servers : [];
    const _cnt = {};
    this.servers = raw.map(s => {
      const _t = s.type === 'pve' ? 'pve' : s.type === 'dsm' ? 'dsm' : 'win';
      _cnt[_t] = (_cnt[_t] || 0) + 1;
      const _defName = _t === 'pve' ? 'Proxmox VE · ' + _cnt[_t] : _t === 'dsm' ? '群晖 · ' + _cnt[_t] : 'Windows · ' + _cnt[_t];
      const _defColor = ['#FF3B5F', '#FF9500', '#FFCC00', '#34C759', '#5AC8FA', '#5E5CE6', '#BF5AF2'][(_cnt[_t] - 1) % 7];
      return {
        type: _t, name: s.name || _defName, color: s.color || _defColor,
        host: s.host || '', node: s.node || '', qemuid: s.qemuid || 0, lxcid: s.lxcid || 0,
        diskVolume: s.diskVolume || '',
        diskVolumes: Array.isArray(s.diskVolumes) ? [...s.diskVolumes] : (s.diskVolume ? [s.diskVolume] : []),
        winSource: s.winSource || 'auto', url: s.url || '',
        // 只接受字符串，避免历史脏数据（数字/undefined）让输入框回显异常
        win_pwd: typeof s.win_pwd === 'string' ? s.win_pwd : '',
        account: s.account || '',
        password: typeof s.password === 'string' ? s.password : '',
        platformUrl: s.platformUrl || '',
        leftItems: Array.isArray(s.leftItems) ? [...s.leftItems] : [],
        rightItems: Array.isArray(s.rightItems) ? [...s.rightItems] : [],
      };
    });
    this.interval = Math.min(Math.max(parseInt(i.interval ?? INTERVAL_DEFAULT), INTERVAL_MIN), INTERVAL_MAX);
    this.cardtheme = i.cardtheme ?? '';
    // 主题默认深色（用户要求）。已有 config 带 theme 的实例沿用原值，不改变观感；
    // 只有「从未设置过主题」的新实例才默认深色。
    this.theme = i.theme === undefined ? 'dark' : (i.theme === 'dark' ? 'dark' : 'light');
    this.bgOpacity = Math.min(100, Math.max(0, parseInt(i.bgOpacity ?? 100)));
    this.switchMode = isSwitchMode(i.switchMode) ? i.switchMode : 'fade';
    this.autoSwitch = i.autoSwitch === undefined ? true : !!i.autoSwitch;
    this.compactMode = i.compactMode === undefined ? false : !!i.compactMode;
    this.pollCurrentOnly = i.pollCurrentOnly === undefined ? true : !!i.pollCurrentOnly;
    this.diskWarn = Math.min(100, Math.max(0, parseInt(i.diskWarn === undefined ? 80 : i.diskWarn) || 0));
    this._view = 'public';
    this._tab = this.servers.length ? this.servers[0].type : 'pve';
    this._editIdx = -1;
    this._editColor = '#FF3B5F';
    this._editLi = '';
    this._editRi = '';
    this.leftItems = [...(Array.isArray(i.leftItems) && i.leftItems.length ? i.leftItems : DEFAULT_LEFT_ITEMS)];
    this.rightItems = [...(Array.isArray(i.rightItems) && i.rightItems.length ? i.rightItems : DEFAULT_RIGHT_ITEMS)];
    this._selOpen = false;
    this._drag = null;
    this._tokenInput = '';
    this._volList = [];
    this._pveVolList = [];
    // 草稿缓存：detail/list 点「应用」只写草稿区（不落盘），
    // 回到公共设置再点一次「应用」才真正调 widget.save()（见 handleSaveOrCreateWidget）
    this._draftConfig = null;
    this._draftDirty = false;
    this._draftDiscard = false;
    this._draftTokenMap = {};
    this.requestUpdate();
  }
  _cur() {
    return this._editIdx > -1 && this._editIdx < this.servers.length ? this.servers[this._editIdx] : null;
  }
  _tabInsts() {
    return (this.servers || []).filter(s => s.type === this._tab);
  }
  _setTab(k) {
    this._tab = k === 'dsm' ? 'dsm' : k === 'win' ? 'win' : 'pve';
    this._view = 'list';
    this._editIdx = -1;
    this._selOpen = false;
    this.requestUpdate();
  }
  _showPublic() {
    this._view = 'public';
    this._editIdx = -1;
    this._tab = this.servers.length ? this.servers[0].type : 'pve';
    this._volList = [];
    this._pveVolList = [];
    this._selOpen = false;
    this.requestUpdate();
  }
  _goList() {
    this._view = 'list';
    this._editIdx = -1;
    this._volList = [];
    this._pveVolList = [];
    this._selOpen = false;
    this.requestUpdate();
  }
  // 当前实例属于哪一类接口（决定可监控项目）
  _capKey(s) {
    if (s.type === 'pve') return (s.qemuid || s.lxcid) ? 'pveGuest' : 'pveNode';
    return s.type === 'dsm' ? 'dsm' : 'win';
  }
  _capsOf(s) {
    const k = this._capKey(s);
    return { left: [...FALLBACK_LEFT_CAPS[k]], right: [...FALLBACK_RIGHT_CAPS[k]] };
  }
  // 统一请求入口：自动尝试「接口」里填的多个地址，内网地址不通时回退同端口 127.0.0.1，
  // 并把实际可用的地址记在 this._hostUsed 里，供「测试连接」展示
  _req(url, headers, tmpl) {
    const raw = String(url || '');
    const m = raw.match(/^([a-zA-Z][\w+.-]*:\/\/[^/]+)(\/[\s\S]*)$/);
    const bases = m ? this._testHosts(m[1]) : [];
    const tail = m ? m[2] : '';
    const list = m ? bases.map(b => b + tail) : [raw];
    const send = u => {
      const request = { targetUrl: u, method: 'GET' };
      if (headers) request.headers = headers;
      const o = { request };
      if (tmpl) o.templateReplacements = tmpl;
      return this.spCtx.api.network.request(o).then(r => (r ? r.data : null)).catch(() => null);
    };
    return (async () => {
      for (let i = 0; i < list.length; i++) {
        const d = await send(list[i]);
        if (d) { this._hostUsed = m ? bases[i] : ''; return d; }
      }
      return null;
    })();
  }
  // 探测当前接口「实际能提供」的项目：顺带完成磁盘卷列表加载，并剔除拿不到的项
  // （idx 保留在签名里：调用方都按当前实例下标传，后续若需要按下标读写密钥还要用）
  async _loadMeta(s, _idx) {
    const caps = this._capsOf(s);
    const L = new Set(caps.left), R = new Set(caps.right);
    this._capsSeq = (this._capsSeq || 0) + 1;
    const seq = this._capsSeq;
    let vols = null, pveVols = null;
    try {
      if (s.type === 'dsm') {
        vols = [];
        const h = (s.host || '').replace(/\/+$/, '');
        if (h && s.account && s.password) {
          const aR = await this._req(`${h}/webapi/auth.cgi?api=SYNO.API.Auth&version=6&method=login&account=${encodeURIComponent(s.account)}&passwd=${encodeURIComponent(s.password)}&session=FileStation&format=sid`);
          const sid = aR && aR.success === true && aR.data ? aR.data.sid : '';
          if (sid) {
            const [stR, fsR, diR, fiR, niR] = await Promise.all([
              this._req(`${h}/webapi/entry.cgi?api=SYNO.Storage.CGI.Volume&version=1&method=list&_sid=${sid}`),
              this._req(`${h}/webapi/entry.cgi?api=SYNO.FileStation.List&version=2&method=list_share&additional=%5B%22real_path%22%2C%22volume_status%22%5D&_sid=${sid}`),
              this._req(`${h}/webapi/entry.cgi?api=SYNO.DSM.Info&version=2&method=getinfo&_sid=${sid}`),
              this._req(`${h}/webapi/entry.cgi?api=SYNO.FileStation.Info&version=2&method=get&_sid=${sid}`),
              this._req(`${h}/webapi/entry.cgi?api=SYNO.Core.Network.Interface&version=1&method=list&_sid=${sid}`),
            ]);
            const _vols = [];
            if (stR && stR.success === true && Array.isArray(stR.data?.volumes)) {
              (stR.data.volumes || []).forEach(v => {
                const vRaw = String(v.path || v.volume_path || v.id || v.volume_id || v.name || '');
                const vp = vRaw.replace(/^\/+/, '').replace(/^volume_/, 'volume');
                vp && _vols.push(vp);
              });
            }
            (((fsR || {}).data || {}).shares || []).forEach(sh => {
              const _rp = String(((sh.additional || {}).real_path) || sh.vol_path || '');
              const _m = _rp.match(/^\/(volume\d+)(?:\/|$)/);
              const vp = _m ? _m[1] : String(sh.vol_path || '').replace(/^\/+/, '').replace(/^volume_/, 'volume');
              vp && _vols.push(vp);
            });
            vols = [...new Set(_vols)];
            vols.forEach(v => R.add('disk:' + String(v).replace(/^\/+/, '')));
            const _info = diR && diR.success ? (diR.data || {}) : null;
            if (!_info || _info.temperature == null) R.delete('temp');
            if (!_info || !_info.serial) L.delete('serial');
            if (!_info || !(_info.firmware_ver || _info.firmware)) L.delete('firmware');
            if (!(stR && stR.success) && !(fsR && fsR.success)) R.delete('disk');
            if (!(fiR && fiR.success && fiR.data && fiR.data.hostname)) L.delete('hostname');
            const _ifc = ((niR || {}).data || []).find(x => x.ip && x.ip !== '127.0.0.1');
            if (!_ifc) L.delete('ip');
            if (_info && _info.uptime == null) L.delete('uptime');
          }
        }
      } else if (s.type === 'pve') {
        const h = (s.host || '').replace(/\/+$/, ''), node = s.node;
        if (h && node) {
          // 首次配置时密钥还没落盘（数据节点要等保存后才写入），这里与 _testConn 保持同一套字面量化逻辑：
          // 本次输入框里有值就直接用它，否则才回退 {{token}} 占位符，否则新建实例点「测试连接」
          // 只把「连接成功」刷出来，磁盘卷与可选项仍旧是空的（要保存后重开才刷出来）。
          const _typed = String(this._tokenInput || '').trim();
          const _hdr = { Authorization: 'PVEAPIToken ' + (_typed || '{{token}}') };
          const _tmpl = _typed ? null : [this._tokenTmpl()];
          const get = (url) => this._req(url, _hdr, _tmpl);
          const guest = s.qemuid ? 'qemu/' + s.qemuid : s.lxcid ? 'lxc/' + s.lxcid : '';
          const [stR, volR] = await Promise.all([
            get(`${h}/api2/json/nodes/${node}/${guest ? guest + '/status/current' : 'status'}`),
            guest ? Promise.resolve(null) : get(`${h}/api2/json/nodes/${node}/storage`),
          ]);
          const d = stR && stR.data;
          if (guest) { if (!d) { L.clear(); R.clear(); caps.left.forEach(k => L.add(k)); caps.right.forEach(k => R.add(k)); } }
          if (d) {
            if (d.diskread == null && d.diskwrite == null) R.delete('diskio');
            if (d.netin == null && d.netout == null) R.delete('network');
            if (d.uptime == null) L.delete('uptime');
            if (guest) {
              // 客户机：磁盘/交换分区取自 status/current 的 disk+maxdisk、swap+maxswap
              if (!(d.disk != null && parseFloat(d.maxdisk) > 0)) R.delete('disk');
              if (!(parseFloat(d.maxswap) > 0)) R.delete('swap');
              ['arch', 'version', 'kernel', 'cores', 'ip'].forEach(k => L.delete(k));
              if (!d.name) L.delete('hostname');
              if (d.vmid == null) L.delete('model');
            } else {
              // 节点：swap/rootfs 取自 status，磁盘容量取自 storage 列表（见下方 volR）
              if (!(d.swap && parseFloat(d.swap.total) > 0)) R.delete('swap');
              if (!(d.rootfs && parseFloat(d.rootfs.total) > 0)) R.delete('rootfs');
              if (d.kversion == null) L.delete('kernel');
              if (!(d.cpuinfo && d.cpuinfo.cpus)) L.delete('cores');
              if (d.wait == null) R.delete('iowait');
              if (!(d.loadavg || []).length) R.delete('load');
            }
          }
          if (volR && Array.isArray(volR.data)) {
            pveVols = volR.data.filter(x => parseFloat(x.total) > 0 && x.used !== undefined).map(x => String(x.storage || '')).filter(Boolean);
            pveVols = [...new Set(pveVols)];
            pveVols.forEach(v => R.add('disk:' + v));
            if (!pveVols.length) R.delete('disk');
          }
        }
      } else {
        // Windows：与 _buildConfig 用同一个归一化函数，否则探测时请求的是网页、保存后取的才是接口，
        // 表现为「测试连接说不通，保存后重开配置却正常」。
        const u = normalizeWinUrl(s.url, s.winSource);
        if (u) {
          const snap = await this._req(u + (s.win_pwd ? (u.includes('?') ? '&' : '?') + 'pwd=' + encodeURIComponent(s.win_pwd) : ''));
          const items = Array.isArray(snap && snap.items) ? snap.items : [];
          if (items.length) {
            const _has = re => items.some(x => re.test(String(x.k || '')));
            const _hasDiskIo = items.some(x => x && (x.k === 'DISK.Read' || x.k === 'DISK.Write'));
            if (!_has(/TEMP/i)) R.delete('temp');
            if (!_has(/GPU/i)) R.delete('gpu');
            if (!_hasDiskIo && !(snap.disk_used != null || snap.disk_total != null)) R.delete('disk');
            if (!_hasDiskIo) R.delete('diskio');
            if (!items.some(x => x && x.k === 'CPU.Load')) R.delete('cpu');
            if (!items.some(x => x && x.k === 'MEM.Load')) R.delete('memory');
            if (!items.some(x => x && (x.k === 'NET.Up' || x.k === 'NET.Down'))) R.delete('network');
            if (!items.some(x => x && /^(DATA\.Day|NET\.(UpTotal|DownTotal|Tx|Rx))/i.test(String(x.k || '')))) R.delete('traffic');
            if (!items.some(x => x && x.k === 'DASH.Uptime')) L.delete('uptime');
            if (!items.some(x => x && x.k === 'DASH.HOST')) L.delete('hostname');
            if (!items.some(x => x && x.k === 'DASH.IP')) L.delete('ip');
          } else if (isLhmTree(snap)) {
            const _names = flattenLhmSensors(snap);
            R.clear();
            L.clear();
            L.add('platform');
            L.add('hostname');
            R.add('cpu');
            R.add('memory');
            if (_names.some(x => /Storage|HDD|SSD|Volume/i.test(x.path.join('/')))) R.add('disk');
            if (_names.some(x => /°C/.test(x.value))) R.add('temp');
            if (_names.some(x => /GPU/i.test(x.path.join('/')))) R.add('gpu');
          } else if (snap) {
            ['diskio', 'traffic', 'gpu'].forEach(k => R.delete(k));
            if (!(snap.cpu != null || snap.cpu_percent != null || snap.cpuPercent != null)) R.delete('cpu');
            if (!(snap.mem_total != null || snap.memory_total != null || (snap.mem && snap.mem.total))) R.delete('memory');
            if (!(snap.disk_total != null || (snap.disk && snap.disk.total))) R.delete('disk');
            if (!(snap.temperature != null || snap.temp != null)) R.delete('temp');
            if (snap.uptime == null) L.delete('uptime');
            if (!snap.ip) L.delete('ip');
          }
        }
      }
    } catch { /* 忽略：失败时保持上一次状态 */ }
    if (seq !== this._capsSeq) return;
    if (vols) this._volList = vols;
    if (pveVols) this._pveVolList = pveVols;
    this._caps = { left: [...L], right: [...R] };
    this._capsLoading = false;
    // 把探测到的卷补进右侧信息勾选（用户没手动选过时自动全选），否则卷列表刷新生效了却看不到对应项目
    this._syncVolItems();
    this.requestUpdate();
  }
  // 让右侧信息勾选里始终有每个已选卷对应的「磁盘(卷名)」项
  _syncVolItems() {
    const s = this._cur();
    if (!s || (s.type !== 'pve' && s.type !== 'dsm')) return;
    const _cur = selectedVolumes(s);
    const _has = Array.isArray(s.rightItems) && s.rightItems.length;
    const rk = new Set(_has ? s.rightItems : DEFAULT_RIGHT_ITEMS);
    let changed = false;
    _cur.forEach(v => { const k = 'disk:' + v; if (!rk.has(k)) { rk.add(k); changed = true; } });
    // 勾了具体卷就去掉通用「磁盘」，避免两个同名磁盘块
    if (_cur.length && rk.has('disk')) { rk.delete('disk'); changed = true; }
    // 全部卷都取消勾选时，把「磁盘」还原回去，用户至少还能看到一个磁盘块
    if (!_cur.length && !rk.has('disk') && (_has || changed)) { rk.add('disk'); changed = true; }
    if (changed) {
      s.rightItems = [...rk];
      this.rightItems = [...rk];
    }
  }
  _openDetail(idx) {
    this._editIdx = idx;
    this._view = 'detail';
    this._selOpen = false;
    const s = this._cur();
    if (!s) return;
    this._editColor = s.color || '#FF3B5F';
    const _liKeys = Array.isArray(s.leftItems) && s.leftItems.length ? s.leftItems : (Array.isArray(this.widgetInfo?.config?.leftItems) && this.widgetInfo.config.leftItems.length ? this.widgetInfo.config.leftItems : DEFAULT_LEFT_ITEMS);
    const _riKeys = Array.isArray(s.rightItems) && s.rightItems.length ? s.rightItems : (Array.isArray(this.widgetInfo?.config?.rightItems) && this.widgetInfo.config.rightItems.length ? this.widgetInfo.config.rightItems : DEFAULT_RIGHT_ITEMS);
    this.leftItems = [..._liKeys];
    this.rightItems = [..._riKeys];
    this._tokenInput = '';
    this._volList = [];
    this._pveVolList = [];
    this._caps = null;
    this._capsLoading = !!(s.host || s.url);
    this._volCustom = '';
    this._testMsg = '';
    this._testOk = null;
    this._loadMeta(s, idx);
    this.requestUpdate();
  }
  _addInst() {
    const list = this._tabInsts();
    if (list.length >= 7) return;
    const base = this._tab === 'pve' ? 'Proxmox VE' : this._tab === 'dsm' ? '群晖' : 'Windows';
    const color = ['#FF3B5F', '#FF9500', '#FFCC00', '#34C759', '#5AC8FA', '#5E5CE6', '#BF5AF2'][list.length % 7];
    // 新建实例时显式带上全部字段（含 win_pwd），避免字段缺失被当成「有值」或渲染出 undefined
    this.servers.push({ type: this._tab, name: base + ' · ' + (list.length + 1), color, host: '', node: '', qemuid: 0, lxcid: 0, diskVolume: '', diskVolumes: [], winSource: 'auto', url: '', win_pwd: '', account: '', password: '', platformUrl: '', leftItems: [...DEFAULT_LEFT_ITEMS], rightItems: [...DEFAULT_RIGHT_ITEMS] });
    this.requestUpdate();
  }
  _delInst(idx) {
    if (idx < 0 || idx >= this.servers.length) return;
    this.servers.splice(idx, 1);
    this._editIdx === idx && (this._view = 'list', this._editIdx = -1),
    this._editIdx > idx && this._editIdx--,
    this.requestUpdate();
  }
  _reorderServer(f, k) {
    if (f < 0 || f >= this.servers.length || k < 0 || k >= this.servers.length || f === k) return;
    const ns = [...this.servers];
    const [moved] = ns.splice(f, 1);
    const ti = ns.indexOf(this.servers[k]);
    ti > -1 ? ns.splice(ti, 0, moved) : ns.push(moved);
    this.servers = ns;
    this.requestUpdate();
  }
  _patchInst(key, value) {
    const s = this._cur();
    if (!s) return;
    s[key] = value;
    // 输入过程中防抖，避免每敲一个字符就打一轮接口
    ['host', 'node', 'account', 'password', 'url', 'win_pwd', 'qemuid', 'lxcid'].indexOf(key) > -1 && this._metaDebounce();
    this.requestUpdate();
  }
  _metaDebounce() {
    clearTimeout(this._metaT);
    this._metaT = setTimeout(() => {
      const s = this._cur();
      s && this._loadMeta(s, this._editIdx);
    }, 600);
  }
  async _closeConfig() {
    this._draftDiscard = true;
    try {
      const api = this.spCtx && this.spCtx.api || {};
      if (api.widget && api.widget.close) return api.widget.close();
      if (api.widget && api.widget.closeConfig) return api.widget.closeConfig();
      if (api.close) return api.close();
      if (api.widget && api.widget.exit) return api.widget.exit();
    } catch { /* 忽略：失败时保持上一次状态 */ }
    this._showPublic();
  }
  _setEditColor(c) {
    this._editColor = c;
    const s = this._cur();
    s && (s.color = c);
    this.requestUpdate();
  }
  _toggleSplitItem(side, k) {
    if (side === 'left') {
      const cur = [...this.leftItems];
      const has = cur.indexOf(k);
      if (has > -1) { cur.splice(has, 1); this.leftItems = cur; }
      else { cur.push(k); this.leftItems = cur; }
    } else {
      const cur = [...this.rightItems];
      const has = cur.indexOf(k);
      if (has > -1) { cur.splice(has, 1); this.rightItems = cur; }
      else { cur.push(k); this.rightItems = cur; }
    }
    const s = this._cur();
    s && (s.leftItems = [...this.leftItems], s.rightItems = [...this.rightItems]);
    this.requestUpdate();
  }
  // —— 磁盘卷（多选 + 自定义）——
  _volSel() { return selectedVolumes(this._cur()); }
  _volPool() {
    const s = this._cur();
    if (!s) return [];
    const list = (s.type === 'dsm' ? this._volList : this._pveVolList) || [];
    const out = [];
    list.forEach(v => { const k = String(v).replace(/^\/+/, ''); if (k && out.indexOf(k) < 0) out.push(k); });
    selectedVolumes(s).forEach(v => { if (out.indexOf(v) < 0) out.push(v); });
    return out;
  }
  _volLabel(v) { const s = this._cur(); return `磁盘(${s && s.type === 'dsm' ? '/' : ''}${v})`; }
  _volOptions() { return this._volPool().map(v => ({ key: 'disk:' + v, label: this._volLabel(v) })); }
  _volApply(sel, addKeys, delKeys) {
    const s = this._cur();
    if (!s) return;
    s.diskVolumes = [...sel];
    s.diskVolume = sel[0] || '';
    const _has = Array.isArray(s.rightItems) && s.rightItems.length;
    const rk = new Set(_has ? s.rightItems : DEFAULT_RIGHT_ITEMS);
    (addKeys || []).forEach(k => rk.add(k));
    (delKeys || []).forEach(k => rk.delete(k));
    // 勾了具体卷就用「磁盘(卷名)」，去掉通用「磁盘」，两者不重复显示
    if (sel.length) rk.delete('disk');
    s.rightItems = [...rk];
    this.rightItems = [...s.rightItems];
    this.requestUpdate();
  }
  _toggleVol(v) {
    const cur = this._volSel();
    const i = cur.indexOf(v);
    if (i > -1) { cur.splice(i, 1); this._volApply(cur, [], ['disk:' + v]); }
    else { cur.push(v); this._volApply(cur, ['disk:' + v], []); }
  }
  _addVolCustom() {
    const v = String(this._volCustom || '').trim().replace(/^\/+/, '');
    if (!v) return;
    const cur = this._volSel();
    if (cur.indexOf(v) < 0) cur.push(v);
    this._volCustom = '';
    this._volApply(cur, ['disk:' + v], []);
  }
  _volAll() { const pool = this._volPool(); this._volApply(pool, pool.map(v => 'disk:' + v), []); }
  _volClear() { const old = this._volSel(); this._volApply([], [], old.map(v => 'disk:' + v)); }
  _renderVolPicker(kind) {
    const s = this._cur();
    if (!s) return '';
    const pool = this._volPool();
    const sel = this._volSel();
    return html`
       <div class="form-group">
        <label>磁盘卷（可多选；不选则自动取第一个）</label>
        ${pool.length ? html`<div class="ss-vol-grid">${pool.map(v => html`<span class="ss-vol-chip ${sel.indexOf(v) > -1 ? 'on' : ''}" @click="${() => this._toggleVol(v)}">${this._volLabel(v)}</span>`)}</div>` : html`<div class="ss-empty-tip">未自动获取到卷列表，可在下方手动填写</div>`}
                <div class="ss-vol-row">
         <input type="text" class="styled-input" .value="${this._volCustom}" @input="${e => this._volCustom = e.target.value}" placeholder="${kind === 'dsm' ? '自定义卷，如 /volume3' : '自定义存储，如 local-lvm'}">
         <button type="button" class="ss-mini-btn" @click="${this._addVolCustom}">添加</button>
                  ${pool.length ? html`<button type="button" class="ss-mini-btn" @click="${this._volAll}">全选</button><button type="button" class="ss-mini-btn" @click="${this._volClear}">清空</button>` : ''}
                </div>
        <div class="ss-field-hint">每个勾选的卷会各自生成一个「磁盘」指标，并自动加入右侧信息，可分别开关与排序。</div>
       </div>`;
  }
  _tokenTmpl() { return { placeholder: '{{token}}', fields: ['headers'], dataNodeKey: 'widgetConfig.' + this.spCtx.widgetInfo.widgetId + '_token_' + this._editIdx }; }
  _testHosts(host) {
    const list = parseHostList(host);
    const alt = list.length ? loopbackHostOf(list[0]) : '';
    if (alt && list.indexOf(alt) < 0) list.push(alt);
    return list;
  }
  _renderTestRow() {
    return html`
       <div class="ss-test-row">
        <button type="button" class="ss-mini-btn" ?disabled="${this._testing}" @click="${this._testConn}">${this._testing ? '测试中…' : '测试连接'}</button>
        ${this._testMsg ? html`<span class="ss-test-msg ${this._testOk === true ? 'ok' : this._testOk === false ? 'bad' : ''}">${this._testMsg}</span>` : ''}
       </div>`;
  }
  async _testConn() {
    const s = this._cur();
    if (!s) return;
    this._testing = true;
    this._testOk = null;
    this._testMsg = '正在测试连接…';
    this._hostUsed = '';
    this.requestUpdate();
    const t0 = Date.now();
    // Windows 的地址先归一化成数据接口，否则用户填的是网页根地址时会测到 HTML 页面
    const _winUrl = s.type === 'win' ? normalizeWinUrl(s.url, s.winSource) : '';
    const first = (s.type === 'win' ? parseHostList(_winUrl)[0] : parseHostList(s.host || s.url || '')[0]) || '';
    let ok = false, msg = '';
    try {
      if (s.type === 'pve') {
        if (!first || !s.node) msg = '请先填写「接口」与「节点」';
        else {
          const path = s.qemuid ? 'qemu/' + s.qemuid : s.lxcid ? 'lxc/' + s.lxcid : '';
          // 刚输入的密钥还没落盘（数据节点要等保存后才写入），此时直接用它做字面量请求，
          // 否则 {{token}} 占位符取不到值，会在保存前一直测不通。
          const _typed = String(this._tokenInput || '').trim();
          const _hdr = _typed ? { Authorization: 'PVEAPIToken ' + _typed } : { Authorization: 'PVEAPIToken {{token}}' };
          const _tmpl = _typed ? null : [this._tokenTmpl()];
          const raw = await this._req(`${first}/api2/json/nodes/${s.node}/${path ? path + '/status/current' : 'status'}`, _hdr, _tmpl);
          const d = raw && raw.data ? raw.data : null;
          if (d) {
            ok = true;
            const _n = path ? `${s.qemuid ? '虚拟机' : '容器'} ${d.name || ''} (${d.vmid || s.qemuid || s.lxcid})` : (d.pveversion ? 'PVE ' + String(d.pveversion).replace(/^pve-manager\//, '').split('/')[0] : '节点');
            msg = `连接成功 · ${_n}${_typed ? ' · 使用本次输入的密钥' : ''}`;
            // 再校验一次令牌权限，给出更明确的提示
            const perm = await this._req(`${this._hostUsed || first}/api2/json/access/permissions`, _hdr, _tmpl);
            msg += perm && perm.data ? ' · 令牌有效' : ' · 接口可访问但令牌权限不足（建议授予 PVEAuditor）';
          } else msg = _typed ? '连接失败：未获取到数据，请检查接口地址 / 端口 / 密钥内容' : '连接失败：未获取到数据。若尚未保存过密钥，请先填写上方「密钥」再测试（或点「应用」保存后重试）';
        }
      } else if (s.type === 'dsm') {
        if (!first || !s.account || !s.password) msg = '请先填写「接口」「账号」「密码」';
        else {
          const a = await this._req(`${first}/webapi/auth.cgi?api=SYNO.API.Auth&version=6&method=login&account=${encodeURIComponent(s.account)}&passwd=${encodeURIComponent(s.password)}&session=FileStation&format=sid`);
          if (a && a.success === true && a.data && a.data.sid) {
            ok = true;
            const info = await this._req(`${this._hostUsed || first}/webapi/entry.cgi?api=SYNO.DSM.Info&version=2&method=getinfo&_sid=${a.data.sid}`);
            const ver = info && info.success && info.data ? String(info.data.version_string || '').split('-')[0] : '';
            msg = '连接成功 · 群晖' + (ver ? ' ' + ver : '');
          } else msg = '连接失败：登录未成功，请检查接口地址 / 账号 / 密码或账号权限';
        }
      } else {
        if (!first) msg = '请先填写「接口」';
        else {
          const _u = normalizeWinUrl(first, s.winSource);
          const e = await this._req(_u + (s.win_pwd ? (_u.includes('?') ? '&' : '?') + 'pwd=' + encodeURIComponent(s.win_pwd) : ''));
          if (e) {
            ok = true;
            const n = Array.isArray(e.items) ? e.items.length : 0;
            msg = `连接成功 · ${n ? 'LiteMonitor（' + n + ' 项指标）' : '通用 JSON 接口'}`;
          } else msg = '连接失败：未获取到数据，请检查接口地址 / 端口 / 密码';
        }
      }
    } catch (e) { ok = false; msg = '连接失败：' + ((e && e.message) || e); }
    if (ok && this._hostUsed && first && this._hostUsed !== first) msg += `（自动改用 ${this._hostUsed}）`;
    this._testing = false;
    this._testOk = ok;
    this._testMsg = msg + ' · ' + (Date.now() - t0) + 'ms';
    // 连接成功后重新探测一次：刷新磁盘卷列表与左右侧可选项目（按接口实际能力过滤）
    if (ok && s) {
      try {
        this._caps = null;
        this._capsLoading = true;
        this.requestUpdate();
        await this._loadMeta(s, this._editIdx);
        msg = this._testMsg.replace(/ · \d+ms$/, '');
        this._testMsg = msg + ' · 已刷新卷与可选项';
      } catch { /* 忽略：刷新失败不影响测试结论 */ }
    }
    this.requestUpdate();
  }
  // —— 分区折叠 ——
  _isCollapsed(k) { return !!(this._collapsed && this._collapsed[k]); }
  _toggleSec(k) {
    const c = Object.assign({}, this._collapsed || {});
    c[k] = !c[k];
    this._collapsed = c;
    this.requestUpdate();
  }
  _sec(key, title, body) {
    const open = !this._isCollapsed(key);
    return html`
          <div class="ss-section-title ${open ? '' : 'collapsed'}" @click="${() => this._toggleSec(key)}">
      <span>${title}</span><span class="ss-sec-arrow">▾</span>
     </div>
     ${open ? body : ''}`;
  }
  _renderSortableList(t, e) {
    const sel = (e === 'left' ? this.leftItems : this.rightItems) || [];
    // 自动隐藏当前接口拿不到的项目（探测完成前不过滤，探测失败回退到类型兜底表）
    const cap = this._caps && this._caps[e];
    const t2 = cap && cap.length ? t.filter(n => cap.indexOf(n.key) >= 0) : t;
    const s = sel,
      order = s.filter(k => t2.some(n => n.key === k)),
      rest = t2.filter(n => !order.includes(n.key)).map(n => n.key),
      items = order.concat(rest);
    return html`<div class="ss-chip-grid">${items.map(k => {
      const opt = t2.find(n => n.key === k);
      const on = order.includes(k);
      return html`<div class="ss-chip ${on ? 'selected' : ''}" data-k="${k}" @mousedown="${r => this._pgDragStart(r, e)}" @touchstart="${r => this._pgDragStart(r, e)}" @click="${() => { if (this._dragFrom) return; this._toggleSplitItem(e, k); }}"><span class="drag-handle">⋮⋮</span><span class="lbl">${opt.label}</span></div>`;
    })}</div>`;
  }
  // 指针拖拽排序：鼠标可在整条目上按下，触摸需按拖拽手柄；
  // 移动超过阈值才真正开始拖拽（普通点击不受影响），落点用蓝线提示，松手即完成
  _pgDragStart(e, scope) {
    if (e.button !== undefined && e.button !== 0) return;
    const isTouch = !!(e.touches && e.touches.length);
    const sel = scope === 'order' ? '.ss-order-item' : '.ss-chip';
    const el = e.target.closest(sel);
    if (!el) return;
    if (isTouch && !e.target.closest('.drag-handle')) return;
    if (e.target.closest('.ss-i-del')) return;
    const y = e.clientY != null ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    const d = { scope, el, box: el.parentElement, startY: y, moved: false };
    d.mv = ev => this._pgDragMove(ev);
    d.up = () => this._pgDragEnd();
    document.addEventListener('mousemove', d.mv);
    document.addEventListener('mouseup', d.up);
    document.addEventListener('touchmove', d.mv, { passive: false });
    document.addEventListener('touchend', d.up);
    document.addEventListener('touchcancel', d.up);
    this._drag = d;
  }
  _pgDragBegin(d) {
    const el = d.el
      , rc = el.getBoundingClientRect()
      , boxRc = d.box.getBoundingClientRect()
      , ph = document.createElement('div');
    ph.className = 'ss-drag-ph';
    ph.style.height = rc.height + 'px';
    if (d.scope === 'order') ph.style.marginBottom = '8px';
    d.box.insertBefore(ph, el);
    el.classList.add('dragging');
    el.style.position = 'fixed';
    el.style.left = rc.left + 'px';
    el.style.top = rc.top + 'px';
    el.style.width = rc.width + 'px';
    el.style.zIndex = '999';
    el.style.margin = '0';
    el.style.pointerEvents = 'none';
    const items = [...d.box.querySelectorAll(d.scope === 'order' ? '.ss-order-item' : '.ss-chip')].filter(o => o !== el)
      , line = document.createElement('div');
    line.className = 'ss-drag-line';
    line.style.left = '0';
    line.style.right = '0';
    d.box.appendChild(line);
    d.ph = ph;
    d.line = line;
    d.items = items;
    d.h = rc.height;
    d.startTop = rc.top;
    d.boxTop = boxRc.top;
    d.itemTops = items.map(o => o.getBoundingClientRect().top);
    d.target = items.length;
    d.moved = true;
  }
  _pgDragMove(e) {
    const d = this._drag;
    if (!d) return;
    const y = e.clientY != null ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    if (!d.moved) {
      if (Math.abs(y - d.startY) < 4) return;
      this._pgDragBegin(d);
    }
    if (e.cancelable) e.preventDefault();
    d.el.style.top = (d.startTop + (y - d.startY)) + 'px';
    const mid = d.startTop + (y - d.startY) + d.h / 2;
    let t = d.items.length;
    for (let i = 0; i < d.items.length; i++) {
      if (d.itemTops[i] + d.h / 2 > mid) { t = i; break; }
    }
    d.target = t;
    if (d.line) {
      const yTop = t < d.items.length ? d.itemTops[t] : (d.itemTops.length ? d.itemTops[d.itemTops.length - 1] + d.h : d.startTop);
      d.line.style.top = (yTop - d.boxTop) + 'px';
    }
  }
  _pgDragEnd() {
    const d = this._drag;
    if (!d) return;
    document.removeEventListener('mousemove', d.mv);
    document.removeEventListener('mouseup', d.up);
    document.removeEventListener('touchmove', d.mv);
    document.removeEventListener('touchend', d.up);
    document.removeEventListener('touchcancel', d.up);
    this._drag = null;
    if (!d.moved) return;
    if (d.line && d.line.parentNode) d.line.parentNode.removeChild(d.line);
    const t = Math.max(0, Math.min(d.items.length, d.target == null ? d.items.length : d.target));
    if (t < d.items.length) d.box.insertBefore(d.el, d.items[t]); else d.box.appendChild(d.el);
    if (d.ph && d.ph.parentNode) d.ph.parentNode.removeChild(d.ph);
    d.el.classList.remove('dragging');
    d.el.style.position = '';
    d.el.style.left = '';
    d.el.style.top = '';
    d.el.style.width = '';
    d.el.style.zIndex = '';
    d.el.style.margin = '';
    d.el.style.pointerEvents = '';
    if (d.scope === 'order') {
      const keys = [...d.box.querySelectorAll('.ss-order-item')].map(x => x.dataset.idx);
      const sorted = keys.map(x => this.servers[parseInt(x)]).filter(Boolean);
      this.servers = sorted;
    } else {
      const keys = [...d.box.querySelectorAll('.ss-chip')].map(x => x.dataset.k).filter(Boolean);
      if (d.scope === 'left') this.leftItems = keys; else this.rightItems = keys;
      const s = this._cur();
      s && (s.leftItems = [...this.leftItems], s.rightItems = [...this.rightItems]);
    }
    this._dragFrom = true;
    setTimeout(() => this._dragFrom = false, 80);
    this.requestUpdate();
  }
  _buildConfig() {
    const servers = this.servers.map(s => {
      const o = { type: s.type, name: s.name, color: s.color, leftItems: s.leftItems || [], rightItems: s.rightItems || [] };
      if (s.type === 'pve') { o.host = (s.host || '').replace(/\/+$/, ''); o.node = s.node; o.qemuid = s.qemuid; o.lxcid = s.lxcid; o.diskVolumes = selectedVolumes(s); o.diskVolume = o.diskVolumes[0] || ''; o.url = s.url; }
      else if (s.type === 'dsm') { o.host = (s.host || '').replace(/\/+$/, ''); o.account = s.account; o.password = s.password; o.diskVolumes = selectedVolumes(s); o.diskVolume = o.diskVolumes[0] || ''; o.url = s.url; }
      else { const _w = normalizeWinUrl(s.url, s.winSource); o.url = _w; o.win_pwd = typeof s.win_pwd === 'string' ? s.win_pwd : ''; o.platformUrl = s.platformUrl; o.winSource = s.winSource || 'auto'; }
      return o;
    });
    return {
      ...this.widgetInfo.config,
      servers,
      interval: Math.min(Math.max(parseInt(this.interval ?? INTERVAL_DEFAULT), INTERVAL_MIN), INTERVAL_MAX),
      cardtheme: this.cardtheme,
      theme: this.theme,
      bgOpacity: Math.min(100, Math.max(0, parseInt(this.bgOpacity ?? 100))),
      switchMode: isSwitchMode(this.switchMode) ? this.switchMode : 'fade',
      autoSwitch: !!this.autoSwitch,
      compactMode: !!this.compactMode,
      pollCurrentOnly: !!this.pollCurrentOnly,
      diskWarn: Math.min(100, Math.max(0, parseInt(this.diskWarn) || 0)),
      leftItems: this.widgetInfo?.config?.leftItems || [],
      rightItems: this.widgetInfo?.config?.rightItems || [],
    };
  }
  _commitDraft() {
    this._draftConfig = this._buildConfig();
    if (this._tokenInput && this._cur() && this._cur().type === 'pve') {
      this._draftTokenMap[this._editIdx] = this._tokenInput;
    }
    this._draftDirty = true;
    this._draftDiscard = false;
  }
  async _persistDraft() {
    if (!this._draftDirty || !this._draftConfig) return false;
    try {
      const t = await this.spCtx.api.widget.save({
        ...this.widgetInfo,
        config: this._draftConfig,
      });
      // 保存返回值不一定带 id（新建/更新时机不同）；回退到当前 widgetId，
      // 否则密钥会被静默丢弃，之后小部件取数时 {{token}} 解析为空 → 一直获取失败。
      const savedId = (t && t.id) || (this.widgetInfo && this.widgetInfo.widgetId) || '';
      if (savedId) {
        for (const [idx, val] of Object.entries(this._draftTokenMap)) {
          if (val) await this.spCtx.api.dataNode.user.setByKey('widgetConfig', savedId + '_token_' + idx, val);
        }
        // 后续测试连接/再保存都按这个 id 读取密钥
        if (t && t.id && this.widgetInfo) this.widgetInfo.widgetId = t.id;
        this._draftTokenMap = {};
      }
      this._draftDirty = false;
      return true;
    } catch {
      return false;
    }
  }
  async handleSaveOrCreateWidget() {
    // 配置还没初始化完（宿主还没把 spCtx.widgetInfo 送进来）时，点应用无意义
    if (!this._cfgReady) return;
    const _v = this._view;
    this._commitDraft();
    // 按用户要求：只有停在「公共设置」视图时，「应用」才真正调用 widget.save() 落盘；
    // 在「实例详情 / 实例列表」点「应用」只把当前改动写进草稿区（_draftConfig），
    // 并切回上一级，等回到公共设置再点一次才真正保存。
    if (_v === 'detail') { this._goList(); return; }
    if (_v === 'list') { this._showPublic(); return; }
    // public 点「应用」：真正落盘后关闭配置窗口
    const _saved = await this._persistDraft();
    this._closeConfig();
    return _saved;
  }
  disconnectedCallback() {
    // 手动关窗（非"取消"）：若缓存区有待落盘变更，则触发一次实际保存
    if (this._cfgReady && !this._draftDiscard && this._draftDirty) {
      this._persistDraft().catch(() => {});
    }
    super.disconnectedCallback();
  }
  render() {
    const insts = this._tabInsts();
    const _total = (this.servers || []).length;
    const _disabled = _total <= 1;
    const _tabName = this._tab === 'pve' ? 'ProxmoxVE' : this._tab === 'dsm' ? '群晖' : 'Windows';
    return html`
      <div class="container">
    <div class="ss-page-header">
          ${this._view === 'detail' ? html`<button type="button" class="ss-glass-btn" @click="${() => this._goList()}"><span class="ss-back-arrow">←</span>返回</button>` : this._view === 'list' ? html`<button type="button" class="ss-glass-btn" @click="${() => this._showPublic()}"><span class="ss-back-arrow">←</span>返回</button>` : html`<button type="button" class="ss-glass-btn" @click="${() => this._closeConfig()}">取消</button>`}
          <h1>设置</h1>
     <button type="button" class="ss-glass-btn primary" @click="${this.handleSaveOrCreateWidget}">应用</button>
        </div>
        <div class="ss-module-selector">
          <div class="ss-module-card ${this._view === 'list' && this._tab === 'pve' ? 'on' : ''}" @click="${() => this._setTab('pve')}">
            <svg class="ic" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/></svg>
      <span class="nm">ProxmoxVE</span><span class="st">PVE 节点监控</span>
          </div>
          <div class="ss-module-card ${this._view === 'list' && this._tab === 'dsm' ? 'on' : ''}" @click="${() => this._setTab('dsm')}">
            <svg class="ic" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3" fill="#fff" stroke="none"/></svg>
      <span class="nm">群晖</span><span class="st">DSM 监控</span>
          </div>
          <div class="ss-module-card ${this._view === 'list' && this._tab === 'win' ? 'on' : ''}" @click="${() => this._setTab('win')}">
            <svg class="ic" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M4 5.5l6.2-.9v6H4zM12 4.3l8-1.1v7.3h-8zM4 12.9h6.2v6L4 18zM12 12.9h8v7.1l-8-1.1z"/></svg>
      <span class="nm">Windows</span><span class="st">LiteMonitor\LibreHardwareMonitor</span>
          </div>
        </div>
        <div class="ss-view">
          ${this._view === 'public' ? html`
          ${this._sec('basic', '基础设置', html`
          <div class="ss-row">
      <div class="ss-row-left"><span class="ss-row-label">自动切换</span><span class="ss-row-desc">启用后自动切换各实例</span></div>
            <div class="ss-theme-toggle">
              <button type="button" class="ss-theme-opt ${this.autoSwitch ? 'active' : ''}" @click="${() => { this.autoSwitch = true; this.requestUpdate(); }}">开启</button>
              <button type="button" class="ss-theme-opt ${!this.autoSwitch ? 'active' : ''}" @click="${() => { this.autoSwitch = false; this.requestUpdate(); }}">关闭</button>
            </div>
          </div>
          <div class="ss-row">
            <div class="ss-row-left"><span class="ss-row-label">切换周期</span><span class="ss-row-desc">多实例自动切换的时间间隔</span></div>
      <div class="ss-cycle-wrap">
              <input type="number" name="interval" class="ss-cycle-input" .value="${this.interval}" @input="${t => this.interval = t.target.value}" min="${INTERVAL_MIN}" max="${INTERVAL_MAX}" ?disabled="${_disabled}">
              <span class="ss-cycle-unit">秒</span>
            </div>
          </div>
          <div class="ss-row">
            <div class="ss-row-left"><span class="ss-row-label">紧凑模式</span><span class="ss-row-desc">开启后右侧指标超过 3 条即压缩显示（条数多时自动继续收紧行高）；关闭则每屏显示 3 条并轮询滑动</span></div>
            <div class="ss-theme-toggle">
       <button type="button" class="ss-theme-opt ${this.compactMode ? 'active' : ''}" @click="${() => { this.compactMode = true; this.requestUpdate(); }}">开启</button>
              <button type="button" class="ss-theme-opt ${!this.compactMode ? 'active' : ''}" @click="${() => { this.compactMode = false; this.requestUpdate(); }}">关闭</button>
            </div>
          </div>
          <div class="ss-row">
            <div class="ss-row-left"><span class="ss-row-label">轮询范围</span><span class="ss-row-desc">仅当前实例：只刷新正在显示的实例，切换过去时再取数（实例多时更省资源）</span></div>
            <div class="ss-theme-toggle">
       <button type="button" class="ss-theme-opt ${this.pollCurrentOnly ? 'active' : ''}" @click="${() => { this.pollCurrentOnly = true; this.requestUpdate(); }}">仅当前</button>
              <button type="button" class="ss-theme-opt ${!this.pollCurrentOnly ? 'active' : ''}" @click="${() => { this.pollCurrentOnly = false; this.requestUpdate(); }}">全部</button>
            </div>
          </div>
          <div class="ss-row">
            <div class="ss-row-left"><span class="ss-row-label">磁盘告警阈值</span><span class="ss-row-desc">磁盘使用率达到该百分比时高亮告警，0 表示关闭</span></div>
            <div class="ss-cycle-wrap">
              <input type="number" name="diskWarn" class="ss-cycle-input" .value="${this.diskWarn}" @input="${t => this.diskWarn = t.target.value}" min="0" max="100">
              <span class="ss-cycle-unit">%</span>
            </div>
          </div>
          <div class="ss-row">
            <div class="ss-row-left"><span class="ss-row-label">切换方式</span><span class="ss-row-desc">实例切换的动画效果（淡入淡出 / 翻页 / 缩放 / 翻牌 / 模糊 / 上下滑动）</span></div>
      <div class="ss-selector">
              <button type="button" class="ss-sel-trigger ${this._selOpen ? 'open' : ''}" @click="${() => { this._selOpen = !this._selOpen; this.requestUpdate(); }}">
                <span>${switchModeLabel(this.switchMode)}</span><span class="chevron">▾</span>
       </button>
       <div class="ss-sel-dropdown ${this._selOpen ? 'open' : ''}">
                ${SWITCH_MODES.map(m => html`<div class="ss-sel-option ${this.switchMode === m.key ? 'selected' : ''}" @click="${() => { this.switchMode = m.key; this._selOpen = false; this.requestUpdate(); }}">${m.label}</div>`)}
              </div>
            </div>
     </div>
`)}
     ${this._sec('look', '外观', html`
     <div class="ss-row">
            <span class="ss-row-label">主题</span>
            <div class="ss-theme-toggle">
              <button type="button" class="ss-theme-opt ${this.theme === 'dark' ? '' : 'active'}" @click="${() => { this.theme = 'light'; this.requestUpdate(); }}">浅色</button>
              <button type="button" class="ss-theme-opt ${this.theme === 'dark' ? 'active' : ''}" @click="${() => { this.theme = 'dark'; this.requestUpdate(); }}">深色</button>
            </div>
          </div>
          <div class="ss-row">
            <span class="ss-row-label">亮度</span>
      <div class="ss-brightness">
              <span class="ss-bri-icon">🌙</span>
              <input type="range" class="ss-brightness-slider" min="0" max="100" step="1" .value="${this.bgOpacity}" @input="${t => { this.bgOpacity = t.target.value; this.requestUpdate(); }}">
       <span class="ss-opacity-val">${this.bgOpacity}%</span>
              <span class="ss-bri-icon">☀️</span>
      </div>
     </div>
`)}
     ${this._sec('order', '实例顺序', html`
     <div class="ss-inst-list">
      ${this.servers.length ? this.servers.map((s, i) => html`<div class="ss-order-item" data-idx="${i}" @mousedown="${r => this._pgDragStart(r, 'order')}" @touchstart="${r => this._pgDragStart(r, 'order')}" @click="${() => { if (this._dragFrom) return; this._openDetail(i); }}"><div class="left"><span class="drag-handle">⋮⋮</span><span class="status-dot" style="background:${s.color || '#FF3B5F'}"></span><span class="name">${s.name}</span></div></div>`) : html`<div class="ss-empty-tip">暂无实例</div>`}
          </div>
     `)}
          ` : this._view === 'list' ? html`
          <div class="ss-inst-list">
      ${insts.length ? insts.map(s => {
    const g = this.servers.indexOf(s);
    return html`<div class="ss-inst-item" @click="${() => this._openDetail(g)}"><div class="ss-i-left"><span class="ss-i-dot" style="background:${s.color || '#FF3B5F'}"></span><span>${s.name}</span></div><span class="ss-i-del" @click="${ev => { ev.stopPropagation(); this._delInst(g); }}">−</span></div>`;
  }) : html`<div class="ss-empty-tip">暂无 ${_tabName} 实例，点击下方添加</div>`}
          </div>
          <button type="button" class="ss-inst-add" @click="${() => this._addInst()}"><span>+</span> 添加 ${_tabName} 实例（最多 7 个）</button>
     ` : html`
     ${(() => {
    const s = this._cur();
    if (!s) return html`<div class="ss-empty-tip">实例不存在</div>`;
    const _colorName = { '#FF3B5F': '红', '#FF9500': '橙', '#FFCC00': '黄', '#34C759': '绿', '#5AC8FA': '蓝', '#5E5CE6': '靛', '#BF5AF2': '紫' }[s.color || '#FF3B5F'] || (s.color ? '自定义' : '');
    return html`
       ${s.type === 'pve' ? html`
              ${this._sec('iface', '接口配置', html`
              <div class="form-group">
                <label for="pve_host">接口</label>
                <input type="text" name="pve_host" .value="${s.host}" @input="${t => this._patchInst('host', t.target.value)}" placeholder="http://&lt;IP&gt;:&lt;Port&gt;" class="styled-input">
              </div>
              <div class="ss-field-hint">同机部署（如 Sun-Panel 装在本机 Docker / 套件里）请填 127.0.0.1；也可填多个地址（逗号分隔），会按顺序尝试并自动回退到 127.0.0.1 同端口。</div>
              <div class="form-group">
                <label for="pve_token">密钥（留空则不修改）</label>
                <input type="text" name="pve_token" .value="${this._tokenInput}" @input="${t => this._tokenInput = t.target.value}" placeholder="root@pam!sunpanel=xxxx/申请API令牌后，需在权限-API令牌权限设置“/”、“用户”、“PVEAuditor”" class="styled-input">
              </div>
              <div class="form-group">
                <label for="pve_node">节点</label>
                <input type="text" name="pve_node" .value="${s.node}" @input="${t => this._patchInst('node', t.target.value)}" placeholder="节点" class="styled-input">
              </div>
       ${this._renderVolPicker('pve')}
              ${this._renderTestRow()}
              <div class="form-group">
                <label for="pve_qemuid">虚拟机 ID（留空则监控节点）</label>
                <input type="number" name="pve_qemuid" .value="${s.qemuid}" @input="${t => this._patchInst('qemuid', t.target.value)}" placeholder="100 - 999999999" class="styled-input">
              </div>
              <div class="form-group">
        <label for="pve_lxcid">LXC ID（留空则监控节点）</label>
        <input type="number" name="pve_lxcid" .value="${s.lxcid}" @input="${t => this._patchInst('lxcid', t.target.value)}" placeholder="100 - 999999999" class="styled-input">
       </div>
`)}
       ` : s.type === 'dsm' ? html`
              ${this._sec('iface', '接口配置', html`
              <div class="form-group">
                <label for="dsm_host">接口</label>
                <input type="text" name="dsm_host" .value="${s.host}" @input="${t => this._patchInst('host', t.target.value)}" placeholder="http://&lt;IP&gt;:&lt;Port&gt;" class="styled-input">
              </div>
       <div class="ss-field-hint">同机部署（如 Sun-Panel 装在本机 Docker / 套件里）请填 127.0.0.1；也可填多个地址（逗号分隔），会按顺序尝试并自动回退到 127.0.0.1 同端口。</div>
              <div class="form-group">
                <label for="dsm_account">账号</label>
                <input type="text" name="dsm_account" .value="${s.account}" @input="${t => this._patchInst('account', t.target.value)}" placeholder="管理员账号" class="styled-input">
              </div>
              <div class="form-group">
        <label for="dsm_password">密码</label>
                <input type="password" name="dsm_password" .value="${s.password}" @input="${t => this._patchInst('password', t.target.value)}" placeholder="登录密码" class="styled-input">
              </div>
              ${this._renderVolPicker('dsm')}
       ${this._renderTestRow()}
       `)}
              ` : html`
              ${this._sec('iface', '接口配置', html`
              <div class="form-group">
                <label for="win_url">接口</label>
                <input type="text" name="win_url" .value="${s.url}" @input="${t => this._patchInst('url', t.target.value)}" placeholder="Windows需安装LiteMonitor\LibreHardwareMonitor并打开网页端，链接格式&quot;http://&lt;IP&gt;:&lt;Port&gt;&quot;" class="styled-input">
              </div>
              <div class="form-group">
                <label for="win_pwd">接口密码</label>
                <input type="password" name="win_pwd" .value="${s.win_pwd}" @input="${t => this._patchInst('win_pwd', t.target.value)}" placeholder="可选，LiteMonitor 设置了密码时填写" class="styled-input">
       </div>
       <div class="form-group">
        <label>数据源</label>
                <select class="styled-input" @change="${t => this._patchInst('winSource', t.target.value)}">
                  ${[['auto', '自动识别（推荐）'], ['litemonitor', 'LiteMonitor（/api/snapshot）'], ['lhm', 'LibreHardwareMonitor（/data.json）'], ['json', '通用 JSON']].map(o => html`<option value="${o[0]}" .selected="${(s.winSource || 'auto') === o[0]}">${o[1]}</option>`)}
                </select>
       </div>
       ${this._renderTestRow()}
       `)}
       `}
       ${this._sec('jump', '标题跳转', html`
       <div class="form-group">
                <label for="jump_url">跳转地址</label>
                <input type="text" name="jump_url" .value="${s.type === 'win' ? s.platformUrl : s.url}" @input="${t => s.type === 'win' ? this._patchInst('platformUrl', t.target.value) : this._patchInst('url', t.target.value)}" placeholder="留空则不跳转" class="styled-input">
       </div>
`)}
       ${this._sec('info', '显示信息管理', html`
       <div class="ss-sub-title">标题颜色</div>
              <div class="ss-color-dots">
        ${['#FF3B5F', '#FF9500', '#FFCC00', '#34C759', '#5AC8FA', '#5E5CE6', '#BF5AF2', '#1C1C1E'].map(c => html`<span class="ss-cd ${this._editColor === c ? 'on' : ''}" style="background:${c}" @click="${() => this._setEditColor(c)}"></span>`)}
                <label class="ss-cd ss-cd-picker ${['#FF3B5F', '#FF9500', '#FFCC00', '#34C759', '#5AC8FA', '#5E5CE6', '#BF5AF2', '#1C1C1E'].includes(this._editColor) ? '' : 'on'}" title="自定义颜色">
                  <input type="color" .value="${this._editColor}" @input="${t => this._setEditColor(t.target.value)}">
                </label>
              </div>
              <div class="ss-split-row">
        <div class="ss-split-col">
         <div class="ss-sub-title">左侧信息</div>
                  ${this._renderSortableList(LEFT_ITEM_OPTIONS, 'left')}
                </div>
        <div class="ss-split-col">
         <div class="ss-sub-title">右侧信息</div>
                  ${this._renderSortableList(RIGHT_ITEM_OPTIONS.concat(this._volOptions()), 'right')}
        </div>
       </div>
       <div class="ss-sort-hint">点击条目切换显示 / 隐藏，直接拖拽调整顺序${this._capsLoading ? '；正在检测当前接口可提供的项目…' : (this._caps ? '；已按当前接口能力过滤可选项' : '')}</div>
       `)}
       `;
  })()}
     `}
    </div>
   </div>
  `;
  }
}
