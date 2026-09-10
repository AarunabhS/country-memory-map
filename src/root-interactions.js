const COUNTRY_CLICK_ANSWER_MODES = new Set(["Explore", "Countries"]);

function retainedHost(frameDocument) {
  return frameDocument?.defaultView?.CountryMemoryRetained || null;
}

function retainedFreeMapIsActive(frameDocument, checker) {
  const lifecycle = retainedHost(frameDocument)?.getLifecycleState?.();
  return lifecycle?.state === "free-map" && lifecycle.checker === checker;
}

export function modeAllowsCountryClickAnswer(mode) {
  return COUNTRY_CLICK_ANSWER_MODES.has(mode);
}

export function activateRetainedFreeMap(frameDocument, { checker = "countries" } = {}) {
  const host = retainedHost(frameDocument);
  if (!host?.openFreeMap || !host?.getLifecycleState || !host?.submitFreeMapGuess) {
    throw new Error("The existing Free Map checker is unavailable.");
  }
  if (!retainedFreeMapIsActive(frameDocument, checker)) host.openFreeMap({ checker });
  if (!retainedFreeMapIsActive(frameDocument, checker)) {
    throw new Error("The existing Free Map checker is not ready.");
  }
  return frameDocument;
}

export async function prepareRetainedFreeMap(frameDocument, {
  checker = "countries",
  timeoutMs = 2000,
  retryMs = 25,
  now = () => Date.now(),
  delay = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds)),
} = {}) {
  const deadline = now() + timeoutMs;
  let lastError;
  do {
    try {
      activateRetainedFreeMap(frameDocument, { checker });
      await delay(retryMs);
      if (retainedFreeMapIsActive(frameDocument, checker)) return frameDocument;
      lastError = new Error("The existing Free Map checker did not remain ready.");
    } catch (error) {
      lastError = error;
      await delay(retryMs);
    }
  } while (now() < deadline);
  throw lastError || new Error("The existing Free Map checker is unavailable.");
}

export async function submitRetainedFreeMapGuess(frameDocument, value, { checker = "countries" } = {}) {
  const host = retainedHost(frameDocument);
  if (!host?.submitFreeMapGuess) {
    throw new Error("The existing answer engine is unavailable.");
  }
  const result = await host.submitFreeMapGuess({ value, checker });
  if (!result || typeof result.message !== "string" || !result.message.trim()) {
    throw new Error("The existing answer engine returned an invalid result.");
  }
  return result;
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
      const result = await submitCountry(checker, name);
      return { status: "submitted", mode: originatingMode, result };
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
      const result = await submit(value);
      return { status: "submitted", value, result };
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
