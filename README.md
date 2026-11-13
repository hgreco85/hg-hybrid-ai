# HG Hybrid AI

Hybrid on-device/cloud generative AI web app built with Firebase AI Logic.

## What it does
- Initializes the on-device Gemini Nano model in Chrome (with user activation).
- Generates text from text and optional JPEG/PNG image input.
- Uses `PREFER_ON_DEVICE` mode: on-device when available, cloud fallback otherwise.
- Displays whether inference used on-device or cloud.
- Reports on-device readiness from the Prompt API (`LanguageModel.availability()` or the Firebase AI Logic adapter). Unavailable, downloadable, and downloading states stay visible; the UI claims the model is ready only when availability is `available`.

## Tech stack
- Vite + vanilla JS
- Firebase JS SDK (Firebase AI Logic)
- Firebase App Check (debug provider for local dev)

## Prerequisites
- Node.js 20+
- Chrome 139+ (for on-device inference)
- Firebase project with AI Logic enabled

## Setup
1. `npm install`
2. Create a Firebase project and enable AI Logic (Gemini Developer API).
3. Register App Check debug token for local dev.
4. Update `src/firebase.js` with your Firebase config if needed.
5. `npm run dev`
6. Open http://localhost:5173, click "Initialize on-device model", then "Generate". If this browser cannot run Gemini Nano, the status says the on-device model is unavailable and requests use the cloud.

## Build
`npm run build`

## Demo video

A new demo video is coming. The previous desktop recording was removed from this repository. It was not a product demo.

## Notes
- This project was created during the hackathon submission period.
- No production API keys are committed. Firebase web config is public by design.
- App Check debug tokens must not be committed for production.
## Competition improvement branch — release gates

The `improve/competition-readiness-20261113` branch introduces guided use cases, response timing, clearer SDK-reported inference source, and mandatory App Check configuration. **It is not production-ready until the following are complete:**

1. Register a real reCAPTCHA v3 site key for the Firebase Hosting domain and configure `VITE_RECAPTCHA_V3_SITE_KEY` (see `.env.example`). This key is public, but any debug tokens must remain private. Revoke the previously exposed debug token in Firebase Console. Confirm App Check enforcement for AI Logic and test production traffic.
2. Run `npm install && npm run build` and Playwright tests; verify the deployed domain after release. The build will need the environment variable configured. Do not merge or deploy without it.
3. Prove **both** device and cloud inference with real SDK-reported source values on supported Chrome/hardware. Cloud fallback alone is insufficient. Do not claim a mode from a button click or initialization alone.
4. A new demo video is coming. Record it only after verifying the user problem, the actual device path, the actual fallback, and the value. Update Devpost only after that new video is verified.

This repository does not include a demo video. The previous desktop recording was removed. There is no verified E2E run, deployment, or Devpost edit here.
