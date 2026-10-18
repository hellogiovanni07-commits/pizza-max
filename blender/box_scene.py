"""Pizza Max - pizza boxes for the marketing materials: stacks of 1, 2 and 3 boxes, the top one open on a pizza.

The boxes wear the kit's own print (brand/export/box-lid.png on the lid, box-side.png on the walls, made by
brand/export.py), the board is the kit's kraft (assets/tex/kraft.webp), and the pizza inside is the shop's own
top-view render (assets/pizza/<id>-top.webp). Lit with the pizza renders' rig. Renders to assets/boxes/.

  blender -b -P blender/box_scene.py -- [--only stack-2] [--samples 96] [--scale 1]
"""
import bpy, bmesh, math, os, sys, argparse
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument('--only', default='')
ap.add_argument('--samples', type=int, default=96)
ap.add_argument('--scale', type=float, default=1.0)
args = ap.parse_args(argv)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'boxes')
os.makedirs(OUT, exist_ok=True)
U = 100.0                       # mm per unit
W, H, T = 330.0, 45.0, 3.0      # a Maxi box: 330 x 330 x 45 mm, 3 mm E-flute board


def reset(rx, ry):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
    sc.cycles.samples = args.samples; sc.cycles.use_denoising = True
    sc.render.film_transparent = True
    sc.render.resolution_x, sc.render.resolution_y = round(rx * args.scale), round(ry * args.scale)
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'Standard'
    try:
        sc.view_settings.look = 'Medium High Contrast'
    except TypeError:
        pass
    sc.view_settings.exposure = -1.45
    wd = bpy.data.worlds.new('w'); sc.world = wd; wd.use_nodes = True
    bg = wd.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (1, .97, .92, 1); bg.inputs['Strength'].default_value = .2
    return sc


def link(ob):
    bpy.context.scene.collection.objects.link(ob)
    return ob


def lights(k=1.6):
    key = bpy.data.lights.new('key', 'AREA'); key.energy = 3300 * k * k; key.size = 4.5 * k; key.color = (1, .95, .88)
    ko = link(bpy.data.objects.new('key', key)); ko.location = (-3.5 * k, -4 * k, 8 * k)
    aim = link(bpy.data.objects.new('aim', None))
    tc = ko.constraints.new('TRACK_TO'); tc.target = aim; tc.track_axis = 'TRACK_NEGATIVE_Z'; tc.up_axis = 'UP_Y'
    rim = bpy.data.lights.new('rim', 'AREA'); rim.energy = 700 * k * k; rim.size = 4 * k; rim.color = (1, .9, .8)
    ro = link(bpy.data.objects.new('rim', rim)); ro.location = (5 * k, 5 * k, 5 * k)
    tr = ro.constraints.new('TRACK_TO'); tr.target = aim; tr.track_axis = 'TRACK_NEGATIVE_Z'; tr.up_axis = 'UP_Y'
    # the table catches the shadows only
    bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=30)
    me = bpy.data.meshes.new('floor'); bm.to_mesh(me); bm.free()
    fl = link(bpy.data.objects.new('floor', me)); fl.is_shadow_catcher = True


def img_mat(name, path, rough=.85, repeat=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(path); t.interpolation = 'Cubic'
    if repeat:
        uv = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping')
        mp.inputs['Scale'].default_value = (repeat, repeat, 1)
        nt.links.new(uv.outputs['UV'], mp.inputs['Vector']); nt.links.new(mp.outputs[0], t.inputs['Vector'])
    nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    if t.image.alpha_mode != 'NONE' and name.startswith('pizza'):
        nt.links.new(t.outputs['Alpha'], b.inputs['Alpha'])
        try:
            m.blend_method = 'HASHED'
        except (AttributeError, TypeError):
            pass
    b.inputs['Roughness'].default_value = rough
    b.inputs['Specular IOR Level'].default_value = .2
    bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = .12; bump.inputs['Distance'].default_value = .002
    bw = nt.nodes.new('ShaderNodeRGBToBW'); nt.links.new(t.outputs['Color'], bw.inputs[0]); nt.links.new(bw.outputs[0], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], b.inputs['Normal'])
    return m


