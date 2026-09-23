// ============================================================
// BacklinkForge — Shared Type Definitions
// All types match the database schema in migrations/001_initial_schema.sql
// ============================================================

// --- Enums ---

export type AutomationMode = 'manual' | 'assisted' | 'autonomous';

export type OpportunityType = 'link_gap' | 'broken_link' | 'resource_page' | 'unlinked_mention' | 'editorial';

export type OpportunityStatus =
  | 'discovered' | 'qualified' | 'approved' | 'in_progress'
  | 'contacted' | 'replied' | 'acquired' | 'verified'
  | 'rejected' | 'archived';

export type OpportunityPriority = 'high' | 'medium' | 'low' | 'reject';

export type AgentTaskStatus =
  | 'queued' | 'running' | 'waiting' | 'waiting_for_approval'
  | 'paused' | 'completed' | 'failed' | 'cancelled';

export type AgentType =
  | 'project_analyst' | 'site_discovery' | 'competitor_discovery'
  | 'competitor_intelligence' | 'backlink_discovery' | 'link_gap'
  | 'domain_discovery' | 'domain_qualification' | 'opportunity'
  | 'broken_link' | 'mention' | 'content_gap' | 'content_strategy'
  | 'contact_discovery' | 'outreach' | 'response_analysis'
  | 'browser' | 'backlink_verification' | 'monitoring'
  | 'competitor_watch' | 'site_audit' | 'internal_link'
  | 'keyword' | 'rank_tracking' | 'serp' | 'content_opportunity';

export type MessageStatus =
  | 'draft' | 'pending_approval' | 'approved' | 'sent'
  | 'delivered' | 'replied' | 'bounced' | 'failed';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export type BrowserSessionStatus = 'disconnected' | 'connected' | 'busy' | 'error';

export type BrowserTaskStatus = 'pending' | 'running' | 'waiting_for_user' | 'completed' | 'failed' | 'cancelled';

export type MonitoringSeverity = 'info' | 'warning' | 'error' | 'critical';

export type ProviderCategory = 'backlink' | 'keyword' | 'serp' | 'domain_metrics' | 'contact' | 'email' | 'llm' | 'browser';

// --- Core Entities ---

