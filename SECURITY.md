# BacklinkForge — Security, Privacy & Responsible Automation

## 1. Operating System Security

* **Windows DPAPI Integration**: Sensitive API tokens and provider keys are secured using Electron's native `safeStorage` API, which leverages Windows Data Protection API (DPAPI). Keys are encrypted with the logged-in Windows user's system credentials and cannot be decrypted by unauthorized user accounts.
* **Local-First Architecture**: Project datasets, crawl outputs, and audit logs are stored locally in the user's `userData` application directory. No backlink or project data is transmitted to third-party cloud servers without explicit user instruction.
* **Safe IPC**: Renderer code runs in a sandboxed context without direct Node.js integration. All inter-process communication is validated through strictly typed IPC channels.

---

## 2. Browser Automation Security

BacklinkForge enforces strict browser privacy protocols:
* **Zero Password Harvesting**: The software never reads, extracts, or stores browser passwords, saved credit cards, or browser autofill databases.
* **Zero Cookie Transfer**: Browser session cookies remain within the authorized Chrome profile and are never transmitted to external APIs.
* **Explicit User Authorization**: Automation tasks are triggered only when explicitly approved by the user.

---

## 3. Responsible Automation Standard

BacklinkForge rejects abusive or deceptive SEO practices:
* **No CAPTCHA / Anti-Bot Circumvention**: When anti-bot or CAPTCHA challenges are encountered, the agent automatically halts and requests human intervention (`HUMAN ACTION REQUIRED`).
* **No Mass Directory Spam**: The software filters out low-quality link farms and automatically generated directories, prioritizing curated platforms that deliver genuine business value.
* **No Fake Identities or Reviews**: Submissions are strictly restricted to legitimate, verified business profile information and genuine publications provided by the project owner.
* **Link Type Transparency**: BacklinkForge never misrepresents link attributes (e.g. claiming a `nofollow` link is `dofollow`).
