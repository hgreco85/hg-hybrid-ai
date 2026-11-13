import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from 'firebase/ai';

const firebaseConfig = {
  apiKey: 'AIzaSyAtoxAn3P70hMuIdXDy509O8WUc5I7YyOE',
  authDomain: 'hg-hybrid-ai-2026.firebaseapp.com',
  projectId: 'hg-hybrid-ai-2026',
  storageBucket: 'hg-hybrid-ai-2026.firebasestorage.app',
  messagingSenderId: '769768787214',
  appId: '1:769768787214:web:6187158de8e2be9ea75b5f',
};

export const firebaseApp = initializeApp(firebaseConfig);

// Debug provider for local development. Register the printed token in Firebase console.
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

// Set VITE_RECAPTCHA_V3_SITE_KEY to the registered site key for this domain.
// App Check enforcement must also be enabled in the Firebase Console.
const siteKey = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY;
if (!siteKey) {
  throw new Error('Missing VITE_RECAPTCHA_V3_SITE_KEY: configure App Check before running the app.');
}
initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
});

const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });

export const model = getGenerativeModel(ai, { mode: InferenceMode.PREFER_ON_DEVICE });

export async function initDeviceModel(onProgress) {
  return model.initializeDeviceModel((progress) => {
    if (onProgress) onProgress(progress);
  });
}

export async function generate(prompt, imageFile) {
  let parts = [prompt];
  if (imageFile) {
    const base64 = await fileToBase64(imageFile);
    parts = [prompt, { inlineData: { data: base64, mimeType: imageFile.type } }];
  }
  const result = await model.generateContent(parts);
  const response = result.response;
  let mode = 'unknown';
  try {
    mode = response.inferenceSource || response.inferenceMode || 'unknown';
  } catch {}
  return { text: response.text(), mode, raw: result };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}