/* Small browser speech-recognition lifecycle shared by root and retained UI. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CountryMemoryVoice = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';

  function alternativesFor(result) {
    if (!result) return [];
    return [...result]
      .map(item => String(item?.transcript || '').trim())
      .filter(Boolean);
  }

  class VoiceInputController {
    constructor({
      Recognition,
      language = 'en-US',
      maxAlternatives = 5,
      startTimeout = 15000,
      onState = () => {},
      onPreview = () => {},
      onFinal = () => {},
      onError = () => {},
      setTimer = setTimeout,
      clearTimer = clearTimeout
    } = {}) {
      this.supported = typeof Recognition === 'function';
      this.state = 'idle';
      this.onState = onState;
      this.onPreview = onPreview;
      this.onFinal = onFinal;
      this.onError = onError;
      this.startTimeout = startTimeout;
      this.setTimer = setTimer;
      this.clearTimer = clearTimer;
      this.startTimer = null;
      this.processedFinals = new Set();
      this.finalDelivered = false;
      this.userStopped = false;
      if (!this.supported) return;
      this.Recognition = Recognition;
      this.language = language;
      this.maxAlternatives = maxAlternatives;
      this.installRecognition();
    }

    get active() {
      return this.state === 'starting' || this.state === 'listening';
    }

    setState(state, detail = {}) {
      this.state = state;
      this.onState({ state, ...detail });
    }

    clearStartTimer() {
      if (this.startTimer !== null) this.clearTimer(this.startTimer);
      this.startTimer = null;
    }

    installRecognition() {
      const recognition = new this.Recognition();
      recognition.lang = this.language;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = this.maxAlternatives;
      recognition.addEventListener('start', () => { if (this.recognition === recognition) this.handleStart(); });
      recognition.addEventListener('end', () => { if (this.recognition === recognition) this.reset({ reason: 'ended' }); });
      recognition.addEventListener('error', event => { if (this.recognition === recognition) this.handleError(event); });
      recognition.addEventListener('result', event => { if (this.recognition === recognition) this.handleResult(event); });
      this.recognition = recognition;
      return recognition;
    }

    replaceStalledRecognition(reason) {
      const stalled = this.recognition;
      this.installRecognition();
      try { stalled?.abort(); } catch {}
      this.reset({ reason });
    }

    start() {
      if (!this.supported || this.active) return false;
      this.userStopped = false;
      this.processedFinals.clear();
      this.finalDelivered = false;
      this.setState('starting');
      this.startTimer = this.setTimer(() => {
        if (this.state !== 'starting') return;
        this.replaceStalledRecognition('timeout');
        this.onError({ code: 'start-timeout' });
      }, this.startTimeout);
      try {
        this.recognition.start();
      } catch (error) {
        this.installRecognition();
        this.reset({ reason: 'start-failed' });
        this.onError({ code: 'start-failed', error });
        return false;
      }
      return true;
    }

    stop({ abort = false } = {}) {
      if (!this.active) return false;
      this.userStopped = true;
      this.clearStartTimer();
      if (abort || this.state === 'starting') {
        this.replaceStalledRecognition('cancelled');
        return true;
      }
      try {
        this.recognition.stop();
      } catch {
        this.reset({ reason: 'stop-failed' });
      }
      return true;
    }

    abort() {
      return this.stop({ abort: true });
    }

    handleStart() {
      this.clearStartTimer();
      if (this.userStopped || this.state === 'idle') {
        try { this.recognition.abort(); } catch {}
        return;
      }
      this.setState('listening');
    }

    handleResult(event) {
      if (!this.active || this.finalDelivered) return;
      const results = event?.results;
      if (!results?.length) return;
      const from = Number.isInteger(event.resultIndex) ? Math.max(0, event.resultIndex) : Math.max(0, results.length - 1);
      for (let index = from; index < results.length; index++) {
        const result = results[index];
        const alternatives = alternativesFor(result);
        if (!alternatives.length) continue;
        if (!result.isFinal) {
          this.onPreview(alternatives[0], alternatives);
          continue;
        }
        const signature = `${index}:${alternatives.join('\u0000')}`;
        if (this.processedFinals.has(signature)) continue;
        this.processedFinals.add(signature);
        this.finalDelivered = true;
        // One press is one answer. Some engines append another final segment
        // before firing `end`; stop immediately so it cannot become a retry.
        try { this.onFinal(alternatives); }
        finally { try { this.recognition.stop(); } catch {} }
        return;
      }
    }

    handleError(event) {
      const code = String(event?.error || 'unknown');
      const silent = this.userStopped && code === 'aborted';
      this.reset({ reason: 'error' });
      if (!silent) this.onError({ code, event });
    }

    reset(detail = {}) {
      this.clearStartTimer();
      this.userStopped = false;
      if (this.state !== 'idle') this.setState('idle', detail);
    }
  }

  return Object.freeze({ VoiceInputController, alternativesFor });
});
