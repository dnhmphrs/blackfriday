#!/usr/bin/env python3
"""Build the promo site's variants as single, self-contained HTML files: every picture and typeface
is put inside the page as a data: URL.
    python3 tools/site-build.py            -> out/site/<name>.html for each output in OUTPUTS
In a template, {{fonts}} becomes the @font-face rules ("Archivo Black", "Antonio" 300 and 600,
"Arimo" bold italic, "Tinos" bold italic), {{img:NAME}} a picture from IMAGES, {{link:NAME}} a link."""
import base64, io, os, re, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KIT = os.path.join(ROOT, 'out/kit-2.4')
SRC = os.path.join(os.path.dirname(ROOT), 'src')
LINKS = {
    'store': 'https://chromewebstore.google.com/detail/henmcmipcaepmamandofeafnkijmeddn',
    'garrett': 'https://garrettmusar.work/',
    'aufbau': 'https://www.aufbau.io/',
}
# name: (file, longest side or None, format, quality)
IMAGES = {
    'shot1': (f'{KIT}/extension-store/screenshot-1280x800.png', None, 'WEBP', 84),
    'shot2': (f'{KIT}/extension-store/screenshot-2-1280x800.png', None, 'WEBP', 84),
    'marquee': (f'{KIT}/extension-store/marquee-promo-1400x560.png', None, 'WEBP', 84),
    'square': (f'{KIT}/posts/30off-square-1080x1080.png', 900, 'WEBP', 84),
    'icon': (f'{KIT}/extension-store/store-icon-128.png', None, 'PNG', None),
    'favicon': (f'{SRC}/icons/icon32.png', None, 'PNG', None),
    'logo': (f'{ROOT}/assets/gme/gme-primary.png', 600, 'WEBP', 90),   # white on clear
    'cap': (f'{SRC}/images/cap.webp', None, 'WEBP', 90),
    'shaft': (f'{SRC}/images/shaft.webp', None, 'WEBP', 90),
    'base': (f'{SRC}/images/base.webp', None, 'WEBP', 90),
    'type_top': (f'{SRC}/images/type-top.webp', None, 'WEBP', 90),
    'type_mid': (f'{SRC}/images/type-mid.webp', None, 'WEBP', 90),
    'globe_still': (f'{ROOT}/out/channel-page/parts/globe-00.png', None, 'WEBP', 85),
}
PARTS = f'{ROOT}/out/channel-page/parts'
# the pages: output name -> (template in site/, its {{variables}})
OUTPUTS = {'live': ('_live.html', {'layout': 'site'}),           # the site
           'live-one': ('_live.html', {'layout': 'one'}), 'live-two': ('_live.html', {'layout': 'two'})}  # for the vertical posts
FONTS = [('Archivo Black', 'normal', 400, f'{SRC}/fonts/archivo-black.woff2'),
         ('Antonio', 'normal', 300, f'{SRC}/fonts/antonio-light.woff2'),
         ('Antonio', 'normal', 600, f'{SRC}/fonts/antonio-semibold.woff2'),
         ('Arimo', 'italic', 700, f'{SRC}/fonts/arimo-bold-italic.woff2'),
         ('Tinos', 'italic', 700, f'{ROOT}/variants/v17/fonts/tinos-bold-italic.woff2')]

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
    """The globe turning, from the 60 frames cut for the banner (one turn in 4 s, at 15 frames a second)."""
    frames = [Image.open(f'{PARTS}/globe-{i:02d}.png').convert('RGBA') for i in range(60)]
    buf = io.BytesIO()
    frames[0].save(buf, 'WEBP', save_all=True, append_images=frames[1:], duration=67, loop=0, quality=78, method=4)
    return data('image/webp', buf.getvalue())

def tile():
    """The faint ground: the GME lockup stepped in staggered rows, as in the store images, on a clear 260 x 224 cell."""
    logo = Image.open(IMAGES['logo'][0]).convert('RGBA')
    w = 190; logo = logo.resize((w, round(logo.height * w / logo.width)), Image.LANCZOS)
    cell = Image.new('RGBA', (260, 224), (0, 0, 0, 0))
    for x, y in [(35, (112 - logo.height) // 2), (-95, 112 + (112 - logo.height) // 2), (165, 112 + (112 - logo.height) // 2)]:
        cell.paste(logo, (x, y), logo)  # clipped at the cell's edges; the next cell carries the rest
    buf = io.BytesIO(); cell.save(buf, 'PNG', optimize=True)
    return data('image/png', buf.getvalue())

fonts = '\n'.join(f'@font-face {{ font-family: "{f}"; font-style: {s}; font-weight: {wt}; font-display: block; '
                  f'src: url({data("font/woff2", open(p, "rb").read())}) format("woff2"); }}' for f, s, wt, p in FONTS)
cache = {}
def img(name):
    if name not in cache: cache[name] = {'tile': tile, 'globe_anim': globe_anim}.get(name, lambda: picture(name))()
    return cache[name]

out = os.path.join(ROOT, 'out/site'); os.makedirs(out, exist_ok=True)
for name in sys.argv[1:] or OUTPUTS:
    template, values = OUTPUTS[name]
    t = open(os.path.join(ROOT, 'site', template), encoding='utf-8').read()
    for k, v in values.items(): t = t.replace('{{' + k + '}}', v)
    t = t.replace('{{fonts}}', fonts)
    t = re.sub(r'\{\{img:(\w+)\}\}', lambda m: img(m.group(1)), t)
    t = re.sub(r'\{\{link:(\w+)\}\}', lambda m: LINKS[m.group(1)], t)
    left = re.findall(r'\{\{[^}]*\}\}', t)
    if left: sys.exit(f'{name}: unfilled {left}')
    path = os.path.join(out, name + '.html')
    open(path, 'w', encoding='utf-8').write(t)
    print(f'{path}  {os.path.getsize(path) / 1e6:.2f} MB')
