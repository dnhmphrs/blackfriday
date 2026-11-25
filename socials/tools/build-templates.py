#!/usr/bin/env python3
"""Build the templates as single, self-contained HTML files: every picture and typeface is put inside
the page as a data: URL.
    python3 tools/build-templates.py [name ...]     -> out/templates/<name>.html (default: every templates/*.html)
In a template, {{fonts}} becomes the @font-face rules ("Archivo Black", "Antonio" 300 and 600,
"Arimo" bold italic, "Tinos" bold italic, from the extension's own fonts) and {{img:NAME}} a picture
from IMAGES (or the made-up ones: tile, globe_anim)."""
import base64, io, os, re, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXT = os.path.join(os.path.dirname(ROOT), 'extension', 'src')
TEMPLATES = os.path.join(ROOT, 'templates')
GLOBE = os.path.join(ROOT, 'assets', 'globe')   # globe-00.png ... globe-59.png: one turn in 4 s at 15 frames a second
# name: (file, longest side or None, format, quality)
IMAGES = {
    'favicon': (f'{EXT}/icons/icon32.png', None, 'PNG', None),
    'logo': (f'{ROOT}/assets/gme/gme-primary.png', 600, 'WEBP', 90),   # white on clear
    'globe_still': (f'{GLOBE}/globe-00.png', None, 'WEBP', 85),
}
FONTS = [('Archivo Black', 'normal', 400, 'archivo-black.woff2'),
         ('Antonio', 'normal', 300, 'antonio-light.woff2'),
         ('Antonio', 'normal', 600, 'antonio-semibold.woff2'),
         ('Arimo', 'italic', 700, 'arimo-bold-italic.woff2'),
         ('Tinos', 'italic', 700, 'tinos-bold-italic.woff2')]


def data(mime, raw):
    return f'data:{mime};base64,' + base64.b64encode(raw).decode()


def picture(name):
    path, side, fmt, q = IMAGES[name]
    im = Image.open(path)
    if side and max(im.size) > side:
        k = side / max(im.size); im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, fmt, **({'quality': q, 'method': 6} if fmt == 'WEBP' else {'optimize': True}))
    return data(f'image/{fmt.lower()}', buf.getvalue())


def globe_anim():
    """The globe turning, as one animated WebP from its 60 frames."""
    frames = [Image.open(f'{GLOBE}/globe-{i:02d}.png').convert('RGBA') for i in range(60)]
    buf = io.BytesIO()
    frames[0].save(buf, 'WEBP', save_all=True, append_images=frames[1:], duration=67, loop=0, quality=78, method=4)
    return data('image/webp', buf.getvalue())


def tile():
    """The faint ground: the GME lockup stepped in staggered rows on a clear 260 x 224 cell."""
    logo = Image.open(IMAGES['logo'][0]).convert('RGBA')
    w = 190; logo = logo.resize((w, round(logo.height * w / logo.width)), Image.LANCZOS)
    cell = Image.new('RGBA', (260, 224), (0, 0, 0, 0))
    for x, y in [(35, (112 - logo.height) // 2), (-95, 112 + (112 - logo.height) // 2), (165, 112 + (112 - logo.height) // 2)]:
        cell.paste(logo, (x, y), logo)  # clipped at the cell's edges; the next cell carries the rest
    buf = io.BytesIO(); cell.save(buf, 'PNG', optimize=True)
    return data('image/png', buf.getvalue())


fonts = '\n'.join(f'@font-face {{ font-family: "{f}"; font-style: {s}; font-weight: {wt}; font-display: block; '
                  f'src: url({data("font/woff2", open(os.path.join(EXT, "fonts", p), "rb").read())}) format("woff2"); }}'
                  for f, s, wt, p in FONTS)
cache = {}
def img(name):
    if name not in cache: cache[name] = {'tile': tile, 'globe_anim': globe_anim}.get(name, lambda: picture(name))()
    return cache[name]


out = os.path.join(ROOT, 'out', 'templates'); os.makedirs(out, exist_ok=True)
names = sys.argv[1:] or sorted(f[:-5] for f in os.listdir(TEMPLATES) if f.endswith('.html'))
for name in names:
    t = open(os.path.join(TEMPLATES, name + '.html'), encoding='utf-8').read()
    t = t.replace('{{fonts}}', fonts)
    t = re.sub(r'\{\{img:(\w+)\}\}', lambda m: img(m.group(1)), t)
    left = re.findall(r'\{\{[^}]*\}\}', t)
    if left: sys.exit(f'{name}: unfilled {left}')
    path = os.path.join(out, name + '.html')
    open(path, 'w', encoding='utf-8').write(t)
    print(f'{path}  {os.path.getsize(path) / 1e6:.2f} MB')
