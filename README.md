# HG Hybrid AI

Hybrid on-device/cloud generative AI web app built with Firebase AI Logic.

## What it does
- Initializes the on-device Gemini Nano model in Chrome (with user activation).
- Generates text from text and optional JPEG/PNG image input.
- Uses `PREFER_ON_DEVICE` mode: on-device when available, cloud fallback otherwise.
- Displays whether inference used on-device or cloud.

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
6. Open http://localhost:5173, click "Initialize on-device model", then "Generate".

## Build
`npm run build`

## Notes
- This project was created during the hackathon submission period.
- No production API keys are committed. Firebase web config is public by design.
- App Check debug tokens must not be committed for production.