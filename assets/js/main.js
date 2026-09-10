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

// Draw each SVG once, then keep its completed outline. No webfont or filled text is needed.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('.home-journal, .home-photography').forEach((section) => {
  const outline = section.querySelector('.home-journal-outline, .home-photography-outline');
  const path = outline?.querySelector('path');
  if (!path || reducedMotion.matches || !('IntersectionObserver' in window)) return;
  if (getComputedStyle(outline).position !== 'absolute') return;
  let finished = false;
  let finishTimer;

  const finishOutline = () => {
    if (finished) return;
    finished = true;
    clearTimeout(finishTimer);
    observer.disconnect();
    // The base SVG style is the finished outline; keep the SVG in the page.
    section.classList.remove('is-outline-ready', 'is-outline-playing');
    outline.removeEventListener('animationend', onOutlineEnd);
    reducedMotion.removeEventListener('change', onMotionChange);
  };
  const onMotionChange = () => {
    if (reducedMotion.matches) finishOutline();
  };
  const onOutlineEnd = (event) => {
    // Every contour uses the same duration and delay; there is no fade-out stage.
    if (event.animationName === 'home-journal-trace') finishOutline();
  };
  const milliseconds = (value) => parseFloat(value) * (value.trim().endsWith('ms') ? 1 : 1000);
  const observer = new IntersectionObserver((entries) => {
    if (finished || !entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    section.classList.add('is-outline-playing');
    const animation = getComputedStyle(path);
    const duration = milliseconds(animation.animationDelay) + milliseconds(animation.animationDuration);
    finishTimer = setTimeout(finishOutline, duration + 250);
  }, { rootMargin: '0px 0px -20% 0px', threshold: 0.3 });

  reducedMotion.addEventListener('change', onMotionChange);
  outline.addEventListener('animationend', onOutlineEnd);
  section.classList.add('is-outline-ready');
  observer.observe(outline);
});

// The about page discovers its avatar variants from the image folder at build time.
const avatar = document.querySelector('[data-avatar-images]');
const avatarImage = avatar?.querySelector('img');

if (avatarImage) {
  const originalSource = avatarImage.getAttribute('src');
  let sources;
  try {
    sources = JSON.parse(avatar.dataset.avatarImages);
  } catch {
    sources = [];
  }
  const variants = (Array.isArray(sources) ? sources : [])
    .filter((source) => typeof source === 'string' && source.length > 0)
    .map((source) => {
      const image = new Image();
      const ready = new Promise((resolve) => {
        image.onload = () => resolve(true);
        image.onerror = () => resolve(false);
      });
      image.src = source;
      return { source, ready };
    });
  let hoverVersion = 0;

  if (variants.length > 0) {
    avatar.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch') return;
      const version = ++hoverVersion;
      const variant = variants[Math.floor(Math.random() * variants.length)];
      variant.ready.then((loaded) => {
        // A slow image must not replace the original after the pointer has left.
        if (loaded && version === hoverVersion) avatarImage.src = variant.source;
      });
    });
    const restoreAvatar = () => {
      hoverVersion += 1;
      avatarImage.src = originalSource;
    };
    avatar.addEventListener('pointerleave', restoreAvatar);
    avatar.addEventListener('pointercancel', restoreAvatar);
    window.addEventListener('blur', restoreAvatar);
  }
}
