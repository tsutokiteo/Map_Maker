/* ============================================================
 * WORLD_DATA —— 世界观地图的标注数据
 *
 * 坐标约定（配合 app.js 的 CONFIG.coordMode = 'ratio'）：
 *   [x, y]，都是 0 ~ 1 的比例值
 *     x：0 = 世界最左，1 = 世界最右
 *     y：0 = 世界最上（北），1 = 世界最下（南）
 *   → 你在 PS / GIMP 里量坐标：xRatio = 标尺x / 画布宽，yRatio = 标尺y / 画布高
 *
 * 三种几何：
 *   - Point       ：单个 [x, y]                → 城、要塞、遗迹
 *   - LineString  ：[x,y] 数组（>=2 个）        → 商路、河流、国界
 *   - Polygon     ：[x,y] 数组（首尾闭合）      → 王国、森林、湖泊
 *                   有多个环（如岛屿、飞地）时用 rings: [[...], [...]]
 *
 * properties 通用字段：name（必填）、type、desc、color
 * ============================================================ */

const WORLD_DATA = {
  // —— 国度 / 区域面 ——
  realms: [
    {
      properties: { name: '灰鸥公国', type: 'realm', color: '#d4b878' },
      geometry: {
        type: 'Polygon',
        // 一个四边形（首尾点要闭合，即第一个点 = 最后一个点）
        coordinates: [[
          [0.30, 0.42], [0.52, 0.40], [0.55, 0.62], [0.31, 0.64], [0.30, 0.42],
        ]],
      },
    },
    {
      properties: { name: '赤砂汗国', type: 'realm', color: '#c0503a' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [0.58, 0.55], [0.82, 0.52], [0.85, 0.78], [0.60, 0.80], [0.58, 0.55],
        ]],
      },
    },
  ],

  // —— 地名点 ——
  places: [
    { properties: { name: '鸥港',   type: 'city',  desc: '灰鸥公国首都，潮汐之门。' },
      geometry: { type: 'Point', coordinates: [0.40, 0.48] } },
    { properties: { name: '盐铁堡', type: 'fort',  desc: '扼守赤砂商道的要塞。' },
      geometry: { type: 'Point', coordinates: [0.66, 0.58] } },
    { properties: { name: '迷雾遗迹', type: 'ruin', desc: '旧纪元沉没的神殿。' },
      geometry: { type: 'Point', coordinates: [0.45, 0.30] } },
    { properties: { name: '赤砂城', type: 'city',  desc: '汗国王帐所在。' },
      geometry: { type: 'Point', coordinates: [0.72, 0.66] } },
  ],

  // —— 商路 / 线 ——
  routes: [
    {
      properties: { name: '银盐古道', type: 'trade', color: '#e0c878' },
      geometry: { type: 'LineString', coordinates: [
        [0.40, 0.48], [0.52, 0.54], [0.66, 0.58], [0.72, 0.66],
      ] },
    },
    {
      properties: { name: '海龙迁徙线', type: 'natural', color: '#4a90a4' },
      geometry: { type: 'LineString', coordinates: [
        [0.20, 0.28], [0.45, 0.30], [0.70, 0.34], [0.90, 0.30],
      ] },
    },
  ],
};
