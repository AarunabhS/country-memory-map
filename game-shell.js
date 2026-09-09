/* Thin, engine-independent presentation adapter for retained game surfaces. */
(function (global) {
  'use strict';

  const phaseNames = new Set(['setup', 'countdown', 'playing', 'feedback', 'results', 'free-map']);

  function text(value) { return value == null ? '' : String(value); }

  function mount(root) {
    if (!root || root.dataset.gameShellMounted === 'true') return global.GameShell;
    root.dataset.gameShellMounted = 'true';
    root.classList.add('game-shell');
    root.setAttribute('aria-label', 'Country Memory Map game');

    const backdrop = document.createElement('div');
    backdrop.className = 'game-shell-atmosphere';
    backdrop.setAttribute('aria-hidden', 'true');
    root.prepend(backdrop);
    return global.GameShell;
  }

  /* Display is intentionally serializable and shallow. The shell does not keep
     a game store or calculate a value; controllers remain the source of truth. */
  function render({ root, display = {}, callbacks = {} } = {}) {
    if (!root) return;
    mount(root);
    const phase = phaseNames.has(display.phase) ? display.phase : 'setup';
    root.dataset.gameShellPhase = phase;
    root.dataset.gameShellFamily = text(display.family || 'free-map');
    root.dataset.gameShellStage = text(display.stage || 'map');
    root.toggleAttribute('data-game-shell-timed', Boolean(display.timed));
    root.toggleAttribute('data-game-shell-lives', Boolean(display.lives));
    root.setAttribute('aria-busy', phase === 'countdown' ? 'true' : 'false');

    const stage = root.querySelector('.map-shell, #flagGameView');
    if (stage) stage.dataset.gameShellStage = text(display.stage || 'map');
    const input = root.querySelector('#guessInput');
    if (input && display.answerDescription) input.setAttribute('aria-description', text(display.answerDescription));

    // Callbacks are supplied by the controller for action ownership. The shell
    // deliberately neither invokes nor replaces them, preserving existing UI wiring.
    root.dataset.gameShellActions = Object.keys(callbacks).join(' ');
  }

  global.GameShell = Object.freeze({ mount, render });
})(window);
