"""用 PIL 做等效渲染验证（沙盒里 node canvas 装不上，改用 Python，绘制逻辑与 app.js 一致）"""
import json, re, os
from PIL import Image, ImageDraw, ImageFont

W, H = 2048, 1024
img = Image.open('basemap/WorldMap.png').convert('RGB')
draw = ImageDraw.Draw(img, 'RGBA')

# 解析 data.js（手写 mini parser：抽三种数组）
src = open('data.js').read()
def grab(name):
    # 取 name: [ ... ] 的最外层数组
    start = src.index(f'{name}:') + len(name) + 1
    # 跳过空白到 [
    while src[start] in ' \n\t': start += 1
    depth, i, acc = 0, start, []
    while True:
        ch = src[i]
        if ch == '[': depth += 1
        elif ch == ']':
            depth -= 1
            if depth == 0: break
        i += 1
    return src[start:i+1]

def to_px(c): return [c[0]*W, c[1]*H]

def props_for(block):
    name = re.search(r'name:\s*[\'"]([^\'"]+)', block)
    typ = re.search(r'type:\s*[\'"]([^\'"]+)', block)
    col = re.search(r'color:\s*[\'"]([^\'"]+)', block)
    desc = re.search(r'desc:\s*[\'"]([^\'"]*)', block)
    return {k: (v.group(1) if v else None) for k, v in [('name',name),('type',typ),('color',col),('desc',desc)]}

font = ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-microhei.ttc', 28)

# 用正则拆出每个 feature block（按 properties 出现位置）
blocks = re.split(r'(?=\{\s*properties:)', src)
realms = [b for b in blocks if '"realm"' in b or 'type:\'realm' in b]
places = [b for b in blocks if 'Point' in b and 'coordinates:' in b]
routes = [b for b in blocks if 'LineString' in b]

def parse_coords(text):
    """从一段含 [ [x,y], [x,y] ... ] 的文本提取所有 [x,y]"""
    return [[float(a), float(b)] for a, b in re.findall(r'\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]', text)]

# 国度面
for b in blocks:
    if 'Polygon' in b and 'coordinates:' in b:
        p = props_for(b)
        coords_text = re.search(r'coordinates:\s*(\[\[.*?\]\])', b, re.S)
        if not coords_text: continue
        ring = parse_coords(coords_text.group(1))
        pts = [tuple(to_px(c)) for c in ring]
        col = p['color'] or '#d4b878'
        draw.polygon(pts, fill=col+'22', outline=col, width=4)

# 商路线
for b in blocks:
    if 'LineString' in b and 'coordinates:' in b:
        p = props_for(b)
        ring = parse_coords(re.search(r'coordinates:\s*(\[.*?\])\s*\}\s*,?\s*\n', b, re.S).group(1))
        pts = [tuple(to_px(c)) for c in ring]
        col = p['color'] or '#8fa8b0'
        draw.line(pts, fill=col, width=4)

# 地名点
for b in blocks:
    if 'Point' in b and 'coordinates:' in b:
        p = props_for(b)
        c = parse_coords(re.search(r'coordinates:\s*(\[.*?\])\s*\}\s*,?', b, re.S).group(1))[0]
        px, py = to_px(c)
        col = p['color'] or '#d4b878'
        draw.ellipse([px-10, py-10, px+10, py+10], fill=(26,36,44), outline=col, width=4)
        if p['name']:
            draw.text((px+16, py), p['name'], font=font, fill=(232,224,208))

draw.text((40, 30), '世界观地图 · World Map', font=ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-microhei.ttc', 48), fill=(212,184,120))

img.save('render_preview.png')
img.resize((1024, 512)).save('render_thumb.png')
print('✓ 已生成 render_preview.png（2048x1024）')
