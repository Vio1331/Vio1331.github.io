/* Presentation choices are local to this page visit; every new page opens in its default layout. */
(() => {
  'use strict';
  const choices = {
    'data-view': ['cards', 'list'],
    'data-reading': ['narrow', 'wide'],
    'data-density': ['airy', 'full']
  };
  document.querySelectorAll('[data-layout-switch]').forEach(toolbar => {
    const target = document.getElementById(toolbar.dataset.layoutTarget);
    const attribute = toolbar.dataset.layoutAttribute;
    const allowed = choices[attribute];
    if (!target || !allowed) return;
    const buttons = [...toolbar.querySelectorAll('button[data-layout-value]')];
    const select = value => {
      if (!allowed.includes(value)) return;
      target.setAttribute(attribute, value);
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.layoutValue === value)));
    };
    buttons.forEach(button => button.addEventListener('click', () => select(button.dataset.layoutValue)));
    select(target.getAttribute(attribute));
    toolbar.hidden = false;
  });
})();
