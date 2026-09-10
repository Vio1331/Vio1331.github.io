/* Detail-page controls; index-page layout switches remain independent. */
(() => {
  'use strict';
  const toolbar = document.querySelector('[data-reading-tools]');
  if (!toolbar) return;
  const isJournal = toolbar.dataset.readingTools === 'journal';
  const target = document.getElementById(isJournal ? 'journal-reading' : 'photography-reading');
  if (!target) return;
  const content = target.querySelector(isJournal ? ':scope > .journal-content' : '.photography-sheet');
  const widthButton = toolbar.querySelector('[data-reading-width-button]');
  const divider = toolbar.querySelector('[data-reading-divider]');
  const tocButton = toolbar.querySelector('[data-reading-toc-button]');
  const toc = document.getElementById('reading-toc');
  const backdrop = document.querySelector('[data-reading-toc-close]');
  const smallScreen = matchMedia('(max-width: 720px)');
  const drawerScreen = matchMedia('(max-width: 1000px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('.site-header');
  const headingElements = isJournal && content ? [...content.querySelectorAll('h2, h3')].filter(h => h.textContent.trim()) : [];
  const entries = [];
  let tocOpen = false;
  let activeHeading = null;
  let pendingFrame = 0;

  const headerBottom = () => header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
  const keepReadingPosition = change => {
    const edge = headerBottom() + 16;
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
    pendingFrame = 0;
    if (!tocOpen || !entries.length) return;
    let active = entries[0];
    const edge = headerBottom() + 64;
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
  function scheduleHeadingUpdate() {
    if (!pendingFrame && tocOpen) pendingFrame = requestAnimationFrame(updateActiveHeading);
  }
  function setToc(open) {
    if (!entries.length) return;
    keepReadingPosition(() => {
      tocOpen = open;
      document.body.dataset.readingToc = open ? 'open' : 'closed';
      toc.hidden = !open;
      backdrop.hidden = !(open && drawerScreen.matches);
      tocButton.setAttribute('aria-expanded', String(open));
      const label = open ? '收起文章目录' : '展开文章目录';
      tocButton.setAttribute('aria-label', label);
      tocButton.title = label;
    });
    activeHeading = null;
    scheduleHeadingUpdate();
  }
  function syncControls() {
    const expanded = target.getAttribute(isJournal ? 'data-reading' : 'data-density') === (isJournal ? 'wide' : 'full');
    const label = isJournal ? (expanded ? '切换到窄版' : '切换到宽版') : (expanded ? '切换到 Airy · 疏朗' : '切换到 Full · 铺展');
    widthButton.setAttribute('aria-label', label);
    widthButton.title = label;
    widthButton.setAttribute('aria-pressed', String(expanded));
    widthButton.querySelector('[data-reading-expand]').toggleAttribute('hidden', expanded);
    widthButton.querySelector('[data-reading-collapse]').toggleAttribute('hidden', !expanded);
    widthButton.hidden = isJournal && smallScreen.matches;
    divider.hidden = widthButton.hidden && (!tocButton || tocButton.hidden);
    if (backdrop) backdrop.hidden = !(tocOpen && drawerScreen.matches);
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
        window.scrollTo({top: Math.max(0, scrollY + heading.getBoundingClientRect().top - headerBottom() - 24), behavior: reducedMotion.matches ? 'instant' : 'smooth'});
        if (event.detail === 0) {
          heading.setAttribute('tabindex', '-1');
          heading.focus({preventScroll: true});
          heading.addEventListener('blur', () => heading.removeAttribute('tabindex'), {once: true});
        }
      });
      entries.push({heading, link});
      toc.append(link);
    });
    tocButton.hidden = entries.length === 0;
    tocButton.addEventListener('click', event => {
      setToc(!tocOpen);
      if (tocOpen && event.detail === 0) (activeHeading || entries[0]).link.focus();
    });
    backdrop.addEventListener('click', () => { setToc(false); tocButton.focus(); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && tocOpen) { setToc(false); tocButton.focus(); }
    });
    window.addEventListener('scroll', scheduleHeadingUpdate, {passive: true});
    if (content && typeof ResizeObserver !== 'undefined') new ResizeObserver(scheduleHeadingUpdate).observe(content);
  }
  widthButton.addEventListener('click', () => {
    keepReadingPosition(() => {
      const attribute = isJournal ? 'data-reading' : 'data-density';
      const larger = isJournal ? 'wide' : 'full';
      const smaller = isJournal ? 'narrow' : 'airy';
      target.setAttribute(attribute, target.getAttribute(attribute) === larger ? smaller : larger);
    });
    syncControls();
    scheduleHeadingUpdate();
  });
  window.addEventListener('resize', () => { syncControls(); scheduleHeadingUpdate(); });
  syncControls();
})();
