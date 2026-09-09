const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const shell = fs.readFileSync('game-shell.js', 'utf8');
const shellCss = fs.readFileSync('game-shell.css', 'utf8');
const ui = fs.readFileSync('game-ui.js', 'utf8');
const legacy = fs.readFileSync('legacy/index.html', 'utf8');
const core = fs.readFileSync('game-core.js', 'utf8');

test('GameShell is a shallow presentation adapter, not another game store', () => {
  assert.match(shell, /Thin, engine-independent presentation adapter/);
  assert.match(shell, /function render\(\{ root, display = \{\}, callbacks = \{\} \}/);
  assert.match(shell, /dataset\.gameShellPhase/);
  assert.match(shell, /Object\.keys\(callbacks\)/);
  assert.doesNotMatch(shell, /new Engine|submitText|submitCountry|localStorage|Google|Maps/);
  assert.match(ui, /window\.GameShell\?\.mount\(app\)/);
  assert.match(ui, /function renderShell\(phase = 'setup'/);
  assert.match(ui, /renderShell\('playing', q\)/);
  assert.match(ui, /renderShell\('free-map'\)/);
  assert.match(ui, /renderShell\('results'\)/);
  assert.match(core, /class Engine/);
});

test('all retained experiences load one shared cinematic shell treatment', () => {
  assert.match(legacy, /game-shell\.css\?v=20260909-master3/);
  assert.match(legacy, /game-shell\.js\?v=20260909-master3/);
  assert.match(shellCss, /--shell-cyan/);
  assert.match(shellCss, /data-game-shell-stage="flag"/);
  assert.match(shellCss, /prefers-reduced-motion:reduce/);
  assert.match(shellCss, /max-height:500px/);
  assert.match(shellCss, /max-width:760px/);
});
