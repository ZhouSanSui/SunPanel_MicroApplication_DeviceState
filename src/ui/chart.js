/**
 * 通用折线图绘制（canvas）。
 */
export function drawLineChart(n, t) {
  if (!n || !t)
  {return;}
  const e = window.devicePixelRatio || 1
    , i = n.parentElement.clientWidth
    , s = n.parentElement.clientHeight;
  if (i === 0 || s === 0)
  {return;}
  n.width = i * e,
  n.height = s * e,
  n.style.width = '100%',
  n.style.height = '100%';
  const a = n.getContext('2d');
  a.scale(e, e),
  a.clearRect(0, 0, i, s);
  const r = t.data
    , o = t.minVal
    , c = t.maxVal
    , d = t.unit;
  if (r.length < 2) {
    a.fillStyle = '#94a3b8',
    a.font = '14px Inter, sans-serif',
    a.textAlign = 'center',
    a.textBaseline = 'middle',
    a.fillText('暂无数据', i / 2, s / 2);
    return;
  }
  const h = {
      top: 6,
      bottom: 10,
      left: 20,
      right: 2,
    }
    , l = i - h.left - h.right
    , p = s - h.top - h.bottom
    , u = y => h.left + y / (r.length - 1) * l
    , f = y => h.top + p - (y - o) / (c - o) * p;
  a.save(),
  a.strokeStyle = '#bbb',
  a.lineWidth = .8,
  a.setLineDash([3, 5]);
  for (let y = 0; y <= 4; y++) {
    const g = h.top + p - y / 4 * p;
    a.beginPath(),
    a.moveTo(h.left, g),
    a.lineTo(i - h.right, g),
    a.stroke(),
    a.fillStyle = '#bbb',
    a.font = '10px Inter, sans-serif',
    a.textAlign = 'right',
    a.textBaseline = 'middle',
    a.fillText(o + Math.round(y * (c - o) / 4) + d, h.left - 4, g);
  }
  a.setLineDash([]),
  a.save(),
  a.beginPath();
  const _ = u(0)
    , b = f(r[0].value);
  a.moveTo(_, b);
  for (let y = 0; y < r.length; y++) {
    const g = u(y)
      , z = f(r[y].value);
    a.lineTo(g, z);
  }
  const x = u(r.length - 1);
  a.lineTo(x, h.top + p),
  a.lineTo(_, h.top + p),
  a.closePath(),
  a.fillStyle = t.fill,
  a.fill(),
  a.restore(),
  a.beginPath(),
  a.strokeStyle = t.color,
  a.lineWidth = 2,
  a.lineJoin = 'round',
  a.lineCap = 'round';
  for (let y = 0; y < r.length; y++) {
    const g = u(y)
      , z = f(r[y].value);
    y === 0 ? a.moveTo(g, z) : a.lineTo(g, z);
  }
  a.stroke();
}
