/* ============================================================
 * 世界观地图 —— 纯 Canvas 实现
 *
 * 为什么不用 Leaflet/瓦片：
 *   你的底图是"自己画的一张平面图"，不是真实地球经纬度。
 *   此时 Leaflet 的 CRS.Simple 会把 y 轴反转（latLng = (x, -y)），
 *   新手极易踩坑。直接用 canvas，坐标系完全自己掌控：
 *     - x 向右、y 向下，原点左上角 —— 和 PS / GIMP / 图片像素完全一致
 *     - 标注坐标用 [px, py] 像素，或在 data.js 里用百分比 [0~1, 0~1]
 *
 * 坐标系约定（写在 data.js 里）：
 *   每个要素的坐标用 [x, y]，含义由 CONFIG.coordMode 决定：
 *     - 'pixel'：直接是像素（0 ~ WORLD_W, 0 ~ WORLD_H）
 *     - 'ratio' ：是百分比（0~1, 0~1），运行时自动乘宽高 → 换底图尺寸也不用重标
 *   y 轴：0 = 顶部，向下递增（= 图片坐标系 = PS 里的标尺）
 * ============================================================ */

const CONFIG = {
  basemap: './basemap/WorldMap.png',  // 你画的世界底图
  worldW: 2048,                        // 底图宽（像素）
  worldH: 1024,                        // 底图高（像素），2:1 是球形世界展开的标准比
  coordMode: 'ratio',                  // 'ratio' 推荐，换图自适应；改 'pixel' 就用绝对像素
  bgColor: '#0c1820',                  // 海洋 / 画布底色（底图透明处透出此色）
};

const canvas = document.getElementById('map');
const ctx = canvas.getContext('2d');

let scale = 1;        // 当前缩放（1 = 看到整张世界）
let offsetX = 0;      // 平移（屏幕像素）
let offsetY = 0;
let basemapImg = null;

/* ---------- 坐标换算：data.js 里的比例 → 实际像素 ---------- */
function toPx(coord) {
  const [x, y] = coord;
  if (CONFIG.coordMode === 'ratio') {
    return [x * CONFIG.worldW, y * CONFIG.worldH];
  }
  return [x, y];
}

/* ---------- 屏幕 ↔ 世界坐标（用于命中检测） ---------- */
function screenToWorld(sx, sy) {
  return [(sx - offsetX) / scale, (sy - offsetY) / scale];
}

/* ---------- 绘制 ---------- */
function draw() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = CONFIG.bgColor;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  // 1) 底图
  if (basemapImg) {
    ctx.drawImage(basemapImg, 0, 0, CONFIG.worldW, CONFIG.worldH);
  } else {
    // 底图还没加载好：画个占位格
    ctx.fillStyle = '#14212a';
    ctx.fillRect(0, 0, CONFIG.worldW, CONFIG.worldH);
    ctx.strokeStyle = '#2a3a44';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, CONFIG.worldW, CONFIG.worldH);
  }

  // 2) 图层：国度面 → 商路线 → 地名点
  drawRealms();
  drawRoutes();
  drawPlaces();

  ctx.restore();
}

