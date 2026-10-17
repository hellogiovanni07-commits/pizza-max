// Pizza Max — first-visit intro. A closed Pizza Max box sits in a spotlight and tilts toward the pointer.
// Lift the lid (drag it up, tap it, or press Enter): it follows your finger on a spring and steam escapes.
// Inside is the hero's own 3D pizza; the box drops away and the camera flies to the hero's exact view,
// so the pizza simply stays put when the page appears. Skip and Escape always work. The head script
// decides whether the intro runs (first visit of the session, no deep link, no reduced motion; ?intro forces it).
const root = document.documentElement;
const el = document.getElementById('intro');
let finish;
window.pmIntroDone = new Promise((res) => (finish = res));

if (el && root.classList.contains('intro-on')) start();
else { el?.remove(); finish(false); }

async function start() {
  window.pmIntroReady = true;
  try { sessionStorage.setItem('pm-intro', '1'); } catch (e) { /* private mode: show it again next time */ }
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);

  const box = el.querySelector('#introBox'), skip = el.querySelector('#introSkip'), host = el.querySelector('#introStage');
  const behind = [...document.body.children].filter((n) => n !== el && n.tagName !== 'SCRIPT');
  behind.forEach((n) => (n.inert = true));
  let leaving = false, landed = false, scene = null, flyFrom = 0;
  let placeBox = () => {};
  skip.addEventListener('click', () => leave(true));
  addEventListener('keydown', onKey);
  function onKey(e) { if (e.key === 'Escape') leave(true); }

  try {
    const slow = new Promise((_, no) => setTimeout(() => no(new Error('intro 3D took too long')), 4000));
    scene = await Promise.race([import('./pizza3d.js').then(({ createIntro }) => createIntro(host)), slow]);
  } catch (err) {
    console.error(err);
    return leave(true);                       // no 3D: straight to the page
  }
  if (leaving) return scene.dispose();

  // the button is the accessible, draggable area over the box; the words sit under it
  placeBox = () => {
    scene.resize();
    const r = scene.boxRect();
    Object.assign(box.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.right - r.left}px`, height: `${r.bottom - r.top}px` });
    el.style.setProperty('--box-bottom', `${r.bottom}px`);
  };
  placeBox();
  addEventListener('resize', placeBox);
  el.classList.add('is-ready');
  box.focus({ preventScroll: true, focusVisible: false });   // keyboard users still get the ring on Tab

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  let open = 0, vel = 0, target = 0;            // lid: 0 closed .. 1 open, sprung toward target
  let drag = null;                               // { y, from, moved }
  let tx = 0, ty = 0, tiltX = 0, tiltY = 0;      // pointer tilt, eased
  let lastTouch = performance.now(), opened = false;

  /* ---------- the loop: spring, idle peek, tilt, flight ---------- */
  function frame(now) {
    if (landed) return;
    if (!drag) {
      vel = (vel + (target - open) * .085) * .78;   // springy, with a little overshoot
      open = clamp(open + vel, 0, 1.04);
    }
    // while nobody touches it the lid lifts a crack every few seconds and lets out a puff
    const idle = (now - lastTouch) / 1000;
    const peek = !opened && !drag && target === 0 && idle > 1.2 ? Math.max(0, Math.sin((idle - 1.2) * 2.3)) ** 4 * .1 : 0;
    const lid = Math.max(open, peek);
    tiltX += (tx - tiltX) * .08; tiltY += (ty - tiltY) * .08;
    const fly = flyFrom ? clamp((now - flyFrom) / 1400) : 0;
    scene.frame({ lid, tiltX, tiltY, steam: clamp(lid * 1.6), fly }, now / 1000);
    if (!opened && target === 1 && open > .93) onOpened();
    if (!opened && !drag && target === 0 && idle > 6.5) openBox();   // nobody's here: open it anyway
    if (fly >= 1) return land();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- pointer: tilt, drag the lid, tap to open ---------- */
  el.addEventListener('pointermove', (e) => {
    tx = (e.clientX / innerWidth - .5) * 14;
    ty = (e.clientY / innerHeight - .5) * 8;
    if (!drag) return;
    const dy = drag.y - e.clientY;
    drag.moved = Math.max(drag.moved, Math.abs(dy));
    open = clamp(drag.from + dy / (box.offsetHeight * .9), 0, 1);
    vel = 0;
  });
  box.addEventListener('pointerdown', (e) => {
    if (opened) return;
    drag = { y: e.clientY, from: open, moved: 0 };
    lastTouch = performance.now();
    box.setPointerCapture(e.pointerId);
    el.classList.add('is-touched');
  });
  const release = () => {
    if (!drag) return;
    const { moved } = drag;
    drag = null;
    lastTouch = performance.now();
    if (moved < 6 || open > .3) openBox();
    else target = 0;                              // not far enough: it falls shut with a bounce
  };
  box.addEventListener('pointerup', release);
  box.addEventListener('pointercancel', release);
  box.addEventListener('click', (e) => { if (e.detail === 0) openBox(); });   // Enter / Space

  function openBox() {
    if (target === 1) return;
    target = 1;
    el.classList.add('is-touched');
    box.setAttribute('aria-label', 'Box open');
  }
  function onOpened() {
    opened = true;
    el.classList.add('is-open');
    setTimeout(() => leave(false), 1200);
  }

  /* ---------- leaving: fly to the hero, or just fade on skip ---------- */
  function leave(skipped) {
    if (leaving) return;
    leaving = true;
    removeEventListener('keydown', onKey);
    removeEventListener('resize', placeBox);
    behind.forEach((n) => (n.inert = false));
    root.classList.add('intro-fly');
    root.classList.remove('intro-on');            // the hero headline and props start their entrance
    el.classList.add('is-leaving');
    const title = document.getElementById('hero-title');
    if (title) { title.tabIndex = -1; title.focus({ preventScroll: true }); }
    const stage = document.getElementById('pizza3d');
    if (skipped || !scene || !stage) {
      el.classList.add('is-skip');
      return setTimeout(land, 380);
    }
    scene.aim(stage.getBoundingClientRect());
    flyFrom = performance.now();
    setTimeout(land, 1900);                       // in case frames are held back (background tab)
  }

  function land() {
    if (landed) return;
    landed = true;
    root.classList.remove('intro-fly');           // the hero's own canvas fades in under the landed pizza
    finish(true);
    el.classList.add('is-gone');
    setTimeout(() => { scene?.dispose(); el.remove(); }, 500);
  }
}
