"""Pizza Max — team wear and the drink cup, lying on the table, for the brand kit.

Builds each piece as a real object (cotton with folds, hems and seams; a twill cap with an embroidered seal;
a paper cup with its lid, lying on its side), prints the kit's own artwork on it (brand/export/<id>-print.png,
made by brand/export.py) and renders it from above with the same light rig as the pizza renders.

Run headless:
  blender -b -P blender/wear_scene.py -- --out assets/wear [--only tee-front] [--samples 64] [--scale 1]
"""
import bpy, bmesh, math, os, re, sys, argparse
from mathutils import Vector, Matrix, noise, kdtree

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument('--out', default='assets/wear')
ap.add_argument('--art', default='brand/export')
ap.add_argument('--only', default='')
ap.add_argument('--samples', type=int, default=64)
ap.add_argument('--scale', type=float, default=1.0, help='resolution multiplier (0.25 for quick tests)')
ap.add_argument('--exposure', type=float, default=-1.45)
args = ap.parse_args(argv)
OUT, ART = os.path.abspath(args.out), os.path.abspath(args.art)
os.makedirs(OUT, exist_ok=True)
U = 100.0   # millimetres per Blender unit

# ------------------------------------------------------------------ scene, light (the pizza rig, scaled to cloth size)
def reset(res_x, res_y):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = args.samples
    sc.cycles.use_denoising = True
    sc.render.film_transparent = True
    sc.render.resolution_x, sc.render.resolution_y = round(res_x * args.scale), round(res_y * args.scale)
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'Standard'
    try:
        sc.view_settings.look = 'Medium High Contrast'
    except TypeError:
        pass
    sc.view_settings.exposure = args.exposure
    world = bpy.data.worlds.new('w'); sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (1.0, .97, .92, 1)
    bg.inputs['Strength'].default_value = .18
    return sc

def link(ob):
    bpy.context.scene.collection.objects.link(ob)
    return ob

def lights(cx, cy, k, rake=False):
    """key and rim as in blender/pizza_scene.py, moved over the piece and scaled by k (distance);
    rake: the same key brought down low across the cloth (as a flat-lay photographer would), so folds cast shade"""
    key = bpy.data.lights.new('key', 'AREA'); key.energy = 3300 * k * k * (2.3 if rake else 1); key.size = (2.6 if rake else 4.5) * k; key.color = (1, .95, .88)
    ko = link(bpy.data.objects.new('key', key)); ko.location = (cx - 7 * k, cy - 2.5 * k, 3.2 * k) if rake else (cx - 3.5 * k, cy - 4 * k, 8 * k)
    aim = link(bpy.data.objects.new('aim', None)); aim.location = (cx, cy, 0)
    tc = ko.constraints.new('TRACK_TO'); tc.target = aim; tc.track_axis = 'TRACK_NEGATIVE_Z'; tc.up_axis = 'UP_Y'
    rim = bpy.data.lights.new('rim', 'AREA'); rim.energy = 700 * k * k; rim.size = 4 * k; rim.color = (1, .9, .8)
    ro = link(bpy.data.objects.new('rim', rim)); ro.location = (cx + 5 * k, cy + 5 * k, 5 * k)
    tr = ro.constraints.new('TRACK_TO'); tr.target = aim; tr.track_axis = 'TRACK_NEGATIVE_Z'; tr.up_axis = 'UP_Y'

def camera(loc, target, ortho):
    cam = bpy.data.cameras.new('cam'); cam.type = 'ORTHO'; cam.ortho_scale = ortho; cam.clip_end = 100
    ob = link(bpy.data.objects.new('cam', cam)); ob.location = loc
    t = link(bpy.data.objects.new('cam_t', None)); t.location = target
    c = ob.constraints.new('TRACK_TO'); c.target = t; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
    bpy.context.scene.camera = ob
    return ob

def render(name):
    sc = bpy.context.scene
    sc.render.filepath = os.path.join(OUT, f'{name}.png')
    bpy.ops.render.render(write_still=True)
    print('RENDERED', sc.render.filepath)

# ------------------------------------------------------------------ shader helpers
def node(nt, kind, **kw):
    n = nt.nodes.new(kind)
    for k, v in kw.items():
        setattr(n, k, v)
    return n

def srgb(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x + .055) / 1.055) ** 2.4 if x > .04045 else x / 12.92 for x in c) + (1,)

def math_n(nt, op, a, b=None, clamp=False):
    m = node(nt, 'ShaderNodeMath', operation=op, use_clamp=clamp)
    for i, x in enumerate((a, b)):
        if x is None:
            continue
        if isinstance(x, (int, float)):
            m.inputs[i].default_value = x
        else:
            nt.links.new(x, m.inputs[i])
    return m.outputs[0]

def attr(nt, name):
    return node(nt, 'ShaderNodeAttribute', attribute_name=name).outputs['Fac']

