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
      this.requestMicrophone = typeof requestMicrophone === 'function' ? () => requestMicrophone() : null;
      this.microphoneReady = !requestMicrophone;
      this.permissionAttempt = null;
      this.setTimer = (fn, ms) => setTimer(fn, ms);
      this.clearTimer = id => clearTimer(id);
      this.startTimer = null;
      this.processedFinals = new Set();
      this.finalDelivered = false;
      this.lastAlternatives = null;
      this.userStopped = false;
      if (typeof navigator !== 'undefined' && navigator.permissions && typeof navigator.permissions.query === 'function') {
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
      return this.state === 'permission' || this.state === 'starting' || this.state === 'listening';
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
      const onEnd = () => {
        if (this.recognition !== recognition) return;
        if (this.active && !this.finalDelivered && !this.userStopped && this.lastAlternatives?.length) {
          this.finalDelivered = true;
          try { this.onFinal(this.lastAlternatives); }
          finally { this.reset({ reason: 'ended' }); }
          return;
        }
        const empty = this.active && !this.finalDelivered && !this.userStopped;
        this.reset({ reason: 'ended' });
        if (empty) this.onError({ code: 'no-speech' });
      };
      const onError = event => { if (this.recognition === recognition) this.handleError(event); };
      const onResult = event => { if (this.recognition === recognition) this.handleResult(event); };

      // Support both EventTarget addEventListener and standard Web Speech IDL on* properties
      // across Chrome, Safari, and WebKit implementations.
      if (typeof recognition.addEventListener === 'function') {
        recognition.addEventListener('start', onStart);
        recognition.addEventListener('audiostart', onStart);
        recognition.addEventListener('soundstart', onStart);
        recognition.addEventListener('speechstart', onStart);
        recognition.addEventListener('end', onEnd);
        recognition.addEventListener('error', onError);
        recognition.addEventListener('result', onResult);
      }
      recognition.onstart = onStart;
      recognition.onaudiostart = onStart;
      recognition.onsoundstart = onStart;
      recognition.onspeechstart = onStart;
      recognition.onend = onEnd;
      recognition.onerror = onError;
      recognition.onresult = onResult;

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
      this.processedFinals.clear();
      this.finalDelivered = false;
      this.lastAlternatives = null;
      this.setState('starting');
      this.startTimer = this.setTimer(() => {
        if (this.state !== 'starting') return;
        this.replaceStalledRecognition('timeout');
        this.onError({ code: 'start-timeout' });
      }, this.startTimeout);
      // Ensure a fresh, non-stale Recognition instance is used for each session
      const recognition = this.installRecognition();
      if (!recognition) {
        this.reset({ reason: 'start-failed' });
        this.onError({ code: 'start-failed' });
        return false;
      }
      try {
        recognition.start();
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
      if (this.state === 'listening') return;
      this.clearStartTimer();
      if (this.userStopped || this.state === 'idle') {
        try { this.recognition.abort(); } catch {}
        return;
      }
      this.setState('listening');
    }

    handleResult(event) {
      if (!this.active || this.finalDelivered) return;
      if (this.state !== 'listening') this.handleStart();
      const results = event?.results;
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
      if (code === 'not-allowed' || code === 'audio-capture') this.microphoneReady = !this.requestMicrophone;
      const silent = this.userStopped && code === 'aborted';
      this.reset({ reason: 'error' });
      if (!silent) this.onError({ code, event });
    }

    reset(detail = {}) {
      this.clearStartTimer();
      this.userStopped = false;
      this.lastAlternatives = null;
      if (this.state !== 'idle') this.setState('idle', detail);
    }
  }

  return Object.freeze({ VoiceInputController, alternativesFor });
});
