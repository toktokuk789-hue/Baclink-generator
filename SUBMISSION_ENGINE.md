# Submission & Asset Distribution Subsystem — Technical Specification

## Overview

The **Submission & Asset Distribution Agent** is a dedicated subsystem engineered to discover, qualify, prepare, execute, and verify legitimate profile, directory, and document/PDF backlink opportunities.

It does not generate bulk submission spam. It follows a disciplined operational pipeline:
```
DISCOVER → QUALIFY → PREPARE → APPROVE → BROWSER SUBMIT → VERIFY → MONITOR
```

---

## 1. Supported Platform Categories

1. **Business Profile Platforms**: Authoritative, persistent brand hubs (e.g. Crunchbase, Trustpilot, Clutch, F6S).
2. **Industry & Niche Directories**: Highly focused sector directories with active editorial curation (e.g. GoodFirms, SaaSHub, AlternativeTo).
3. **Local Citations & Regional Directories**: Verified geographic references matching target country and operating regions.
4. **Document & PDF Repositories**: Authoritative libraries for research reports, whitepapers, manuals, and technical guides (e.g. Scribd, SlideShare, Issuu, Zenodo, Academia.edu).
5. **Presentation & Slide Hubs**: Slide decks and conference materials embedding citation references (e.g. SpeakerDeck, SlideServe).
6. **Tool & Resource Directories**: Curated software and developer tool indexes (e.g. Product Hunt).

---

## 2. Agent Subcomponents

### 2.1 Submission Discovery Agent (`submission-discovery.ts`)
Discovers potential platforms using:
* Project Industry & Niche
* Operating Country & Target Language
* Competitor Profiles & Historical Backlinks
* Keyword Themes & Product Offerings

Each candidate target records:
* `platform_name`, `domain`, `submission_url`
* `target_type` (business_profile, industry_directory, document_sharing, etc.)
* `allows_links` (0/1)
* `estimated_link_type` (`follow`, `nofollow`, `ugc`, `unknown`)
* `topical_relevance` score (0.0 to 1.0)
* Platform submission requirements (required fields, account types)

### 2.2 Submission Qualification Agent (`submission-qualification.ts`)
Analyzes discovered platforms before recommending action:
* **Spam Filter**: Rejects known link-farm patterns, auto-submission footprints, and uncurated link directories.
* **Editorial Quality**: Verifies whether human moderation or business verification is enforced.
* **Indexing Likelihood**: Evaluates if the platform's profile/document URLs are discoverable and indexed by search engines.
* **Classification**:
  - `HIGH PRIORITY`: Authoritative, verified brand and document repositories.
  - `MEDIUM PRIORITY`: Curated niche directories with direct website references.
  - `LOW PRIORITY`: Secondary directories with limited authority metrics.
  - `REJECTED`: Blocked by quality filter with explicit transparency reason.

### 2.3 Profile Builder Agent (`profile-builder.ts`)
Normalizes project business data into an editable, reusable Business Profile Package:
* Business name, website URL, tagline, industry
* Short description (character-capped at 150 chars for constrained directories)
* Detailed long description (topical depth and value proposition)
* Categories, services, products
* Contact details (public email, phone, address, founded year, business hours)
* Social links (LinkedIn, Twitter/X, GitHub, Facebook, Crunchbase)

### 2.4 PDF/Document Asset Distribution & Analyzer (`pdf-analyzer.ts`, `pdf-generator.ts`)
Distributes high-value documents (whitepapers, original research reports, technical checklists):
* **Duplicate Content Protection**: Computes cryptographic SHA-256 hashes of all document bytes to prevent duplicate submissions.
* **Embedded Link Detection**: Validates that hyperlinked citations pointing to the user's website exist within the document body.
* **Quality Scoring**: Evaluates page depth, readability, citation count, and metadata completeness.
* **PDF Creation Assistant**: Enables operators to generate structured, branded PDF publications embedding target website citations using `pdf-lib`.

### 2.5 Submission Verifier Agent (`submission-verifier.ts`)
Crawls published listing URLs and documents to audit backlink status:
* Fetches live HTTP response (detecting 200 OK, 404/410 removals, 301 redirects)
* Parses DOM with `cheerio` to locate links pointing to the project domain
* Extracts actual anchor text and `rel` attribute tags
* Classifies status:
  - `published_link_found` (Live active DoFollow or NoFollow citation)
  - `published_no_link` (Listing published, but direct link absent)
  - `removed` (Page deleted or returning error)
  - `unable_to_verify` (Requires login session or bot challenge)

---

## 3. Human Handoff Integration

Whenever a target platform presents:
* CAPTCHA / Cloudflare challenges
* Multi-factor authentication (MFA)
* Account credential creation
* Final confirmation requiring operator judgment

The agent pauses the workflow, flags the attempt as `waiting_human_action`, and displays the **HUMAN ACTION REQUIRED** banner in the BacklinkForge desktop interface. After the operator completes the step directly in Chrome, clicking **Confirm & Resume Agent** resumes automated tracking and verification.