def band(nt, x, centre, half):
    """1 inside |x - centre| < half, soft edges"""
    d = math_n(nt, 'ABSOLUTE', math_n(nt, 'SUBTRACT', x, centre))
    return math_n(nt, 'SUBTRACT', 1.0, math_n(nt, 'DIVIDE', d, half), clamp=True)

def mixc(nt, a, b, fac):
    m = node(nt, 'ShaderNodeMix', data_type='RGBA', blend_type='MIX')
    for sock, v in ((m.inputs[6], a), (m.inputs[7], b), (m.inputs[0], fac)):
        if isinstance(v, (tuple, list)):
            sock.default_value = v
        elif isinstance(v, (int, float)):
            sock.default_value = v
        else:
            nt.links.new(v, sock)
    return m.outputs[2]

def image(nt, path, vec, clip=True):
    img = bpy.data.images.load(path)
    t = node(nt, 'ShaderNodeTexImage', extension='CLIP' if clip else 'REPEAT', interpolation='Cubic')
    t.image = img
    nt.links.new(vec, t.inputs['Vector'])
    return t

def principled(nt):
    out = node(nt, 'ShaderNodeOutputMaterial')
    b = node(nt, 'ShaderNodeBsdfPrincipled')
    nt.links.new(b.outputs[0], out.inputs['Surface'])
    return b

def new_mat(name):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    return m, nt

def bump_from(nt, b, height, strength=.3, dist=.004):
    bp = node(nt, 'ShaderNodeBump'); bp.inputs['Strength'].default_value = strength; bp.inputs['Distance'].default_value = dist
    nt.links.new(height, bp.inputs['Height'])
    nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])

def knit(nt, co, wale=1100, course=260):
    """jersey knit: fine vertical wales"""
    mp = node(nt, 'ShaderNodeMapping'); mp.inputs['Scale'].default_value = (wale, course, wale)
    nt.links.new(co, mp.inputs['Vector'])
    n = node(nt, 'ShaderNodeTexNoise'); n.inputs['Scale'].default_value = 1; n.inputs['Detail'].default_value = 2
    nt.links.new(mp.outputs[0], n.inputs['Vector'])
    return n.outputs['Fac']

def cotton(name, base, print_png=None, twill=False):
    """deep green cotton; hems, seams and rib from mesh attributes; the print from the artwork image on UV"""
    m, nt = new_mat(name)
    b = principled(nt)
    tc = node(nt, 'ShaderNodeTexCoord')
    co = tc.outputs['Object']
    col = srgb(base)
    inside = attr(nt, 'inside')      # 1 where you see the inside of the back (the neckline)
    rib = attr(nt, 'rib')            # 1 on the knitted collar rib
    c = mixc(nt, col, tuple(x * .55 for x in col[:3]) + (1,), inside)
    height = knit(nt, co, *( (260, 260) if twill else (140, 60) ))
    if twill:
        # twill: fine diagonal ridges
        mp = node(nt, 'ShaderNodeMapping'); mp.inputs['Rotation'].default_value = (0, 0, math.radians(35))
        nt.links.new(co, mp.inputs['Vector'])
        w = node(nt, 'ShaderNodeTexWave', wave_type='BANDS'); w.inputs['Scale'].default_value = 900; w.inputs['Distortion'].default_value = 1.5
        nt.links.new(mp.outputs[0], w.inputs['Vector'])
        height = math_n(nt, 'ADD', math_n(nt, 'MULTIPLY', w.outputs['Fac'], .6), math_n(nt, 'MULTIPLY', height, .4))
    # rib: strong vertical ribs
    mpr = node(nt, 'ShaderNodeMapping'); mpr.inputs['Scale'].default_value = (420, 1, 1)
    nt.links.new(co, mpr.inputs['Vector'])
    wr = node(nt, 'ShaderNodeTexWave', wave_type='BANDS', bands_direction='X'); wr.inputs['Scale'].default_value = 1
    nt.links.new(mpr.outputs[0], wr.inputs['Vector'])
    height = mixc(nt, height, wr.outputs['Fac'], math_n(nt, 'MULTIPLY', rib, .9))
    # stitch lines: grooves at fixed distances from hems and seams (mm attributes)
    hem, seam = attr(nt, 'hem'), attr(nt, 'seam')
    groove = math_n(nt, 'MAXIMUM', band(nt, hem, 17.0, .9), band(nt, hem, 23.0, .9))
    groove = math_n(nt, 'MAXIMUM', groove, band(nt, seam, 0.0, 1.4))
    groove = math_n(nt, 'MAXIMUM', groove, band(nt, seam, 5.0, .7))
    fold = math_n(nt, 'MULTIPLY', band(nt, hem, 26.0, 1.6), .6)     # where the hem is turned
    c = mixc(nt, c, tuple(x * .45 for x in col[:3]) + (1,), math_n(nt, 'MULTIPLY', groove, .7))
    bw = node(nt, 'ShaderNodeRGBToBW'); nt.links.new(height, bw.inputs[0])
    h = math_n(nt, 'SUBTRACT', math_n(nt, 'MULTIPLY', bw.outputs[0], .35), math_n(nt, 'ADD', math_n(nt, 'MULTIPLY', groove, 2.0), fold))
    rough = .93
    if print_png and os.path.isfile(print_png):
        uv = node(nt, 'ShaderNodeUVMap', uv_map='print')
        t = image(nt, print_png, uv.outputs['UV'])
        a = math_n(nt, 'MULTIPLY', t.outputs['Alpha'], .96)
        c = mixc(nt, c, t.outputs['Color'], a)
        # plastisol sits on top of the knit: smoother, a hair higher, a little less rough
        h = math_n(nt, 'ADD', math_n(nt, 'MULTIPLY', h, math_n(nt, 'SUBTRACT', 1.0, math_n(nt, 'MULTIPLY', a, .7))), math_n(nt, 'MULTIPLY', a, .15))
        rr = math_n(nt, 'SUBTRACT', rough, math_n(nt, 'MULTIPLY', a, .3))
        nt.links.new(rr, b.inputs['Roughness'])
    else:
        b.inputs['Roughness'].default_value = rough
    nt.links.new(c, b.inputs['Base Color'])
    b.inputs['Sheen Weight'].default_value = .3
    b.inputs['Sheen Tint'].default_value = col
    b.inputs['Sheen Roughness'].default_value = .5
    b.inputs['Specular IOR Level'].default_value = .12
    bump_from(nt, b, h, .55, .008)
    return m

