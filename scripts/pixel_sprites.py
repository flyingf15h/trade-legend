"""Draws the app's pixel-art sprites into static/art/px/ as crisp SVGs.

Each sprite is a grid of palette letters ('.' is see-through). Fill shapes only: a 1px dark
outline is added automatically around every sprite, then any 'face' pixels are drawn on top.
Run: python3 scripts/pixel_sprites.py
"""
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'static' / 'art' / 'px'
OUT.mkdir(parents=True, exist_ok=True)

PAL = {
    'K': '#4a2e24', 'B': '#8a5232', 'b': '#b8763e', 'C': '#e0a95a', 'c': '#f4cf91', 'D': '#5a3420',
    'Y': '#f8c94f', 'y': '#fde69a', 'O': '#f2a64a', 'P': '#f7a8b8', 'p': '#fcd3db', 'R': '#d9534f',
    'r': '#f08a7e', 'G': '#6fbf73', 'g': '#a8dcaa', 'W': '#ffffff', 'w': '#fdf3e1', 'S': '#8cc1ec',
    's': '#cfe6f7', 'L': '#9b7fd6', 'l': '#c6a6ec', 'M': '#8f4a4a', 'm': '#b86b6b', 'E': '#9c8f8a',
    'e': '#e3dcd6', 'k': '#2a1d18', 'h': '#f6a5a5',
}


def grid(text):
    rows = [r for r in text.strip('\n').split('\n')]
    w = max(len(r) for r in rows)
    return [list(r.ljust(w, '.')) for r in rows]


def outline(g):
    """Pad by one pixel and outline every filled pixel's empty neighbours."""
    h, w = len(g), len(g[0])
    out = [['.'] * (w + 2) for _ in range(h + 2)]
    for y in range(h):
        for x in range(w):
            out[y + 1][x + 1] = g[y][x]
    res = [row[:] for row in out]
    for y in range(h + 2):
        for x in range(w + 2):
            if out[y][x] != '.':
                continue
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h + 2 and 0 <= nx < w + 2 and out[ny][nx] not in '.':
                    res[y][x] = 'K'
                    break
    return res


def overlay(g, marks):
    """marks: list of (x, y, letter) in outlined-sprite coordinates."""
    for x, y, c in marks:
        g[y][x] = c
    return g


def paste(dst, src, ox, oy):
    for y, row in enumerate(src):
        for x, c in enumerate(row):
            if c != '.' and 0 <= oy + y < len(dst) and 0 <= ox + x < len(dst[0]):
                dst[oy + y][ox + x] = c
    return dst


def blank(w, h):
    return [['.'] * w for _ in range(h)]


def save(name, g):
    h, w = len(g), len(g[0])
    rects = []
    for y in range(h):
        x = 0
        while x < w:
            c = g[y][x]
            if c == '.':
                x += 1
                continue
            run = 1
            while x + run < w and g[y][x + run] == c:
                run += 1
            rects.append(f'<rect x="{x}" y="{y}" width="{run}" height="1" fill="{PAL[c]}"/>')
            x += run
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" shape-rendering="crispEdges">'
           + ''.join(rects) + '</svg>\n')
    (OUT / f'{name}.svg').write_text(svg)


def face(cx, cy, blush=True, sleepy=False):
    m = []
    if sleepy:
        m += [(cx - 3, cy, 'k'), (cx - 2, cy, 'k'), (cx + 2, cy, 'k'), (cx + 3, cy, 'k')]
    else:
        m += [(cx - 2, cy, 'k'), (cx + 2, cy, 'k'), (cx - 2, cy - 1, 'k'), (cx + 2, cy - 1, 'k')]
    m += [(cx - 1, cy + 2, 'k'), (cx, cy + 2, 'k'), (cx + 1, cy + 2, 'k')] if not sleepy else [(cx, cy + 2, 'k')]
    if blush:
        m += [(cx - 4, cy + 1, 'h'), (cx + 4, cy + 1, 'h')]
    return m


