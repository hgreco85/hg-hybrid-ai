/**
 * On-device readiness for the hybrid UI.
 *
 * Firebase AI Logic's initializeDeviceModel() resolves without throwing in
 * PREFER_ON_DEVICE mode when the Prompt API is unavailable. Readiness has to
 * come from LanguageModel.availability() (or the SDK adapter's equivalent),
 * not from that promise resolving.
 */

export const ON_DEVICE_READY = 'On-device model ready';
export const ON_DEVICE_UNAVAILABLE =
  'On-device model unavailable in this browser; requests will use the cloud';
export const ON_DEVICE_DOWNLOADABLE =
  'On-device model is downloadable in this browser; requests will use the cloud until the download finishes';
export const ON_DEVICE_DOWNLOADING = 'On-device model is downloading';
export const ON_DEVICE_CHECKING = 'Initializing on-device model (may download)...';

const KNOWN = new Set(['available', 'unavailable', 'downloadable', 'downloading']);

export function statusForAvailability(availability) {
  switch (availability) {
    case 'available':
      return { text: ON_DEVICE_READY, kind: 'ok' };
    case 'downloadable':
      return { text: ON_DEVICE_DOWNLOADABLE, kind: 'warn' };
    case 'downloading':
      return { text: ON_DEVICE_DOWNLOADING, kind: 'warn' };
    default:
      return { text: ON_DEVICE_UNAVAILABLE, kind: 'warn' };
  }
}

export function downloadProgressStatus(progress) {
  const pct = Math.round(progress * 100);
  return { text: `Downloading model: ${pct}%`, kind: '' };
}

function normalizeAvailability(value) {
  return KNOWN.has(value) ? value : 'unavailable';
}

/**
 * Prefer the Firebase AI Logic Chrome adapter, which calls
 * languageModelProvider.availability(createOptions) — the same check
 * hybrid inference uses. Fall back to the Prompt API, then unavailable.
 */
export async function readOnDeviceAvailability(model, scope = globalThis) {
  const adapter = model && model.chromeAdapter;
  const provider = adapter && adapter.languageModelProvider;
  if (provider && typeof provider.availability === 'function') {
    const options = adapter.onDeviceParams && adapter.onDeviceParams.createOptions;
    return normalizeAvailability(await provider.availability(options));
  }
  const languageModel = scope && scope.LanguageModel;
  if (languageModel && typeof languageModel.availability === 'function') {
    return normalizeAvailability(await languageModel.availability());
  }
  return 'unavailable';
}

/**
 * Run device-model initialization and report status from a real availability
 * check. Does not change inference mode or where generateContent runs.
 */
export async function runOnDeviceInitialization({
  model,
  scope = globalThis,
  initializeDeviceModel,
  onStatus,
}) {
  const availability = await readOnDeviceAvailability(model, scope);
  if (availability === 'unavailable') {
    onStatus(statusForAvailability('unavailable'));
    return 'unavailable';
  }

  if (availability === 'downloadable' || availability === 'downloading') {
    onStatus(statusForAvailability(availability));
  } else {
    onStatus({ text: ON_DEVICE_CHECKING, kind: '' });
  }

  await initializeDeviceModel((progress) => {
    onStatus(downloadProgressStatus(progress));
  });

  const after = await readOnDeviceAvailability(model, scope);
  onStatus(statusForAvailability(after));
  return after;
}