# ------------------------------------------------------------------ outlines from the kit's SVG paths (mm, y down)
def svg_points(d, step=1.5):
    toks = re.findall(r'[MLQHVZ]|-?\d+(?:\.\d+)?', d)
    pts, i, cur, cmd = [], 0, Vector((0, 0)), None
    def num():
        nonlocal i
        v = float(toks[i]); i += 1
        return v
    def line_to(p):
        n = max(1, int((p - cur).length / step))
        for k in range(1, n + 1):
            pts.append(cur.lerp(p, k / n))
    while i < len(toks):
        if re.match(r'[A-Z]', toks[i]):
            cmd = toks[i]; i += 1
        if cmd == 'M':
            cur = Vector((num(), num())); pts.append(cur.copy()); cmd = 'L'
        elif cmd == 'L':
            p = Vector((num(), num())); line_to(p); cur = p
        elif cmd == 'H':
            p = Vector((num(), cur.y)); line_to(p); cur = p
        elif cmd == 'V':
            p = Vector((cur.x, num())); line_to(p); cur = p
        elif cmd == 'Q':
            c1, p = Vector((num(), num())), Vector((num(), num()))
            n = max(4, int(((c1 - cur).length + (p - c1).length) / step))
            for k in range(1, n + 1):
                t = k / n
                pts.append((1 - t) ** 2 * cur + 2 * (1 - t) * t * c1 + t * t * p)
            cur = p
        elif cmd == 'Z':
            if pts:
                line_to(pts[0]); cur = pts[0]
            cmd = None
    return pts

def polyline(pairs, step=1.5):
    """open polyline through (x, y) mm points, densified"""
    out = []
    for a, b in zip(pairs, pairs[1:]):
        a, b = Vector(a), Vector(b)
        n = max(1, int((a - b).length / step))
        out += [a.lerp(b, k / n) for k in range(n)]
    out.append(Vector(pairs[-1]))
    return out

def quad(p0, c, p1, n=60):
    p0, c, p1 = Vector(p0), Vector(c), Vector(p1)
    return [(1 - t) ** 2 * p0 + 2 * (1 - t) * t * c + t * t * p1 for t in (k / n for k in range(n + 1))]

def tree(pts):
    kd = kdtree.KDTree(len(pts))
    for i, p in enumerate(pts):
        kd.insert((p.x, p.y, 0), i)
    kd.balance()
    return kd

def spans(outline, y):
    xs = []
    n = len(outline)
    for i in range(n):
        a, b = outline[i], outline[(i + 1) % n]
        if (a.y <= y < b.y) or (b.y <= y < a.y):
            xs.append(a.x + (y - a.y) / (b.y - a.y) * (b.x - a.x))
    xs.sort()
    return list(zip(xs[0::2], xs[1::2]))

