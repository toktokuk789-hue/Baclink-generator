# Chrome Browser Hub & Automation Layer

## Overview

The **BacklinkForge Browser Hub** provides an explicit, controllable browser automation layer powered by Playwright and the Chrome DevTools Protocol (CDP).

It operates under strict human-in-the-loop and security guidelines.

---

## 1. Connection Architecture

Operators can attach BacklinkForge to an authorized Google Chrome instance:

```
┌─────────────────────────────────┐
│     BACKLINKFORGE CORE          │
└──────────────┬──────────────────┘
               │ CDP Connection (e.g. localhost:9222)
               ▼
┌─────────────────────────────────┐
│    AUTHORIZED CHROME PROFILE    │
│  - Active user session          │
│  - Visible browser window       │
│  - Operator has complete oversight
└─────────────────────────────────┘
```

If no remote CDP endpoint is provided, BacklinkForge launches a controlled local Chromium instance for research and inspection tasks.

---

## 2. Browser Agent Capabilities

* **URL Navigation**: Opens target websites with configurable timeouts and redirect tracking.
* **DOM Inspection**: Analyzes page structure, contact mechanisms, submission forms, and editorial author credits.
* **Form Preparation**: Maps approved business profile or submission fields into input elements.
* **Screenshot Verification**: Captures full-page or viewport screenshots to archive visual proof of completed actions.
* **Public Information Extraction**: Extracts publicly listed editorial contact emails, organization names, and submission requirements.

---

## 3. Human Handoff Protocols

Automated bots must never attempt to bypass security systems. When the browser layer encounters:
* **CAPTCHAs** (reCAPTCHA, hCaptcha, Cloudflare Turnstile)
* **Cloudflare Browser Verification** / Under Attack challenges
* **Multi-Factor Authentication** (SMS, TOTP, Email OTP)
* **Account Password Entry**
* **Payment or Credit Card confirmation**
* **Final legal submission terms**

The browser agent immediately triggers:
```
HUMAN ACTION REQUIRED
```
1. The agent task status transitions to `waiting_human_action`.
2. The user interface prominently alerts the operator with the reason and target website.
3. The operator switches to the Chrome window and completes the challenge manually.
4. The operator returns to BacklinkForge and clicks **Confirm & Resume Agent**.
5. The agent verifies the resulting page state and continues execution.

---

## 4. Security & Privacy Guarantees

* **Zero Password Extraction**: BacklinkForge never extracts, inspects, or logs browser passwords or password manager vaults.
* **Zero Cookie Harvesting**: Private authentication cookies are never copied or transferred to external servers.
* **Explicit User Authorization**: Every consequential external action is visible, recorded, and cancellable.
