# BuildHybridAI — competition readiness review

## Critical before resubmitting or deploying

1. **App Check:** Production code currently uses a Google sample reCAPTCHA v3 site key, not a project-specific key. Register a genuine site key for the hosting domain, enforce App Check for Firebase AI Logic and verify legitimate users can generate. Do not silently swallow initialization failures. Revoke the previously exposed local App Check debug token in Firebase Console and audit any copies or logs. A public GitHub comment was redacted, but its revision history may retain the value.
2. **Hybrid evidence:** The existing receipt confirms cloud inference only. Capture successful device inference with the SDK-reported source on supported hardware, then force a controlled fallback and capture cloud inference. If device mode is unavailable, document it honestly and do not fabricate evidence.
3. **Product:** Current app is a generic prompt box. Choose one compelling user problem with a measurable benefit, compelling demo input and output, and polished task-oriented UX; evaluate against the four equally weighted judging criteria.
4. **Video:** The previous desktop recording was removed. It was not a product demo. A new demo video is coming. Record it only after verifying functionality. Aim for 90–120 seconds: user problem (10s), device path (35s), controlled fallback (25s), value and technical architecture (20s), concise close. English subtitles, readable UI, no fabricated footage.
5. **Quality:** Add automated tests for initialization failure, network fallback, source labeling, accessibility, file validation and error handling. Run build and real browser E2E on deployed site. Verify no sensitive files, credentials or tokens in repo or video.
6. **Submission:** Keep current Devpost submission intact until a better tested version is ready. Then update repository, deployment, video URL and Devpost and retain evidence of confirmation.

Status: review checklist only. No claim of successful device inference, deployment, production App Check protection, or video review.