def flat_piece(name, outline, w, h, cell=3.0, lift=12.0, reach=70.0, folds=1.0, seed=0, extra=None, creases=()):
    """a flat textile lying on the table: grid inside the outline, edge snapped to it, puffed and folded"""
    kd = tree(outline)
    bm = bmesh.new()
    nx, ny = int(w / cell) + 2, int(h / cell) + 2
    inside = {}
    for j in range(ny):
        y = j * cell
        for (x0, x1) in spans(outline, y):
            for i in range(max(0, int(x0 / cell)), min(nx, int(x1 / cell) + 2)):
                x = i * cell
                if x0 <= x <= x1:
                    inside[(i, j)] = None
    for (i, j) in list(inside):
        inside[(i, j)] = bm.verts.new((i * cell, j * cell, 0))
    for (i, j), v in inside.items():
        q = [inside.get(k) for k in ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1))]
        if all(q):
            bm.faces.new(q)
    for v in [v for v in bm.verts if not v.link_faces]:
        bm.verts.remove(v)
    bm.edges.ensure_lookup_table()
    edge_verts = {v for e in bm.edges if e.is_boundary for v in e.verts}
    for v in edge_verts:
        co, _, _ = kd.find((v.co.x, v.co.y, 0))
        v.co.x, v.co.y = co.x, co.y
    # height: puffed double layer + folds that fade out at the edge
    for v in bm.verts:
        x, y = v.co.x, v.co.y
        d = kd.find((x, y, 0))[2]
        s = min(1.0, d / reach); s = s * s * (3 - 2 * s)
        e = min(1.0, d / 25.0)
        # broad lumps, long soft creases, and tight wrinkles that gather in a few places (as cotton does)
        gather = max(0.0, noise.noise(Vector((x / 160 + seed, y / 140, 9.1))) + .15) * 2.2
        f = (10.0 * noise.noise(Vector((x / 200 + seed, y / 220, .3)))
             + 4.0 * noise.noise(Vector((x / 80, y / 100 + seed, 1.7)))
             - 3.5 * abs(noise.noise(Vector((x / 95 + seed, y / 260, 4.1))))
             - 3.0 * gather * abs(noise.noise(Vector((x / 22 + seed, y / 60, 2.9))))) * folds
        for (ax, ay, bx, by, depth, width) in creases:      # the few long folds a flat-laid piece really has
            ux, uy = bx - ax, by - ay
            t = max(0.0, min(1.0, ((x - ax) * ux + (y - ay) * uy) / (ux * ux + uy * uy)))
            q = math.hypot(x - ax - t * ux, y - ay - t * uy)
            f -= depth * math.exp(-(q / width) ** 2) * math.sin(math.pi * t) * folds
        v.co.z = lift * s + f * e
        v.co.x, v.co.y, v.co.z = x / U, -y / U, v.co.z / U
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    ob = link(bpy.data.objects.new(name, me))
    for p in me.polygons:
        p.use_smooth = True
    # print UVs: the artwork sheet covers the w x h box
    uvl = me.uv_layers.new(name='print')
    for loop in me.loops:
        co = me.vertices[loop.vertex_index].co
        uvl.data[loop.index].uv = (co.x * U / w, 1 + co.y * U / h)
    # mm attributes for the shader
    for nm in ('hem', 'seam', 'rib', 'inside'):
        me.attributes.new(nm, 'FLOAT', 'POINT')
    vals = {nm: [999.0] * len(me.vertices) for nm in ('hem', 'seam')}
    vals.update({nm: [0.0] * len(me.vertices) for nm in ('rib', 'inside')})
    if extra:
        extra(me, vals)
    for nm, arr in vals.items():
        me.attributes[nm].data.foreach_set('value', arr)
    sol = ob.modifiers.new('thick', 'SOLIDIFY'); sol.thickness = 1.6 / U; sol.offset = -1
    return ob

def dist_field(me, pts):
    kd = tree(pts)
    return [kd.find((v.co.x * U, -v.co.y * U, 0))[2] for v in me.vertices]

def top_camera(w, h, pad=0):
    camera((w / 2 / U, -h / 2 / U, 20), (w / 2 / U, -h / 2 / U, 0), max(w, h) / U * (1 + pad))

# ------------------------------------------------------------------ the pieces
GREEN = '#0d4214'    # renders to about the kit's pine #1d5d22 under the raking key

TEE_BACK = 'M175 30 Q280 52 385 30 L520 92 L560 250 L460 280 L455 700 Q280 722 105 700 L100 280 L0 250 L40 92 Z'
FRONT_NECK = quad((175, 30), (280, 150), (385, 30), 120)
BACK_NECK = quad((175, 30), (280, 52), (385, 30))
ARMHOLES = [quad((439, 59), (424, 180), (460, 280)), quad((121, 59), (136, 180), (100, 280))]
HEMS = [quad((455, 700), (280, 722), (105, 700)), polyline([(560, 250), (460, 280)]), polyline([(100, 280), (0, 250)])]

