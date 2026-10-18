"""Pizza Max brand kit: export every material to brand/export/.

  python brand/export.py            # everything
  python brand/export.py bc-front   # one or more ids

PNG: screens at their native pixels; print at 200 dpi (longest side capped at 6000 px).
PDF: print materials at true size; pieces with a bleed get it on every side plus crop marks and a job line.
PRINT FILE (<id>-print.png): the artwork alone on a transparent ground, for screen printing and embroidery.
Needs Google Chrome or Microsoft Edge. Serves the pizza-max folder on a free local port while it works.
"""
import functools, http.server, os, re, shutil, socket, subprocess, sys, threading

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(HERE, 'export')
DPI = 200
CAP = 6000
BROWSERS = [
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'google-chrome', 'chromium', 'chromium-browser',
]


def browser():
    for b in BROWSERS:
        if os.path.isfile(b) or shutil.which(b):
            return b
    sys.exit('Chrome or Edge not found')


BLEED = set()


def kit():
    """read the material list from kit.js (id, size, unit, outputs)"""
    src = open(os.path.join(HERE, 'kit.js'), encoding='utf-8').read()
    items = []
    BLEED.update(f"id: '{b[1]}'" for b in re.finditer(r"\{ id: '([\w-]+)'[^\n]*?bleed: [1-9]", src))
    for m in re.finditer(r"\{ id: '([\w-]+)', z: '\w+', name: '(?:[^'\\]|\\.)*', w: (\d+), h: (\d+), u: (MM|PX),.*?out: \[([^\]]*)\]", src):
        art = re.search(r"art: \[(\d+), (\d+)\]", m[0])
        items.append({'id': m[1], 'w': int(m[2]), 'h': int(m[3]), 'u': m[4], 'out': re.findall(r"'(\w+)'", m[5]),
                      'art': (int(art[1]), int(art[2])) if art else None})
    return items


def serve():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    handler = functools.partial(Quiet, directory=ROOT)
    httpd = http.server.ThreadingHTTPServer(('127.0.0.1', port), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, port


def provenance_tool():
    base = os.path.expanduser(os.path.join('~', '.claude', 'skills', 'impeccable', 'scripts'))
    for name in ('impeccable.cmd', 'impeccable'):
        path = os.path.join(base, name)
        if os.path.isfile(path):
            return path
    return None


def provenance(tool, path, text):
    """write where the raster came from into the file (skipped when the impeccable tool is not installed)"""
    if tool:
        subprocess.run(['cmd', '/c', tool, 'embed-prompt', path, '--prompt', text] if tool.endswith('.cmd') else [tool, 'embed-prompt', path, '--prompt', text],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60)


def run(cmd):
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)


def main(only):
    os.makedirs(OUT, exist_ok=True)
    chrome = browser()
    httpd, port = serve()
    base = f'http://127.0.0.1:{port}/brand/index.html'
    common = [chrome, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--force-device-scale-factor=1',
              '--virtual-time-budget=4000', '--run-all-compositor-stages-before-draw']
    done = []
    tool = provenance_tool()
    for k in kit():
        if only and k['id'] not in only:
            continue
        if 'png' in k['out']:
            scale = 1 if k['u'] == 'PX' else min(DPI / 25.4, CAP / max(k['w'], k['h']))
            w, h = round(k['w'] * scale), round(k['h'] * scale)
            path = os.path.join(OUT, f"{k['id']}.png")
            run(common + ['--default-background-color=00000000', f'--window-size={w},{h}', f'--screenshot={path}', f"{base}?export={k['id']}&scale={scale}"])
            provenance(tool, path, f"Origin: rendered by brand/export.py from the HTML/CSS material '{k['id']}' in brand/index.html "
                       f"({k['w']}x{k['h']} {'px' if k['u'] == 'PX' else 'mm'}, exported {w}x{h} px) with headless Chrome. Pizza and ingredient images in it are "
                       "the shop's own Blender renders (blender/pizza_scene.py). No generated or stock imagery.")
            done.append(f"{k['id']}.png {w}x{h}")
        if 'art' in k['out'] and k['art']:
            aw, ah = k['art']
            scale = min(DPI / 25.4, CAP / max(aw, ah))
            w, h = round(aw * scale), round(ah * scale)
            path = os.path.join(OUT, f"{k['id']}-print.png")
            run(common + ['--default-background-color=00000000', f'--window-size={w},{h}', f'--screenshot={path}', f"{base}?art={k['id']}&scale={scale}"])
            provenance(tool, path, f"Origin: print artwork for '{k['id']}' rendered by brand/export.py from brand/index.html "
                       f"({aw}x{ah} mm, {w}x{h} px) with headless Chrome. Vector type and logo only.")
            done.append(f"{k['id']}-print.png {w}x{h}")
        if 'pdf' in k['out']:
            path = os.path.join(OUT, f"{k['id']}.pdf")
            run(common + ['--no-pdf-header-footer', f'--print-to-pdf={path}', f"{base}?print={k['id']}"])
            done.append(f"{k['id']}.pdf {k['w']}x{k['h']} mm" + (' + bleed and marks' if f"id: '{k['id']}'" in BLEED else ''))
        print(done[-1] if done else k['id'], flush=True)
    httpd.shutdown()
    print(f'{len(done)} files in {OUT}')


if __name__ == '__main__':
    main(set(sys.argv[1:]))
