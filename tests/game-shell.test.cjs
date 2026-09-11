const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const shell = fs.readFileSync('game-shell.js', 'utf8');
const shellCss = fs.readFileSync('game-shell.css', 'utf8');
const gameCss = fs.readFileSync('game.css', 'utf8');
const flagCss = fs.readFileSync('flag-game.css', 'utf8');
const ui = fs.readFileSync('game-ui.js', 'utf8');
const legacy = fs.readFileSync('legacy/index.html', 'utf8');
const core = fs.readFileSync('game-core.js', 'utf8');
const multiplayerCss = fs.readFileSync('multiplayer.css', 'utf8');
const rootHtml = fs.readFileSync('index.html', 'utf8');
const rootCss = fs.readFileSync('styles.css', 'utf8');
const rootMain = fs.readFileSync('src/main.js', 'utf8');

function colorToken(source, name) {
  return source.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1];
}

function contrastRatio(foreground, background) {
  const luminance = (hex) => {
    const channels = [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const values = [luminance(foreground), luminance(background)].sort((left, right) => right - left);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

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
  assert.match(legacy, /game-shell\.css\?v=20260911-nine-player2/);
  assert.match(legacy, /game-shell\.js\?v=20260910-recovery/);
  assert.match(shellCss, /--shell-cyan/);
  assert.match(shellCss, /data-game-shell-stage="flag"/);
  assert.match(shellCss, /prefers-reduced-motion: reduce/);
  assert.match(shellCss, /max-height: 500px/);
  assert.match(shellCss, /max-width: 760px/);
  assert.match(shellCss, /forced-colors: active/);
  assert.match(shellCss, /\.game-shell\.platform button/);
  assert.match(shellCss, /\.game-shell\.platform \.legend-panel/);
  assert.match(shellCss, /background: rgba\(247, 252, 255, 0\.97\)/);
  assert.match(shellCss, /-webkit-text-fill-color: #17384e/);
  const panel = colorToken(shellCss, '--shell-panel-solid');
  assert.ok(contrastRatio(colorToken(shellCss, '--shell-ink'), panel) >= 7);
  assert.ok(contrastRatio(colorToken(shellCss, '--shell-muted'), panel) >= 7);
  assert.ok(contrastRatio(colorToken(shellCss, '--shell-control-ink'), colorToken(shellCss, '--shell-control-bg')) >= 7);
});

test('a Home-launched game keeps real setup controls without repeating the five-game chooser', () => {
  assert.match(ui, /data-hosted-game/);
  assert.match(ui, /hostedGame \? 'Back to games' : 'Free map'/);
  assert.match(ui, /family === 'flag' \? variants\[\$\('gameVariant'\)\.value\] : families\[family\]/);
  assert.match(shellCss, /\.game-shell\[data-hosted-game\] \.game-choices/);
  assert.match(ui, /gameVariant/);
  assert.match(ui, /gameDifficulty/);
  assert.match(ui, /gameQuestionTime/);
});

test('mobile retained screens own the visual viewport without hiding essential controls', () => {
  assert.match(rootCss, /height: var\(--visual-viewport-height, 100dvh\)/);
  assert.match(rootMain, /--visual-viewport-height/);
  assert.match(rootMain, /syncViewport\?\.\(\{ height: vh, offsetTop: 0 \}\)/);
  assert.match(legacy, /window\.parent\.visualViewport/);
  assert.match(ui, /syncViewport\(\{ height, offsetTop = 0 \} = \{\}\)/);
  assert.match(gameCss, /height: var\(--app-height, 100dvh\)/);
  assert.match(gameCss, /\.platform\.choosing \{[\s\S]*?grid-template-rows: auto minmax\(0, 1fr\)/);
  assert.match(gameCss, /\.platform\.choosing \.setup-panel \{[\s\S]*?position:relative;[\s\S]*?grid-row:2;[\s\S]*?overflow-y: auto/);
  assert.match(gameCss, /\.platform \.control \{ inset:auto;/);
  assert.match(gameCss, /\.platform\.keyboard-open \.question-panel \{display:block/);
  assert.doesNotMatch(gameCss, /\.platform\.keyboard-open \.question-panel \{display:none/);
  assert.match(flagCss, /\.flag-platform \{[\s\S]*?height: var\(--app-height, 100dvh\);[\s\S]*?overflow: hidden/);
  assert.match(gameCss, /@media \(max-height:500px\) and \(min-width:600px\) \{[\s\S]*?height:var\(--app-height,100dvh\);[\s\S]*?\.platform\.choosing \.setup-panel/);
});

test('flag countdown hides stale retained-map feedback until the first flag question', () => {
  assert.match(ui, /control\.hidden = flagGame; form\.hidden = flagGame/);
  assert.match(ui, /engine\.config\.family === 'flag'[\s\S]*?control\.hidden = false;[\s\S]*?renderFlagQuestion\(q, s\)/);
});

test('setup multiplayer CTA and geography answer fields resist browser color and autofill overrides', () => {
  assert.match(multiplayerCss, /#playFriends\{[^}]*color:#fff;[^}]*-webkit-text-fill-color:#fff;[^}]*border:1px solid #7cdeff/);
  assert.match(rootHtml, /id="answer-form" autocomplete="off"/);
  assert.match(rootHtml, /id="country-input"[^>]*autocomplete="new-password"/);
  assert.doesNotMatch(rootHtml, /id="country-input"[^>]*name="country"/);
  assert.match(legacy, /id="guessInput"[^>]*autocomplete="new-password"/);
  assert.match(legacy, /hasAttribute\("data-free-map-active"\)/);
  assert.match(ui, /allowDesktopAutofocus: false/);
});

test('voice and multiplayer answers stay single-flight and preserve engine-owned duplicate feedback', () => {
  assert.match(ui, /let remote = null,[^;]*remoteSubmission = null/);
  assert.match(ui, /if\(remoteSubmission\)\{textFeedback\(`Still checking/);
  assert.match(ui, /candidates=engine\.pool\.flatMap/);
  assert.doesNotMatch(ui, /engine\.pool\.filter\(c=>!engine\.state\.completedCountries\.has/);
  assert.match(legacy, /CountryMemoryVoice/);
  assert.match(rootMain, /CountryMemoryVoice/);
});