def tee(side):
    reset(1400, 1800)
    w, h = 560, 720
    def extra(me, vals):
        vals['hem'] = dist_field(me, [p for c in HEMS for p in c])
        vals['seam'] = dist_field(me, [p for c in ARMHOLES for p in c])
        xs = [p.x for p in FRONT_NECK]
        def front_y(x):
            for a, b in zip(FRONT_NECK, FRONT_NECK[1:]):
                if a.x <= x <= b.x:
                    return a.y + (x - a.x) / max(1e-6, b.x - a.x) * (b.y - a.y)
            return 30.0
        clamp = lambda t: max(0.0, min(1.0, t))
        bk = dist_field(me, BACK_NECK)
        for i, v in enumerate(me.vertices):
            x, y = v.co.x * U, -v.co.y * U
            back_rib = clamp((12 - bk[i]) / 2) if 160 <= x <= 400 else 0.0
            if side == 'front' and 170 <= x <= 390:
                o = y - front_y(min(385, max(175, x)))           # mm below the front neckline (negative: above it)
                ins = clamp(-o / 2.5)
                rib = clamp(o / 1.5) * clamp((15 - o) / 1.5)
                vals['inside'][i] = ins * (1 - back_rib)
                vals['rib'][i] = max(rib, back_rib * ins)
                v.co.z += (-4.0 * clamp(-o / 6) + 1.4 * rib) / U   # the back neck lies lower, seen through the neckline
            elif side == 'back':
                vals['rib'][i] = back_rib
                v.co.z += 1.0 * back_rib / U
    # folds from the armpits towards the middle, one across the waist
    creases = [(118, 300, 230, 470, 5.0, 11), (442, 300, 330, 460, 4.5, 10), (140, 575, 420, 560, 3.5, 22), (470, 140, 520, 235, 3.0, 9)]
    ob = flat_piece('tee', svg_points(TEE_BACK), w, h, seed=3 if side == 'front' else 8, extra=extra, creases=creases)
    ob.data.materials.append(cotton('cotton', GREEN, os.path.join(ART, f'tee-{side}-print.png')))
    lights(w / 2 / U, -h / 2 / U, 2.0, rake=True)
    top_camera(w, h)
    render(f'tee-{side}')

APRON = 'M190 60 H410 V230 Q470 240 560 300 L520 800 H80 L40 300 Q130 240 190 230 Z'

def ribbon(name, pts, width, z, mat):
    """a flat strap along a polyline (mm), lying on the table"""
    bm = bmesh.new()
    rows = []
    for k, p in enumerate(pts):
        a = pts[max(0, k - 1)]; b = pts[min(len(pts) - 1, k + 1)]
        t = (b - a).normalized(); nrm = Vector((-t.y, t.x))
        rows.append([bm.verts.new(((p.x + nrm.x * s * width / 2) / U, -(p.y + nrm.y * s * width / 2) / U, (z + .8 * noise.noise(Vector((k / 9, s, 2)))) / U)) for s in (-1, -.5, 0, .5, 1)])
    for r0, r1 in zip(rows, rows[1:]):
        for i in range(4):
            bm.faces.new((r0[i], r0[i + 1], r1[i + 1], r1[i]))
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for nm in ('hem', 'seam', 'rib', 'inside'):
        me.attributes.new(nm, 'FLOAT', 'POINT').data.foreach_set('value', [999.0 if nm in ('hem', 'seam') else 0.0] * len(me.vertices))
    me.uv_layers.new(name='print')
    for p in me.polygons:
        p.use_smooth = True
    ob = link(bpy.data.objects.new(name, me)); ob.data.materials.append(mat)
    sol = ob.modifiers.new('thick', 'SOLIDIFY'); sol.thickness = 1.8 / U; sol.offset = -1
    return ob

def apron():
    reset(1400, 1913)
    w, h = 600, 820
    outline = svg_points(APRON)
    def extra(me, vals):
        vals['hem'] = [d + 7 for d in dist_field(me, outline)]     # hemmed all round: stitch 10 and 16 mm in
        # the pocket: a patch 260 x 130 mm, stitched 5 mm in and down the middle
        for i, v in enumerate(me.vertices):
            x, y = v.co.x * U, -v.co.y * U
            if 170 <= x <= 430 and 520 <= y <= 650:
                e = min(x - 170, 430 - x, y - 520, 650 - y)
                v.co.z += min(1.0, e / 5) * 3.0 / U
                vals['seam'][i] = min(abs(e - 5), abs(x - 300) if y > 525 else 999)
                vals['inside'][i] = max(0.0, 1 - e / 2.5) * .6     # the shadow line under the patch edge
    creases = [(120, 330, 250, 520, 4.0, 14), (480, 330, 360, 540, 4.0, 14), (110, 700, 480, 690, 3.0, 24)]
    ob = flat_piece('apron', outline, w, h, cell=3.0, lift=8.0, reach=60.0, folds=1.0, seed=5, extra=extra, creases=creases)
    mat = cotton('twill', GREEN, os.path.join(ART, 'apron-print.png'), twill=True)
    ob.data.materials.append(mat)
    strap = cotton('strap', '#0f4318', None, twill=True)
    ribbon('neck', [Vector(p) for p in quad((196, 75), (300, -26), (404, 75), 50)], 22, 5, strap)
    ribbon('tie_l', [Vector(p) for p in quad((50, 305), (12, 420), (24, 560), 40)], 20, 2.5, strap)
    ribbon('tie_r', [Vector(p) for p in quad((550, 305), (588, 420), (576, 560), 40)], 20, 2.5, strap)
    lights(w / 2 / U, -h / 2 / U, 2.1, rake=True)
    top_camera(w, h)
    render('apron')

