import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import './style.css';
import { profile, skills, projects } from './content';

gsap.registerPlugin(ScrollTrigger);

interface Particle {
  x: number;
  y: number;
  bx: number;
  by: number;
  vx: number;
  vy: number;
  r: number;
}

interface Field {
  toggleMatrix(): boolean;
}

type Command = (args: string[]) => string[];

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document): T => {
  const node = root.querySelector<T>(s);
  if (!node) throw new Error(`Missing element: ${s}`);
  return node;
};
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document): T[] => [
  ...root.querySelectorAll<T>(s),
];
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text?: string): HTMLElementTagNameMap[K] => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

/* ---------------- content ---------------- */
function splitText(node: HTMLElement, text = node.textContent ?? ''): void {
  node.textContent = '';
  node.setAttribute('aria-label', text);
  text.split(' ').forEach((word, i, all) => {
    const w = el('span', 'word');
    w.setAttribute('aria-hidden', 'true');
    [...word].forEach((ch) => {
      const c = el('span', 'char', ch);
      c.dataset.ch = ch;
      w.append(c);
    });
    node.append(w);
    if (i < all.length - 1) node.append(' ');
  });
}

function render(): void {
  const [l1, l2] = $$('#name .line');
  l1.textContent = profile.first;
  l2.textContent = profile.last;
  $$('[data-split]').forEach((n) => splitText(n));

  const marquee = $('#marquee');
  for (let i = 0; i < 2; i++) {
    skills.forEach((s) => marquee.append(el('span', '', s), el('b', '', '✦')));
  }

  const about = $('#about-text');
  about.setAttribute('aria-label', profile.about);
  profile.about.split(' ').forEach((w) => {
    const s = el('span', 'w', w);
    s.setAttribute('aria-hidden', 'true');
    about.append(s);
  });

  const grid = $('#skill-grid');
  skills.forEach((s, i) => {
    const li = el('li', 'reveal');
    li.append(el('i', '', String(i + 1).padStart(2, '0')), el('span', '', s));
    grid.append(li);
  });

  $('#work-count').textContent = `# ${projects.length} items`;
  const track = $('#work-track');
  projects.forEach((p, i) => {
    const card = el('article', 'card');
    const top = el('div', 'card-top');
    top.append(el('b', '', `${String(i + 1).padStart(2, '0')}/`), el('span', '', p.kind));
    const tags = el('ul', 'tags');
    p.stack.forEach((t) => tags.append(el('li', '', t)));
    card.append(top, el('h3', '', p.name), el('p', '', p.blurb), tags);
    track.append(card);
  });

  $<HTMLAnchorElement>('#mail').href = `mailto:${profile.email}`;
  const links = $('#links');
  [{ label: profile.email, href: `mailto:${profile.email}` }, ...profile.links].forEach((l) => {
    const li = el('li');
    const a = el('a', '', l.label);
    a.href = l.href;
    if (l.href.startsWith('http')) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
    li.append(a);
    links.append(li);
  });

  $('#year').textContent = String(new Date().getFullYear());
}

/* ---------------- hero canvas ---------------- */
function createField(): Field {
  const c = $<HTMLCanvasElement>('#field');
  const ctx = c.getContext('2d');
  if (!ctx) return { toggleMatrix: () => false };

  const mouse = { x: -9999, y: -9999 };
  let w = 0;
  let h = 0;
  let parts: Particle[] = [];
  let cols: number[] = [];
  let raf = 0;
  let frame = 0;
  let mode: 'net' | 'matrix' = 'net';

  function resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = c.clientWidth;
    h = c.clientHeight;
    c.width = w * dpr;
    c.height = h * dpr;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(140, Math.floor((w * h) / 11000));
    parts = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      bx: (Math.random() - 0.5) * 0.45,
      by: (Math.random() - 0.5) * 0.45,
      vx: 0,
      vy: 0,
      r: Math.random() * 1.6 + 0.6,
    }));
    cols = Array.from({ length: Math.ceil(w / 16) }, () => Math.random() * (h / 16));
  }

  function drawNet(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 150) {
        const f = ((150 - d) / 150) * 0.7;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.x += p.bx + p.vx;
      p.y += p.by + p.vy;
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;
    }
    ctx.lineWidth = 1;
    parts.forEach((a, i) => {
      for (let j = i + 1; j < parts.length; j++) {
        const b = parts[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 130) {
          ctx.strokeStyle = `rgba(158,255,110,${(1 - d / 130) * 0.22})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (dm < 220) {
        ctx.strokeStyle = `rgba(255,92,170,${(1 - dm / 220) * 0.5})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(235,233,228,.75)';
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawMatrix(ctx: CanvasRenderingContext2D): void {
    if (frame % 3) return;
    ctx.fillStyle = 'rgba(7,8,10,.14)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#9eff6e';
    ctx.font = '14px JetBrains Mono, monospace';
    cols.forEach((y, i) => {
      ctx.fillText(String.fromCharCode(0x30a0 + Math.random() * 96), i * 16, y * 16);
      cols[i] = y * 16 > h && Math.random() > 0.975 ? 0 : y + 1;
    });
  }

  function loop(): void {
    frame++;
    if (mode === 'net') drawNet(ctx!);
    else drawMatrix(ctx!);
    raf = requestAnimationFrame(loop);
  }

  resize();
  drawNet(ctx);
  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', (e) => {
    const r = c.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });

  if (!reduced) {
    new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(raf);
      if (entry.isIntersecting) loop();
    }).observe(c);
  }

  return {
    toggleMatrix() {
      mode = mode === 'net' ? 'matrix' : 'net';
      ctx.clearRect(0, 0, w, h);
      if (reduced) drawNet(ctx);
      return mode === 'matrix';
    },
  };
}

