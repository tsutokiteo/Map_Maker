"""
生成一张占位底图 basemap/WorldMap.png (2048x1024，equirectangular 标准 2:1)
→ 让整个工程不用用户提供图片就能直接跑起来看效果。
你在 PS/GIMP 里画好自己的世界图后，覆盖这个文件即可（保持同名同尺寸，或改 app.js 的 worldW/worldH）。
"""
import numpy as np
from PIL import Image

W, H = 2048, 1024
img = Image.new('RGB', (W, H))
px = img.load()

# 海洋：从赤道向两极渐变（赤道暖、极地冷），模拟球形世界的纬度感
for y in range(H):
    lat = abs(y / H - 0.5) * 2  # 0(赤道) ~ 1(极地)
    r = int(12 + lat * 20)
    g = int(24 + lat * 30)
    b = int(40 + lat * 40)
    for x in range(W):
        # 加点"洋流/深浅"噪声
        n = int(10 * np.sin(x / 90.0) * np.cos(y / 70.0))
        px[x, y] = (max(0, r + n), max(0, g + n), max(0, b + n))

# 用几个椭圆"大陆块"叠出轮廓（浅色陆地）
from PIL import ImageDraw
draw = ImageDraw.Draw(img, 'RGBA')
continents = [
    (0.30, 0.48, 0.16, 0.20, (90, 110, 72)),   # 西大陆
    (0.66, 0.60, 0.15, 0.18, (110, 96, 64)),    # 东大陆（赤砂）
    (0.50, 0.30, 0.10, 0.10, (80, 104, 88)),    # 北方群岛
]
for cx, cy, rw, rh, col in continents:
    cx, cy = cx * W, cy * H
    rx, ry = rw * W, rh * H
    bbox = [cx - rx, cy - ry, cx + rx, cy + ry]
    draw.ellipse(bbox, fill=col + (255,))

# 海岸线描边（再画一圈略大的深色椭圆，只填边）
for cx, cy, rw, rh, col in continents:
    cx, cy = cx * W, cy * H
    rx, ry = rw * W * 1.06, rh * H * 1.06
    draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], outline=(60, 80, 70, 255), width=4)

img.save('basemap/WorldMap.png')
print('saved basemap/WorldMap.png', img.size)
