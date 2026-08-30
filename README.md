# 世界观地图（自定义世界 · 可缩放 + 点地名弹窗）

给**完全虚构、不依赖现实地理**的世界观用的地图：一张自己画的底图，上面叠加可缩放、可点击弹窗的地理标注。

> 球形世界（类地球）→ 用 **equirectangular（等距矩形）投影**：画一张 2:1 的平面图，左右能对接（如果你要做环球）。坐标系是你自己的，不绑任何真实经纬度。

---

## 快速开始

```bash
cd world-map
python3 gen_basemap.py   # 生成占位底图（可跳过，如果你已有自己的图）
# 用浏览器打开 index.html 即可（推荐用 Live Server / http server 打开）
python3 -m http.server 8000
# 访问 http://localhost:8000
```

打开后：滚轮缩放、拖拽平移、点地名弹窗。右上角可开关「国度 / 地名 / 商路」图层。

---

## 从零画你自己的世界 —— 工作流

### 第 1 步：画底图（最关键的一步）

在 **Photoshop / GIMP / Krita / Procreate** 里新建画布，**推荐 2048 × 1024（2:1）**。

- 2:1 是球形世界展开的黄金比例，左右边缘会自动对接成"环球"。
- 分层画：**海洋底层 → 大陆色块 → 地形/山脉/森林 → 河流 → 国界**。
- 存为 `basemap/WorldMap.png`，**保持 2048×1024**（或改 `app.js` 里的 `worldW / worldH`）。

> 颜色：用色块区分地形即可，标注（地名、图标）**不要画进底图** —— 标注放在 `data.js` 里，改起来不用重画。

### 第 2 步：量坐标（核心技巧）

你在画布上标一个点，需要它的 **比例坐标 [0~1, 0~1]**：

```
x 比例 = 该点水平像素 ÷ 画布宽
y 比例 = 该点垂直像素 ÷ 画布高
```

**最快方法**：在 PS / GIMP 里打开"标尺 + 信息面板"，直接读到像素，再除一下。
或者更省事：把画布宽高设成 **1000 × 500**，那像素坐标就等于比例坐标 ×1000，心算即可。

### 第 3 步：填数据（`data.js`）

```javascript
// 一个城（点）
{ properties: { name: '鸥港', type: 'city', desc: '首都。' },
  geometry: { type: 'Point', coordinates: [0.40, 0.48] } }   // [x比例, y比例]

// 一条商路（线）
{ properties: { name: '银盐古道', color: '#e0c878' },
  geometry: { type: 'LineString', coordinates: [[0.40,0.48], [0.72,0.66]] } }

// 一个王国（面，首尾点必须闭合）
{ properties: { name: '灰鸥公国', type: 'realm', color: '#d4b878' },
  geometry: { type: 'Polygon', coordinates: [[[0.30,0.42], [0.52,0.40], [0.55,0.62], [0.31,0.64], [0.30,0.42]]] } }
```

字段：`name`（必填）、`type`、`desc`（弹窗描述）、`color`（覆盖默认）。

### 第 4 步：校验

```bash
node validate.js   # 检查坐标越界、多边形闭合、name 缺失
```

改完 `data.js` 刷新浏览器即可，不用重画底图。

---

## 文件结构

```
world-map/
├── index.html        # 页面入口
├── app.js            # 核心：渲染 + 缩放平移 + 点击弹窗 + 图层开关
├── data.js           # ★ 你的标注数据（点/线/面）
├── style.css         # 配色（改这里换主题色）
├── gen_basemap.py    # 生成占位底图（可删）
├── validate.js       # 数据校验
├── render.py         # 导出静态高清大图（PNG）
└── basemap/
    └── WorldMap.png  # ★ 你画的世界底图（2048×1024）
```

---

## 进阶

**换主题色**：改 `style.css` 里的 `#d4b878`（金色主色）、`#0c1820`（海洋底色）。

**导出静态大图**：`python3 render.py` → 生成 `render_preview.png`（2048×1024 高清版，可发群/印书）。

**想让地图"能搜索地名"**：在 `app.js` 里加一个 `<input>` + 遍历 `WORLD_DATA.places` 做字符串匹配，`map.center` 跳过去即可。

**真·球形（可拖成地球仪）**：把底图喂给 [MapLibre](https://maplibre.org/) + `globe: true`，或导出 equirectangular 后用 Three.js 贴到一个球上 —— 底图不变，只是展示方式升级。

**多张子地图**（区域放大）：给 `data.js` 加 `zoomLevel` 字段，按当前缩放显示/隐藏不同细节层级。

---

## 已验证

- `validate.js`：坐标范围、多边形闭合、必填字段 ✓
- `render.py`：底图 + 大陆 + 国度面 + 地名 + 标题均已正确渲染（像素级抽样验证）✓
- 缩放中心 = 鼠标指向点（缩放后该点不动）✓