def quad(bm, uvl, pts, uvs):
    f = bm.faces.new([bm.verts.new(p) for p in pts])
    for loop, uv in zip(f.loops, uvs):
        loop[uvl].uv = uv
    return f


def slab(name, mats, w=W, h=H, top=True):
    """a closed box: printed lid on top, the printed band on the four walls, kraft underneath"""
    s, z = w / 2 / U, h / U
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UV')
    F = []
    if top:
        F.append((quad(bm, uvl, [(-s, -s, z), (s, -s, z), (s, s, z), (-s, s, z)], [(0, 0), (1, 0), (1, 1), (0, 1)]), 0))
    walls = [((-s, -s), (s, -s)), ((s, -s), (s, s)), ((s, s), (-s, s)), ((-s, s), (-s, -s))]
    for a, b in walls:
        F.append((quad(bm, uvl, [(a[0], a[1], 0), (b[0], b[1], 0), (b[0], b[1], z), (a[0], a[1], z)], [(0, 0), (1, 0), (1, 1), (0, 1)]), 1))
    F.append((quad(bm, uvl, [(-s, s, 0), (s, s, 0), (s, -s, 0), (-s, -s, 0)], [(0, 0), (1, 0), (1, 1), (0, 1)]), 2))
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-6)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for (f, mi), p in zip(F, me.polygons):
        p.material_index = mi
    for m in mats:
        me.materials.append(m)
    ob = link(bpy.data.objects.new(name, me))
    bev = ob.modifiers.new('bev', 'BEVEL'); bev.width = 1.6 / U; bev.segments = 2; bev.limit_method = 'ANGLE'
    return ob


def open_box(name, mats, pizza_mat, lid_angle=108):
    """the top box, open: tray with walls, the pizza inside, the lid swung back (its unprinted inside to camera)"""
    s, z, t = W / 2 / U, H / U, T / U
    tray = slab(name + '_tray', [mats[2], mats[1], mats[2]], top=False)
    # inside walls and floor in plain kraft
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UV')
    i = s - t
    quad(bm, uvl, [(-i, -i, t), (i, -i, t), (i, i, t), (-i, i, t)], [(0, 0), (1, 0), (1, 1), (0, 1)])
    for a, b in [((-i, -i), (-i, i)), ((-i, i), (i, i)), ((i, i), (i, -i)), ((i, -i), (-i, -i))]:
        quad(bm, uvl, [(a[0], a[1], t), (b[0], b[1], t), (b[0], b[1], z), (a[0], a[1], z)], [(0, 0), (1, 0), (1, .14), (0, .14)])
    for a, b, c, d in [((-s, -s), (s, -s), (i, -i), (-i, -i)), ((s, -s), (s, s), (i, i), (i, -i)), ((s, s), (-s, s), (-i, i), (i, i)), ((-s, s), (-s, -s), (-i, -i), (-i, i))]:
        quad(bm, uvl, [(a[0], a[1], z), (b[0], b[1], z), (c[0], c[1], z), (d[0], d[1], z)], [(0, 0), (1, 0), (1, .01), (0, .01)])   # the cut board edge
    me = bpy.data.meshes.new(name + '_in'); bm.to_mesh(me); bm.free(); me.materials.append(mats[2])
    link(bpy.data.objects.new(name + '_in', me))
    # the pizza: the top-view render on a disc, lying in the box
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UV')
    r = (W - 26) / 2 / U
    quad(bm, uvl, [(-r, -r, t + .002), (r, -r, t + .002), (r, r, t + .002), (-r, r, t + .002)], [(0, 0), (1, 0), (1, 1), (0, 1)])
    me = bpy.data.meshes.new(name + '_pz'); bm.to_mesh(me); bm.free(); me.materials.append(pizza_mat)
    link(bpy.data.objects.new(name + '_pz', me))
    # the lid: a board hinged on the back top edge, printed outside (away from us), kraft inside
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UV')
    quad(bm, uvl, [(-s, -s, 0), (s, -s, 0), (s, s, 0), (-s, s, 0)], [(0, 0), (1, 0), (1, 1), (0, 1)])
    me = bpy.data.meshes.new(name + '_lid'); bm.to_mesh(me); bm.free()
    me.materials.append(mats[0]); me.materials.append(mats[2])
    lid = link(bpy.data.objects.new(name + '_lid', me))
    sol = lid.modifiers.new('board', 'SOLIDIFY'); sol.thickness = t; sol.offset = 1; sol.material_offset = 1
    # closed, the printed face is up; open, it swings back about the hinge on the back top edge (the print faces away)
    lid.matrix_world = Matrix.Translation((0, s, z)) @ Matrix.Rotation(-math.radians(lid_angle), 4, 'X') @ Matrix.Translation((0, -s, 0))
    return tray