/* ---------------- small effects ---------------- */
const scrambleTimers = new WeakMap<HTMLElement, number>();

function scramble(node: HTMLElement): void {
  const glyphs = '!<>-_\\/[]{}=+*^?#01';
  $$('.char', node).forEach((c, i) => {
    let n = 0;
    clearInterval(scrambleTimers.get(c));
    const timer = window.setInterval(() => {
      if (n++ >= 5 + i) {
        clearInterval(timer);
        c.textContent = c.dataset.ch ?? '';
        return;
      }
      c.textContent = glyphs[(Math.random() * glyphs.length) | 0];
    }, 35);
    scrambleTimers.set(c, timer);
  });
}

async function typeLoop(node: HTMLElement, items: string[]): Promise<void> {
  if (reduced || items.length === 0) {
    node.textContent = items[0] ?? '';
    return;
  }
  for (let i = 0; ; i++) {
    const s = items[i % items.length];
    for (let k = 1; k <= s.length; k++) {
      node.textContent = s.slice(0, k);
      await wait(55);
    }
    await wait(1700);
    for (let k = s.length; k >= 0; k--) {
      node.textContent = s.slice(0, k);
      await wait(26);
    }
    await wait(300);
  }
}

function initCursor(): void {
  if (!finePointer || reduced) return;
  document.documentElement.classList.add('has-cursor');
  const dot = $('.cursor-dot');
  const ring = $('.cursor-ring');
  const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
  window.addEventListener('mousemove', (e) => {
    gsap.set(dot, { x: e.clientX, y: e.clientY });
    rx(e.clientX);
    ry(e.clientY);
  });
  document.addEventListener('mouseover', (e) => {
    const target = e.target instanceof Element ? e.target.closest('a, button, .card, .skill-grid li') : null;
    ring.classList.toggle('is-hover', !!target);
  });

  $$('.magnetic').forEach((m) => {
    const xTo = gsap.quickTo(m, 'x', { duration: 0.7, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(m, 'y', { duration: 0.7, ease: 'elastic.out(1, 0.4)' });
    m.addEventListener('mousemove', (e) => {
      const r = m.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.4);
      yTo((e.clientY - r.top - r.height / 2) * 0.4);
    });
    m.addEventListener('mouseleave', () => {
      xTo(0);
      yTo(0);
    });
  });

  $$('.card').forEach((card) => {
    const rxTo = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3' });
    const ryTo = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3' });
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', `${px * 100}%`);
      card.style.setProperty('--my', `${py * 100}%`);
      ryTo((px - 0.5) * 12);
      rxTo((0.5 - py) * 12);
    });
    card.addEventListener('mouseleave', () => {
      rxTo(0);
      ryTo(0);
    });
  });
}

/* ---------------- terminal ---------------- */
function initTerminal(field: Field): void {
  const out = $('#term-out');
  const body = $('#term-body');
  const input = $<HTMLInputElement>('#term-in');
  const history: string[] = [];
  let hi = 0;

  const print = (text: string, cls = ''): void => {
    out.append(el('div', `term-line ${cls}`, text));
    body.scrollTop = body.scrollHeight;
  };

  const listProjects: Command = () =>
    projects.map((p, i) => `  ${String(i + 1).padStart(2, '0')}  ${p.name.padEnd(20)} ${p.stack.slice(0, 3).join(', ')}`);

  const commands: Record<string, Command> = {
    help: () => [
      'available commands:',
      '  whoami     who is this guy',
      '  about      the short story',
      '  projects   things I have built',
      '  skills     tools I reach for',
      '  contact    how to reach me',
      '  matrix     toggle something silly',
      '  clear      clean the screen',
    ],
    whoami: () => [`${profile.first} ${profile.last} — ${profile.roles[0]}`],
    about: () => [profile.about],
    projects: listProjects,
    ls: listProjects,
    skills: () => [skills.join(' · ')],
    contact: () => [profile.email, ...profile.links.map((l) => `${l.label}: ${l.href}`)],
    matrix: () => [field.toggleMatrix() ? 'wake up, visitor… (scroll to the top)' : 'back to reality.'],
    sudo: () => ['nice try. this incident will be reported.'],
    date: () => [new Date().toString()],
    echo: (args) => [args.join(' ')],
    clear: () => {
      out.textContent = '';
      return [];
    },
  };

  print("welcome. type 'help' to see what I can do.");

  $<HTMLFormElement>('#term-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = input.value.trim();
    input.value = '';
    print(`visitor@da:~$ ${raw}`, 'cmd');
    if (!raw) return;
    history.push(raw);
    hi = history.length;
    const [name, ...args] = raw.split(/\s+/);
    const key = name.toLowerCase();
    if (!Object.hasOwn(commands, key)) {
      print(`command not found: ${name}. try 'help'.`, 'err');
      return;
    }
    commands[key](args).forEach((l) => print(l));
  });

  input.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    hi = Math.max(0, Math.min(history.length, hi + (e.key === 'ArrowUp' ? -1 : 1)));
    input.value = history[hi] ?? '';
  });

  body.addEventListener('click', () => {
    if (!String(window.getSelection())) input.focus({ preventScroll: true });
  });
}

