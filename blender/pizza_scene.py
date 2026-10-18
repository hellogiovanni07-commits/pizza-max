"""Pizza Max — Blender scene builder and renderer.

Builds a photoreal pizza (crust, sauce, melted cheese, toppings) on a round
wooden board, then renders:
  * menu stills per pizza: angled on the board, and straight from above
  * flat textures for the live three.js hero pizza (cheese, wood, salami, tomato)

Run headless:
  blender -b -P blender/pizza_scene.py -- --out assets [--only marg] [--res 900] [--samples 96] [--tex]
"""
import bpy, bmesh, math, random, sys, os, argparse
from mathutils import Vector, noise

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument('--out', default='assets')
ap.add_argument('--only', default='')
ap.add_argument('--res', type=int, default=900)
ap.add_argument('--samples', type=int, default=96)
ap.add_argument('--tex', action='store_true', help='also render hero textures')
ap.add_argument('--props', action='store_true', help='also render hero ingredient props')
ap.add_argument('--no-pizzas', action='store_true')
ap.add_argument('--views', default='angle,top')
ap.add_argument('--exposure', type=float, default=-1.45)
ap.add_argument('--vt', default='Standard')
ap.add_argument('--look', default='Medium High Contrast')
ap.add_argument('--tag', default='')
args = ap.parse_args(argv)
OUT = os.path.abspath(args.out)
os.makedirs(os.path.join(OUT, 'pizza'), exist_ok=True)
os.makedirs(os.path.join(OUT, 'tex'), exist_ok=True)
os.makedirs(os.path.join(OUT, 'props'), exist_ok=True)

PIZZAS = {
    'marg':    ['tomato', 'basil', 'mozz'],
    'salami':  ['pepperoni', 'pepperoni'],
    'diavolo': ['pepperoni', 'jalapeno', 'chili', 'onion'],
    'funghi':  ['mushroom', 'mozz'],
    'garden':  ['tomato', 'mushroom', 'pepper', 'pepper_y', 'olive', 'rocket'],
    'tonno':   ['tuna', 'onion', 'olive', 'caper'],
    'hawaii':  ['ham', 'pineapple'],
    'supreme': ['pepperoni', 'ham', 'pepper', 'olive', 'mushroom', 'onion', 'jalapeno'],
}
R_PIZZA, R_CHEESE, CHEESE_Z = 2.0, 1.6, .20

# ------------------------------------------------------------------ scene
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = args.samples
    sc.cycles.use_denoising = True
    sc.render.film_transparent = True
    sc.render.resolution_x = sc.render.resolution_y = args.res
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = args.vt
    try:
        sc.view_settings.look = args.look
    except TypeError:
        pass
    world = bpy.data.worlds.new('w'); sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (1.0, .97, .92, 1)
    bg.inputs['Strength'].default_value = .18
    sc.view_settings.exposure = args.exposure
    return sc

def node(nt, kind, **kw):
    n = nt.nodes.new(kind)
    for k, v in kw.items():
        setattr(n, k, v)
    return n

def sock(n, ident):
    for s in list(n.inputs) + list(n.outputs):
        if s.identifier == ident or s.name == ident:
            return s
    raise KeyError(ident)

def mix(nt, a, b, fac):
    m = node(nt, 'ShaderNodeMix', data_type='RGBA', blend_type='MIX')
    for v, ident in ((a, 'A_Color'), (b, 'B_Color')):
        s = [x for x in m.inputs if x.identifier == ident][0]
        if isinstance(v, tuple): s.default_value = v
        else: nt.links.new(v, s)
    f = m.inputs[0]
    if isinstance(fac, float): f.default_value = fac
    else: nt.links.new(fac, f)
    return [x for x in m.outputs if x.identifier == 'Result_Color'][0]

def ramp(nt, src, stops):
    r = node(nt, 'ShaderNodeValToRGB')
    els = r.color_ramp.elements
    while len(els) > 1: els.remove(els[-1])
    els[0].position, els[0].color = stops[0]
    for pos, col in stops[1:]:
        e = els.new(pos); e.color = col
    nt.links.new(src, r.inputs['Fac'])
    return r.outputs['Color'], r.outputs['Alpha']

