/* Map adapter: the existing renderer remains responsible for borders, labels and navigation. */
window.createGameMap = function (bridge, onPick) {
  const svg = bridge.svg;
  const hitLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const feedbackLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  hitLayer.id = 'gameHitTargets'; feedbackLayer.id = 'gameFeedbackLayer'; svg.querySelector('#mapViewport').append(hitLayer, feedbackLayer);
  let clickMode = false, countries = [], lastRegion = null, gesture = null, pointerCount = 0;
  let keyboardCountries = [], keyboardIndex = -1, lastPointerUp = -Infinity;
  function units() { const v = bridge.getView(), box = svg.getBoundingClientRect(); return Math.max(v.w / box.width, v.h / box.height); }
  function clearFeedback() {
    for (const r of bridge.regionRecords) r.path.classList.remove('game-good', 'game-bad', 'game-reveal', 'game-pending');
    feedbackLayer.replaceChildren();
  }
  function pending(id) {
    clearPending();
    if (!id) return;
    for (const r of bridge.regionRecords) {
      if ((r.ownerId || r.id) === id) r.path.classList.add('game-pending');
    }
  }
  function clearPending() {
    for (const r of bridge.regionRecords) r.path.classList.remove('game-pending');
  }
  function feedback(id, kind, permanent = false, intensity = 'full') {
    clearPending();
    if (kind === 'reveal') {
      const label = bridge.labelRecords.find(r => r.mode === 'countries' && r.id === id), view = bridge.getView();
      if (label && (label.labelX < view.x || label.labelX > view.x+view.w || label.labelY < view.y || label.labelY > view.y+view.h)) {
        bridge.setView({...view,x:label.labelX-view.w/2,y:label.labelY-view.h/2});
      }
    }
    if (kind !== 'bad') bridge.mark(id);
    for (const r of bridge.regionRecords) {
      if ((r.ownerId || r.id) !== id) continue;
      r.path.classList.remove('game-good', 'game-bad', 'game-reveal', 'feedback-full', 'feedback-subtle', 'feedback-minimal');
      void r.path.getBoundingClientRect();
      r.path.classList.add(`game-${kind}`);
      if (kind === 'good' && intensity !== 'off') r.path.classList.add(`feedback-${intensity}`);
      if (kind === 'bad') setTimeout(() => r.path.classList.remove('game-bad'), 450);
      if (kind === 'good' && !permanent) setTimeout(() => r.path.classList.remove('game-good', 'feedback-full', 'feedback-subtle', 'feedback-minimal'), intensity === 'minimal' ? 320 : intensity === 'subtle' ? 420 : 560);
    }
  }
  function pulseTarget(id, type = 'country', intensity = 'full') {
    if (intensity === 'off' || intensity === 'minimal') return;
    const record = bridge.labelRecords.find(value => (value.mode === (type === 'capital' ? 'capitals' : 'countries')) && (value.id === id || value.countryId === id));
    if (!record) return;
    const scale = units(), ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ring.setAttribute('class', `game-feedback-ping ${type === 'capital' ? 'capital-ping' : 'country-ping'} feedback-${intensity}`);
    ring.setAttribute('cx', record.labelX); ring.setAttribute('cy', record.labelY); ring.setAttribute('r', Math.max(2, 6 * scale));
    feedbackLayer.append(ring);
    setTimeout(() => ring.remove(), intensity === 'subtle' ? 380 : 480);
  }
  function flashCountry(id, intensity = 'full') { feedback(id, 'good', false, intensity); pulseTarget(id, 'country', intensity); }
  function pulseCapital(id, intensity = 'full') { pulseTarget(id, 'capital', intensity); }
  function renderTargets() {
    hitLayer.replaceChildren();
    if (!clickMode) return;
    const scale = units(), view = bridge.getView();
    if (view.w > 350) return;
    for (const record of bridge.labelRecords.filter(r => r.mode === 'countries' && r.isCountry)) {
      const recordWidth = record.bounds.maxX - record.bounds.minX;
      const recordHeight = record.bounds.maxY - record.bounds.minY;
      const country = countries.find(c => c.country_id === record.id);
      if (Math.min(recordWidth, recordHeight) / scale > 12 && country?.countryLocationDifficulty !== 4) continue;
      const capital = country?.capital[0];
      const [targetX, targetY] = capital && Number.isFinite(capital.longitude) && Number.isFinite(capital.latitude)
        ? bridge.project([capital.longitude,capital.latitude]) : [record.labelX,record.labelY];
      if (record.labelX < view.x || record.labelX > view.x + view.w || record.labelY < view.y || record.labelY > view.y + view.h) continue;
      const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const radius = matchMedia('(pointer: coarse)').matches ? 18 : 10;
      point.setAttribute('cx', targetX); point.setAttribute('cy', targetY); point.setAttribute('r', radius * scale);
      point.setAttribute('class', 'game-hit-target'); point.dataset.countryId = record.id;
      hitLayer.append(point);
    }
  }
  function prepare(question, country) {
    clearFeedback(); bridge.clear();
    clickMode = question.type.endsWith('_CLICK');
    svg.classList.toggle('click-game', clickMode);
    svg.setAttribute('tabindex', clickMode ? '0' : '-1');
    keyboardIndex = -1;
    const oldCursor = svg.querySelector('.keyboard-cursor'); if (oldCursor) oldCursor.remove();
    if (clickMode) {
      bridge.focusRegion(country.continent); lastRegion = country.continent;
    }
    renderTargets();
  }
  svg.addEventListener('pointerdown', e => {
    pointerCount++;
    if (pointerCount === 1) gesture = { x: e.clientX, y: e.clientY, moved: false, threshold: e.pointerType === 'touch' ? 16 : 8 };
    else if (gesture) gesture.moved = true;
  });
  svg.addEventListener('pointermove', e => { if (gesture && Math.hypot(e.clientX-gesture.x, e.clientY-gesture.y)>gesture.threshold) gesture.moved = true; });
  svg.addEventListener('pointercancel', () => { pointerCount = 0; gesture = null; });
  svg.addEventListener('pointerup', e => {
    lastPointerUp = performance.now();
    pointerCount = Math.max(0, pointerCount-1);
    if (!clickMode || !gesture || gesture.moved || pointerCount) { if (!pointerCount) gesture = null; return; }
    gesture = null;
    // Pointer capture retargets the up event to the SVG; hit-test at the actual release point.
    const nodes = document.elementsFromPoint(e.clientX, e.clientY);
    const node = nodes.find(item => item.closest?.('[data-country-id], [data-region-id]')) || nodes[0];
    let id = node?.closest('[data-country-id]')?.dataset.countryId;
    if (id) {
      const at = bridge.point(e.clientX,e.clientY);
      const near = [...hitLayer.children].filter(c => c.dataset.countryId).map(c => ({id:c.dataset.countryId, distance:Math.hypot(Number(c.getAttribute('cx'))-at.x,Number(c.getAttribute('cy'))-at.y)})).sort((a,b)=>a.distance-b.distance);
      id = near[0]?.id || id;
    }
    if (!id) {
      const regionId = node?.closest('[data-region-id]')?.dataset.regionId;
      const record = bridge.regionRecords.find(r => r.id === regionId);
      id = record?.ownerId || (record?.isCountry ? record.id : null);
      if (!id && record) { onPick(null, record.name); return; }
    }
    if (id) onPick(id);
  });
  // Assistive technology and semantic activation may emit a click without pointer events.
  svg.addEventListener('click', e => {
    if (!clickMode || performance.now()-lastPointerUp<600) return;
    const node=e.target;
    const targetId=node?.closest('[data-country-id]')?.dataset.countryId;
    if(targetId){onPick(targetId);return;}
    const record=bridge.regionRecords.find(r=>r.id===node?.closest('[data-region-id]')?.dataset.regionId);
    if(record)onPick(record.ownerId||(record.isCountry?record.id:null),record.name);
  });
  // Keyboard alternative: traverse geographic positions, then select with Enter.
  svg.addEventListener('keydown', e => {
    if (!clickMode || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(e.key)) return;
    e.preventDefault();
    keyboardCountries = bridge.labelRecords.filter(r => r.mode === 'countries' && r.isCountry)
      .sort((a,b)=>a.labelY-b.labelY || a.labelX-b.labelX);
    if (e.key === 'Enter' || e.key === ' ') { if (keyboardIndex >= 0) onPick(keyboardCountries[keyboardIndex].id); return; }
    keyboardIndex = (keyboardIndex + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + keyboardCountries.length) % keyboardCountries.length;
    const r = keyboardCountries[keyboardIndex], v = bridge.getView();
    if (r.labelX<v.x || r.labelX>v.x+v.w || r.labelY<v.y || r.labelY>v.y+v.h) bridge.setView({...v,x:r.labelX-v.w/2,y:r.labelY-v.h/2});
    svg.querySelector('.keyboard-cursor')?.remove();
    const ring = document.createElementNS('http://www.w3.org/2000/svg','circle');
    ring.setAttribute('class','keyboard-cursor');ring.setAttribute('cx',r.labelX);ring.setAttribute('cy',r.labelY);ring.setAttribute('r',12*units()); hitLayer.append(ring);
    svg.setAttribute('aria-label',`Map location ${keyboardIndex+1} of ${keyboardCountries.length}. Use arrows to move, Enter to choose.`);
  });
  window.addEventListener('mapviewchange', renderTargets);
  new ResizeObserver(renderTargets).observe(svg);
  return {
    start(region, dataset) { countries = dataset; bridge.gameActive = true; bridge.gameRegion = region; bridge.setMode('countries'); bridge.clear(); bridge.selectRegion(region); lastRegion = region; },
    prepare, feedback, flashCountry, pulseCapital, pending, clearPending, clearFeedback,
    mark(id) { bridge.mark(id); },
    end() { clickMode = false; svg.classList.remove('click-game'); hitLayer.replaceChildren(); svg.removeAttribute('tabindex'); },
    restore() { this.end(); clearFeedback(); bridge.gameActive = false; bridge.gameRegion = 'World'; bridge.clear(); bridge.selectRegion('World'); },
    enableClick(value) { clickMode = value; renderTargets(); }
  };
};
