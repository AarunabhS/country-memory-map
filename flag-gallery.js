(function () {
  'use strict';
  const inventory = window.FLAG_INVENTORY || [];
  const gallery = document.getElementById('flagGallery');
  const search = document.getElementById('flagSearch');
  const continent = document.getElementById('continentFilter');
  const status = document.getElementById('galleryStatus');
  const special = new Set(['np','ch','va','qa','sa','kh','bz','tm','bt']);
  const loadedCodes = new Set();
  const failedCodes = new Set();

  [...new Set(inventory.map(item => item.continent))].sort().forEach(name => continent.add(new Option(name, name)));

  function updateStatus(visible = inventory.length) {
    const assetState = failedCodes.size ? ` · ${failedCodes.size} failed to load` : ` · ${loadedCodes.size}/${inventory.length} loaded`;
    status.textContent = `${visible} of ${inventory.length} playable flags${assetState}`;
  }

  function cardFor(item) {
    const card = document.createElement('article');
    card.className = 'flag-card';
    card.dataset.code = item.code;
    const frame = FlagComponent.create({ flag_code:item.code }, { size:'gallery', alt:`${item.name} flag`, loading:'eager' });
    const image = FlagComponent.image(frame);
    image.addEventListener('load', () => { loadedCodes.add(item.code); card.dataset.status = 'loaded'; updateStatus(); }, { once:true });
    image.addEventListener('error', () => { failedCodes.add(item.code); card.dataset.status = 'error'; updateStatus(); }, { once:true });
    card.appendChild(frame);
    const info = document.createElement('div'); info.className = 'flag-card-info';
    const name = document.createElement('strong'); name.className = 'flag-card-name'; name.textContent = item.name;
    const code = document.createElement('code'); code.className = 'flag-card-code'; code.textContent = `${item.code}.svg`;
    info.append(name, code); card.appendChild(info);
    const note = document.createElement('p'); note.className = 'flag-card-note';
    if (special.has(item.code)) { const badge = document.createElement('span'); badge.className = 'qa-badge'; badge.textContent = 'QA focus'; note.appendChild(badge); }
    note.append(document.createTextNode(item.continent)); card.appendChild(note);
    return card;
  }

  function render() {
    const query = search.value.trim().toLowerCase();
    const selectedContinent = continent.value;
    const visible = inventory.filter(item => (!query || `${item.name} ${item.code}`.toLowerCase().includes(query)) &&
      (selectedContinent === 'World' || item.continent === selectedContinent));
    gallery.replaceChildren(...visible.map(cardFor));
    updateStatus(visible.length);
  }

  search.addEventListener('input', render);
  continent.addEventListener('change', render);
  document.getElementById('themeToggle').addEventListener('click', event => {
    const dark = document.documentElement.dataset.theme !== 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    event.currentTarget.textContent = dark ? 'Light surface' : 'Dark surface';
    event.currentTarget.setAttribute('aria-pressed', String(dark));
  });
  render();
})();
