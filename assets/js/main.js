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
