-- 002_submissions_and_assets.sql
-- Submissions, Business Profiles, Document/PDF Distribution Engine

CREATE TABLE IF NOT EXISTS business_profiles (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    website_url TEXT NOT NULL,
    tag_line TEXT,
    short_description TEXT,
    long_description TEXT,
    industry TEXT,
    categories TEXT, -- JSON array of category names
    services TEXT, -- JSON array
    products TEXT, -- JSON array
    country TEXT,
    city TEXT,
    state_region TEXT,
    postal_code TEXT,
    address TEXT,
    phone TEXT,
    public_email TEXT,
    founded_year INTEGER,
    business_hours TEXT,
    logo_url TEXT,
    images TEXT, -- JSON array
    social_profiles TEXT, -- JSON object: { linkedin, twitter, facebook, github, crunchbase }
    keywords TEXT, -- JSON array
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_business_profiles_project ON business_profiles(project_id);

CREATE TABLE IF NOT EXISTS document_assets (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    asset_type TEXT NOT NULL CHECK(asset_type IN ('pdf_guide','whitepaper','research_report','case_study','statistics_report','manual','checklist','technical_doc')),
    file_path TEXT,
    file_name TEXT,
    file_hash TEXT, -- SHA-256 for duplicate detection
    file_size INTEGER,
    author TEXT,
    organization TEXT,
    website_url TEXT,
    summary TEXT,
    citations_count INTEGER DEFAULT 0,
    urls_detected TEXT, -- JSON array of URLs inside doc
    quality_score REAL DEFAULT 0.0,
    quality_notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_document_assets_project ON document_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_document_assets_hash ON document_assets(file_hash);

CREATE TABLE IF NOT EXISTS submission_campaigns (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    campaign_type TEXT NOT NULL CHECK(campaign_type IN ('business_directory','industry_profile','local_citation','pdf_distribution','resource_library')),
    target_country TEXT,
    target_niche TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('draft','active','paused','completed')),
    automation_policy TEXT DEFAULT 'ask_approval' CHECK(automation_policy IN ('research_only','prepare_only','ask_approval','authorized_submission')),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_submission_campaigns_project ON submission_campaigns(project_id);

CREATE TABLE IF NOT EXISTS submission_targets (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    campaign_id TEXT REFERENCES submission_campaigns(id) ON DELETE SET NULL,
    platform_name TEXT NOT NULL,
    domain TEXT NOT NULL,
    submission_url TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK(target_type IN ('business_profile','industry_directory','local_directory','resource_directory','document_sharing','presentation','organization_listing','tool_listing')),
    accepted_asset_types TEXT, -- JSON array
    country TEXT,
    language TEXT,
    topical_relevance REAL DEFAULT 0.0,
    quality_signals TEXT, -- JSON object
    spam_risk_signals TEXT, -- JSON object
    qualification_status TEXT DEFAULT 'pending' CHECK(qualification_status IN ('pending','qualified','high_priority','medium_priority','low_priority','rejected')),
    qualification_reason TEXT,
    allows_links INTEGER DEFAULT 1,
    estimated_link_type TEXT DEFAULT 'unknown' CHECK(estimated_link_type IN ('follow','nofollow','ugc','sponsored','unknown')),
    requirements TEXT, -- JSON object
    discovery_source TEXT,
    status TEXT DEFAULT 'discovered' CHECK(status IN ('discovered','qualified','prepared','waiting_approval','approved','in_progress','submitted','published','rejected','failed')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(project_id, domain, submission_url)
);

CREATE INDEX IF NOT EXISTS idx_submission_targets_project ON submission_targets(project_id, status);
CREATE INDEX IF NOT EXISTS idx_submission_targets_qualification ON submission_targets(project_id, qualification_status);

CREATE TABLE IF NOT EXISTS submission_attempts (
    id TEXT PRIMARY KEY,
    target_id TEXT NOT NULL REFERENCES submission_targets(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    profile_id TEXT REFERENCES business_profiles(id) ON DELETE SET NULL,
    asset_id TEXT REFERENCES document_assets(id) ON DELETE SET NULL,
    attempt_number INTEGER DEFAULT 1,
    mode TEXT DEFAULT 'browser_assisted',
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','filling_form','waiting_human_action','submitted','failed','cancelled')),
    human_action_reason TEXT,
    submitted_data TEXT, -- JSON
    submission_response TEXT,
    public_url TEXT,
    screenshot_path TEXT,
    error_message TEXT,
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_submission_attempts_target ON submission_attempts(target_id);
CREATE INDEX IF NOT EXISTS idx_submission_attempts_project ON submission_attempts(project_id, status);

CREATE TABLE IF NOT EXISTS submission_verifications (
    id TEXT PRIMARY KEY,
    target_id TEXT NOT NULL REFERENCES submission_targets(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    listing_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('published_link_found','published_no_link','pending_approval','rejected','removed','unable_to_verify')),
    http_status INTEGER,
    link_detected INTEGER DEFAULT 0,
    target_url_found TEXT,
    anchor_text TEXT,
    rel_attribute TEXT,
    is_dofollow INTEGER DEFAULT 0,
    last_checked_at TEXT DEFAULT (datetime('now')),
    verification_notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_submission_verifications_target ON submission_verifications(target_id);
CREATE INDEX IF NOT EXISTS idx_submission_verifications_project ON submission_verifications(project_id, status);