S = {}
S['cookie'] = grid('''
....CCCCCC....
..CCcccCCCCC..
.CcDCCCCCDCCC.
.CcCCCCCCCCCC.
CCCCCCDCCCCCCC
CCCCCCCCCCDCCC
CCCCCCCCCCCCCC
CDCCCCCCCCCCCC
CCCCCCDCCCCCCC
CCCCCCCCCCCCDC
.CCCCDCCCCCCC.
.CCCCCCCCDCCC.
..CCCCCCCCCC..
....CCCCCC....
''')
S['croissant'] = grid('''
......bCCCb.......
....bCCCbCCCCb....
...CCcCbCCCcCbC...
..CcCCbCCCCCCbCC..
.CcCCbCCcCCCCCbCC.
CcCCCbCCCCCCCCbCcC
CCCCbCCCCCCCCCCbCC
.CC.bCCCCCCCCCCb.C
.C...bbCCCCCCbb...
.......bbbbbb.....
''')
S['muffin'] = grid('''
...BBBBBBBB...
.BBbBBBBDBBBB.
BBDBBBbBBBBDBB
BBBBBDBBBBBBBB
BbBBBBBBBDBBBB
.BBBBBBBBBBBB.
.PpPpPpPpPpPp.
.PpPpPpPpPpPp.
..pPpPpPpPpP..
..pPpPpPpPpP..
...PpPpPpPp...
''')
S['pie'] = grid('''
...............bb
............bbCCb
.........bbCCCCCb
......bbCCCcCCCCb
...bbCCCCCCCCCCCb
bbCCCcCCCCCCCCCCb
RRRRRRRRRRRRRRRRb
RRrRRRRRRrRRRRRRb
RRRRRRrRRRRRRRrRb
bbbbbbbbbbbbbbbbb
''')
S['dice'] = grid('''
.WWWWWWWWWWWW.
WWWWWWWWWWWWWW
WWRRWWWWWWWWWW
WWRRWWWWWWWWWW
WWWWWWWWWWWWWW
WWWWWWWWWWWWWW
WWWWWWRRWWWWWW
WWWWWWRRWWWWWW
WWWWWWWWWWWWWW
WWWWWWWWWWWWWW
WWWWWWWWWWRRWW
WWWWWWWWWWRRWW
WeeeeeeeeeeeeW
.eeeeeeeeeeee.
''')
S['tart'] = grid('''
...R...R...R...R..
..RrR.RrR.RrR.RrR.
.wwwwwwwwwwwwwwww.
wwwwwwwwwwwwwwwwww
bCCCCCCCCCCCCCCCCb
.bCCcCCCCCCCcCCCb.
..bCCCCCCCCCCCCb..
...bbbbbbbbbbbb...
''')
S['scone'] = grid('''
......CC......
.....CCcC.....
....CCcCCC....
...CCCCCDCC...
..CCDCCCCCCC..
.RRRRRRRRRRRR.
CCCCCCCCCDCCCC
CCDCCCCCCCCCCC
.CCCCCCCCCCCC.
''')
S['roll'] = grid('''
...bbbbbbbb...
.bbCCCCCCCCbb.
bCCbbbbbbbbCCb
bCbCCCCCCCCbCb
bCbCbbbbbbCbCb
bCbCbCCCCbCbCb
bCbCbCbbCbCbCb
bCbCbCCCbbCbCb
bCbCbbbbbCCbCb
bCCbCCCCCCbCCb
.bbCbbbbbbCbb.
...bbbbbbbb...
''')
S['crumble'] = grid('''
..CbCcbCbCCbCb..
.bCCbCCcbCCbCCb.
SSSSSSSSSSSSSSSS
SsSSSSSSSSSSSSSS
.SSWSSWSSWSSWSS.
.SSSSSSSSSSSSSS.
..SSSSSSSSSSSS..
...SSSSSSSSSS...
.....eeeeee.....
''')
S['cake'] = grid('''
......O.......
.....OYO......
......y.......
......S.......
......S.......
..PPPPPPPPPP..
.PWPPWPPWPPWP.
.PPPPPPPPPPPP.
.pppppppppppp.
.PPPPPPPPPPPP.
.PPPPPPPPPPPP.
eeeeeeeeeeeeee
''')
S['tag'] = grid('''
YYYYYYYYYYY.....
YYYYYYYYYYYY....
YWWYYYYYYYYYY...
YWWYYKKYYYKYYY..
YYYYYKKYYKYYYYY.
YYYYYYYYKYYYYYYY
YYYYYYYKYYKKYYY.
YYYYYYKYYYKKYY..
YYYYYYYYYYYYY...
YYYYYYYYYYYY....
''')
S['sample'] = grid('''
........R.....
........RR....
........k.....
........k.....
......CCCCC...
......CcCCC...
......CCCCC...
.eeeeeeeeeeee.
eWWWWWWWWWWWWe
.eeeeeeeeeeee.
''')
S['heart'] = grid('''
.RRR...RRR.
RRrRR.RRRRR
RrRRRRRRRRR
RRRRRRRRRRR
.RRRRRRRRR.
..RRRRRRR..
...RRRRR...
....RRR....
.....R.....
''')
S['star'] = grid('''
.....Y.....
....YYY....
....YyY....
YYYYYyYYYYY
.YYYYYYYYY.
..YYYYYYY..
..YYYYYYY..
.YYYY.YYYY.
.YY.....YY.
''')
S['ticket'] = grid('''
PPPPPPPPPPPPPP
PPWPPPPPPPPWPP
.PPPPPPPPPPPP.
PPPPppPPppPPPP
.PPPPPPPPPPPP.
PPWPPPPPPPPWPP
PPPPPPPPPPPPPP
''')
S['receipt'] = grid('''
wwwwwwwwww
wwwwwwwwww
wkkkkkkkww
wwwwwwwwww
wkkkkkwwww
wwwwwwwwww
wkkkkkkkww
wwwwwwwwww
wkkkwwkkkw
wwwwwwwwww
w.w.w.w.w.
''')
S['qr'] = grid('''
kkkkW.Wkkkk
kWWkW.WkWWk
kWWkWkWkWWk
kkkkWWWkkkk
WWWWkWkWWWW
kWkWWkWWkWk
WWWWkWkWkWW
kkkkWkWWkWk
kWWkWWkWWWW
kWWkWkWkkWk
kkkkWWWkWWk
''')
S['house'] = grid('''
.....RR.....
....RRRR....
...RRRRRR...
..RRRRRRRR..
.RRRRRRRRRR.
RRRRRRRRRRRR
.wwwwwwwwww.
.wwbbwwSSww.
.wwbbwwSSww.
.wwbbwwwwww.
.wwbbwwwwww.
''')
S['gift'] = grid('''
...R....R...
..R.R..R.R..
...RR..RR...
PPPPPRRPPPPP
PPPPPRRPPPPP
.pPPPPRRPPPp
.pPPPPRRPPPp
.pPPPPRRPPPp
.pPPPPRRPPPp
.pPPPPRRPPPp
''')
S['sparkle'] = grid('''
...Y...
...Y...
..YyY..
YYyWyYY
..YyY..
...Y...
...Y...
''')
S['spoon'] = grid('''
..bbbb..................
.bCCCCb.................
bCCccCCbbbbbbbbbbbbbbbb.
bCCcCCCCCCCCCCCCCCCCCCCb
bCCCCCCbbbbbbbbbbbbbbbb.
.bCCCCb.................
..bbbb..................
''')
S['crumb-box'] = grid('''
...CC..CCC..CC...
..CCCCCCcCCCCCC..
MMMMMMMYYMMMMMMMM
MmmmmmmYYmmmmmmmM
MMMMMMMYYMMMMMMMM
MMMMMMMYYMMMMMMMM
MMMMMMMYYMMMMMMMM
MMMMMMMYYMMMMMMMM
MMMMMMMYYMMMMMMMM
MMMMMMMYYMMMMMMMM
''')
S['coffee-cup'] = grid('''
..eeeeeeee..
.eeeeeeeeee.
eeeeeeeeeeee
.wwwwwwwwww.
.bbbbbbbbbb.
.bbbbPPbbbb.
.bbbPPPPbbb.
.bbbbPPbbbb.
.bbbbbbbbbb.
..wwwwwwww..
..wwwwwwww..
...wwwwww...
''')
S['parfait-glass'] = grid('''
....W.R...
...WWWRR..
..WWWWWW..
.ssssssss.
.PPPPPPPP.
.wwwwwwww.
.CCCCCCCC.
.PPPPPPPP.
..ssssss..
....ss....
....ss....
..ssssss..
''')
S['loaf'] = grid('''
..bbbbbbbbbb..
.bCCCCCCCCCCb.
bCCcCCCCCCCCCb
bCCCCCCCCCCCCb
bCwwwwwwwwwwCb
bCwwwwwwwwwwCb
bCwwwwwwwwwwCb
bCwwwwwwwwwwCb
bCwwwwwwwwwwCb
bCCCCCCCCCCCCb
.bbbbbbbbbbbb.
''')
S['jar'] = grid('''
.........yyyyy.........
.......yyyyyyyyy.......
.....yyyyyyyyyyyyy.....
......eeeeeeeeeee......
....sWWWWWWWWWWWWWs....
...sWWWWWWWWWWWWWWWs...
..sWWWWWWWWWWWWWWWWWs..
..sWgWWWWWWWWWWWWWWWs..
..sWgWWWWWWWWWWWWWWWs..
..sWgWWWWWWWWWWWWWWWs..
..sWgWWWWWWWWWWWWWWWs..
..sWWWWWWWWWWWWWWWWWs..
..sWWWWWWWWWWWWWWWWWs..
..sWWWWWWWWWWWWWWWWWs..
..sWWWWWWWWWWWWWWWWWs..
..sWWWWWWWWWWWWWWWWWs..
..sWWWWWWWWWWWWWWWWWs..
..sWWWWWWWWWWWWWWWWWs..
..sWWWWWWWWWWWWWWWWWs..
..sWWWWWWWWWWWWWWWWWs..
..syyyyyyyyyyyyyyyyys..
...syyyyyyyyyyyyyyys...
....sssssssssssssss....
''')
mini_cookie = grid('''
.CCC.
CDCcC
CCCDC
CcCCC
.CCC.
''')

