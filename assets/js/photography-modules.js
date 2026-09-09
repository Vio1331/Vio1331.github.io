/* Natural image ratios drive layout; photographs are never cropped or stretched.
   A ratio hint is optional and is replaced by the actual ratio after loading. */
(() => {
  'use strict';
  const parseRatio = value => {
    if (!value) return null;
    const parts = String(value).trim().split(/[:/]/).map(Number);
    if (parts.length === 2 && parts.every(n => Number.isFinite(n) && n > 0)) return parts[0] / parts[1];
    if (parts.length === 1 && Number.isFinite(parts[0]) && parts[0] > 0) return parts[0];
    return null;
  };
  const shape = ratio => Math.abs(ratio - 1) < 0.01 ? 's' : ratio > 1 ? 'h' : 'v';
  const imageRatio = image => {
    if (image.naturalWidth > 0 && image.naturalHeight > 0) return image.naturalWidth / image.naturalHeight;
    const hinted = parseRatio(image.dataset.ratio);
    if (hinted) return hinted;
    const width = Number(image.getAttribute('width'));
    const height = Number(image.getAttribute('height'));
    return width > 0 && height > 0 ? width / height : null;
  };
  document.querySelectorAll('.photography').forEach(photography => {
    const updateBlock = block => {
      if (!block) return;
      const images = [...block.querySelectorAll('.photography-image > img')];
      const ratios = images.map(imageRatio);
      const shapes = ratios.map(ratio => ratio ? shape(ratio) : null);
      images.forEach((image, index) => {
        if (shapes[index]) image.closest('.photography-image').dataset.shape = shapes[index];
      });
      if (ratios.some(ratio => !ratio) || !ratios.length) return;
      const type = block.dataset.type;
      if (type === 'diptych' || type === 'triptych') {
        block.style.setProperty('--photography-tracks', ratios.map(ratio => `${ratio}fr`).join(' '));
        block.classList.toggle('photography-square-pair', type === 'diptych' && ratios.length === 2 && shapes.every(s => s === 's'));
        block.classList.toggle('photography-landscape-pair', type === 'diptych' && shapes.every(s => s === 'h'));
      } else if (type === 'asymmetric') {
        const mainIndex = block.dataset.main === 'right' ? 1 : 0;
        block.style.setProperty('--photography-tracks', ratios.map((ratio, index) => `${ratio * (index === mainIndex ? 1.55 : 1)}fr`).join(' '));
      } else if (type === 'image' || type === 'image_text') {
        block.dataset.shape = shapes[0];
      }
    };
    photography.querySelectorAll('.photography-image > img').forEach(image => {
      const update = () => {
        const ratio = imageRatio(image);
        if (ratio) image.closest('.photography-image').dataset.shape = shape(ratio);
        updateBlock(image.closest('.photography-block'));
      };
      image.addEventListener('load', update, { once: true });
      update();
    });
  });
})();
