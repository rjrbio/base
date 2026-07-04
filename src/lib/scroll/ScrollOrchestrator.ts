import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

let lenis: Lenis | null = null;
let initialized = false;

export function initScroll(): void {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);

  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  initHeroEntrance();
  initTitleReveals();
  initScrollProgress();
  initMagneticCta();
  initPolaroidHover();

  const subsections = document.querySelectorAll<HTMLElement>('[data-pinning-id]');
  subsections.forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 30,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
    });
  });

  const isWide = window.matchMedia('(min-width: 900px)').matches;
  const subsectionTexts = document.querySelectorAll<HTMLElement>('.subsection__content > p');
  subsectionTexts.forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      x: isWide ? 60 : 0,
      y: isWide ? 0 : 20,
      duration: 1,
      delay: 0.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
    });
  });

  // Polaroid teatral: each project image gets a deterministic tilt and a soft
  // scroll-driven parallax. The tilt cycles through three values so adjacent
  // items don't lean the same way.
  const tiltCycle = [-1.5, 0.9, -0.6];
  const projectImages = document.querySelectorAll<HTMLElement>('.project-image');
  projectImages.forEach((img, i) => {
    const tilt = tiltCycle[i % tiltCycle.length];
    gsap.set(img, { rotation: tilt });
    gsap.fromTo(
      img,
      { yPercent: 8 },
      {
        yPercent: -8,
        rotation: tilt,
        ease: 'none',
        scrollTrigger: {
          trigger: img,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      },
    );
  });
}

function initHeroEntrance(): void {
  const headline = document.querySelector<HTMLElement>('.hero__headline');
  if (!headline) return;
  const split = new SplitText(headline, { type: 'chars', mask: 'chars' });
  gsap.from(split.chars, {
    yPercent: 110,
    rotateX: -35,
    duration: 1.05,
    ease: 'power4.out',
    stagger: 0.035,
    delay: 0.2,
  });
  const period = split.chars[split.chars.length - 1];
  if (period) {
    gsap.from(period, {
      scale: 0,
      duration: 0.5,
      delay: 0.2 + split.chars.length * 0.035 + 0.15,
      ease: 'back.out(3)',
    });
  }
}

function initTitleReveals(): void {
  const gold =
    getComputedStyle(document.documentElement).getPropertyValue('--p3').trim() || '#d4a64a';

  document
    .querySelectorAll<HTMLElement>('[data-reveal="title"]:not(.hero__headline)')
    .forEach((el) => {
      if (el.closest('#kintsugi-the-fall')) {
        initKintsugiReveal(el, gold);
        return;
      }
      const split = new SplitText(el, { type: 'chars', mask: 'chars' });
      gsap.from(split.chars, {
        yPercent: 115,
        duration: 0.9,
        ease: 'power4.out',
        stagger: 0.03,
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      });
    });

  document.querySelectorAll<HTMLElement>('.project__tagline').forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 24,
      duration: 0.9,
      delay: 0.35,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
    });
  });
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

// Fracture glitch + one-shot golden sweep: the typographic kintsugi crack.
function initKintsugiReveal(el: HTMLElement, gold: string): void {
  const split = new SplitText(el, { type: 'chars' });
  const chars = split.chars;
  const tl = gsap.timeline({
    scrollTrigger: { trigger: el, start: 'top 78%', once: true },
  });
  tl.from(chars, {
    opacity: 0,
    duration: 0.05,
    stagger: { each: 0.028, from: 'random' },
  })
    .to(chars, {
      x: () => gsap.utils.random(-16, 16),
      y: () => gsap.utils.random(-12, 12),
      opacity: () => gsap.utils.random(0.15, 1),
      duration: 0.08,
      repeat: 3,
      repeatRefresh: true,
      stagger: { each: 0.01, from: 'random' },
    })
    .to(chars, {
      x: 0,
      y: 0,
      opacity: 1,
      duration: 0.5,
      ease: 'power3.out',
      stagger: { each: 0.012, from: 'random' },
    })
    .to(
      chars,
      {
        color: gold,
        textShadow: `0 0 24px ${hexToRgba(gold, 0.55)}`,
        duration: 0.16,
        stagger: 0.02,
        ease: 'none',
      },
      '+=0.1',
    )
    .to(
      chars,
      {
        color: 'var(--fg)',
        textShadow: `0 0 0px ${hexToRgba(gold, 0)}`,
        duration: 0.4,
        stagger: 0.02,
        ease: 'power2.out',
      },
      '<0.18',
    );
}

function initScrollProgress(): void {
  const fill = document.querySelector<HTMLElement>('[data-scroll-progress-fill]');
  if (!fill) return;

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      fill.style.transform = `scaleY(${self.progress})`;
    },
  });

  const accents: Record<string, string> = {
    'lore-master-assistant': 'var(--p1)',
    'gonna-be': 'var(--p2)',
    'kintsugi-the-fall': 'var(--p3)',
  };
  document.querySelectorAll<HTMLElement>('[data-bg-section]').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => {
        if (self.isActive) {
          fill.style.background = accents[el.dataset.bgSection ?? ''] ?? 'var(--fg-muted)';
        }
      },
    });
  });
}

function initMagneticCta(): void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const link = document.querySelector<HTMLElement>('.cta__link');
  if (!link) return;
  const xTo = gsap.quickTo(link, 'x', { duration: 0.4, ease: 'power3.out' });
  const yTo = gsap.quickTo(link, 'y', { duration: 0.4, ease: 'power3.out' });
  window.addEventListener(
    'mousemove',
    (e) => {
      const r = link.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy);
      const radius = Math.max(r.width, r.height) / 2 + 80;
      if (dist < radius && dist > 0) {
        const pull = (1 - dist / radius) * 12;
        xTo((dx / dist) * pull);
        yTo((dy / dist) * pull);
      } else {
        xTo(0);
        yTo(0);
      }
    },
    { passive: true },
  );
}

function initPolaroidHover(): void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll<HTMLElement>('.project-image').forEach((img) => {
    img.addEventListener('mouseenter', () => {
      gsap.to(img, { scale: 1.03, duration: 0.35, ease: 'power2.out' });
    });
    img.addEventListener('mouseleave', () => {
      gsap.to(img, { scale: 1, duration: 0.45, ease: 'power2.out' });
    });
  });
}
