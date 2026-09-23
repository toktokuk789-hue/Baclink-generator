# BacklinkForge — Crawler & Technical SEO Engine

## Overview

The BacklinkForge Crawler is an embedded Node.js crawling engine utilizing `undici` for high-throughput HTTP/1.1 and HTTP/2 pipelining, and `cheerio` for rapid DOM parsing.

It executes entirely within the Electron main process, isolated from the UI to ensure 60fps interface responsiveness.

---

## 1. Crawl Lifecycle & Configuration

```
USER ENTERS URL → ROBOTS CHECK → ENQUEUE ROOT → FETCH & PARSE → EXTRACT LINKS → DEDUPLICATE → AUDIT
```

### Crawl Options:
* `baseUrl`: Target website root.
* `maxPages`: Configurable limit (default: 30 for MVP; scales up to thousands).
* `maxDepth`: Maximum link distance from homepage (default: 3).
* `User-Agent`: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) BacklinkForge-Crawler/1.0`.

---

## 2. Extracted Signals

For every discovered page, the crawler collects:
* **HTTP Status**: Response code (200, 301, 302, 404, 500).
* **Title Tag**: Character length and content.
* **Meta Description**: Snippet text.
* **Primary H1**: Main editorial heading.
* **Canonical URL**: Self-referential or alternate target.
* **Robots Directives**: Presence of `noindex` or `nofollow`.
* **Link Graph**: Count and URLs of internal vs external hyperlinks.
* **Structured Data**: JSON-LD schema blocks (`@context: schema.org`).
* **Content Metrics**: Estimated word count and text-to-code ratio.

---

## 3. Technical SEO Health Score

The `SiteAuditEngine` analyzes crawled pages and computes an overall health score (0 to 100):
* **Critical Issues (-40% penalty factor)**: Broken pages (HTTP 4xx/5xx), missing title tags.
* **Warning Issues (-20% penalty factor)**: Missing H1 headings, missing meta descriptions, missing canonical tags, excessive crawl depth (>3 clicks).
* **Notices**: Intentional noindex directives, redirecting URLs, potential orphan pages (0 internal links).