def cap():
    reset(1400, 1300)
    rx, ry = 96, 102
    seams = [math.radians(a) for a in (-90, -30, 30, 90, 150, 210)]
    bm = bmesh.new()
    nu, nv = 192, 48
    grid = []
    for j in range(nv + 1):
        ph = j / nv * math.pi / 2
        row = []
        for i in range(nu):
            th = i / nu * math.tau
            dth = min(abs((th - s + math.pi) % math.tau - math.pi) for s in seams)
            puff = 1 + .022 * math.sin(min(1, dth / math.radians(30)) * math.pi / 2) * math.cos(ph)
            r = math.cos(ph) * puff
            # structured front panels stand taller; the crown slopes down to the back
            hz = 88 - 14 * math.sin(th)
            z = hz * math.sin(ph) ** .62
            front = max(0, -math.sin(th))
            row.append(bm.verts.new((rx * r * math.cos(th) / U, ry * r * math.sin(th) / U * (1 - .08 * front * math.sin(ph)), (z + 6) / U)))
        grid.append(row)
    for j in range(nv):
        for i in range(nu):
            bm.faces.new((grid[j][i], grid[j][(i + 1) % nu], grid[j + 1][(i + 1) % nu], grid[j + 1][i]))
    bmesh.ops.remove_doubles(bm, verts=grid[-1], dist=.0005)
    me = bpy.data.meshes.new('crown'); bm.to_mesh(me); bm.free()
    for p in me.polygons:
        p.use_smooth = True
    crown = link(bpy.data.objects.new('crown', me))
    # seam distance (mm along the surface) for the shader
    me.attributes.new('seam', 'FLOAT', 'POINT'); me.attributes.new('hem', 'FLOAT', 'POINT')
    me.attributes.new('rib', 'FLOAT', 'POINT'); me.attributes.new('inside', 'FLOAT', 'POINT')
    sv = []
    for v in me.vertices:
        th = math.atan2(v.co.y, v.co.x)
        rr = math.hypot(v.co.x, v.co.y) * U
        sv.append(min(abs((th - s + math.pi) % math.tau - math.pi) for s in seams) * rr)
    me.attributes['seam'].data.foreach_set('value', sv)
    me.attributes['hem'].data.foreach_set('value', [999.0] * len(me.vertices))
    me.attributes['rib'].data.foreach_set('value', [0.0] * len(me.vertices))
    me.attributes['inside'].data.foreach_set('value', [0.0] * len(me.vertices))
    # the seal, embroidered on the front panels: projected straight from the front
    m, nt = new_mat('cap')
    b = principled(nt)
    tc = node(nt, 'ShaderNodeTexCoord')
    co = tc.outputs['Object']
    sep = node(nt, 'ShaderNodeSeparateXYZ'); nt.links.new(co, sep.inputs[0])
    # projected along the camera's line of sight (50 degrees up, from the front), centred on the front panel,
    # then squashed a little as embroidery on a panel that leans back would look
    el = math.radians(50)
    u = math_n(nt, 'ADD', math_n(nt, 'DIVIDE', sep.outputs['X'], 55 / U), .5)
    up = math_n(nt, 'ADD', math_n(nt, 'MULTIPLY', math_n(nt, 'ADD', sep.outputs['Y'], 90 / U), math.sin(el)),
                math_n(nt, 'MULTIPLY', math_n(nt, 'SUBTRACT', sep.outputs['Z'], 64 / U), math.cos(el)))
    vv = math_n(nt, 'ADD', math_n(nt, 'DIVIDE', up, 55 * .86 / U), .5)
    cmb = node(nt, 'ShaderNodeCombineXYZ'); nt.links.new(u, cmb.inputs['X']); nt.links.new(vv, cmb.inputs['Y'])
    t = image(nt, os.path.join(ART, 'cap-print.png'), cmb.outputs[0])
    front = math_n(nt, 'LESS_THAN', sep.outputs['Y'], 0)
    a = math_n(nt, 'MULTIPLY', t.outputs['Alpha'], front)
    seam = attr(nt, 'seam')
    groove = math_n(nt, 'MAXIMUM', band(nt, seam, 0, 1.8), math_n(nt, 'MULTIPLY', band(nt, seam, 4.5, .7), .7))
    col = mixc(nt, mixc(nt, srgb(GREEN), (0.004, 0.022, 0.006, 1), math_n(nt, 'MULTIPLY', groove, .55)), srgb('#f4f2ec'), a)
    nt.links.new(col, b.inputs['Base Color'])
    mp = node(nt, 'ShaderNodeMapping'); mp.inputs['Rotation'].default_value = (0, math.radians(35), 0)
    nt.links.new(co, mp.inputs['Vector'])
    wv = node(nt, 'ShaderNodeTexWave', wave_type='BANDS'); wv.inputs['Scale'].default_value = 900; wv.inputs['Distortion'].default_value = 1.2
    nt.links.new(mp.outputs[0], wv.inputs['Vector'])
    # satin stitches run across the letters: a finer, brighter wave where the thread is
    ws = node(nt, 'ShaderNodeTexWave', wave_type='BANDS', bands_direction='Y'); ws.inputs['Scale'].default_value = 1500
    nt.links.new(co, ws.inputs['Vector'])
    h = math_n(nt, 'SUBTRACT', math_n(nt, 'MULTIPLY', wv.outputs['Fac'], .45), groove)
    h = math_n(nt, 'ADD', h, math_n(nt, 'MULTIPLY', a, math_n(nt, 'ADD', 1.2, math_n(nt, 'MULTIPLY', ws.outputs['Fac'], .4))))
    bump_from(nt, b, h, .4, .006)
    b.inputs['Roughness'].default_value = .93
    b.inputs['Specular IOR Level'].default_value = .12
    b.inputs['Sheen Weight'].default_value = .5
    b.inputs['Sheen Roughness'].default_value = .5
    crown.data.materials.append(m)
    # the button on top
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=12, radius=7 / U)
    for v in bm.verts:
        v.co.z *= .45
    bm.transform(Matrix.Translation((0, 0, (88 + 6 + 1.5) / U)))
    me2 = bpy.data.meshes.new('button'); bm.to_mesh(me2); bm.free()
    for p in me2.polygons:
        p.use_smooth = True
    btn = link(bpy.data.objects.new('button', me2)); btn.data.materials.append(m)
    # the brim: pre-curved, stitched in rows
    bm = bmesh.new(); rows = []
    span = math.radians(66)
    for j in range(0, 33):
        t = j / 32
        row = []
        for i in range(0, 97):
            a = -math.pi / 2 + (i / 96 - .5) * 2 * span
            side = abs(i / 96 - .5) * 2
            r_in = 1 / math.sqrt((math.cos(a) / rx) ** 2 + (math.sin(a) / ry) ** 2)
            r = r_in + t * 74 * max(0, math.cos(side * math.pi / 2)) ** .8
            z = 8 + t * 3 - 13 * side ** 2 - 4 * t * side
            row.append(bm.verts.new((r * math.cos(a) / U, r * math.sin(a) / U, max(1.2, z) / U)))
        rows.append(row)
    for j in range(32):
        for i in range(96):
            bm.faces.new((rows[j][i], rows[j][i + 1], rows[j + 1][i + 1], rows[j + 1][i]))
    me3 = bpy.data.meshes.new('brim'); bm.to_mesh(me3); bm.free()
    for p in me3.polygons:
        p.use_smooth = True
    brim = link(bpy.data.objects.new('brim', me3))
    m3, nt3 = new_mat('brim')
    b3 = principled(nt3)
    b3.inputs['Base Color'].default_value = srgb('#0b3a11')
    b3.inputs['Roughness'].default_value = .93
    b3.inputs['Specular IOR Level'].default_value = .12
    b3.inputs['Sheen Weight'].default_value = .5
    # stitch rows parallel to the edge: distance from the crown in object space
    tc3 = node(nt3, 'ShaderNodeTexCoord')
    g = node(nt3, 'ShaderNodeTexGradient', gradient_type='SPHERICAL')
    mp3 = node(nt3, 'ShaderNodeMapping'); mp3.inputs['Scale'].default_value = (1 / 1.8, 1 / 1.85, 1)
    nt3.links.new(tc3.outputs['Object'], mp3.inputs['Vector']); nt3.links.new(mp3.outputs[0], g.inputs['Vector'])
    wv3 = node(nt3, 'ShaderNodeTexWave', wave_type='RINGS'); wv3.inputs['Scale'].default_value = 1.0
    mp4 = node(nt3, 'ShaderNodeMapping'); mp4.inputs['Scale'].default_value = (17, 17.5, 0)
    nt3.links.new(tc3.outputs['Object'], mp4.inputs['Vector']); nt3.links.new(mp4.outputs[0], wv3.inputs['Vector'])
    bump_from(nt3, b3, math_n(nt3, 'POWER', wv3.outputs['Fac'], 6), .25, .004)
    brim.data.materials.append(m3)
    sol = brim.modifiers.new('thick', 'SOLIDIFY'); sol.thickness = 3 / U; sol.offset = -1
    # look at it from the front, from above
    el = math.radians(50)
    # frame the whole cap: centre its projected outline in a 280 x 260 mm view
    bpy.context.view_layer.update()
    up, right = Vector((0, math.sin(el), math.cos(el))), Vector((1, 0, 0))
    pts = [ob.matrix_world @ v.co for ob in (crown, brim, btn) for v in ob.data.vertices]
    pu = [p.dot(up) for p in pts]; pr = [p.dot(right) for p in pts]
    mid_u, mid_r = (min(pu) + max(pu)) / 2, (min(pr) + max(pr)) / 2
    print('CAP EXTENT mm', round((max(pr) - min(pr)) * U), round((max(pu) - min(pu)) * U))
    tgt = up * mid_u + right * mid_r
    lights(0, 0, 1.1, rake=True)
    camera(tgt + Vector((0, -math.cos(el), math.sin(el))) * 8, tgt, 280 / U)
    render('cap')

