/* Presentation choices are local to this page visit; every new page opens in its default layout. */
(() => {
  'use strict';
  const allowed = ['cards', 'list'];
  document.querySelectorAll('[data-layout-switch]').forEach(toolbar => {
    const target = document.getElementById(toolbar.dataset.layoutTarget);
    if (!target) return;
    const buttons = [...toolbar.querySelectorAll('button[data-layout-value]')];
    const covers = [...target.querySelectorAll('.photography-cover-image img[srcset]')].map(image => ({ image, cardSizes: image.sizes }));
    const select = value => {
      if (!allowed.includes(value)) return;
      target.dataset.view = value;
      covers.forEach(({ image, cardSizes }) => {
        image.sizes = value === 'list' ? 'auto, (max-width: 600px) 6.25rem, 12rem' : cardSizes;
      });
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.layoutValue === value)));
    };
    buttons.forEach(button => button.addEventListener('click', () => select(button.dataset.layoutValue)));
    select(target.dataset.view);
    toolbar.hidden = false;
  });
})();