def material(name, build):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    out = node(nt, 'ShaderNodeOutputMaterial')
    bsdf = node(nt, 'ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs[0], out.inputs['Surface'])
    tc = node(nt, 'ShaderNodeTexCoord')
    build(nt, bsdf, tc.outputs['Object'], out)
    return m

def noise_tex(nt, co, scale, detail=6, rough=.55, dist=0.0):
    n = node(nt, 'ShaderNodeTexNoise')
    n.inputs['Scale'].default_value = scale
    n.inputs['Detail'].default_value = detail
    n.inputs['Roughness'].default_value = rough
    n.inputs['Distortion'].default_value = dist
    nt.links.new(co, n.inputs['Vector'])
    return n.outputs['Fac']

def voronoi(nt, co, scale, rand=1.0):
    v = node(nt, 'ShaderNodeTexVoronoi', feature='F1')
    v.inputs['Scale'].default_value = scale
    v.inputs['Randomness'].default_value = rand
    nt.links.new(co, v.inputs['Vector'])
    return v.outputs['Distance']

def sph(nt, co, r):
    mp = node(nt, 'ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1 / r, 1 / r, 1 / r)
    nt.links.new(co, mp.inputs['Vector'])
    g = node(nt, 'ShaderNodeTexGradient', gradient_type='SPHERICAL')
    nt.links.new(mp.outputs[0], g.inputs['Vector'])
    return g.outputs['Fac']

def bump(nt, bsdf, height, strength=.25, dist=.02):
    b = node(nt, 'ShaderNodeBump')
    b.inputs['Strength'].default_value = strength
    b.inputs['Distance'].default_value = dist
    nt.links.new(height, b.inputs['Height'])
    nt.links.new(b.outputs['Normal'], bsdf.inputs['Normal'])

def set_bsdf(bsdf, **kw):
    for k, v in kw.items():
        name = {'rough': 'Roughness', 'sss': 'Subsurface Weight', 'coat': 'Coat Weight', 'spec': 'Specular IOR Level'}.get(k, k)
        bsdf.inputs[name].default_value = v

# ------------------------------------------------------------------ materials
def mats():
    M = {}
    def dough(nt, b, co, out):
        n = noise_tex(nt, co, 9)
        c, _ = ramp(nt, n, [(0.3, (.80, .52, .26, 1)), (.75, (.93, .72, .44, 1))])
        nt.links.new(c, b.inputs['Base Color']); set_bsdf(b, rough=.8)
        bump(nt, b, n, .3)
    M['dough'] = material('dough', dough)

    def crust(nt, b, co, out):
        big = noise_tex(nt, co, 4.5, 8, .62, .5)
        fine = noise_tex(nt, co, 60, 4, .6)
        sep = node(nt, 'ShaderNodeSeparateXYZ'); nt.links.new(co, sep.inputs[0])
        mr = node(nt, 'ShaderNodeMapRange'); mr.inputs['From Min'].default_value = .16; mr.inputs['From Max'].default_value = .33
        nt.links.new(sep.outputs['Z'], mr.inputs['Value'])
        add = node(nt, 'ShaderNodeMath', operation='ADD'); add.use_clamp = True
        nt.links.new(mr.outputs[0], add.inputs[0])
        sc_ = node(nt, 'ShaderNodeMath', operation='MULTIPLY'); sc_.inputs[1].default_value = .45
        nt.links.new(big, sc_.inputs[0]); nt.links.new(sc_.outputs[0], add.inputs[1])
        base, _ = ramp(nt, add.outputs[0], [(0.12, (.86, .62, .33, 1)), (.42, (.72, .42, .15, 1)), (.72, (.50, .24, .07, 1)), (1.0, (.28, .11, .03, 1))])
        char = voronoi(nt, co, 16, 1)
        cm, _ = ramp(nt, char, [(0.0, (1, 1, 1, 1)), (.08, (1, 1, 1, 1)), (.12, (0, 0, 0, 1))])
        gate = node(nt, 'ShaderNodeMath', operation='MULTIPLY')
        nt.links.new(cm, gate.inputs[0]); nt.links.new(mr.outputs[0], gate.inputs[1])
        col = mix(nt, base, (.16, .07, .02, 1), gate.outputs[0])     # char blisters on the top
        flour, _ = ramp(nt, fine, [(0.74, (0, 0, 0, 1)), (.8, (1, 1, 1, 1))])
        col = mix(nt, col, (.95, .91, .82, 1), flour)
        nt.links.new(col, b.inputs['Base Color']); set_bsdf(b, rough=.75)
        bump(nt, b, big, .6, .04)
    M['crust'] = material('crust', crust)

    def sauce(nt, b, co, out):
        n = noise_tex(nt, co, 12)
        c, _ = ramp(nt, n, [(0.3, (.30, .03, .015, 1)), (.55, (.55, .07, .03, 1)), (.8, (.72, .14, .05, 1))])
        herb = voronoi(nt, co, 90, 1)
        hm, _ = ramp(nt, herb, [(0.0, (1, 1, 1, 1)), (.07, (1, 1, 1, 1)), (.1, (0, 0, 0, 1))])
        col = mix(nt, c, (.12, .14, .04, 1), hm)                    # oregano flecks
        nt.links.new(col, b.inputs['Base Color']); set_bsdf(b, rough=.3, coat=.2)
        bump(nt, b, n, .2)
    M['sauce'] = material('sauce', sauce)

    def cheese(nt, b, co, out):
        n = noise_tex(nt, co, 5, 8, .62, .3)
        base, _ = ramp(nt, n, [(0.3, (.80, .46, .10, 1)), (.5, (.93, .66, .24, 1)), (.72, (.99, .84, .50, 1))])
        bub = voronoi(nt, co, 3.6, 1)
        bm, _ = ramp(nt, bub, [(0.0, (1, 1, 1, 1)), (.16, (1, 1, 1, 1)), (.26, (0, 0, 0, 1))])
        bn = noise_tex(nt, co, 2.2, 3)
        gate, _ = ramp(nt, bn, [(0.22, (0, 0, 0, 1)), (.42, (1, 1, 1, 1))])
        mm = node(nt, 'ShaderNodeMath', operation='MULTIPLY')
        nt.links.new(bm, mm.inputs[0]); nt.links.new(gate, mm.inputs[1])
        col = mix(nt, base, (.45, .20, .04, 1), mm.outputs[0])   # browned bubbles in patches
        sp = noise_tex(nt, co, 3, 4, .5)
        spm, _ = ramp(nt, sp, [(0.57, (0, 0, 0, 1)), (.61, (1, 1, 1, 1))])
        col = mix(nt, col, (.55, .08, .03, 1), spm)               # sauce peeking through
        oil = noise_tex(nt, co, 3, 2)
        om, _ = ramp(nt, oil, [(0.62, (0, 0, 0, 1)), (.72, (1, 1, 1, 1))])
        col = mix(nt, col, (.95, .55, .16, 1), om)                # orange oil sheen
        blot = noise_tex(nt, co, 1.6, 3)
        bl, _ = ramp(nt, blot, [(0.5, (0, 0, 0, 1)), (.7, (.65, .65, .65, 1))])
        col = mix(nt, col, (.62, .32, .08, 1), bl)                # broad golden-brown blotches
        nt.links.new(col, b.inputs['Base Color'])
        set_bsdf(b, rough=.38, sss=.12, coat=.12)
        bump(nt, b, bub, .35, .02)
    M['cheese'] = material('cheese', cheese)

    def wood(nt, b, co, out):
        mp = node(nt, 'ShaderNodeMapping'); mp.inputs['Scale'].default_value = (14, .9, 14)
        nt.links.new(co, mp.inputs['Vector'])
        n = node(nt, 'ShaderNodeTexNoise'); n.inputs['Scale'].default_value = 2.2; n.inputs['Detail'].default_value = 10
        n.inputs['Distortion'].default_value = 1.5
        nt.links.new(mp.outputs[0], n.inputs['Vector'])
        c, _ = ramp(nt, n.outputs['Fac'], [(0.25, (.20, .10, .045, 1)), (.5, (.32, .18, .08, 1)), (.75, (.44, .27, .13, 1))])
        nt.links.new(c, b.inputs['Base Color']); set_bsdf(b, rough=.5, coat=.15)
        bump(nt, b, n.outputs['Fac'], .02)
    M['wood'] = material('wood', wood)

    def flat(name, rgb, rough=.4, sss=0., coat=0.):
        def f(nt, b, co, out):
            b.inputs['Base Color'].default_value = (*rgb, 1); set_bsdf(b, rough=rough, sss=sss, coat=coat)
        M[name] = material(name, f)
    flat('olive', (.03, .025, .03), .3, coat=.2)
    flat('pepper', (.07, .36, .05), .3, coat=.15)
    def basil(nt, b, co, out):
        sep = node(nt, 'ShaderNodeSeparateXYZ'); nt.links.new(co, sep.inputs[0])
        ax = node(nt, 'ShaderNodeMath', operation='ABSOLUTE'); nt.links.new(sep.outputs['X'], ax.inputs[0])
        rib, _ = ramp(nt, ax.outputs[0], [(0.0, (.10, .30, .06, 1)), (.01, (.10, .30, .06, 1)), (.018, (.035, .19, .03, 1))])
        n = noise_tex(nt, co, 40, 4)
        vein, _ = ramp(nt, n, [(0.45, (0, 0, 0, 1)), (.6, (.35, .35, .35, 1))])
        col = mix(nt, rib, (.02, .12, .02, 1), vein)
        nt.links.new(col, b.inputs['Base Color']); set_bsdf(b, rough=.55, sss=.25)
        bump(nt, b, n, .15, .01)
    M['basil'] = material('basil', basil)
    flat('rocket', (.05, .20, .035), .45, sss=.2)
    flat('pepper_y', (.92, .62, .03), .3, sss=.15, coat=.2)
    flat('caper', (.17, .20, .06), .3, coat=.3)
    flat('mozz', (.95, .91, .80), .4, sss=.5)
    flat('onion', (.62, .26, .46), .25, sss=.8, coat=.25)
    flat('pineapple', (.92, .66, .16), .3, sss=.3, coat=.15)
    flat('chili', (.55, .05, .03), .3, coat=.15)

    def pep(nt, b, co, out):
        gf = sph(nt, co, .23)
        rim, _ = ramp(nt, gf, [(0.0, (.10, .018, .01, 1)), (.045, (.16, .025, .012, 1)), (.075, (.50, .075, .04, 1)), (.7, (.56, .085, .045, 1)), (1.0, (.44, .06, .03, 1))])
        fat = voronoi(nt, co, 34, 1)
        fm, _ = ramp(nt, fat, [(0.0, (1, 1, 1, 1)), (.09, (1, 1, 1, 1)), (.15, (0, 0, 0, 1))])
        col = mix(nt, rim, (.86, .55, .45, 1), fm)
        nt.links.new(col, b.inputs['Base Color']); set_bsdf(b, rough=.42, coat=.08)   # a little oily, never glassy
        bump(nt, b, fat, .35, .01)
    M['pepperoni'] = material('pepperoni', pep)

    def tom(nt, b, co, out):
        gf = sph(nt, co, .2)
        c, _ = ramp(nt, gf, [(0.0, (.40, .03, .02, 1)), (.06, (.66, .06, .03, 1)), (.14, (.85, .18, .09, 1)), (.5, (.80, .12, .06, 1)), (1.0, (.92, .30, .18, 1))])
        sep = node(nt, 'ShaderNodeSeparateXYZ'); nt.links.new(co, sep.inputs[0])
        ang = node(nt, 'ShaderNodeMath', operation='ARCTAN2'); nt.links.new(sep.outputs['Y'], ang.inputs[0]); nt.links.new(sep.outputs['X'], ang.inputs[1])
        k = node(nt, 'ShaderNodeMath', operation='MULTIPLY'); k.inputs[1].default_value = 4 / math.pi * 2
        nt.links.new(ang.outputs[0], k.inputs[0])
        sn = node(nt, 'ShaderNodeMath', operation='SINE'); nt.links.new(k.outputs[0], sn.inputs[0])
        band = node(nt, 'ShaderNodeMath', operation='MULTIPLY')
        mid, _ = ramp(nt, gf, [(0.25, (0, 0, 0, 1)), (.4, (1, 1, 1, 1)), (.7, (1, 1, 1, 1)), (.82, (0, 0, 0, 1))])
        nt.links.new(sn.outputs[0], band.inputs[0]); nt.links.new(mid, band.inputs[1])
        pocket, _ = ramp(nt, band.outputs[0], [(0.35, (0, 0, 0, 1)), (.6, (1, 1, 1, 1))])
        col = mix(nt, c, (.98, .55, .32, 1), pocket)                  # jelly pockets
        seeds = voronoi(nt, co, 60, 1)
        sm, _ = ramp(nt, seeds, [(0.0, (1, 1, 1, 1)), (.1, (1, 1, 1, 1)), (.16, (0, 0, 0, 1))])
        gate = node(nt, 'ShaderNodeMath', operation='MULTIPLY'); nt.links.new(sm, gate.inputs[0]); nt.links.new(pocket, gate.inputs[1])
        col = mix(nt, col, (.97, .86, .55, 1), gate.outputs[0])        # seeds
        nt.links.new(col, b.inputs['Base Color']); set_bsdf(b, rough=.25, sss=.3, coat=.15)
    M['tomato'] = material('tomato', tom)

    def jal(nt, b, co, out):
        gf = sph(nt, co, .1)
        c, _ = ramp(nt, gf, [(0.0, (.04, .16, .02, 1)), (.1, (.05, .19, .025, 1)), (.13, (.36, .58, .16, 1)), (.55, (.42, .64, .2, 1)), (.62, (.86, .86, .6, 1))])
        nt.links.new(c, b.inputs['Base Color']); set_bsdf(b, rough=.3, sss=.3, coat=.3)
    M['jalapeno'] = material('jalapeno', jal)

    def ham(nt, b, co, out):
        n = noise_tex(nt, co, 18, 4)
        c, _ = ramp(nt, n, [(0.35, (.78, .36, .40, 1)), (.7, (.93, .62, .62, 1))])
        nt.links.new(c, b.inputs['Base Color']); set_bsdf(b, rough=.35, sss=.3)
    M['ham'] = material('ham', ham)

    def tuna(nt, b, co, out):
        n = noise_tex(nt, co, 25, 6)
        mp = node(nt, 'ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1, 6, 1)
        nt.links.new(co, mp.inputs['Vector'])
        fib = noise_tex(nt, mp.outputs[0], 30, 6, .6)                # fibres along the flake
        c, _ = ramp(nt, fib, [(0.3, (.62, .45, .34, 1)), (.7, (.86, .72, .60, 1))])
        nt.links.new(c, b.inputs['Base Color']); set_bsdf(b, rough=.75)
        bump(nt, b, fib, .5)
    M['tuna'] = material('tuna', tuna)

    def mush(nt, b, co, out):
        n = noise_tex(nt, co, 30, 4)
        c, _ = ramp(nt, n, [(0.3, (.52, .40, .29, 1)), (.7, (.82, .73, .60, 1))])
        nt.links.new(c, b.inputs['Base Color']); set_bsdf(b, rough=.55)
    M['mushroom'] = material('mushroom', mush)
    flat('tomato_whole', (.70, .05, .03), .3, sss=.2, coat=.25)
    flat('chili_whole', (.62, .04, .03), .15, coat=.7)
    flat('garlic', (.93, .89, .80), .45, sss=.4)
    flat('ceramic', (.93, .92, .89), .15, coat=.6)
    return M

# ------------------------------------------------------------------ geometry helpers
def link(obj):
    bpy.context.scene.collection.objects.link(obj); return obj

def mesh_obj(name, bm, mat=None, smooth=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    if smooth:
        me.shade_smooth() if hasattr(me, 'shade_smooth') else [setattr(p, 'use_smooth', True) for p in me.polygons]
    ob = bpy.data.objects.new(name, me)
    if mat: ob.data.materials.append(mat)
    return link(ob)

def cylinder(name, r, h, z, mat, segs=96, bevel=0.0):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segs, radius1=r, radius2=r, depth=h)
    ob = mesh_obj(name, bm, mat)
    ob.location.z = z
    if bevel:
        mod = ob.modifiers.new('bev', 'BEVEL'); mod.width = bevel; mod.segments = 3
    return ob

def disc_polar(name, radius_fn, rings, segs, z_fn, mat):
    bm = bmesh.new()
    centre = bm.verts.new((0, 0, z_fn(0, 0)))
    grid = []
    for i in range(1, rings + 1):
        t = i / rings
        row = []
        for j in range(segs):
            a = j / segs * math.tau
            r = radius_fn(a) * t
            x, y = r * math.cos(a), r * math.sin(a)
            row.append(bm.verts.new((x, y, z_fn(x, y))))
        grid.append(row)
    for j in range(segs):
        bm.faces.new((centre, grid[0][j], grid[0][(j + 1) % segs]))
    for i in range(rings - 1):
        for j in range(segs):
            bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][(j + 1) % segs], grid[i][(j + 1) % segs]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_obj(name, bm, mat)

def disc_grid(name, radius_fn, n, size, z_fn, mat):
    """dense grid clipped to an irregular disc, z from z_fn(x, y)"""
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=n, y_segments=n, size=size / 2)
    kill = [v for v in bm.verts if v.co.xy.length > radius_fn(math.atan2(v.co.y, v.co.x))]
    bmesh.ops.delete(bm, geom=kill, context='VERTS')
    for v in bm.verts:
        v.co.z = z_fn(v.co.x, v.co.y)
    return mesh_obj(name, bm, mat)

def place(ob, x, y, z, rz, tilt=.06):
    ob.location = (x, y, z)
    ob.rotation_euler = (random.uniform(-tilt, tilt), random.uniform(-tilt, tilt), rz)
    return ob

# ------------------------------------------------------------------ pizza base
CUTS = [i * math.pi / 4 for i in range(4)]
def cut_depth(x, y):
    d = min(abs(-math.sin(a) * x + math.cos(a) * y) for a in CUTS)
    return -.028 * max(0, 1 - d / .022)

def build_base(M, seed):
    random.seed(seed)
    off = Vector((seed * 3.1, seed * 1.7, 0))
    cylinder('base', R_PIZZA - .02, .1, .07, M['dough'], bevel=.03)
    # sauce shows as a thin ring between crust and cheese
    cylinder('sauce', R_PIZZA - .1, .05, .145, M['sauce'])
    def rfn(a):
        return R_CHEESE + .05 * noise.noise(Vector((math.cos(a) * 2, math.sin(a) * 2, seed))) + .02 * math.sin(a * 11 + seed) + .012 * math.sin(a * 23 + seed * 2)
    def zfn(x, y):
        p = Vector((x, y, 0)) + off
        rr = math.hypot(x, y)
        edge = max(0, (rr - (R_CHEESE - .25)) / .25)
        z = CHEESE_Z + .018 * noise.noise(p * 2.3) + .008 * noise.noise(p * 9) - .03 * edge * edge
        return z + cut_depth(x, y)
    disc_polar('cheese', rfn, 110, 360, zfn, M['cheese'])
    # crust: lumpy torus
    bm = bmesh.new()
    seg_major, seg_minor, R0, r0 = 180, 28, R_PIZZA - .14, .19
    verts = []
    for i in range(seg_major):
        a = i / seg_major * math.tau
        row = []
        lump = .045 * noise.noise(Vector((math.cos(a) * 3, math.sin(a) * 3, seed))) + .012 * noise.noise(Vector((math.cos(a) * 9, math.sin(a) * 9, seed + 4)))
        for j in range(seg_minor):
            b = j / seg_minor * math.tau
            rr = r0 + lump * (1 + .4 * math.sin(b))
            d = R0 + rr * math.cos(b)
            z = .14 + rr * math.sin(b) * .85 + (.02 if math.sin(b) > 0 else 0) * lump * 10
            # cut grooves across the crust too
            ca = min(abs(((a - c) + math.pi / 8) % (math.pi / 4) - math.pi / 8) for c in [0])
            if ca * R0 < .02 and math.sin(b) > -.2:
                z -= .03 * (1 - ca * R0 / .02)
            row.append(bm.verts.new((d * math.cos(a), d * math.sin(a), z)))
        verts.append(row)
    for i in range(seg_major):
        for j in range(seg_minor):
            a, b2, c, d = verts[i][j], verts[(i + 1) % seg_major][j], verts[(i + 1) % seg_major][(j + 1) % seg_minor], verts[i][(j + 1) % seg_minor]
            bm.faces.new((a, b2, c, d))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh_obj('crust', bm, M['crust'])

# ------------------------------------------------------------------ toppings
def make_topping(kind, M):
    bm = bmesh.new()
    if kind == 'pepperoni':
        bmesh.ops.create_circle(bm, cap_ends=True, segments=40, radius=.23)
        bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=3, use_grid_fill=True)
        for v in bm.verts:
            rr = v.co.xy.length / .23
            v.co.z = .03 * rr ** 5 + .003 * noise.noise(v.co * 30)   # flat slice, rim curls up while baking
        bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=.013)
    elif kind in ('tomato', 'jalapeno'):
        r = .2 if kind == 'tomato' else .1
        bmesh.ops.create_cone(bm, cap_ends=True, segments=40, radius1=r, radius2=r * .97, depth=.035)
    elif kind == 'mozz':
        bmesh.ops.create_uvsphere(bm, u_segments=28, v_segments=14, radius=.2)
        for v in bm.verts:
            v.co.z *= .1; v.co.x *= 1.15 + .16 * noise.noise(v.co * 6); v.co.y *= 1.15 + .16 * noise.noise(v.co * 6 + Vector((3, 0, 0)))
    elif kind == 'olive':
        torus(bm, .07, .03, 32, 12, sz=.5)     # a sliced olive ring
    elif kind == 'onion':
        strip(bm, .12, .022, 2.4, .007, 30)          # a curved sliver of red onion
    elif kind == 'chili':
        torus(bm, .05, .016, 16, 6, arc=math.pi)
    elif kind in ('pepper', 'pepper_y'):
        strip(bm, .17, .058, 1.6, .02)              # a flat strip of bell pepper, gently curved
    elif kind == 'basil':
        # oval leaf with a pointed tip, folded along the midrib, thin
        bmesh.ops.create_grid(bm, x_segments=16, y_segments=24, size=.5)
        for v in bm.verts:
            u, t = v.co.x * 2, v.co.y + .5                # u in -1..1 across, t 0 (stem) .. 1 (tip)
            w = .15 * math.sin(math.pi * min(1, t ** .85)) ** .9 + .004
            v.co.x = u * w
            v.co.y = (t - .45) * .46
            v.co.z = .55 * abs(v.co.x) ** 1.15 - .05 * t * t + .006 * noise.noise(v.co * 25)    # a soft fold, wilted by the oven
        bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=.005)
    elif kind == 'rocket':
        # long leaf with rounded lobes, laid on after baking
        bmesh.ops.create_grid(bm, x_segments=10, y_segments=30, size=.5)
        for v in bm.verts:
            u, t = v.co.x * 2, v.co.y + .5
            w = (.05 * math.sin(math.pi * min(1, t * 1.05)) ** .6) * (.6 + .4 * abs(math.sin(t * math.pi * 3.5))) + .006
            v.co.x = u * w
            v.co.y = (t - .5) * .4
            v.co.z = 1.6 * v.co.x ** 2 + .25 * (t - .5) ** 2 + .006 * noise.noise(v.co * 30)
        bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=.004)
    elif kind == 'caper':
        bmesh.ops.create_uvsphere(bm, u_segments=14, v_segments=8, radius=.034)
        for v in bm.verts:
            v.co.z *= .8; v.co += v.co.normalized() * .004 * noise.noise(v.co * 60)
    elif kind == 'mushroom':
        prof = [(math.cos(t) * .16, math.sin(t) * .16) for t in [math.pi * i / 20 for i in range(21)]]
        prof += [(-.055, 0), (-.05, -.13), (0, -.15), (.05, -.13), (.055, 0)]
        vs = [bm.verts.new((x, y, 0)) for x, y in prof]
        f = bm.faces.new(vs)
        ext = bmesh.ops.extrude_face_region(bm, geom=[f])
        for v in [e for e in ext['geom'] if isinstance(e, bmesh.types.BMVert)]:
            v.co.z += .018
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    elif kind == 'ham':
        # a torn piece: an irregular, slightly curled sheet
        n = 11
        top = [bm.verts.new(((.15 + .06 * noise.noise(Vector((i * .9, 1.3, 0)))) * math.cos(i / n * math.tau) * 1.25,
                             (.15 + .06 * noise.noise(Vector((i * .9, 4.1, 0)))) * math.sin(i / n * math.tau) * .9, 0)) for i in range(n)]
        bm.faces.new(top)
        bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=2, use_grid_fill=True)
        for v in bm.verts:
            v.co.z = .012 * noise.noise(v.co * 9) + .02 * (v.co.x * v.co.x)
        bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=.012)
    elif kind == 'pineapple':
        bmesh.ops.create_cube(bm, size=1)
        for v in bm.verts:
            v.co.x *= .26 if v.co.y < 0 else .15; v.co.y *= .2; v.co.z *= .08
    elif kind == 'tuna':
        # a ragged flake, not a pill
        bmesh.ops.create_icosphere(bm, subdivisions=2, radius=.075)
        for v in bm.verts:
            v.co.x *= 1.6; v.co.z *= .35
            v.co += v.co.normalized() * (.028 * noise.noise(v.co * 18) + .01 * noise.noise(v.co * 50))
    ob = mesh_obj(kind, bm, M[kind])
    if kind == 'pineapple':
        mod = ob.modifiers.new('bev', 'BEVEL'); mod.width = .012; mod.segments = 3
    # thin slices keep a sharp rim: smooth shading across it made every disc shade like a dome
    if kind in ('pepperoni', 'tomato', 'jalapeno', 'ham', 'pineapple', 'onion', 'pepper', 'pepper_y', 'mushroom'):   # mozzarella melts: it stays soft
        es = ob.modifiers.new('rim', 'EDGE_SPLIT'); es.split_angle = math.radians(32)
    return ob

