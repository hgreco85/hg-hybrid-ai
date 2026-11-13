import { initDeviceModel, generate } from './firebase.js';

const statusEl = document.getElementById('status');
const modeEl = document.getElementById('mode');
const outputEl = document.getElementById('output');
const promptEl = document.getElementById('prompt');
const imageEl = document.getElementById('image');
const initBtn = document.getElementById('initBtn');
const runBtn = document.getElementById('runBtn');
const elapsedEl = document.getElementById('elapsed');
document.querySelectorAll('[data-prompt]').forEach(button => {
  button.addEventListener('click', () => { promptEl.value = button.dataset.prompt; promptEl.focus(); });
});

function setStatus(text, cls = '') {
  statusEl.textContent = text;
  statusEl.className = 'status ' + cls;
}

initBtn.addEventListener('click', async () => {
  setStatus('Initializing on-device model (may download)...');
  try {
    await initDeviceModel((p) => {
      setStatus(`Downloading model: ${Math.round(p * 100)}%`);
    });
    setStatus('On-device model ready', 'ok');
  } catch (e) {
    console.error(e);
    setStatus('Initialization failed or fell back to cloud: ' + e.message, 'warn');
  }
});

runBtn.addEventListener('click', async () => {
  const prompt = promptEl.value.trim();
  if (!prompt) {
    setStatus('Enter a prompt first', 'warn');
    return;
  }
  const file = imageEl.files && imageEl.files[0] ? imageEl.files[0] : null;
  if (file && (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
    setStatus('Use a JPEG or PNG image smaller than 5 MB.', 'warn');
    return;
  }
  setStatus('Generating...');
  runBtn.disabled = true;
  const startedAt = performance.now();
  outputEl.textContent = '';
  try {
    const { text, mode } = await generate(prompt, file);
    outputEl.textContent = text;
    modeEl.textContent = 'SDK-reported inference source: ' + mode;
    if (mode === 'unknown') setStatus('Response received, but inference source was not reported.', 'warn');
    elapsedEl.textContent = `Response time: ${((performance.now() - startedAt) / 1000).toFixed(1)}s`;
    if (mode !== 'unknown') setStatus('Done', 'ok');
  } catch (e) {
    console.error(e);
    outputEl.textContent = 'Error: ' + e.message;
    setStatus('Failed', 'warn');
  } finally {
    runBtn.disabled = false;
  }
});