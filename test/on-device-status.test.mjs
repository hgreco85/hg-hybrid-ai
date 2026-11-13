import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ON_DEVICE_DOWNLOADABLE,
  ON_DEVICE_DOWNLOADING,
  ON_DEVICE_READY,
  ON_DEVICE_UNAVAILABLE,
  downloadProgressStatus,
  readOnDeviceAvailability,
  runOnDeviceInitialization,
  statusForAvailability,
} from '../src/on-device-status.mjs';

const CREATE_OPTIONS = {
  expectedInputs: [{ type: 'text', languages: ['en'] }, { type: 'image' }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
};

function modelWithAvailability(availability) {
  const calls = [];
  const model = {
    chromeAdapter: {
      onDeviceParams: { createOptions: CREATE_OPTIONS },
      languageModelProvider: {
        async availability(options) {
          calls.push(options);
          return typeof availability === 'function' ? availability(calls.length) : availability;
        },
      },
    },
  };
  return { model, calls };
}

describe('statusForAvailability', () => {
  it('maps available to the ready status', () => {
    assert.deepEqual(statusForAvailability('available'), {
      text: ON_DEVICE_READY,
      kind: 'ok',
    });
  });

  it('maps unavailable to an honest cloud-fallback status', () => {
    assert.deepEqual(statusForAvailability('unavailable'), {
      text: ON_DEVICE_UNAVAILABLE,
      kind: 'warn',
    });
  });

  it('maps downloadable and downloading to distinct statuses', () => {
    assert.equal(statusForAvailability('downloadable').text, ON_DEVICE_DOWNLOADABLE);
    assert.equal(statusForAvailability('downloading').text, ON_DEVICE_DOWNLOADING);
    assert.equal(statusForAvailability('downloadable').kind, 'warn');
    assert.equal(statusForAvailability('downloading').kind, 'warn');
  });

  it('does not treat unknown values as ready', () => {
    for (const value of [undefined, null, '', 'ready', true, 'AVAILABLE']) {
      assert.equal(statusForAvailability(value).text, ON_DEVICE_UNAVAILABLE);
      assert.notEqual(statusForAvailability(value).text, ON_DEVICE_READY);
    }
  });
});

describe('readOnDeviceAvailability', () => {
  it('uses the Firebase AI Logic adapter availability check and its create options', async () => {
    const { model, calls } = modelWithAvailability('available');
    const languageModelCalled = [];
    const scope = {
      LanguageModel: {
        async availability() {
          languageModelCalled.push(true);
          return 'unavailable';
        },
      },
    };
    assert.equal(await readOnDeviceAvailability(model, scope), 'available');
    assert.deepEqual(calls, [CREATE_OPTIONS]);
    assert.equal(languageModelCalled.length, 0);
  });

  it('reads unavailable, downloadable, and downloading from the adapter', async () => {
    for (const value of ['unavailable', 'downloadable', 'downloading']) {
      const { model } = modelWithAvailability(value);
      assert.equal(await readOnDeviceAvailability(model), value);
    }
  });

  it('falls back to LanguageModel.availability() when the SDK adapter is absent', async () => {
    const seen = [];
    const scope = {
      LanguageModel: {
        async availability() {
          seen.push('called');
          return 'downloadable';
        },
      },
    };
    assert.equal(await readOnDeviceAvailability({}, scope), 'downloadable');
    assert.deepEqual(seen, ['called']);
  });

  it('returns unavailable when the Prompt API is missing', async () => {
    assert.equal(await readOnDeviceAvailability(undefined, {}), 'unavailable');
    assert.equal(await readOnDeviceAvailability({ chromeAdapter: {} }, {}), 'unavailable');
  });
});

describe('runOnDeviceInitialization', () => {
  it('does not report ready when the model is unavailable, even if initialization would resolve', async () => {
    const { model } = modelWithAvailability('unavailable');
    const statuses = [];
    let initializeCalls = 0;
    const result = await runOnDeviceInitialization({
      model,
      initializeDeviceModel: async () => {
        initializeCalls += 1;
      },
      onStatus: (status) => statuses.push(status),
    });

    assert.equal(result, 'unavailable');
    assert.equal(initializeCalls, 0);
    assert.deepEqual(statuses, [
      { text: ON_DEVICE_UNAVAILABLE, kind: 'warn' },
    ]);
    assert.equal(statuses.some((status) => status.text === ON_DEVICE_READY), false);
  });

  it('reports ready only after a post-init availability check says available', async () => {
    const { model } = modelWithAvailability(() => 'available');
    const statuses = [];
    let initializeCalls = 0;
    const result = await runOnDeviceInitialization({
      model,
      initializeDeviceModel: async (onProgress) => {
        initializeCalls += 1;
        assert.equal(typeof onProgress, 'function');
      },
      onStatus: (status) => statuses.push(status.text),
    });

    assert.equal(result, 'available');
    assert.equal(initializeCalls, 1);
    assert.deepEqual(statuses, [
      'Initializing on-device model (may download)...',
      ON_DEVICE_READY,
    ]);
  });

  it('does not report ready when initialization resolves but the next availability check is unavailable', async () => {
    let reads = 0;
    const { model } = modelWithAvailability(() => {
      reads += 1;
      return reads === 1 ? 'available' : 'unavailable';
    });
    const statuses = [];
    const result = await runOnDeviceInitialization({
      model,
      initializeDeviceModel: async () => {},
      onStatus: (status) => statuses.push(status.text),
    });

    assert.equal(result, 'unavailable');
    assert.equal(statuses.at(-1), ON_DEVICE_UNAVAILABLE);
    assert.equal(statuses.includes(ON_DEVICE_READY), false);
  });

  it('shows downloadable, then download progress, and ready only if the model becomes available', async () => {
    let reads = 0;
    const { model } = modelWithAvailability(() => {
      reads += 1;
      return reads === 1 ? 'downloadable' : 'available';
    });
    const statuses = [];
    const result = await runOnDeviceInitialization({
      model,
      initializeDeviceModel: async (onProgress) => {
        onProgress(0.42);
      },
      onStatus: (status) => statuses.push(status.text),
    });

    assert.equal(result, 'available');
    assert.deepEqual(statuses, [
      ON_DEVICE_DOWNLOADABLE,
      'Downloading model: 42%',
      ON_DEVICE_READY,
    ]);
  });

  it('keeps the downloadable status when the download has not finished', async () => {
    const { model } = modelWithAvailability('downloadable');
    const statuses = [];
    let initializeCalls = 0;
    const result = await runOnDeviceInitialization({
      model,
      initializeDeviceModel: async () => {
        initializeCalls += 1;
      },
      onStatus: (status) => statuses.push(status.text),
    });

    assert.equal(result, 'downloadable');
    assert.equal(initializeCalls, 1);
    assert.deepEqual(statuses, [ON_DEVICE_DOWNLOADABLE, ON_DEVICE_DOWNLOADABLE]);
    assert.equal(statuses.includes(ON_DEVICE_READY), false);
  });

  it('shows downloading and does not claim ready while the download is still in progress', async () => {
    const { model } = modelWithAvailability('downloading');
    const statuses = [];
    const result = await runOnDeviceInitialization({
      model,
      initializeDeviceModel: async (onProgress) => {
        onProgress(0.5);
      },
      onStatus: (status) => statuses.push(status),
    });

    assert.equal(result, 'downloading');
    assert.equal(statuses[0].text, ON_DEVICE_DOWNLOADING);
    assert.deepEqual(statuses[1], downloadProgressStatus(0.5));
    assert.equal(statuses.at(-1).text, ON_DEVICE_DOWNLOADING);
    assert.equal(statuses.some((status) => status.text === ON_DEVICE_READY), false);
  });

  it('propagates initialization errors without marking the model ready', async () => {
    const { model } = modelWithAvailability('downloadable');
    const statuses = [];
    await assert.rejects(
      () => runOnDeviceInitialization({
        model,
        initializeDeviceModel: async () => {
          throw new Error('download blocked');
        },
        onStatus: (status) => statuses.push(status.text),
      }),
      /download blocked/,
    );
    assert.deepEqual(statuses, [ON_DEVICE_DOWNLOADABLE]);
  });
});
