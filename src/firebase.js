import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
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

// App Check uses the real reCAPTCHA Enterprise provider for every origin, including localhost.
// (No debug token is generated or required.)

// Real reCAPTCHA Enterprise site key registered for this Firebase Hosting domain.
// Set VITE_RECAPTCHA_ENTERPRISE_SITE_KEY (preferred) or VITE_RECAPTCHA_V3_SITE_KEY.
const siteKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY || import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY;
if (!siteKey) {
  throw new Error('Missing VITE_RECAPTCHA_ENTERPRISE_SITE_KEY: configure App Check before running the app.');
}
initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
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