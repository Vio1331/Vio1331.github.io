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
const homeLeadCard = document.querySelector('.home-lead-card');
const homePhotography = document.querySelector('.home-photography');

if (homeLeadCard && homePhotography) {
  const matchHomeCoverSize = () => {
    const { width, height } = homeLeadCard.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;
    homePhotography.style.setProperty('--home-lead-width', `${width}px`);
    homePhotography.style.setProperty('--home-lead-height', `${height}px`);
  };
  matchHomeCoverSize();
  if ('ResizeObserver' in window) {
    const coverSizeObserver = new ResizeObserver(matchHomeCoverSize);
    coverSizeObserver.observe(homeLeadCard, { box: 'border-box' });
  } else {
    window.addEventListener('resize', matchHomeCoverSize);
  }
  document.fonts?.ready.then(matchHomeCoverSize);
}

// Trace the home decoration once, then return to the original text rendering.
const homeWords = document.querySelector('.home-words');
const wordsOutline = homeWords?.querySelector('.home-words-outline');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (wordsOutline && !reducedMotion.matches && 'IntersectionObserver' in window && document.fonts) {
  let observer;
  let finished = false;
  let finishTimer;

  const finishOutline = () => {
    finished = true;
    clearTimeout(finishTimer);
    observer?.disconnect();
    homeWords.classList.remove('is-outline-ready', 'is-outline-playing');
    wordsOutline.removeEventListener('animationend', onOutlineEnd);
    wordsOutline.remove();
    reducedMotion.removeEventListener('change', onMotionChange);
  };
  const onMotionChange = () => {
    if (reducedMotion.matches) finishOutline();
  };
  const onOutlineEnd = (event) => {
    // A child's drawing animation ends first; only clean up after the SVG has faded.
    if (event.target === wordsOutline && event.animationName === 'home-words-outline-fade') finishOutline();
  };
  const milliseconds = (value) => parseFloat(value) * (value.trim().endsWith('ms') ? 1 : 1000);

  reducedMotion.addEventListener('change', onMotionChange);
  wordsOutline.addEventListener('animationend', onOutlineEnd);

  // The outline comes from Noto Sans SC 700; keep the static fallback if it cannot load.
  document.fonts.load('700 100px "Noto Sans SC"', '文').then((faces) => {
    if (finished) return;
    if (!faces.length || reducedMotion.matches || getComputedStyle(wordsOutline).position !== 'absolute') {
      finishOutline();
      return;
    }
    wordsOutline.style.display = 'block';
    homeWords.classList.add('is-outline-ready');
    observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      homeWords.classList.add('is-outline-playing');
      const animation = getComputedStyle(wordsOutline);
      const duration = milliseconds(animation.animationDelay) + milliseconds(animation.animationDuration);
      finishTimer = setTimeout(finishOutline, duration + 250);
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
    observer.observe(wordsOutline);
  }).catch(finishOutline);
}
