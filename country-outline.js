/* Compact country silhouette renderer backed by the existing map GeoJSON. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CountryOutlineComponent = api;
})(typeof window === 'undefined' ? globalThis : window, function (root) {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function collectRings(geometry, rings = []) {
    if (!geometry) return rings;
    if (geometry.type === 'Polygon') {
      for (const ring of geometry.coordinates || []) rings.push(ring);
    } else if (geometry.type === 'MultiPolygon') {
      for (const polygon of geometry.coordinates || []) for (const ring of polygon || []) rings.push(ring);
    } else if (geometry.type === 'GeometryCollection') {
      for (const child of geometry.geometries || []) collectRings(child, rings);
    }
    return rings;
  }

  function geometryPath(feature, padding = 5) {
    const rings = collectRings(feature?.geometry).filter(ring => Array.isArray(ring) && ring.length > 1);
    const points = rings.flat().filter(point => Array.isArray(point) && Number.isFinite(Number(point[0])) && Number.isFinite(Number(point[1])));
    if (!points.length) return null;
    const xs = points.map(point => Number(point[0])), ys = points.map(point => Number(point[1]));
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const width = Math.max(1, maxX - minX), height = Math.max(1, maxY - minY);
    const pad = Math.max(width, height) * (padding / 100);
    const viewWidth = width + pad * 2, viewHeight = height + pad * 2;
    const project = point => [Number(point[0]) - minX + pad, maxY - Number(point[1]) + pad];
    const paths = rings.map(ring => {
      const points = ring.filter(point => Array.isArray(point) && Number.isFinite(Number(point[0])) && Number.isFinite(Number(point[1])));
      if (points.length < 2) return '';
      return `${points.map((point, index) => {
        const [x, y] = project(point);
        return `${index ? 'L' : 'M'}${x.toFixed(3)} ${y.toFixed(3)}`;
      }).join(' ')} Z`;
    }).filter(Boolean).join(' ');
    return { d: paths, viewBox: `0 0 ${viewWidth.toFixed(3)} ${viewHeight.toFixed(3)}` };
  }

  function create(feature, options = {}) {
    const documentRef = options.document || root.document;
    if (!documentRef) throw new Error('CountryOutlineComponent.create requires a document.');
    const geometry = geometryPath(feature, options.padding ?? 5);
    const svg = documentRef.createElementNS(SVG_NS, 'svg');
    svg.classList.add('country-outline');
    svg.setAttribute('viewBox', geometry?.viewBox || '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('aria-hidden', options.ariaHidden === false ? 'false' : 'true');
    if (options.ariaLabel) {
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', options.ariaLabel);
      svg.removeAttribute('aria-hidden');
    }
    if (options.className) svg.classList.add(options.className);
    if (geometry?.d) {
      const path = documentRef.createElementNS(SVG_NS, 'path');
      path.classList.add('country-outline-path');
      path.setAttribute('d', geometry.d);
      path.setAttribute('fill-rule', 'evenodd');
      path.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.appendChild(path);
    }
    return svg;
  }

  return { create, collectRings, geometryPath };
});
