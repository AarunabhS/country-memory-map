/* Small browser speech-recognition lifecycle used by every game and Explore. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CountryMemoryVoice = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';

  function alternativesFor(result) {
    if (!result) return [];
    const items = [];
    const count = Number(result.length) || 0;
    for (let i = 0; i < count; i++) {
      const item = result[i] || (typeof result.item === 'function' ? result.item(i) : null);
      const text = String(item?.transcript || '').trim();
      if (text) items.push(text);
    }
    if (items.length) return items;
    if (typeof result[Symbol.iterator] === 'function') {
      try {
        for (const item of result) {
          const text = String(item?.transcript || '').trim();
          if (text) items.push(text);
        }
      } catch {}
      if (items.length) return items;
    }
    const single = String(result.transcript || '').trim();
    if (single) return [single];
    return [];
  }

  class VoiceInputController {
    constructor({
      Recognition,
      createRecognition = null,
      language = 'en-US',
      maxAlternatives = 5,
      startTimeout = 15000,
      listeningTimeout = 15000,
      resultTimeout = 15000,
      requestMicrophone = null,
      onState = () => {},
      onPreview = () => {},
      onFinal = () => {},
      onError = () => {},
      setTimer = (fn, ms) => (typeof window !== 'undefined' ? window.setTimeout(fn, ms) : setTimeout(fn, ms)),
      clearTimer = id => (typeof window !== 'undefined' ? window.clearTimeout(id) : clearTimeout(id))
    } = {}) {
      this.createRecognition = createRecognition;
      this.Recognition = Recognition || (typeof createRecognition === 'function' ? createRecognition : null);
      this.supported = typeof this.createRecognition === 'function' || typeof this.Recognition === 'function';
      this.state = 'idle';
      this.onState = onState;
      this.onPreview = onPreview;
      this.onFinal = onFinal;
      this.onError = onError;
      this.startTimeout = startTimeout;
      this.listeningTimeout = listeningTimeout;
      this.resultTimeout = resultTimeout;
      this.requestMicrophone = typeof requestMicrophone === 'function' ? () => requestMicrophone() : null;
      this.microphoneReady = !requestMicrophone;
      this.permissionAttempt = null;
      this.setTimer = (fn, ms) => setTimer(fn, ms);
      this.clearTimer = id => clearTimer(id);
      this.startTimer = null;
      this.resultTimer = null;
      this.finalDelivered = false;
      this.lastAlternatives = null;
      this.userStopped = false;
      if (this.requestMicrophone && typeof navigator !== 'undefined' && navigator.permissions && typeof navigator.permissions.query === 'function') {
        try {
          navigator.permissions.query({ name: 'microphone' }).then(permissionStatus => {
            if (permissionStatus) {
              if (permissionStatus.state === 'granted') {
                this.microphoneReady = true;
              } else if (permissionStatus.state === 'denied' || permissionStatus.state === 'prompt') {
                if (this.requestMicrophone) this.microphoneReady = false;
              }
              permissionStatus.onchange = () => {
                if (permissionStatus.state === 'granted') {
                  this.microphoneReady = true;
                } else if (this.requestMicrophone) {
                  this.microphoneReady = false;
                }
              };
            }
          }).catch(() => {});
        } catch {}
      }
      if (!this.supported) return;
      this.language = language;
      this.maxAlternatives = maxAlternatives;
      this.installRecognition();
    }

    get active() {
      return this.state === 'permission' || this.state === 'starting' || this.state === 'listening' || this.state === 'processing';
    }

    setState(state, detail = {}) {
      this.state = state;
      this.onState({ state, ...detail });
    }

    clearStartTimer() {
      if (this.startTimer !== null) this.clearTimer(this.startTimer);
      this.startTimer = null;
    }

    clearResultTimer() {
      if (this.resultTimer !== null) this.clearTimer(this.resultTimer);
      this.resultTimer = null;
    }

    watchForResult(timeout) {
      this.clearResultTimer();
      const recognition = this.recognition;
      this.resultTimer = this.setTimer(() => {
        if (this.recognition !== recognition || !this.active) return;
        // Keep interim text available for editing, but never score a partial
        // country just because the browser stopped responding.
        this.replaceStalledRecognition('recognition-timeout');
        this.onError({ code: 'recognition-timeout' });
      }, timeout);
    }

    installRecognition() {
      let recognition;
      try {
        recognition = typeof this.createRecognition === 'function'
          ? this.createRecognition()
          : new this.Recognition();
      } catch (err) {
        return null;
      }
      if (!recognition) return null;
      recognition.lang = this.language;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = this.maxAlternatives;

      const onStart = () => { if (this.recognition === recognition) this.handleStart(); };
      const onEnd = () => { if (this.recognition === recognition) this.handleEnd(); };
      const onError = event => { if (this.recognition === recognition) this.handleError(event); };
      const onResult = event => { if (this.recognition === recognition) this.handleResult(event); };
      const onSpeechEnd = () => { if (this.recognition === recognition) this.finishListening(); };

      // WebKit emits `start` before starting capture. Only audio/speech/results
      // establish readiness. Register each callback once, not via both APIs.
      for (const [type, handler] of Object.entries({
        audiostart: onStart, soundstart: onStart, speechstart: onStart,
        speechend: onSpeechEnd, audioend: onSpeechEnd,
        end: onEnd, error: onError, result: onResult
      })) {
        if (typeof recognition.addEventListener === 'function') recognition.addEventListener(type, handler);
        else recognition[`on${type}`] = handler;
      }

      this.recognition = recognition;
      return recognition;
    }

    replaceStalledRecognition(reason) {
      const stalled = this.recognition;
      // Invalidate before abort: engines can dispatch synchronously or much later.
      this.recognition = null;
      try { stalled?.abort(); } catch {}
      this.reset({ reason });
    }

    start() {
      if (!this.supported || this.active) return false;
      if (!this.microphoneReady) {
        const attempt = {};
        this.permissionAttempt = attempt;
        this.setState('permission');
        this.startTimer = this.setTimer(() => {
          if (this.permissionAttempt !== attempt) return;
          this.permissionAttempt = null;
          this.reset({ reason: 'permission-timeout' });
          this.onError({ code: 'permission-timeout' });
        }, 15000);
        try {
          Promise.resolve(this.requestMicrophone()).then(stream => {
            stream?.getTracks?.().forEach(track => track.stop());
            if (this.permissionAttempt !== attempt) return;
            this.permissionAttempt = null;
            this.microphoneReady = true;
            this.reset({ reason: 'permission-granted' });
          }, error => {
            if (this.permissionAttempt !== attempt) return;
            this.permissionAttempt = null;
            this.reset({ reason: 'permission-denied' });
            this.onError({ code: error?.name === 'NotAllowedError' ? 'not-allowed' : 'audio-capture' });
          });
        } catch (error) {
          this.permissionAttempt = null;
          this.reset({ reason: 'permission-denied' });
          this.onError({ code: 'audio-capture', error });
        }
        return true;
      }
      this.userStopped = false;
      this.finalDelivered = false;
      this.lastAlternatives = null;
      this.setState('starting');
      this.startTimer = this.setTimer(() => {
        if (this.state !== 'starting') return;
        this.replaceStalledRecognition('timeout');
        this.onError({ code: 'start-timeout' });
      }, this.startTimeout);
      // Reuse only the unused prepared instance; retired sessions are never reused.
      const recognition = this.recognition || this.installRecognition();
      if (!recognition) {
        this.reset({ reason: 'start-failed' });
        this.onError({ code: 'start-failed' });
        return false;
      }
      try {
        recognition.start();
      } catch (error) {
        this.replaceStalledRecognition('start-failed');
        this.onError({ code: 'start-failed', error });
        return false;
      }
      return true;
    }

    stop({ abort = false } = {}) {
      if (!this.active) return false;
      this.userStopped = true;
      this.clearStartTimer();
      if (this.state === 'permission') {
        this.permissionAttempt = null;
        this.reset({ reason: 'cancelled' });
        return true;
      }
      if (abort || this.state === 'starting') {
        this.replaceStalledRecognition('cancelled');
        return true;
      }
      try {
        this.setState('processing');
        this.watchForResult(this.resultTimeout);
        this.recognition.stop();
      } catch {
        this.replaceStalledRecognition('stop-failed');
      }
      return true;
    }

    abort() {
      return this.stop({ abort: true });
    }

    handleStart() {
      if (this.state !== 'starting') return;
      this.clearStartTimer();
      this.setState('listening');
      this.watchForResult(this.listeningTimeout);
    }

    finishListening() {
      if (!this.active || this.state === 'processing' || this.userStopped) return;
      this.clearStartTimer();
      this.setState('processing');
      this.watchForResult(this.resultTimeout);
      // Ask for the final transcript at the browser's speech boundary, never on
      // an arbitrary pause in interim text (e.g. "United" -> "United Kingdom").
      try { this.recognition.stop(); } catch {}
    }

    deliverFinal(alternatives, { ended = false } = {}) {
      if (this.finalDelivered) return;
      this.finalDelivered = true;
      const recognition = this.recognition;
      this.recognition = null;
      // Unlock the next click before invoking gameplay, which may navigate or
      // stop voice. Old end/error/results must not touch the next session.
      this.reset({ reason: 'answered' });
      if (!ended) { try { recognition?.stop(); } catch {} }
      this.onFinal(alternatives);
    }

    handleEnd() {
      if (this.active && !this.finalDelivered && !this.userStopped && this.lastAlternatives?.length) {
        this.deliverFinal(this.lastAlternatives, { ended: true });
        return;
      }
      const empty = this.active && !this.finalDelivered && !this.userStopped;
      this.recognition = null;
      this.reset({ reason: 'ended' });
      if (empty) this.onError({ code: 'no-speech' });
    }

    handleResult(event) {
      if (!this.active || this.finalDelivered) return;
      this.handleStart();
      const results = event?.results;
      // Interim results may be replaced or removed by a later result event.
      this.lastAlternatives = null;
      if (!results?.length) return;
      const from = Number.isInteger(event.resultIndex) ? Math.max(0, event.resultIndex) : 0;
      for (let index = from; index < results.length; index++) {
        const result = results[index] || (typeof results.item === 'function' ? results.item(index) : null);
        const alternatives = alternativesFor(result);
        if (!alternatives.length) continue;
        this.lastAlternatives = alternatives;
        if (!result.isFinal) {
          this.onPreview(alternatives[0], alternatives);
          continue;
        }
        this.deliverFinal(alternatives);
        return;
      }
    }

    handleError(event) {
      const code = String(event?.error || 'unknown');
      if (code === 'not-allowed' || code === 'audio-capture') this.microphoneReady = !this.requestMicrophone;
      const silent = this.userStopped && code === 'aborted';
      this.replaceStalledRecognition('error');
      if (!silent) this.onError({ code, event });
    }

    reset(detail = {}) {
      this.clearStartTimer();
      this.clearResultTimer();
      this.userStopped = false;
      this.lastAlternatives = null;
      if (this.state !== 'idle') this.setState('idle', detail);
    }
  }

  return Object.freeze({ VoiceInputController, alternativesFor });
});