# ---- plain sprites ----
for name in ['cookie', 'croissant', 'muffin', 'pie', 'dice', 'tart', 'scone', 'roll', 'crumble', 'cake',
             'tag', 'sample', 'heart', 'star', 'ticket', 'receipt', 'qr', 'house', 'gift', 'spoon',
             'crumb-box']:
    save(name, outline(S[name]))
save('sparkle', S['sparkle'])
save('twinkle', grid('''
...k...
...k...
...k...
kkk.kkk
...k...
...k...
...k...
'''))
save('favicon', outline(S['cookie']))

# BOGO: two croissants and a little plus
bogo = blank(34, 16)
paste(bogo, outline(S['croissant']), 0, 4)
paste(bogo, outline(S['croissant']), 14, 0)
for x, y in [(30, 11), (29, 12), (30, 12), (31, 12), (30, 13)]:
    bogo[y][x] = 'R'
save('bogo', bogo)

# ---- the prize cookie with a face ----
pc = outline([[('y' if c == 'C' else 'c' if c == 'c' else c) for c in row] for row in S['cookie']])
save('cookie-face', overlay(pc, face(8, 7)))

# ---- avatars: a pastel circle with a smiling friend ----
def avatar(name, sprite, bg, fx, fy, sleepy=False, ox=None, oy=None):
    size = 26
    a = blank(size, size)
    r = size / 2 - 0.5
    for y in range(size):
        for x in range(size):
            if (x - r) ** 2 + (y - r) ** 2 <= r * r:
                a[y][x] = bg
    sp = outline(sprite)
    ox = (size - len(sp[0])) // 2 if ox is None else ox
    oy = (size - len(sp)) // 2 if oy is None else oy
    paste(a, sp, ox, oy)
    overlay(a, [(x + ox, y + oy, c) for x, y, c in face(fx, fy, sleepy=sleepy)])
    save(f'avatar-{name}', a)