def strip(bm, R, width, arc, thick, nu=24):
    """a flat curved band (pepper strip): inner/outer edge along an arc, then given thickness"""
    rows = []
    for i in range(nu + 1):
        a = -arc / 2 + arc * i / nu
        lift = .012 * math.sin(math.pi * i / nu)
        rows.append([bm.verts.new(((R + d) * math.cos(a) - R, (R + d) * math.sin(a), lift)) for d in (-width / 2, width / 2)])
    for i in range(nu):
        bm.faces.new((rows[i][0], rows[i][1], rows[i + 1][1], rows[i + 1][0]))
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=thick)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

def torus(bm, R, r, nu, nv, arc=math.tau, sy=1., sz=1.):
    closed = arc >= math.tau - 1e-6
    nu_eff = nu if closed else nu + 1
    rows = []
    for i in range(nu_eff):
        a = i / nu * arc
        row = []
        for j in range(nv):
            b = j / nv * math.tau
            d = R + r * math.cos(b)
            row.append(bm.verts.new((d * math.cos(a), d * math.sin(a) * sy, r * math.sin(b) * sz)))
        rows.append(row)
    for i in range(nu if closed else nu):
        i2 = (i + 1) % nu_eff
        if not closed and i == nu: break
        for j in range(nv):
            bm.faces.new((rows[i][j], rows[i2][j], rows[i2][(j + 1) % nv], rows[i][(j + 1) % nv]))
    if not closed:
        bm.faces.new(rows[0][::-1]); bm.faces.new(rows[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

SCALE_TOP = 1.15
SIZE = {'pepperoni': .23, 'tomato': .2, 'mozz': .19, 'basil': .17, 'mushroom': .16, 'pepper': .17, 'pepper_y': .17, 'olive': .11, 'onion': .14,
        'jalapeno': .1, 'chili': .06, 'ham': .21, 'pineapple': .15, 'tuna': .09, 'caper': .04, 'rocket': .16}
LIFT = {'pepperoni': .004, 'tomato': .008, 'mozz': .0, 'basil': .016, 'mushroom': .0, 'pepper': .01, 'pepper_y': .01, 'olive': .006, 'onion': .004,
        'jalapeno': .008, 'chili': .01, 'ham': .006, 'pineapple': .02, 'tuna': .01, 'caper': .018, 'rocket': .05}
LOOSE = {'rocket'}                     # laid on top after baking: may overlap other toppings
COUNT = {'caper': 2.2, 'tuna': 2.2}

def add_toppings(tops, M, seed):
    random.seed(seed)
    kinds = list(dict.fromkeys(tops))
    per = {k: round(max(6, round(30 / len(kinds))) * tops.count(k) * COUNT.get(k, 1)) for k in kinds}
    protos = {k: make_topping(k, M) for k in kinds}
    placed, objs = [], []
    order = [k for k in kinds if k not in LOOSE for _ in range(per[k])]
    random.shuffle(order)
    order += [k for k in kinds if k in LOOSE for _ in range(per[k])]
    for k in order:
        k_scale = SCALE_TOP * random.uniform(.84, 1.14)        # no two pieces cut exactly alike
        s = SIZE[k] * k_scale
        for _ in range(600):
            rr = math.sqrt(random.random()) * (R_CHEESE - .12 - s * .5)
            a = random.random() * math.tau
            x, y = rr * math.cos(a), rr * math.sin(a)
            if k in LOOSE or all((x - px) ** 2 + (y - py) ** 2 > ((s + ps) * .78) ** 2 for px, py, ps in placed):
                if k not in LOOSE: placed.append((x, y, s))
                break
        else:
            continue
        ob = protos[k].copy(); ob.data = protos[k].data
        link(ob); ob.scale = (k_scale,) * 3
        place(ob, x, y, CHEESE_Z + LIFT[k] + .012 * noise.noise(Vector((x, y, 0)) * 2.3), random.random() * math.tau)
        objs.append(ob)
    for p in protos.values():
        bpy.data.objects.remove(p)
    return objs

# ------------------------------------------------------------------ board, lights, cameras
def build_board(M):
    b = cylinder('board', 2.24, .16, -.08, M['wood'], segs=128, bevel=.035)
    return b

def build_lights_and_floor():
    key = bpy.data.lights.new('key', 'AREA'); key.energy = 3300; key.size = 4.5; key.color = (1, .95, .88)
    ko = link(bpy.data.objects.new('key', key)); ko.location = (-3.5, -4, 8)
    aim = link(bpy.data.objects.new('aim', None))
    tc = ko.constraints.new('TRACK_TO'); tc.target = aim; tc.track_axis = 'TRACK_NEGATIVE_Z'; tc.up_axis = 'UP_Y'
    rim = bpy.data.lights.new('rim', 'AREA'); rim.energy = 700; rim.size = 4; rim.color = (1, .9, .8)
    ro = link(bpy.data.objects.new('rim', rim)); ro.location = (5, 5, 5); ro.rotation_euler = (math.radians(-50), 0, math.radians(135))
    bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=15)
    floor = mesh_obj('floor', bm, None, smooth=False); floor.location.z = -.16; floor.is_shadow_catcher = True
    return floor

def camera(name, loc, target=(0, 0, 0), ortho=None, lens=55):
    cam = bpy.data.cameras.new(name)
    if ortho:
        cam.type = 'ORTHO'; cam.ortho_scale = ortho
    else:
        cam.lens = lens
    ob = link(bpy.data.objects.new(name, cam)); ob.location = loc
    tgt = link(bpy.data.objects.new(name + '_t', None)); tgt.location = target
    c = ob.constraints.new('TRACK_TO'); c.target = tgt; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
    return ob

TOP_ORTHO = 4.6   # pizza radius 2.06 -> 2.06 / 2.3 of the half-frame

def render(path, cam):
    sc = bpy.context.scene
    sc.camera = cam
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)

