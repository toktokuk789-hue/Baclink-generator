# BacklinkForge — Technical Architecture

## 1. System Overview

BacklinkForge is structured as a modular desktop operating system utilizing Electron 33, Node.js, and React 19.

```
┌─────────────────────────────────────────────────────────────┐
│                       ELECTRON SHELL                        │
├──────────────────────────────┬──────────────────────────────┤
│      RENDERER PROCESS        │         MAIN PROCESS         │
│   (React 19 + TypeScript)    │    (Node.js + Native APIs)   │
│                              │                              │
│  - Zustand App Stores        │  - Central Agent Orchestrator│
│  - React Query Data Fetching │  - Browser Hub (Playwright)  │
│  - TanStack Virtual Tables   │  - Crawler & Audit Engine    │
│  - Dark-Theme Design System  │  - Verification Engine       │
│  - 14+ Operational Pages     │  - Submission Engine         │
│  - Command Palette (Ctrl+K)  │  - SQLite Repositories (WAL) │
│                              │                              │
├──────────────────────────────┴──────────────────────────────┤
│                   SECURE PRELOAD BRIDGE                     │
│          (contextBridge & Type-Safe IPC Channels)           │
├─────────────────────────────────────────────────────────────┤
│                     PERSISTENT STORAGE                      │
│             SQLite (WAL Mode) + Windows DPAPI               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Process Separation & Security

* **Renderer Isolation**: The React UI runs with `contextIsolation: true` and `nodeIntegration: false`. It cannot access the file system, network sockets, or operating system APIs directly.
* **Context Bridge**: Communication between renderer and main process is mediated strictly through `contextBridge.exposeInMainWorld('api', ...)` using predefined IPC channels defined in `src/shared/ipc-channels.ts`.
* **Zero Secret Extraction**: The desktop application operates on local project configurations and never exports credentials to external cloud servers.

---

## 3. Database Layer

* Embedded SQLite powered by `better-sqlite3`.
* Configured with `PRAGMA journal_mode = WAL` (Write-Ahead Logging) and `PRAGMA synchronous = NORMAL` for high-throughput reads and writes without locking the user interface.
* Version-controlled schema migrations executed automatically at startup via `Migrator`.
* Indexed query paths for domain lookups, backlink filtering, and task state tracking.
