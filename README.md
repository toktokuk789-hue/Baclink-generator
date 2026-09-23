# BacklinkForge

**Autonomous SEO Intelligence, Backlink Discovery, Link Building, Browser Automation, Outreach, Competitor Research, Site Auditing and SEO Operations Platform**

---

## Overview

BacklinkForge is a world-class autonomous SEO operating system for Windows. Built for SEO operators, agency leaders, and digital marketers, it eliminates the fragmented workflow of juggling 10 different tools by uniting:

* **Autonomous Agent Network**: Specialized multi-agent system coordinating research, qualification, and execution.
* **Site Discovery & Technical Audit**: High-speed local crawling, robots.txt compliance, title/H1/canonical inspection, and health scoring.
* **Competitor Intelligence & Link Gap Analysis**: Pinpoints domain referring opportunities where competitors earn equity.
* **Submission & Asset Distribution Engine**: Discovers, qualifies, and prepares business profile submissions, niche directory listings, and PDF/document distribution (whitepapers, guides, research reports).
* **Chrome Browser Hub**: Direct Chrome DevTools Protocol (CDP) session integration with strict **Human-in-the-Loop** verification for CAPTCHA, MFA, and form submissions.
* **Verification & Monitoring Engine**: Verifies live URLs, detects link changes (DoFollow/NoFollow/UGC), tracks lost links, and maintains historical audit trails.
* **Local-First & Windows Native Security**: Backed by SQLite in WAL mode and Windows DPAPI credential encryption.

---

## Core Architecture

```
BacklinkForge/
├── migrations/                  # SQLite versioned migrations
│   ├── 001_initial_schema.sql  # Core projects, backlinks, opportunities, agent tasks
│   └── 002_submissions.sql     # Profiles, document assets, targets, verifications
├── src/
│   ├── main/                    # Electron Main Process (Node.js)
│   │   ├── app.ts               # Main process entry, window lifecycle, DB init
│   │   ├── agents/              # Specialized Autonomous Agents
│   │   │   ├── orchestrator.ts  # Task queue, priorities, state machine
│   │   │   ├── opportunity.ts   # Link gap, broken links, resource pages
│   │   │   └── submission/      # Profile builder, PDF analyzer, verifier
│   │   ├── browser/             # Playwright Chrome Hub & CDP integration
│   │   ├── database/            # better-sqlite3 connection & repositories
│   │   ├── ipc/                 # Type-safe IPC bridge handlers
│   │   └── services/            # Crawler, site audit, verification, import/export
│   ├── renderer/                # React 19 + TypeScript + Tailwind CSS
│   │   ├── App.tsx              # Routing and state providers
│   │   ├── layouts/AppLayout.tsx# Collapsible dark-theme sidebar layout
│   │   ├── pages/               # 13+ production pages (Dashboard, Submissions, etc.)
│   │   └── components/ui/       # Design system components
│   ├── preload/index.ts         # Secure contextBridge API
│   └── shared/                  # Unified schemas, types, and IPC constants
└── tests/                       # Vitest unit & integration test suites
```

---

## Submission & Asset Distribution Subsystem

The **Submission & Asset Distribution Agent** is a dedicated subsystem supporting:
1. **Business Profile Submissions**: Authoritative company listings (Crunchbase, Trustpilot, Clutch, Product Hunt).
2. **Niche & Industry Directories**: Curated directories filtered for strict quality and low spam risk.
3. **Document & PDF Distribution**: Whitepapers, original research reports, technical guides, and presentations shared on SlideShare, Scribd, Issuu, and Zenodo.
4. **Duplicate Content Protection**: Cryptographic SHA-256 asset hashing prevents accidental resubmission.
5. **Quality Filtering**: Proactively rejects low-trust link farms and automated submission directories.
6. **Live Link Verification**: Automatically inspects published URLs to detect active hyperlinks, anchor text, and `rel` attributes (`dofollow` vs `nofollow`).

---

## Responsible Automation & Human Handoff

BacklinkForge strictly adheres to responsible automation:
* **Zero Secret Harvesting**: Never extracts stored browser passwords or private credentials.
* **Human-in-the-Loop**: Automatically pauses and displays `HUMAN ACTION REQUIRED` whenever CAPTCHAs, MFA, or security verifications are encountered.
* **No Mass Spam**: Rejects low-quality submission platforms and emphasizes relevance and editorial standards.

---

## Building and Running

### Development Mode
```bash
npm run dev
```

### Run Tests
```bash
npm run test
```

### Windows Installer Package
```bash
npm run dist
```
Produces `BacklinkForge-Setup.exe` in the `dist/` directory.
