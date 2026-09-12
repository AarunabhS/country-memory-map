const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const ui = fs.readFileSync('multiplayer-ui.js', 'utf8');
const gameUi = fs.readFileSync('game-ui.js', 'utf8');
const styles = fs.readFileSync('multiplayer.css', 'utf8');

test('friends UI presents one host plus eight friends from the server capacity', () => {
  assert.match(ui, /DEFAULT_MAX_PLAYERS=9/);
  assert.match(ui, /data\?\.maxPlayers/);
  assert.match(ui, /up to eight friends/);
  assert.match(ui, /Create Room &amp; Code/);
  assert.doesNotMatch(ui, /2–8 players|\/ 8 players|Up to 8 players/);
});

test('direct invites take precedence over a different stored room', () => {
  assert.match(ui, /if\(room\)\{let invite;try\{invite=service\.prepareInvite\(room\)/);
  assert.match(ui, /if\(invite\.matchesSession\)\{await service\.resume\(\)/);
  assert.match(ui, /try\{await joinScreen\(invite\.code\)/);
  assert.match(ui, /invitationError\(invite\.code,err\)/);
});

test('friends UI exposes a resilient room-code join and sharing path', () => {
  assert.match(ui, /<h3>Join a Room<\/h3>/);
  assert.match(ui, /GEOABC123 or paste invite link/);
  assert.match(ui, /enterkeyhint="go"/);
  assert.match(ui, /pressEnter\('joinCode','joinFriendRoom'\)/);
  assert.match(ui, /id="copyRoomCode"/);
  assert.match(ui, /Room code: \$\{service\.room\?\.code/);
  assert.match(ui, /Share with the buttons below—not the browser address/);
  assert.match(styles, /\.friend-code-share/);
});

test('friends mode clears unrelated profile UI and exits an old remote game for a different invite', () => {
  assert.match(ui, /profileDialog\?\.open\)profileDialog\.close\(\)/);
  assert.match(ui, /async open\(\{room\}=\{\}\)\{window\.CountryMemoryFriendsActive=true/);
  assert.match(gameUi, /function friendsRouteRequested\(\)/);
  assert.match(gameUi, /searchParams\.get\('game'\) === 'multiplayer'/);
  assert.match(gameUi, /!players\.active && !friendsRouteRequested\(\)/);
  assert.match(ui, /suspend\(\)\{window\.CountryMemoryFriendsActive=false/);
  assert.match(ui, /!invite\.matchesSession&&activeGameKey\)\{gameController\.exitRemote\(\);activeGameKey=null/);
});

test('nine-person lobby exposes capacity, readiness, roster, and responsive standings', () => {
  assert.match(ui, /<progress class="friend-capacity"/);
  assert.match(ui, /role="list" aria-label="Players in this room"/);
  assert.match(ui, /aria-describedby="friendStartHint"/);
  assert.match(styles, /max-height:min\(52vh,430px\)/);
  assert.match(styles, /@media\(max-height:500px\) and \(min-width:600px\)/);
});

test('first-load multiplayer routes wait for the controller and focus the visible panel', () => {
  assert.match(gameUi, /addEventListener\('country-memory-multiplayer-ready', open, \{ once: true \}\)/);
  assert.match(ui, /dispatchEvent\(new CustomEvent\('country-memory-multiplayer-ready'\)\)/);
  assert.match(gameUi, /const primary = friendsPanel\.querySelector\('#friendName, #setReady, #acceptInvite, #createFriendRoom, #joinCode'\)/);
  assert.match(gameUi, /\(primary \|\| friendsPanel\.querySelector\('button, select, input'\)\)\?\.focus/);
  assert.match(ui, /panel\.contains\(document\.activeElement\)/);
  assert.match(ui, /pendingFocusId=target\.id/);
  assert.match(ui, /next\?\.focus\(\{preventScroll:true\}\)/);
});