avatar('croissant', S['croissant'], 'c', 10, 6)
avatar('tart', S['tart'], 'p', 10, 6)
avatar('loaf', S['loaf'], 'g', 8, 8, sleepy=True)
avatar('cookie', S['cookie'], 'y', 8, 7)

# ---- special capsules: a clear pixel bubble with the treat inside ----
def bubble(name, sprite, tint):
    size = 26
    a = blank(size, size)
    r = size / 2 - 0.5
    for y in range(size):
        for x in range(size):
            d = (x - r) ** 2 + (y - r) ** 2
            if d <= r * r:
                a[y][x] = 'K' if d > (r - 1.2) ** 2 else tint
    for x, y in [(6, 6), (7, 5), (8, 5), (5, 7), (5, 8)]:
        a[y][x] = 'W'
    sp = outline(sprite)
    paste(a, sp, (size - len(sp[0])) // 2, (size - len(sp)) // 2 + 1)
    # little bow on top
    for x, y, c in [(10, 0, 'R'), (11, 1, 'R'), (12, 1, 'R'), (13, 1, 'R'), (14, 1, 'R'), (15, 0, 'R'), (12, 0, 'K'), (13, 0, 'K')]:
        a[y][x] = c
    save(f'capsule-special-{name}', a)

bubble('coffee', S['coffee-cup'], 'p')
bubble('croissant', S['croissant'], 'y')
bubble('muffin', S['muffin'], 'g')
bubble('parfait', S['parfait-glass'], 's')

# ---- cookie jar, filled with 1..8 cookies ----
spots = [(5, 16), (10, 16), (15, 16), (7, 12), (12, 12), (17, 13), (9, 8), (14, 8)]
for n in range(1, 9):
    j = outline(S['jar'])
    for (x, y) in spots[:n]:
        paste(j, mini_cookie, x + 1, y + 1)
    overlay(j, face(12, 8))
    save(f'jar-{n}', j)

print('wrote', len(list(OUT.glob('*.svg'))), 'sprites to', OUT)
