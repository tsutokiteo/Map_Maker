// 校验 data.js：坐标是否在 [0,1]，多边形是否闭合，必要字段是否存在
const fs = require('fs');
const code = fs.readFileSync('./data.js', 'utf8');
eval(code.replace('const WORLD_DATA', 'global.WORLD_DATA'));

let bad = 0;
function check(coord, where) {
  const [x, y] = coord;
  if (x < -0.001 || x > 1.001 || y < -0.001 || y > 1.001) {
    bad++; console.log('  ✗ 越界', where, coord);
  }
}
function each(arr, type) {
  arr.forEach((f, i) => {
    if (!f.properties || !f.properties.name) { bad++; console.log('  ✗ 缺 name', type, i); }
    const g = f.geometry;
    if (type === 'Point') check(g.coordinates, ['places', i]);
    else if (type === 'LineString') g.coordinates.forEach((c, j) => check(c, ['routes', i, j]));
    else if (type === 'Polygon') {
      const ring = (g.rings || [g.coordinates[0]])[0];
      ring.forEach((c, j) => check(c, ['realms', i, j]));
      // 检查闭合：首尾应相等
      const first = ring[0], last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        console.log('  ⚠ 多边形未闭合（首尾不等）', ['realms', i]);
      }
    }
  });
}
console.log('校验 WORLD_DATA:');
each(WORLD_DATA.places, 'Point');
each(WORLD_DATA.routes, 'LineString');
each(WORLD_DATA.realms, 'Polygon');
console.log(bad === 0 ? '✓ 全部通过' : `✗ ${bad} 处问题`);
