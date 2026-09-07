/* Reusable flag presentation. The frame reserves space; the image preserves its native ratio. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FlagComponent = api;
})(typeof window === 'undefined' ? globalThis : window, function (root) {
  'use strict';

  const DEFAULT_ASSET_DIRECTORY = 'flags';
  const SIZE_ATTRIBUTES = Object.freeze({
    hero: { width: 720, height: 360 },
    card: { width: 320, height: 180 },
    gallery: { width: 320, height: 190 },
    compact: { width: 160, height: 96 }
  });

  function assetPath(country, options) {
    if (options.src) return options.src;
    const code = String(country?.flag_code || country?.flagCode || country?.iso_alpha2 || options.code || '').toLowerCase();
    if (!/^[a-z]{2}$/.test(code)) return '';
    return `${options.assetDirectory || DEFAULT_ASSET_DIRECTORY}/${code}.svg`;
  }

  function create(country, options = {}) {
    const documentRef = options.document || root.document;
    if (!documentRef) throw new Error('FlagComponent.create requires a document.');
    const size = SIZE_ATTRIBUTES[options.size] ? options.size : 'card';
    const frame = documentRef.createElement('span');
    frame.className = `flag-frame flag-frame--${size}${options.className ? ` ${options.className}` : ''}`;
    frame.dataset.flagCode = String(country?.flag_code || country?.flagCode || options.code || '').toLowerCase();
    frame.dataset.flagSize = size;

    const image = documentRef.createElement('img');
    image.className = 'flag-image';
    image.src = assetPath(country, options);
    image.alt = options.decorative ? '' : (options.alt || 'Flag to identify');
    image.width = SIZE_ATTRIBUTES[size].width;
    image.height = SIZE_ATTRIBUTES[size].height;
    image.loading = options.loading || (size === 'hero' ? 'eager' : 'lazy');
    image.decoding = 'async';
    if (options.fetchPriority) image.fetchPriority = options.fetchPriority;
    frame.appendChild(image);

    if (options.caption) {
      const caption = documentRef.createElement('span');
      caption.className = 'flag-caption';
      caption.textContent = options.caption;
      frame.appendChild(caption);
    }
    return frame;
  }

  function image(frame) {
    return frame?.querySelector?.('.flag-image') || null;
  }

  return { create, image, sizes: SIZE_ATTRIBUTES, assetPath };
});
