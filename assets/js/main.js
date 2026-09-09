const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('is-open', !open);
  });
}

document.querySelectorAll('.site-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    toggle?.setAttribute('aria-expanded', 'false');
    nav?.classList.remove('is-open');
  });
});

// Use the article card as the size reference, including after fonts load or text wraps.
const homeJournalCard = document.querySelector('.home-journal-card');
const homePhotography = document.querySelector('.home-photography');

if (homeJournalCard && homePhotography) {
  const matchHomeCoverSize = () => {
    const { width, height } = homeJournalCard.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;
    homePhotography.style.setProperty('--home-journal-width', `${width}px`);
    homePhotography.style.setProperty('--home-journal-height', `${height}px`);
  };
  matchHomeCoverSize();
  if ('ResizeObserver' in window) {
    const coverSizeObserver = new ResizeObserver(matchHomeCoverSize);
    coverSizeObserver.observe(homeJournalCard, { box: 'border-box' });
  } else {
    window.addEventListener('resize', matchHomeCoverSize);
  }
  document.fonts?.ready.then(matchHomeCoverSize);
}

// Trace each decoration once as it enters view, then return to the font rendering.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('.home-journal, .home-photography').forEach((section) => {
  const outline = section.querySelector('.home-journal-outline, .home-photography-outline');
  if (!outline || reducedMotion.matches || !('IntersectionObserver' in window) || !document.fonts) return;
  let observer;
  let finished = false;
  let finishTimer;

  const finishOutline = () => {
    finished = true;
    clearTimeout(finishTimer);
    observer?.disconnect();
    section.classList.remove('is-outline-ready', 'is-outline-playing');
    outline.removeEventListener('animationend', onOutlineEnd);
    outline.remove();
    reducedMotion.removeEventListener('change', onMotionChange);
  };
  const onMotionChange = () => {
    if (reducedMotion.matches) finishOutline();
  };
  const onOutlineEnd = (event) => {
    // A child's drawing animation ends first; only clean up after the SVG has faded.
    if (event.target === outline && event.animationName === 'home-journal-outline-fade') finishOutline();
  };
  const milliseconds = (value) => parseFloat(value) * (value.trim().endsWith('ms') ? 1 : 1000);

  reducedMotion.addEventListener('change', onMotionChange);
  outline.addEventListener('animationend', onOutlineEnd);

  // The outline matches Dela Gothic One 400; retain static text if the subset cannot load.
  document.fonts.load('400 100px "Dela Gothic One"', outline.dataset.glyph).then((faces) => {
    if (finished) return;
    if (!faces.length || reducedMotion.matches || getComputedStyle(outline).position !== 'absolute') {
      finishOutline();
      return;
    }
    outline.style.display = 'block';
    section.classList.add('is-outline-ready');
    observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      section.classList.add('is-outline-playing');
      const animation = getComputedStyle(outline);
      const duration = milliseconds(animation.animationDelay) + milliseconds(animation.animationDuration);
      finishTimer = setTimeout(finishOutline, duration + 250);
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
    observer.observe(outline);
  }).catch(finishOutline);
});