def place(objs, loc, rot_z):
    for ob in objs:
        ob.matrix_world = Matrix.Translation(loc) @ Matrix.Rotation(rot_z, 4, 'Z') @ ob.matrix_world


def scene(name, pizza, n):
    """n boxes stacked; the top one open on the pizza, or all closed (pizza None) with the printed lid on top"""
    closed = pizza is None
    reset(1600, 1300 if closed else 1600 if n < 3 else 1700)
    lid = img_mat('lid', os.path.join(ROOT, 'brand', 'export', 'box-lid.png'))
    side = img_mat('side', os.path.join(ROOT, 'brand', 'export', 'box-side.png'))
    kraft = img_mat('kraft', os.path.join(ROOT, 'assets', 'tex', 'kraft.webp'), repeat=2)
    pz = None if closed else img_mat('pizza', os.path.join(ROOT, 'assets', 'pizza', f'{pizza}-top.webp'), rough=.5)
    mats = [lid, side, kraft]
    turns = [.06, -.05, .03]
    shift = [(0, 0), (.06, -.04), (-.05, .05)]
    for k in range(n if closed else n - 1):          # closed boxes underneath (all of them, closed)
        ob = slab(f'box{k}', mats)
        before = set(bpy.data.objects)
        place([ob], (shift[k][0], shift[k][1], k * H / U), turns[k])
    if not closed:
        before = set(bpy.data.objects)
        open_box('top', mats, pz)
        new = [o for o in bpy.data.objects if o not in before and o.type == 'MESH']
        place(new, (0, 0, (n - 1) * H / U), turns[(n - 1) % 3] * .5)
    lights()
    # three-quarter view from the front, the open box towards us
    h = n * H / U
    # framed loose so the open lid never touches the frame; blender/box_finish.py trims to the box and its shadow
    tgt = Vector((0, .1, h * .5)) if closed else Vector((.05, .55, h * .5 + .95))
    cam = bpy.data.cameras.new('cam'); cam.lens = 62
    co = link(bpy.data.objects.new('cam', cam)); co.location = tgt + Vector((-3.6, -8.4, 5.6)) * (1.15 if closed else 1.3 + .07 * (n - 1))
    tt = link(bpy.data.objects.new('t', None)); tt.location = tgt
    c = co.constraints.new('TRACK_TO'); c.target = tt; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
    bpy.context.scene.camera = co
    bpy.context.scene.render.filepath = os.path.join(OUT, f'{name}.png')
    bpy.ops.render.render(write_still=True)
    print('RENDERED', name)


SCENES = {'stack-1': ('salami', 1), 'stack-2': ('marg', 2), 'stack-3': ('supreme', 3), 'stack-2-closed': (None, 2)}
if __name__ == '__main__':
    ids = [i for i in args.only.split(',') if i] or list(SCENES)
    for i in ids:
        scene(i, *SCENES[i])
    print('BOXES_DONE')