# ------------------------------------------------------------------ main
def pizza_stills(pid, tops, seed):
    reset(); M = mats()
    build_base(M, seed)
    add_toppings(tops, M, seed + 11)
    board = build_board(M)
    build_lights_and_floor()
    views = args.views.split(',')
    if 'angle' in views:
        cam = camera('cam_angle', (0, -7.2, 6.6), (0, .02, -.08), lens=72)
        render(os.path.join(OUT, 'pizza', f'{pid}-angle{args.tag}.png'), cam)
    if 'top' in views:
        board.hide_render = True
        bpy.data.objects['floor'].hide_render = True
        bpy.data.objects['key'].location = (-4.7, -5.4, 5.6)
        cam = camera('cam_top', (0, 0, 12), (0, 0, 0), ortho=TOP_ORTHO)
        render(os.path.join(OUT, 'pizza', f'{pid}-top{args.tag}.png'), cam)

def textures():
    """flat, evenly lit textures for the live three.js pizza"""
    reset(); M = mats()
    sc = bpy.context.scene
    sc.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 1.0
    sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 2.2; sun.angle = math.radians(20)
    so = link(bpy.data.objects.new('sun', sun)); so.rotation_euler = (math.radians(25), 0, math.radians(-30))
    build_base(M, 3)
    for n in ('crust', 'base'):
        bpy.data.objects[n].hide_render = True
    # cheese + sauce: radius 1.852 fills the frame (matches the three.js UV mapping)
    render(os.path.join(OUT, 'tex', 'cheese.png'), camera('c1', (0, 0, 8), (0, 0, 0), ortho=1.852 * 2))
    for o in list(bpy.data.objects):
        if o.type == 'MESH': bpy.data.objects.remove(o)
    build_board(M)
    render(os.path.join(OUT, 'tex', 'wood.png'), camera('c2', (0, 0, 8), (0, 0, 0), ortho=2.2 * 2))
    for o in list(bpy.data.objects):
        if o.type == 'MESH': bpy.data.objects.remove(o)
    for k in ('pepperoni', 'tomato'):
        ob = make_topping(k, M); ob.location.z = 0
        render(os.path.join(OUT, 'tex', f'{k}.png'), camera('c_' + k, (0, 0, 4), (0, 0, 0), ortho=SIZE[k] * 2 * 1.02))
        bpy.data.objects.remove(ob)

