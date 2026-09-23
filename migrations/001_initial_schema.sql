-- initial_schema.sql

CREATE TABLE projects (
    id TEXT PRIMARY KEY, 
    name TEXT NOT NULL, 
    website_url TEXT, 
    business_name TEXT, 
    business_description TEXT, 
    industry TEXT, 
    country TEXT, 
    language TEXT DEFAULT 'en', 
    target_audience TEXT, 
    products_services TEXT, 
    keywords TEXT, 
    automation_mode TEXT DEFAULT 'assisted' CHECK(automation_mode IN ('manual','assisted','autonomous')), 
    status TEXT DEFAULT 'active', 
    created_at TEXT DEFAULT (datetime('now')), 
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE domains (
    id TEXT PRIMARY KEY, 
    project_id TEXT REFERENCES projects(id), 
    domain TEXT NOT NULL, 
    title TEXT, 
    description TEXT, 
    country TEXT, 
    language TEXT, 
    relevance_score REAL, 
    authority_metric REAL, 
    authority_source TEXT, 
    traffic_estimate INTEGER, 
    traffic_source TEXT, 
    contact_available INTEGER DEFAULT 0, 
    opportunity_types TEXT, 
    discovery_source TEXT, 
    status TEXT DEFAULT 'discovered', 
    notes TEXT, 
    tags TEXT, 
    created_at TEXT DEFAULT (datetime('now')), 
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(project_id, domain)
);

CREATE TABLE pages (
    id TEXT PRIMARY KEY, 
    project_id TEXT REFERENCES projects(id), 
    domain_id TEXT REFERENCES domains(id), 
    url TEXT NOT NULL, 
    title TEXT, 
    meta_description TEXT, 
    h1 TEXT, 
    canonical_url TEXT, 
    http_status INTEGER, 
    content_type TEXT, 
    word_count INTEGER, 
    internal_links_count INTEGER, 
    external_links_count INTEGER, 
    depth INTEGER DEFAULT 0, 
    is_indexable INTEGER DEFAULT 1, 
    has_noindex INTEGER DEFAULT 0, 
    has_nofollow INTEGER DEFAULT 0, 
    structured_data TEXT, 
    crawled_at TEXT, 
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(project_id, url)
);

CREATE TABLE competitors (
    id TEXT PRIMARY KEY, 
    project_id TEXT REFERENCES projects(id), 
    domain TEXT NOT NULL, 
    name TEXT, 
    url TEXT, 
    status TEXT DEFAULT 'active', 
    notes TEXT, 
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(project_id, domain)
);

CREATE TABLE backlinks (
    id TEXT PRIMARY KEY, 
    project_id TEXT REFERENCES projects(id), 
    source_url TEXT NOT NULL, 
    source_domain TEXT NOT NULL, 
    target_url TEXT NOT NULL, 
    target_domain TEXT NOT NULL, 
    anchor_text TEXT, 
    link_type TEXT DEFAULT 'text', 
    is_dofollow INTEGER DEFAULT 1, 
    is_nofollow INTEGER DEFAULT 0, 
    is_sponsored INTEGER DEFAULT 0, 
    is_ugc INTEGER DEFAULT 0, 
    http_status INTEGER, 
    page_title TEXT, 
    country TEXT, 
    language TEXT, 
    first_discovered TEXT DEFAULT (datetime('now')), 
    last_verified TEXT, 
    link_context TEXT, 
    link_position TEXT, 
    is_redirect INTEGER DEFAULT 0, 
    redirect_url TEXT, 
    provider TEXT, 
    confidence REAL DEFAULT 1.0, 
    status TEXT DEFAULT 'active', 
    created_at TEXT DEFAULT (datetime('now')), 
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_backlinks_main ON backlinks(project_id, source_domain, target_domain, status);
CREATE INDEX idx_backlinks_first_discovered ON backlinks(first_discovered);

CREATE TABLE backlink_history (
    id TEXT PRIMARY KEY, 
    backlink_id TEXT REFERENCES backlinks(id), 
    field_changed TEXT NOT NULL, 
    old_value TEXT, 
    new_value TEXT, 
    changed_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE referring_domains (
    id TEXT PRIMARY KEY, 
    project_id TEXT REFERENCES projects(id), 
    domain TEXT NOT NULL, 
    backlink_count INTEGER DEFAULT 0, 
    first_seen TEXT, 
    last_seen TEXT, 
    is_dofollow INTEGER DEFAULT 1, 
    authority_metric REAL, 
    authority_source TEXT, 
    traffic_estimate INTEGER, 
    country TEXT, 
    status TEXT DEFAULT 'active', 
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(project_id, domain)
);

CREATE TABLE contacts (
    id TEXT PRIMARY KEY, 
    project_id TEXT REFERENCES projects(id), 
    domain TEXT, 
    organization TEXT, 
    name TEXT, 
    role TEXT, 
    email TEXT, 
    contact_page_url TEXT, 
    social_url TEXT, 
    source TEXT NOT NULL, 
    verified INTEGER DEFAULT 0, 
    notes TEXT, 
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE campaigns (
    id TEXT PRIMARY KEY, 
    project_id TEXT REFERENCES projects(id), 
    name TEXT NOT NULL, 
    type TEXT, 
    status TEXT DEFAULT 'draft', 
    template TEXT, 
    notes TEXT, 
    created_at TEXT DEFAULT (datetime('now')), 
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE opportunities (
    id TEXT PRIMARY KEY, 
    project_id TEXT REFERENCES projects(id), 
    domain_id TEXT REFERENCES domains(id), 
    type TEXT NOT NULL CHECK(type IN ('link_gap','broken_link','resource_page','unlinked_mention','editorial')), 
    source_url TEXT, 
    target_url TEXT, 
    evidence TEXT, 
    relevance_explanation TEXT, 
    recommended_action TEXT, 
    quality_signals TEXT, 
    risk_signals TEXT, 
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('high','medium','low','reject')), 
    priority_reason TEXT, 
    status TEXT DEFAULT 'discovered' CHECK(status IN ('discovered','qualified','approved','in_progress','contacted','replied','acquired','verified','rejected','archived')), 
    contact_id TEXT REFERENCES contacts(id), 
    campaign_id TEXT REFERENCES campaigns(id), 
    notes TEXT, 
    tags TEXT, 
    cost REAL DEFAULT 0, 
    created_at TEXT DEFAULT (datetime('now')), 
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE messages (
    id TEXT PRIMARY KEY, 
    project_id TEXT REFERENCES projects(id), 
    campaign_id TEXT REFERENCES campaigns(id), 
    contact_id TEXT REFERENCES contacts(id), 
    opportunity_id TEXT REFERENCES opportunities(id), 
    type TEXT DEFAULT 'outreach', 
    subject TEXT, 
    body TEXT, 
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft','pending_approval','approved','sent','delivered','replied','bounced','failed')), 
    sent_at TEXT, 
    replied_at TEXT, 
    response_classification TEXT, 
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE agent_tasks (
    id TEXT PRIMARY KEY, 
    project_id TEXT REFERENCES projects(id), 
    agent_type TEXT NOT NULL, 
    objective TEXT NOT NULL, 
    priority INTEGER DEFAULT 5, 
    dependencies TEXT, 
    inputs TEXT, 
    outputs TEXT, 
    status TEXT DEFAULT 'queued' CHECK(status IN ('queued','running','waiting','waiting_for_approval','paused','completed','failed','cancelled')), 
    error_message TEXT, 
    retry_count INTEGER DEFAULT 0, 
    max_retries INTEGER DEFAULT 3, 
    timeout_seconds INTEGER DEFAULT 300, 
    provider TEXT, 
    cost REAL DEFAULT 0, 
    started_at TEXT, 
    completed_at TEXT, 
    created_at TEXT DEFAULT (datetime('now')), 
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE agent_events (
    id TEXT PRIMARY KEY, 
    task_id TEXT REFERENCES agent_tasks(id), 
    agent_type TEXT NOT NULL, 
    event_type TEXT NOT NULL, 
    message TEXT, 
    data TEXT, 
    timestamp TEXT DEFAULT (datetime('now'))
);

CREATE TABLE approvals (
    id TEXT PRIMARY KEY, 
    project_id TEXT REFERENCES projects(id), 
    task_id TEXT REFERENCES agent_tasks(id), 
    type TEXT NOT NULL, 
    title TEXT NOT NULL, 
    description TEXT, 
    evidence TEXT, 
    proposed_action TEXT, 
    risk_level TEXT DEFAULT 'low', 
    cost REAL DEFAULT 0, 
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','expired')), 
    decided_at TEXT, 
    decided_by TEXT, 
    notes TEXT, 
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE monitoring_events (
    id TEXT PRIMARY KEY, 
    project_id TEXT REFERENCES projects(id), 
    event_type TEXT NOT NULL, 
    entity_type TEXT, 
    entity_id TEXT, 
    old_value TEXT, 
    new_value TEXT, 
    severity TEXT DEFAULT 'info', 
    acknowledged INTEGER DEFAULT 0, 
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE providers (
    id TEXT PRIMARY KEY, 
    category TEXT NOT NULL, 
    name TEXT NOT NULL, 
    api_key_ref TEXT, 
    base_url TEXT, 
    is_configured INTEGER DEFAULT 0, 
    is_active INTEGER DEFAULT 0, 
    usage_count INTEGER DEFAULT 0, 
    last_used TEXT, 
    error_count INTEGER DEFAULT 0, 
    last_error TEXT, 
    settings TEXT, 
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE settings (
    key TEXT PRIMARY KEY, 
    value TEXT, 
    category TEXT DEFAULT 'general', 
    created_at TEXT DEFAULT (datetime('now')), 
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE browser_sessions (
    id TEXT PRIMARY KEY, 
    project_id TEXT REFERENCES projects(id), 
    status TEXT DEFAULT 'disconnected', 
    chrome_endpoint TEXT, 
    profile_name TEXT, 
    connected_at TEXT, 
    last_activity TEXT
);

CREATE TABLE browser_tasks (
    id TEXT PRIMARY KEY, 
    project_id TEXT REFERENCES projects(id), 
    agent_task_id TEXT REFERENCES agent_tasks(id), 
    url TEXT, 
    action_type TEXT NOT NULL, 
    action_data TEXT, 
    status TEXT DEFAULT 'pending', 
    result TEXT, 
    screenshot_path TEXT, 
    error_message TEXT, 
    started_at TEXT, 
    completed_at TEXT, 
    created_at TEXT DEFAULT (datetime('now'))
);

-- Additional Indexes
CREATE INDEX idx_pages_project_url ON pages(project_id, url, domain_id);
CREATE INDEX idx_opportunities_main ON opportunities(project_id, status, priority, type);
CREATE INDEX idx_agent_tasks_main ON agent_tasks(project_id, status, agent_type);
CREATE INDEX idx_agent_events_main ON agent_events(task_id, timestamp);
CREATE INDEX idx_monitoring_events_main ON monitoring_events(project_id, event_type, created_at);
