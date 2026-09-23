# BacklinkForge — Autonomous Agent Network

## Overview

BacklinkForge abandons generic, superficial AI chatbots in favor of a coordinated network of specialized autonomous agents managed by a central **Agent Orchestrator**.

---

## 1. Central Agent Orchestrator

The Orchestrator manages the execution lifecycle of all autonomous agents:
* **Task Queue**: Prioritized FIFO queue with dependency resolution (`dependencies` JSON array).
* **State Machine**:
  - `QUEUED`: Awaiting resource or dependency satisfaction.
  - `RUNNING`: Actively executing in the background worker.
  - `WAITING`: Waiting on prerequisites.
  - `WAITING_FOR_APPROVAL`: Paused pending human operator confirmation.
  - `PAUSED`: Temporarily suspended by operator.
  - `COMPLETED`: Finished with structured outputs recorded.
  - `FAILED`: Permanently halted after exhausting retry budget.
  - `CANCELLED`: Aborted by operator.
* **Retry Engine**: Exponential backoff with configurable `max_retries` (default: 3).
* **Event Stream**: Audit trail recording agent lifecycle events into `agent_events` table.

---

## 2. Agent Operational Modes

1. **Manual Mode**: Agents research, analyze, and surface recommendations. Zero consequential actions are executed without manual trigger.
2. **Assisted Mode** (Default): Agents research, qualify opportunities, draft communications, and prepare form submissions, but require operator approval before transmission.
3. **Autonomous Mode**: Pre-authorized low-risk tasks (discovery, crawl auditing, verification checks) run automatically. Consequential actions (form submission, email outreach) remain subject to configured approval policies.

---

## 3. Specialized Agents

| Agent Name | Primary Responsibility | Key Inputs / Outputs |
|---|---|---|
| **Project Analyst Agent** | Profiles the user's business, niche, and target market | Business URL → Topical profile & audience map |
| **Site Discovery Agent** | Discovers sitemaps, robots.txt, and page structures | Base URL → Site tree & metadata hierarchy |
| **Site Audit Agent** | Technical SEO inspection (404s, missing titles/H1, canonicals) | Crawled pages → Technical audit & health score |
| **Competitor Intelligence Agent**| Tracks competitor referring domains and link velocity | Competitor URLs → Competitor link gap catalog |
| **Opportunity Engine** | Discovers gaps, broken links, and curated resource pages | Backlinks & competitors → Scored opportunities |
| **Opportunity Qualification Agent** | Evaluates opportunities against transparent quality signals | Discovered opps → Transparent priority (High/Med/Low/Reject) |
| **Submission Discovery Agent** | Locates directories, profile hubs, and document libraries | Industry & country → Submission target catalog |
| **Submission Qualification Agent**| Filters link farms and analyzes platform quality | Candidate targets → Quality score & spam signals |
| **Profile Creation Agent** | Assembles normalized business profile packages | Project data → Character-bounded profile packages |
| **Document Distribution Agent** | Prepares PDF/research assets with duplicate hash protection | Document bytes → Verified asset ready to distribute |
| **Browser Research Agent** | Controlled Chrome interaction, DOM inspection, screenshot | Target URL → Extracted forms & public contact data |
| **Backlink Verification Agent** | Audits live published URLs to confirm active hyperlinks | Source URL & target → Live status, anchor, and rel attributes |
| **Monitoring Agent** | Scheduled checks for lost links or rel changes | Active backlinks → Historical change log & alerts |