def props():
    """loose ingredients for the hero, rendered with the pizza light rig"""
    reset(); M = mats()
    build_lights_and_floor()
    bpy.data.objects['floor'].hide_render = True
    def shoot(name, ob_list, ortho):
        cam = camera('cam_' + name, (0, -3.2, 9), (0, 0, 0), ortho=ortho)
        render(os.path.join(OUT, 'props', f'{name}.png'), cam)
        for ob in ob_list: bpy.data.objects.remove(ob)
        for o in [o for o in bpy.data.objects if o.name.startswith('cam_')]: bpy.data.objects.remove(o)

    # cherry tomato with calyx
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=24, radius=.5)
    for v in bm.verts: v.co.z *= .88
    tom = mesh_obj('cherry', bm, M['tomato_whole'])
    bm = bmesh.new()
    for i in range(5):
        a = i / 5 * math.tau
        bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=.07, radius2=.005, depth=.36,
                              matrix=__import__('mathutils').Matrix.Translation((math.cos(a) * .16, math.sin(a) * .16, .46)) @ __import__('mathutils').Matrix.Rotation(math.pi / 2, 4, Vector((-math.sin(a), math.cos(a), 0))))
    cal = mesh_obj('calyx', bm, M['basil'])
    shoot('tomato', [tom, cal], 1.4)

    # basil sprig: stem + five leaves
    obs = []
    cu = bpy.data.curves.new('stem', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = .025
    sp = cu.splines.new('POLY'); sp.points.add(3)
    for i, (x, y) in enumerate([(0, -1.2), (.05, -.5), (-.02, .2), (.04, .9)]): sp.points[i].co = (x, y, 0, 1)
    st = link(bpy.data.objects.new('stem', cu)); st.data.materials.append(M['basil']); obs.append(st)
    for i, (x, y, rot, sc_) in enumerate([(-.28, -.55, .9, 2.4), (.3, -.25, -.8, 2.5), (-.25, .2, 1.0, 2.2), (.26, .45, -.9, 2.1), (0, 1.05, 0, 1.8)]):
        lf = make_topping('basil', M); lf.location = (x, y, .02); lf.rotation_euler = (0, 0, rot); lf.scale = (sc_,) * 3; obs.append(lf)
    shoot('basil', obs, 3.0)

    # red chilli: bent tube with a green stalk
    cu = bpy.data.curves.new('chili', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = .09; cu.bevel_resolution = 6
    sp = cu.splines.new('BEZIER'); sp.bezier_points.add(2)
    for i, (x, y) in enumerate([(-1.1, .25), (0, -.1), (1.0, .35)]):
        bp = sp.bezier_points[i]; bp.co = (x, y, 0); bp.handle_left_type = bp.handle_right_type = 'AUTO'
    bp = sp.bezier_points[0]; bp.radius = .15
    ch = link(bpy.data.objects.new('chili', cu)); ch.data.materials.append(M['chili_whole'])
    cu2 = bpy.data.curves.new('stalk', 'CURVE'); cu2.dimensions = '3D'; cu2.bevel_depth = .03
    sp2 = cu2.splines.new('POLY'); sp2.points.add(1); sp2.points[0].co = (1.0, .35, 0, 1); sp2.points[1].co = (1.3, .55, .05, 1)
    sk = link(bpy.data.objects.new('stalk', cu2)); sk.data.materials.append(M['basil'])
    shoot('chili', [ch, sk], 2.8)

    # dipping bowl of tomato sauce
    bm = bmesh.new()
    prof = [(.0, .0), (.5, .0), (.62, .05), (.72, .3), (.76, .42), (.70, .42), (.64, .32), (.55, .12), (.0, .12)]
    vs = [bm.verts.new((x, 0, z)) for x, z in prof]
    for a, b2 in zip(vs, vs[1:]): bm.edges.new((a, b2))
    bmesh.ops.spin(bm, geom=bm.verts[:] + bm.edges[:], cent=(0, 0, 0), axis=(0, 0, 1), angle=math.tau, steps=64, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=.0005)
    bowl = mesh_obj('bowl', bm, M['ceramic'])
    sauce = cylinder('dip', .63, .04, .3, M['sauce'], segs=64)
    shoot('sauce', [bowl, sauce], 1.7)

    # olives
    obs = []
    for i, (x, y) in enumerate([(-.35, 0), (.32, .12), (0, .42)]):
        bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=12, radius=.22)
        for v in bm.verts: v.co.x *= 1.25
        o = mesh_obj(f'ol{i}', bm, M['olive']); o.location = (x, y, 0); o.rotation_euler = (0, 0, i * .9); obs.append(o)
    shoot('olives', obs, 1.5)

if __name__ == '__main__':
    ids = [i for i in args.only.split(',') if i] or list(PIZZAS)
    for n, pid in enumerate(PIZZAS):
        if pid in ids and not args.no_pizzas:
            pizza_stills(pid, PIZZAS[pid], 7 + n * 5)
    if args.tex:
        textures()
    if args.props:
        props()
    print('PIZZA_DONE')