/* ---------------- scroll animations ---------------- */
function initScroll(lenis: Lenis | null): void {
  const scrollTo = (target: string): void => {
    if (lenis) lenis.scrollTo(target, { duration: 1.4 });
    else $(target).scrollIntoView();
  };
  $$<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    const id = a.getAttribute('href') ?? '';
    if (id.length < 2) return;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      scrollTo(id);
    });
  });

  if (reduced) return;

  gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  // hero drifts away as you leave it
  gsap.to('.hero-inner', {
    yPercent: -18,
    opacity: 0.15,
    ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  // marquee: scroll speed and direction drive it
  const loop = gsap.to('#marquee', { xPercent: -50, repeat: -1, duration: 28, ease: 'none' });
  loop.totalTime(loop.duration() * 100);
  ScrollTrigger.create({
    onUpdate(self) {
      const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 250, 7);
      gsap.to(loop, { timeScale: self.direction * boost, duration: 0.25, overwrite: true });
      gsap.to(loop, { timeScale: self.direction, duration: 1, delay: 0.25 });
    },
  });

  // about: words light up as you scroll
  gsap.fromTo(
    '#about-text .w',
    { opacity: 0.12 },
    {
      opacity: 1,
      stagger: 0.06,
      ease: 'none',
      scrollTrigger: { trigger: '#about-text', start: 'top 82%', end: 'bottom 45%', scrub: true },
    },
  );

  // titles: characters rise out of their line
  $$('[data-title]').forEach((t) => {
    gsap.from($$('.char', t), {
      yPercent: 115,
      rotate: 6,
      duration: 0.9,
      ease: 'expo.out',
      stagger: 0.018,
      scrollTrigger: { trigger: t, start: 'top 88%' },
    });
  });

  // generic reveals
  gsap.set('.reveal', { opacity: 0, y: 36 });
  ScrollTrigger.batch('.reveal', {
    start: 'top 92%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.05 }),
  });

  // work: cards fly in, then the section scrolls sideways on desktop
  gsap.from('.card', {
    y: 90,
    opacity: 0,
    rotationX: -18,
    duration: 1,
    ease: 'power3.out',
    stagger: 0.08,
    scrollTrigger: { trigger: '#work-track', start: 'top 85%' },
  });

  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    const track = $('#work-track');
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: '#work',
        start: 'top top',
        end: () => `+=${dist()}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    });
  });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

/* ---------------- boot + intro ---------------- */
async function boot(lenis: Lenis | null): Promise<void> {
  const screen = $('#boot');
  if (reduced) {
    screen.remove();
    return;
  }

  const intro = gsap.timeline({ paused: true });
  intro
    .from('#name .char', { yPercent: 120, rotate: 8, duration: 1.1, ease: 'expo.out', stagger: 0.035 })
    .from('.hero-fade', { opacity: 0, y: 24, duration: 0.8, ease: 'power3.out', stagger: 0.12 }, 0.5)
    .from('.nav', { yPercent: -120, duration: 0.8, ease: 'power3.out' }, 0.6);

  lenis?.stop();
  const log = $('#boot-log');
  const lines = [
    '[ ok ] mounting /dev/creativity',
    '[ ok ] loading pixels ............. done',
    '[ ok ] compiling animations ....... done',
    '[ ok ] brewing coffee ............. done',
    `> ssh visitor@${profile.handle}`,
    'access granted. welcome.',
  ];
  for (const line of lines) {
    log.textContent += `${line}\n`;
    await wait(170);
  }
  await wait(300);
  gsap.delayedCall(0.45, () => intro.play());
  await gsap.to(screen, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' });
  screen.remove();
  lenis?.start();
}

/* ---------------- go ---------------- */
render();
document.documentElement.classList.toggle('reduced', reduced);

let lenis: Lenis | null = null;
if (!reduced) {
  const smooth = new Lenis();
  smooth.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => smooth.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis = smooth;
}

const field = createField();
initCursor();
initTerminal(field);
initScroll(lenis);
void typeLoop($('#typed'), profile.roles);
$$('#name .line').forEach((line) => line.addEventListener('mouseenter', () => scramble(line)));
void boot(lenis);
