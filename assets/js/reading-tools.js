/* Detail-page controls; index-page layout switches remain independent. */
(() => {
  'use strict';
  const toolbar = document.querySelector('[data-reading-tools]');
  if (!toolbar) return;
  const region = toolbar.closest('.reading-region');
  const isJournal = toolbar.dataset.readingTools === 'journal';
  const target = document.getElementById(isJournal ? 'journal-reading' : 'photography-reading');
  if (!target || !region) return;
  const content = target.querySelector(isJournal ? ':scope > .journal-content' : '.photography-sheet');
  const layoutGroup = toolbar.querySelector('[data-reading-layout]');
  const layoutButtons = [...layoutGroup.querySelectorAll('[data-reading-value]')];
  const tocControl = toolbar.querySelector('[data-reading-toc-control]');
  const tocButton = toolbar.querySelector('[data-reading-toc-button]');
  const toc = document.getElementById('reading-toc');
  const tocLinks = toc?.querySelector('[data-reading-toc-links]');
  const backdrop = document.querySelector('[data-reading-toc-close]');
  const smallScreen = matchMedia('(max-width: 720px)');
  const drawerScreen = matchMedia('(max-width: 1320px)');
  const photoInlineScreen = matchMedia('(max-width: 900px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('.site-header');
  const headingElements = isJournal && content ? [...content.querySelectorAll('h2, h3')].filter(h => h.textContent.trim()) : [];
  const entries = [];
  let tocOpen = false;
  let activeHeading = null;
  let pendingFrame = 0;

  const headerBottom = () => header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
  const readingTop = () => headerBottom() + ((isJournal ? drawerScreen.matches : photoInlineScreen.matches) ? toolbar.offsetHeight : 0);
  const keepReadingPosition = change => {
    const edge = readingTop() + 16;
    const anchor = content && [...content.querySelectorAll('h2, h3, p, figure')].find(e => {
      const r = e.getBoundingClientRect();
      return r.height > 0 && r.bottom > edge && r.top < innerHeight;
    });
    const before = anchor ? anchor.getBoundingClientRect().top : 0;
    change();
    if (anchor) {
      const delta = anchor.getBoundingClientRect().top - before;
      if (Math.abs(delta) > 1) window.scrollBy({top: delta, left: 0, behavior: 'instant'});
    }
  };

  function updateActiveHeading() {
    if (!tocOpen || !entries.length) return;
    let active = entries[0];
    const edge = readingTop() + 64;
    for (const entry of entries) {
      if (entry.heading.getBoundingClientRect().top <= edge) active = entry;
    }
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 2) active = entries[entries.length - 1];
    if (active === activeHeading) return;
    activeHeading = active;
    entries.forEach(entry => {
      if (entry === active) entry.link.setAttribute('aria-current', 'location');
      else entry.link.removeAttribute('aria-current');
    });
    const panel = toc.getBoundingClientRect();
    const link = active.link.getBoundingClientRect();
    if (link.top < panel.top) toc.scrollTop += link.top - panel.top;
    else if (link.bottom > panel.bottom) toc.scrollTop += link.bottom - panel.bottom;
  }
  function updateReadingFrame() {
    pendingFrame = 0;
    const end = region.getBoundingClientRect().bottom;
    // Once the reading region ends, fixed controls move with its bottom edge.
    region.style.setProperty('--reading-tools-height', toolbar.offsetHeight + 'px');
    region.style.setProperty('--reading-end-y', Math.max(0, end) + 'px');
    updateActiveHeading();
  }
  function scheduleReadingFrame() {
    if (!pendingFrame) pendingFrame = requestAnimationFrame(updateReadingFrame);
  }
  function setToc(open) {
    if (!entries.length) return;
    tocOpen = open;
    toc.classList.toggle('is-open', open);
    toc.inert = !open;
    toc.setAttribute('aria-hidden', String(!open));
    backdrop.classList.toggle('is-open', open && drawerScreen.matches);
    tocButton.setAttribute('aria-expanded', String(open));
    const label = open ? '收起文章目录' : '展开文章目录';
    tocButton.setAttribute('aria-label', label);
    tocButton.title = label;
    activeHeading = null;
    updateReadingFrame();
  }
  function syncControls() {
    const selected = target.getAttribute(isJournal ? 'data-reading' : 'data-density');
    layoutButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.readingValue === selected)));
    layoutGroup.hidden = isJournal && smallScreen.matches;
    if (backdrop) backdrop.classList.toggle('is-open', tocOpen && drawerScreen.matches);
  }

  if (toc && tocButton) {
    const usedIds = new Set([...document.querySelectorAll('[id]')].map(e => e.id));
    headingElements.forEach((heading, index) => {
      if (!heading.id) {
        let id = 'reading-section-' + (index + 1);
        while (usedIds.has(id)) id += '-section';
        heading.id = id;
        usedIds.add(id);
      }
      const link = document.createElement('a');
      link.textContent = heading.textContent.trim();
      link.href = '#' + encodeURIComponent(heading.id);
      link.dataset.level = heading.tagName.slice(1);
      link.addEventListener('click', event => {
        event.preventDefault();
        if (drawerScreen.matches) setToc(false);
        history.replaceState(history.state, '', link.hash);
        window.scrollTo({top: Math.max(0, scrollY + heading.getBoundingClientRect().top - readingTop() - 24), behavior: reducedMotion.matches ? 'instant' : 'smooth'});
        if (event.detail === 0) {
          heading.setAttribute('tabindex', '-1');
          heading.focus({preventScroll: true});
          heading.addEventListener('blur', () => heading.removeAttribute('tabindex'), {once: true});
        }
      });
      entries.push({heading, link});
      tocLinks.append(link);
    });
    tocControl.hidden = entries.length === 0;
    toc.hidden = false;
    backdrop.hidden = false;
    tocButton.addEventListener('click', event => {
      setToc(!tocOpen);
      if (tocOpen && event.detail === 0) (activeHeading || entries[0]).link.focus();
    });
    backdrop.addEventListener('click', () => { setToc(false); tocButton.focus(); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && tocOpen) { setToc(false); tocButton.focus(); }
    });
  }
  layoutButtons.forEach(button => button.addEventListener('click', () => {
    const attribute = isJournal ? 'data-reading' : 'data-density';
    const value = button.dataset.readingValue;
    if (target.getAttribute(attribute) === value) return;
    keepReadingPosition(() => target.setAttribute(attribute, value));
    syncControls();
    updateReadingFrame();
  }));
  window.addEventListener('scroll', scheduleReadingFrame, {passive: true});
  window.addEventListener('resize', () => { syncControls(); scheduleReadingFrame(); });
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(scheduleReadingFrame).observe(region);
  document.fonts?.ready.then(scheduleReadingFrame);
  toolbar.classList.add('is-floating');
  syncControls();
  updateReadingFrame();
  // Every article starts with its outline open; a fresh page does not inherit a closed state.
  if (entries.length) requestAnimationFrame(() => setToc(true));
})();
