# HG Hybrid AI

A web demo of hybrid on-device/cloud generative AI using Firebase AI Logic.

## Live project

- [Hosted demo](https://hg-hybrid-ai-2026.web.app/)
- [Hackathon submission (Devpost)](https://devpost.com/software/hg-hybrid-ai)
- [Public demo video (YouTube)](https://www.youtube.com/watch?v=ClVuAW-SP10) — approximately 112 seconds, English narration/captions
- [Source code](https://github.com/hgreco85/hg-hybrid-ai)

The project was submitted during the 2026 BuildHybridAI hackathon. The video is hosted on YouTube rather than checked into this repository.

## What it does

- Requests initialization of Chrome's on-device Gemini Nano model after user interaction.
- Generates text from a prompt and optionally a JPEG/PNG image.
- Configures Firebase AI Logic with `InferenceMode.PREFER_ON_DEVICE`, allowing cloud inference when device inference is unavailable.
- Shows the inference source returned by the SDK, rather than assuming the selected mode from the button click.
- Displays device-model readiness only when availability is reported as `available`; other availability states stay visible.

**Availability is environment-dependent.** Not every Chrome installation or device supports Gemini Nano. A successful cloud response does not establish that on-device inference was exercised.

## Technology

- Vite / JavaScript
- Firebase AI Logic (Gemini Developer API backend; `PREFER_ON_DEVICE`)
- Firebase App Check using `ReCaptchaEnterpriseProvider` (the current code requires a configured site key)
- Firebase Hosting

## Local development

Prerequisites: Node.js 20+, a Firebase project configured for AI Logic, and a valid reCAPTCHA Enterprise site key registered for the intended origin. Supported Chrome/hardware is required to demonstrate on-device execution.

1. Clone this repository and run `npm install`.
2. Review the existing Firebase project configuration in `src/firebase.js` and use your own Firebase project/configuration if running an independent deployment.
3. Set `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` in a local `.env` file using a key registered for the test origin. See `.env.example` for the variable name. Do not commit secrets or debug tokens.
4. Run `npm run dev` and open the local address reported by Vite.
5. Select **Initialize on-device model** and then generate a response. Inspect the SDK-reported inference source. If on-device inference is unsupported, the app may use cloud fallback.

The current source uses reCAPTCHA Enterprise, **not** a debug App Check provider. The presence of an App Check integration in code does not independently prove console-side enforcement or production token configuration.

## Testing and build

- `npm test`
- `npm run build`

Historical submission evidence recorded in the [Competition Portfolio issue #1579](https://github.com/hgreco85/HG-Market-System/issues/1579) on November 13, 2026 reported 15/15 tests passing, a successful build, a production deployment, and demonstrations of SDK-reported `on_device` and `in_cloud` inference. These are **historical execution receipts**, not a claim that those tests were rerun for this documentation edit or that every browser can reproduce the on-device result.

## Submission and verification notes

The publicly available demo video shows the product, including the two inference paths, according to the November 13 submission receipt. Review the linked video and live deployment for the current externally visible version.

Before any further release, re-check:
- the exact build/test result and live behavior;
- on-device inference on compatible Chrome/hardware and fallback on a browser without the device model;
- App Check configuration and enforcement in Firebase Console, including the status of any old debug token;
- whether the Devpost description accurately matches current source and demonstration.

These checks are not automatically satisfied by this README update. No deployment or Devpost edit is part of this documentation-only proposal.

## License

The repository includes an [MIT license](LICENSE). Note: `package.json` currently declares `ISC`; this metadata discrepancy should be reconciled in a separately reviewed change.
