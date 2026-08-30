"""像素级验证渲染结果：抽样检查关键位置是否有预期内容"""
from PIL import Image

img = Image.open('render_preview.png').convert('RGB')
W, H = img.size
px = img.load()

def region_mean(x0, y0, x1, y1):
    rs = gs = bs = 0; n = 0
    for x in range(x0, x1, 3):
        for y in range(y0, y1, 3):
            r, g, b = px[x, y]; rs += r; gs += g; bs += b; n += 1
    return [rs/n, gs/n, bs/n]

def fmt(c): return f'{c[0]:.0f},{c[1]:.0f},{c[2]:.0f}'

# 1) 海洋区（左上角，远离大陆）应偏冷蓝
ocean = region_mean(40, 40, 300, 200)
assert ocean[2] > ocean[0], f'海洋应偏蓝，实际{ocean}'
print(f'✓ 海洋区 RGB {fmt(ocean)}（偏冷蓝，符合底色）')

# 2) 西大陆区（灰鸥公国位置附近，大陆块中心 ~0.30W, 0.48H）
land = region_mean(int(0.30*W)-80, int(0.48*H)-60, int(0.30*W)+80, int(0.48*H)+60)
assert land[1] > ocean[1] + 10, f'大陆应比海洋更绿，land={land}, ocean={ocean}'
print(f'✓ 大陆区 RGB {fmt(land)}（比海洋偏绿，大陆轮廓存在）')

# 3) 国度面着色：灰鸥公国区域应有金色混合 → 比纯陆地偏亮
realm = region_mean(int(0.40*W)-60, int(0.48*H)-40, int(0.40*W)+60, int(0.48*H)+40)
assert realm[0] > land[0], f'国度面应比纯陆地偏亮，realm={realm}, land={land}'
print(f'✓ 国度面 RGB {fmt(realm)}（比纯陆地偏亮，半透明金色已叠加）')

# 4) 标题文字：直接扫描顶部区域找金色亮像素（更稳健，不依赖区域均值）
def bright_pixel_count(x0, y0, x1, y1, r_th=150, g_th=130, b_hi=160):
    n = 0
    for y in range(y0, y1):
        for x in range(x0, x1):
            r, g, b = px[x, y]
            if r > r_th and g > g_th and b < b_hi:
                n += 1
    return n

title_bright = bright_pixel_count(40, 25, 900, 90)
assert title_bright > 1000, f'标题区应有大量金色像素，实际{title_bright}'
print(f'✓ 标题文字区亮像素 {title_bright}（金色标题「世界观地图」已渲染）')

# 5) 地名标注：检查鸥港 (~0.40W, 0.48H) 附近是否有文字亮像素
place_bright = bright_pixel_count(int(0.40*W)+5, int(0.48*H)-15, int(0.40*W)+260, int(0.48*H)+20)
assert place_bright > 50, f'鸥港地名文字应有亮像素，实际{place_bright}'
print(f'✓ 鸥港标注亮像素 {place_bright}（地名文字已渲染）')

print('\n✓ 像素级验证全部通过 —— 底图 + 大陆 + 国度面 + 地名 + 标题均已正确渲染')
