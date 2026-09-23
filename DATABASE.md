# BacklinkForge — Database Architecture

## 1. Storage Engine

* **Engine**: Embedded SQLite using `better-sqlite3`.
* **Journal Mode**: `WAL` (Write-Ahead Logging). Permits concurrent reads while a background worker writes without database locking or UI freezing.
* **Synchronous Setting**: `NORMAL`. Ensures database integrity while maximizing disk write throughput.
* **Cache Size**: `-64000` (allocates 64MB memory page cache).
* **Foreign Keys**: `PRAGMA foreign_keys = ON`. Enforces referential integrity with cascading deletes where appropriate.

---

## 2. Core Entities & Tables

```
[projects]
   ├── [domains]
   ├── [pages]
   ├── [competitors]
   ├── [backlinks] ── [backlink_history]
   ├── [referring_domains]
   ├── [opportunities]
   ├── [contacts]
   ├── [campaigns] ── [messages]
   ├── [agent_tasks] ── [agent_events]
   ├── [approvals]
   ├── [monitoring_events]
   ├── [business_profiles]
   ├── [document_assets]
   ├── [submission_campaigns]
   │      └── [submission_targets]
   │             ├── [submission_attempts]
   │             └── [submission_verifications]
   ├── [browser_sessions]
   └── [browser_tasks]
```

---

## 3. High-Performance Indexing

BacklinkForge includes optimized compound indexes:
* `idx_backlinks_main`: `(project_id, source_domain, target_domain, status)` — Enables instant filtering across millions of backlink rows.
* `idx_backlinks_first_discovered`: `(first_discovered)` — Powers historical velocity queries.
* `idx_pages_project_url`: `(project_id, url, domain_id)` — High-speed crawler deduplication.
* `idx_opportunities_main`: `(project_id, status, priority, type)` — Instant opportunity triage.
* `idx_submission_targets_project`: `(project_id, status)` — Fast directory and submission pipeline queries.
* `idx_document_assets_hash`: `(file_hash)` — Instant duplicate document asset detection.

---

## 4. Migration System

Migrations are stored in versioned SQL files in `migrations/`:
* `001_initial_schema.sql`: Core schema tables, constraints, and indexes.
* `002_submissions_and_assets.sql`: Business profiles, document distribution, and verification tables.

The `Migrator` reads all `.sql` files, inspects the `_migrations` tracking table, and runs any unapplied migrations inside individual transactions at startup.