function drawRealms() {
  if (!WORLD_DATA.realms) return;
  if (document.body.classList.contains('hide-realms')) return;
  WORLD_DATA.realms.forEach(f => {
    const ring = f.geometry.rings || [f.geometry.coordinates[0]];
    ring.forEach(ringCoords => {
      ctx.beginPath();
      ringCoords.forEach((c, i) => {
        const [px, py] = toPx(c);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fillStyle = (f.properties.color || '#d4b878') + '22'; // 12% 透明度
      ctx.fill();
      ctx.strokeStyle = f.properties.color || '#d4b878';
      ctx.lineWidth = 2 / scale;   // 线宽不随缩放变粗
      ctx.stroke();
    });
  });
}

function drawRoutes() {
  if (!WORLD_DATA.routes) return;
  if (document.body.classList.contains('hide-routes')) return;
  WORLD_DATA.routes.forEach(f => {
    const pts = f.geometry.coordinates;
    ctx.beginPath();
    pts.forEach((c, i) => {
      const [px, py] = toPx(c);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.strokeStyle = f.properties.color || '#8fa8b0';
    ctx.lineWidth = 2 / scale;
    ctx.setLineDash([8 / scale, 6 / scale]);
    ctx.stroke();
    ctx.setLineDash([]);
  });
}

function drawPlaces() {
  if (!WORLD_DATA.places) return;
  if (document.body.classList.contains('hide-places')) return;
  WORLD_DATA.places.forEach(f => {
    const [px, py] = toPx(f.geometry.coordinates);
    const r = 7 / Math.sqrt(scale);   // 点大小略微随缩放变化，看着舒服

    // pin 圆点
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = '#1a242c';
    ctx.fill();
    ctx.strokeStyle = f.properties.color || '#d4b878';
    ctx.lineWidth = 2 / scale;
    ctx.stroke();

    // 地名文字（缩太小时隐藏，避免糊成一团）
    if (scale > 0.6) {
      ctx.fillStyle = '#e8e0d0';
      ctx.font = `${13 / Math.sqrt(scale)}px "WenQuanYi Micro Hei", sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.fillText(f.properties.name || '', px + r + 5, py);
    }

    // 存下来给点击命中用
    f.__hit = { px, py, r };
  });
}

/* ---------- 交互：拖拽平移 + 滚轮缩放 ---------- */
let dragging = false, dragStart = null, offsetStart = null;

canvas.addEventListener('mousedown', e => {
  dragging = true;
  dragStart = { x: e.clientX, y: e.clientY };
  offsetStart = { x: offsetX, y: offsetY };
});
window.addEventListener('mousemove', e => {
  if (!dragging) return;
  offsetX = offsetStart.x + (e.clientX - dragStart.x);
  offsetY = offsetStart.y + (e.clientY - dragStart.y);
  draw();
});
window.addEventListener('mouseup', () => { dragging = false; });

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const sx = e.clientX, sy = e.clientY;
  const before = screenToWorld(sx, sy);
  const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
  scale *= factor;
  scale = Math.min(Math.max(scale, 0.3), 30);   // 限制缩放范围
  // 让鼠标指向的世界点，缩放后仍在原地（关键：缩放中心 = 鼠标）
  offsetX = sx - before.x * scale;
  offsetY = sy - before.y * scale;
  draw();
}, { passive: false });

/* ---------- 点击命中：点地名弹窗 ---------- */
const popup = document.getElementById('popup');
canvas.addEventListener('click', e => {
  if (dragging) return;
  const [wx, wy] = screenToWorld(e.clientX, e.clientY);
  let found = null, bestDist = Infinity;
  (WORLD_DATA.places || []).forEach(f => {
    const [px, py] = toPx(f.geometry.coordinates);
    const d = Math.hypot(wx - px, wy - py);
    if (d < 20 && d < bestDist) { bestDist = d; found = f; }
  });
  if (found) {
    popup.innerHTML = `
      <div class="type">${found.properties.type || ''}</div>
      <h3>${found.properties.name}</h3>
      ${found.properties.desc ? `<p>${found.properties.desc}</p>` : ''}`;
    popup.style.left = e.clientX + 12 + 'px';
    popup.style.top = e.clientY + 12 + 'px';
    popup.style.display = 'block';
  } else {
    popup.style.display = 'none';
  }
});

/* ---------- 图层开关 ---------- */
document.querySelectorAll('#layers input').forEach(el => {
  el.addEventListener('change', () => {
    document.body.classList.toggle('hide-' + el.dataset.layer, !el.checked);
    draw();
  });
});

/* ---------- 启动 ---------- */
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; fit(); draw(); }
function fit() {
  // 初始：让整张世界图完整显示在屏幕内
  const s = Math.min(canvas.width / CONFIG.worldW, canvas.height / CONFIG.worldH) * 0.95;
  scale = s;
  offsetX = (canvas.width - CONFIG.worldW * s) / 2;
  offsetY = (canvas.height - CONFIG.worldH * s) / 2;
}
window.addEventListener('resize', () => { resize(); });

basemapImg = new Image();
basemapImg.src = CONFIG.basemap;
basemapImg.onload = () => { resize(); };
basemapImg.onerror = () => { resize(); };   // 底图缺失也照样能画标注（占位格上直接画）