export interface Project {
  id: string;
  name: string;
  website_url: string | null;
  business_name: string | null;
  business_description: string | null;
  industry: string | null;
  country: string | null;
  language: string;
  target_audience: string | null;
  products_services: string | null;
  keywords: string | null;
  automation_mode: AutomationMode;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Domain {
  id: string;
  project_id: string;
  domain: string;
  title: string | null;
  description: string | null;
  country: string | null;
  language: string | null;
  relevance_score: number | null;
  authority_metric: number | null;
  authority_source: string | null;
  traffic_estimate: number | null;
  traffic_source: string | null;
  contact_available: number;
  opportunity_types: string | null;
  discovery_source: string | null;
  status: string;
  notes: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  project_id: string;
  domain_id: string | null;
  url: string;
  title: string | null;
  meta_description: string | null;
  h1: string | null;
  canonical_url: string | null;
  http_status: number | null;
  content_type: string | null;
  word_count: number | null;
  internal_links_count: number | null;
  external_links_count: number | null;
  depth: number;
  is_indexable: number;
  has_noindex: number;
  has_nofollow: number;
  structured_data: string | null;
  crawled_at: string | null;
  created_at: string;
}

export interface Competitor {
  id: string;
  project_id: string;
  domain: string;
  name: string | null;
  url: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface Backlink {
  id: string;
  project_id: string;
  source_url: string;
  source_domain: string;
  target_url: string;
  target_domain: string;
  anchor_text: string | null;
  link_type: string;
  is_dofollow: number;
  is_nofollow: number;
  is_sponsored: number;
  is_ugc: number;
  http_status: number | null;
  page_title: string | null;
  country: string | null;
  language: string | null;
  first_discovered: string;
  last_verified: string | null;
  link_context: string | null;
  link_position: string | null;
  is_redirect: number;
  redirect_url: string | null;
  provider: string | null;
  confidence: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BacklinkHistory {
  id: string;
  backlink_id: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
}

export interface ReferringDomain {
  id: string;
  project_id: string;
  domain: string;
  backlink_count: number;
  first_seen: string | null;
  last_seen: string | null;
  is_dofollow: number;
  authority_metric: number | null;
  authority_source: string | null;
  traffic_estimate: number | null;
  country: string | null;
  status: string;
  created_at: string;
}

export interface Opportunity {
  id: string;
  project_id: string;
  domain_id: string | null;
  type: OpportunityType;
  source_url: string | null;
  target_url: string | null;
  evidence: string | null;
  relevance_explanation: string | null;
  recommended_action: string | null;
  quality_signals: string | null;
  risk_signals: string | null;
  priority: OpportunityPriority;
  priority_reason: string | null;
  status: OpportunityStatus;
  contact_id: string | null;
  campaign_id: string | null;
  notes: string | null;
  tags: string | null;
  cost: number;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  project_id: string;
  domain: string | null;
  organization: string | null;
  name: string | null;
  role: string | null;
  email: string | null;
  contact_page_url: string | null;
  social_url: string | null;
  source: string;
  verified: number;
  notes: string | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  project_id: string;
  name: string;
  type: string | null;
  status: string;
  template: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  project_id: string;
  campaign_id: string | null;
  contact_id: string | null;
  opportunity_id: string | null;
  type: string;
  subject: string | null;
  body: string | null;
  status: MessageStatus;
  sent_at: string | null;
  replied_at: string | null;
  response_classification: string | null;
  created_at: string;
}

export interface AgentTask {
  id: string;
  project_id: string;
  agent_type: AgentType;
  objective: string;
  priority: number;
  dependencies: string | null;
  inputs: string | null;
  outputs: string | null;
  status: AgentTaskStatus;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  timeout_seconds: number;
  provider: string | null;
  cost: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentEvent {
  id: string;
  task_id: string;
  agent_type: string;
  event_type: string;
  message: string | null;
  data: string | null;
  timestamp: string;
}

export interface Approval {
  id: string;
  project_id: string;
  task_id: string | null;
  type: string;
  title: string;
  description: string | null;
  evidence: string | null;
  proposed_action: string | null;
  risk_level: string;
  cost: number;
  status: ApprovalStatus;
  decided_at: string | null;
  decided_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface MonitoringEvent {
  id: string;
  project_id: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  old_value: string | null;
  new_value: string | null;
  severity: MonitoringSeverity;
  acknowledged: number;
  created_at: string;
}

export interface Provider {
  id: string;
  category: ProviderCategory;
  name: string;
  api_key_ref: string | null;
  base_url: string | null;
  is_configured: number;
  is_active: number;
  usage_count: number;
  last_used: string | null;
  error_count: number;
  last_error: string | null;
  settings: string | null;
  created_at: string;
}

export interface Setting {
  key: string;
  value: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface BrowserSession {
  id: string;
  project_id: string;
  status: BrowserSessionStatus;
  chrome_endpoint: string | null;
  profile_name: string | null;
  connected_at: string | null;
  last_activity: string | null;
}

export interface BrowserTask {
  id: string;
  project_id: string;
  agent_task_id: string | null;
  url: string | null;
  action_type: string;
  action_data: string | null;
  status: BrowserTaskStatus;
  result: string | null;
  screenshot_path: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

// --- Query Types ---

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FilterOptions {
  field: string;
  operator: 'eq' | 'ne' | 'like' | 'gt' | 'lt' | 'in';
  value: unknown;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QueryOptions {
  page?: number;
  pageSize?: number;
  filters?: FilterOptions[];
  sort?: SortOptions;
  search?: string;
}

// --- Dashboard Stats ---

export interface DashboardStats {
  totalProjects: number;
  totalBacklinks: number;
  totalReferringDomains: number;
  totalOpportunities: number;
  highPriorityOpportunities: number;
  activeTasks: number;
  pendingApprovals: number;
  recentEvents: MonitoringEvent[];
}

// --- API Response Types ---

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// --- Create/Update DTOs ---

export type CreateProject = Omit<Project, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type UpdateProject = Partial<Omit<Project, 'id' | 'created_at'>>;

export type CreateBacklink = Omit<Backlink, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type CreateOpportunity = Omit<Opportunity, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type CreateCompetitor = Omit<Competitor, 'id' | 'created_at'> & { id?: string };
export type CreateDomain = Omit<Domain, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type CreateContact = Omit<Contact, 'id' | 'created_at'> & { id?: string };
export type CreateAgentTask = Omit<AgentTask, 'id' | 'created_at' | 'updated_at'> & { id?: string };

// --- Submission & Asset Distribution Subsystem ---

export type SubmissionTargetType =
  | 'business_profile'
  | 'industry_directory'
  | 'local_directory'
  | 'resource_directory'
  | 'document_sharing'
  | 'presentation'
  | 'organization_listing'
  | 'tool_listing';

export type SubmissionQualificationStatus =
  | 'pending'
  | 'qualified'
  | 'high_priority'
  | 'medium_priority'
  | 'low_priority'
  | 'rejected';

export type SubmissionStatus =
  | 'discovered'
  | 'qualified'
  | 'prepared'
  | 'waiting_approval'
  | 'approved'
  | 'in_progress'
  | 'submitted'
  | 'published'
  | 'rejected'
  | 'failed';

export type SubmissionAttemptStatus =
  | 'pending'
  | 'filling_form'
  | 'waiting_human_action'
  | 'submitted'
  | 'failed'
  | 'cancelled';

export type SubmissionVerificationStatus =
  | 'published_link_found'
  | 'published_no_link'
  | 'pending_approval'
  | 'rejected'
  | 'removed'
  | 'unable_to_verify';

export type DocumentAssetType =
  | 'pdf_guide'
  | 'whitepaper'
  | 'research_report'
  | 'case_study'
  | 'statistics_report'
  | 'manual'
  | 'checklist'
  | 'technical_doc';

export type SubmissionCampaignType =
  | 'business_directory'
  | 'industry_profile'
  | 'local_citation'
  | 'pdf_distribution'
  | 'resource_library';

export type SubmissionAutomationPolicy =
  | 'research_only'
  | 'prepare_only'
  | 'ask_approval'
  | 'authorized_submission';

export interface BusinessProfile {
  id: string;
  project_id: string;
  business_name: string;
  website_url: string;
  tag_line: string | null;
  short_description: string | null;
  long_description: string | null;
  industry: string | null;
  categories: string | null; // JSON array
  services: string | null; // JSON array
  products: string | null; // JSON array
  country: string | null;
  city: string | null;
  state_region: string | null;
  postal_code: string | null;
  address: string | null;
  phone: string | null;
  public_email: string | null;
  founded_year: number | null;
  business_hours: string | null;
  logo_url: string | null;
  images: string | null; // JSON array
  social_profiles: string | null; // JSON object
  keywords: string | null; // JSON array
  created_at: string;
  updated_at: string;
}

export interface DocumentAsset {
  id: string;
  project_id: string;
  title: string;
  asset_type: DocumentAssetType;
  file_path: string | null;
  file_name: string | null;
  file_hash: string | null;
  file_size: number | null;
  author: string | null;
  organization: string | null;
  website_url: string | null;
  summary: string | null;
  citations_count: number;
  urls_detected: string | null; // JSON array
  quality_score: number;
  quality_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionCampaign {
  id: string;
  project_id: string;
  name: string;
  campaign_type: SubmissionCampaignType;
  target_country: string | null;
  target_niche: string | null;
  status: 'draft' | 'active' | 'paused' | 'completed';
  automation_policy: SubmissionAutomationPolicy;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionTarget {
  id: string;
  project_id: string;
  campaign_id: string | null;
  platform_name: string;
  domain: string;
  submission_url: string;
  target_type: SubmissionTargetType;
  accepted_asset_types: string | null; // JSON array
  country: string | null;
  language: string | null;
  topical_relevance: number;
  quality_signals: string | null; // JSON
  spam_risk_signals: string | null; // JSON
  qualification_status: SubmissionQualificationStatus;
  qualification_reason: string | null;
  allows_links: number;
  estimated_link_type: 'follow' | 'nofollow' | 'ugc' | 'sponsored' | 'unknown';
  requirements: string | null; // JSON
  discovery_source: string | null;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
}

export interface SubmissionAttempt {
  id: string;
  target_id: string;
  project_id: string;
  profile_id: string | null;
  asset_id: string | null;
  attempt_number: number;
  mode: string;
  status: SubmissionAttemptStatus;
  human_action_reason: string | null;
  submitted_data: string | null; // JSON
  submission_response: string | null;
  public_url: string | null;
  screenshot_path: string | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface SubmissionVerification {
  id: string;
  target_id: string;
  project_id: string;
  listing_url: string;
  status: SubmissionVerificationStatus;
  http_status: number | null;
  link_detected: number;
  target_url_found: string | null;
  anchor_text: string | null;
  rel_attribute: string | null;
  is_dofollow: number;
  last_checked_at: string;
  verification_notes: string | null;
  created_at: string;
}

export interface SubmissionCenterStats {
  targetsDiscovered: number;
  qualified: number;
  rejected: number;
  pendingApproval: number;
  submitted: number;
  published: number;
  linksFound: number;
  linksMissing: number;
  failed: number;
  needsHumanAction: number;
}

export type CreateBusinessProfile = Omit<BusinessProfile, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type CreateDocumentAsset = Omit<DocumentAsset, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type CreateSubmissionCampaign = Omit<SubmissionCampaign, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type CreateSubmissionTarget = Omit<SubmissionTarget, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type CreateSubmissionAttempt = Omit<SubmissionAttempt, 'id' | 'started_at'> & { id?: string };
export type CreateSubmissionVerification = Omit<SubmissionVerification, 'id' | 'created_at'> & { id?: string };
