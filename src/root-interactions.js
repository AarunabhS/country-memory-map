const COUNTRY_CLICK_ANSWER_MODES = new Set(["Explore", "Countries"]);

function retainedFreeMapIsActive(frameDocument) {
  const input = frameDocument?.querySelector?.("#guessInput");
  const message = frameDocument?.querySelector?.("#message");
  return Boolean(input && !input.disabled && /^Free map:/.test(message?.textContent || ""));
}

export function modeAllowsCountryClickAnswer(mode) {
  return COUNTRY_CLICK_ANSWER_MODES.has(mode);
}

export function activateRetainedFreeMap(frameDocument) {
  const freeMapControl = frameDocument?.querySelector?.("#freeMap");
  const input = frameDocument?.querySelector?.("#guessInput");
  const form = frameDocument?.querySelector?.("#guessForm");
  const message = frameDocument?.querySelector?.("#message");
  const controllerReady = Boolean(frameDocument?.defaultView?.gameController);
  if (!freeMapControl || !input || !form || !message || !controllerReady) {
    throw new Error("The existing Free Map checker is unavailable.");
  }
  freeMapControl.click();
  if (!retainedFreeMapIsActive(frameDocument)) {
    throw new Error("The existing Free Map checker is not ready.");
  }
  return frameDocument;
}

export async function prepareRetainedFreeMap(frameDocument, {
  timeoutMs = 2000,
  retryMs = 25,
  now = () => Date.now(),
  delay = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds)),
} = {}) {
  const deadline = now() + timeoutMs;
  let lastError;
  do {
    try {
      activateRetainedFreeMap(frameDocument);
      await delay(retryMs);
      if (retainedFreeMapIsActive(frameDocument)) return frameDocument;
      lastError = new Error("The existing Free Map checker did not remain ready.");
    } catch (error) {
      lastError = error;
      await delay(retryMs);
    }
  } while (now() < deadline);
  throw lastError || new Error("The existing Free Map checker is unavailable.");
}

export function submitRetainedFreeMapGuess(frameDocument, value) {
  const input = frameDocument?.querySelector?.("#guessInput");
  const form = frameDocument?.querySelector?.("#guessForm");
  if (!input || !form?.requestSubmit) {
    throw new Error("The existing answer engine is unavailable.");
  }
  input.value = value;
  form.requestSubmit();
}

export function createCountryClickHandler({
  getMode,
  isActive = () => true,
  prepareChecker,
  submitCountry,
  setSelection = () => {},
  clearSelection = () => {},
  setInput = () => {},
  clearInput = () => {},
  notify = () => {},
  notifyNonAnswering = () => {},
} = {}) {
  let inFlight = false;

  return async function handleCountryClick({ id, name } = {}) {
    const originatingMode = getMode?.();
    if (!id || !name) return { status: "invalid" };
    if (!isActive()) return { status: "inactive" };
    if (!modeAllowsCountryClickAnswer(originatingMode)) {
      notifyNonAnswering({ id, name, mode: originatingMode });
      return { status: "non-answering", mode: originatingMode };
    }
    if (inFlight) {
      notify({ type: "busy", id, name, mode: originatingMode });
      return { status: "busy", mode: originatingMode };
    }

    inFlight = true;
    setSelection(id);
    setInput(name);
    notify({ type: "checking", id, name, mode: originatingMode });
    try {
      const checker = await prepareChecker();
      if (getMode?.() !== originatingMode || !modeAllowsCountryClickAnswer(originatingMode)) {
        clearSelection(id);
        clearInput(name);
        notify({ type: "cancelled", id, name, mode: originatingMode });
        return { status: "cancelled", mode: originatingMode };
      }
      await submitCountry(checker, name);
      return { status: "submitted", mode: originatingMode };
    } catch (error) {
      clearSelection(id);
      clearInput(name);
      notify({ type: "error", error, id, name, mode: originatingMode });
      return { status: "error", error, mode: originatingMode };
    } finally {
      inFlight = false;
    }
  };
}

export function createTypedAnswerHandler({
  getValue,
  isActive = () => true,
  setDisabled,
  clearValue,
  focus,
  submit,
  notifyEmpty,
  notifyError,
} = {}) {
  return async function handleTypedAnswer(event) {
    event?.preventDefault?.();
    const value = String(getValue?.() ?? "").trim();
    if (!isActive()) return { status: "inactive" };
    if (!value) {
      notifyEmpty?.();
      focus?.();
      return { status: "empty" };
    }

    setDisabled?.(true);
    try {
      await submit(value);
      return { status: "submitted", value };
    } catch (error) {
      notifyError?.(error);
      return { status: "error", error };
    } finally {
      setDisabled?.(false);
      clearValue?.();
      focus?.();
    }
  };
}