def cup():
    reset(1360, 1000)
    R0, R1, H = 30, 45, 115
    bm = bmesh.new()
    nu, nv = 160, 40
    rows = []
    for j in range(nv + 1):
        z = j / nv * H
        r = R0 + (R1 - R0) * z / H
        rows.append([bm.verts.new((r * math.cos(i / nu * math.tau) / U, r * math.sin(i / nu * math.tau) / U, z / U)) for i in range(nu)])
    for j in range(nv):
        for i in range(nu):
            bm.faces.new((rows[j][i], rows[j][(i + 1) % nu], rows[j + 1][(i + 1) % nu], rows[j + 1][i]))
    bottom = bm.faces.new(rows[0][::-1])
    me = bpy.data.meshes.new('cup'); bm.to_mesh(me); bm.free()
    for p in me.polygons:
        p.use_smooth = p.index != len(me.polygons) - 1
    uvl = me.uv_layers.new(name='print')
    for loop in me.loops:
        co = me.vertices[loop.vertex_index].co
        th = math.atan2(co.y, co.x) % math.tau
        uvl.data[loop.index].uv = ((th / math.pi + .5) % 1.0, co.z * U / H)
    body = link(bpy.data.objects.new('cup', me))
    m, nt = new_mat('paper')
    b = principled(nt)
    uv = node(nt, 'ShaderNodeUVMap', uv_map='print')
    t = image(nt, os.path.join(ART, 'cup-print.png'), uv.outputs['UV'], clip=False)
    nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = .55
    b.inputs['Coat Weight'].default_value = .15
    n = node(nt, 'ShaderNodeTexNoise'); n.inputs['Scale'].default_value = 900
    bump_from(nt, b, n.outputs['Fac'], .05, .002)
    body.data.materials.append(m)
    # rolled rim + lid
    bm = bmesh.new()
    prof = [(44.0, 112.0), (47.6, 113.5), (48.6, 116.5), (47.8, 119.5), (45.0, 120.0), (44.0, 121.2), (36.0, 124.0), (20.0, 126.0), (8.0, 126.4), (0.0, 126.5)]
    vs = [bm.verts.new((x / U, 0, z / U)) for x, z in prof]
    for a_, b_ in zip(vs, vs[1:]):
        bm.edges.new((a_, b_))
    bmesh.ops.spin(bm, geom=bm.verts[:] + bm.edges[:], cent=(0, 0, 0), axis=(0, 0, 1), angle=math.tau, steps=96, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=.00005)
    me2 = bpy.data.meshes.new('lid'); bm.to_mesh(me2); bm.free()
    for p in me2.polygons:
        p.use_smooth = True
    lid = link(bpy.data.objects.new('lid', me2))
    m2, nt2 = new_mat('lid')
    b2 = principled(nt2)
    b2.inputs['Base Color'].default_value = srgb('#f3f1ec')
    b2.inputs['Roughness'].default_value = .32
    b2.inputs['Subsurface Weight'].default_value = .2
    lid.data.materials.append(m2)
    # lay it down: the axis along +x, tipped so both the base and the lid rim touch the table
    alpha = math.atan2(48.6 - R0, 116.5)
    rot = Matrix.Rotation(math.pi / 2 - alpha, 4, 'Y')
    for ob in (body, lid):
        ob.matrix_world = rot
    bpy.context.view_layer.update()
    zmin = min((ob.matrix_world @ v.co).z for ob in (body, lid) for v in ob.data.vertices)
    xs = [(ob.matrix_world @ v.co).x for ob in (body, lid) for v in ob.data.vertices]
    for ob in (body, lid):
        ob.matrix_world = Matrix.Translation((-(min(xs) + max(xs)) / 2, 0, -zmin)) @ rot
    lights(0, 0, .7)
    camera((0, 0, 20), (0, 0, 0), 136 / U)
    render('cup')

PIECES = {'tee-front': lambda: tee('front'), 'tee-back': lambda: tee('back'), 'apron': apron, 'cap': cap, 'cup': cup}
if __name__ == '__main__':
    ids = [i for i in args.only.split(',') if i] or list(PIECES)
    for pid in ids:
        PIECES[pid]()
    print('WEAR_DONE')
