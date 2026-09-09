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

// Trace the home decoration once, then return to the original text rendering.
const homeJournal = document.querySelector('.home-journal');
const journalOutline = homeJournal?.querySelector('.home-journal-outline');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (journalOutline && !reducedMotion.matches && 'IntersectionObserver' in window && document.fonts) {
  let observer;
  let finished = false;
  let finishTimer;

  const finishOutline = () => {
    finished = true;
    clearTimeout(finishTimer);
    observer?.disconnect();
    homeJournal.classList.remove('is-outline-ready', 'is-outline-playing');
    journalOutline.removeEventListener('animationend', onOutlineEnd);
    journalOutline.remove();
    reducedMotion.removeEventListener('change', onMotionChange);
  };
  const onMotionChange = () => {
    if (reducedMotion.matches) finishOutline();
  };
  const onOutlineEnd = (event) => {
    // A child's drawing animation ends first; only clean up after the SVG has faded.
    if (event.target === journalOutline && event.animationName === 'home-journal-outline-fade') finishOutline();
  };
  const milliseconds = (value) => parseFloat(value) * (value.trim().endsWith('ms') ? 1 : 1000);

  reducedMotion.addEventListener('change', onMotionChange);
  journalOutline.addEventListener('animationend', onOutlineEnd);

  // The outline comes from Noto Sans SC 700; keep the static fallback if it cannot load.
  document.fonts.load('700 100px "Noto Sans SC"', '文').then((faces) => {
    if (finished) return;
    if (!faces.length || reducedMotion.matches || getComputedStyle(journalOutline).position !== 'absolute') {
      finishOutline();
      return;
    }
    journalOutline.style.display = 'block';
    homeJournal.classList.add('is-outline-ready');
    observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      homeJournal.classList.add('is-outline-playing');
      const animation = getComputedStyle(journalOutline);
      const duration = milliseconds(animation.animationDelay) + milliseconds(animation.animationDuration);
      finishTimer = setTimeout(finishOutline, duration + 250);
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
    observer.observe(journalOutline);
  }).catch(finishOutline);
}
