import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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

  gsap.registerPlugin(ScrollTrigger);

  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  const titles = document.querySelectorAll<HTMLElement>('[data-reveal="title"]');
  titles.forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 60,
      duration: 1.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    });
  });

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
