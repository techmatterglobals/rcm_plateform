export type RoleName = "admin" | "supervisor" | "employee";

export interface Role {
  id: string;
  name: string;
  description: string;
}

export interface Permission {
  id: string;
  code: string;
  description: string;
}

export interface RoleDetail extends Role {
  permissions: Permission[];
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  department: string | null;
  title: string | null;
  role: Role;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface Assistant {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  capabilities: string[];
  suggested_prompts: string[];
  requires_kb: boolean;
  supports_file_upload: boolean;
  supports_confidence_score: boolean;
  is_active: boolean;
  sort_order: number;
}

export type AIProvider = "anthropic" | "openai" | "gemini" | "auto";

export interface Citation {
  kb_document_id: string;
  title: string;
  page_number: number | null;
  snippet: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  provider: AIProvider | null;
  model: string | null;
  citations: Citation[] | null;
  attachment_ids: string[] | null;
  phi_detected: boolean;
  was_blocked: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  assistant_id: string | null;
  title: string;
  provider: AIProvider;
  model: string | null;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export type DocumentSource =
  | "chat_upload"
  | "document_analyzer"
  | "medical_record_review"
  | "knowledge_base";

export type DocumentStatus = "uploaded" | "processing" | "completed" | "failed";

export interface AppDocument {
  id: string;
  owner_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  source: DocumentSource;
  status: DocumentStatus;
  extracted_summary: string | null;
  extracted_data: Record<string, unknown> | null;
  phi_detected: boolean;
  phi_types: string[] | null;
  error_message: string | null;
  created_at: string;
}

export type KBDocumentStatus = "pending" | "indexing" | "indexed" | "failed";

export interface KBDocument {
  id: string;
  title: string;
  category: string;
  mime_type: string;
  size_bytes: number;
  status: KBDocumentStatus;
  version: number;
  chunk_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface KBSearchResult {
  kb_document_id: string;
  title: string;
  category: string;
  page_number: number | null;
  snippet: string;
  score: number;
}

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  created_by: string | null;
  is_shared: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface UsageSeriesPoint {
  date: string;
  count: number;
}

export interface TopItem {
  label: string;
  value: number;
}

export interface AnalyticsOverview {
  daily_usage: UsageSeriesPoint[];
  monthly_usage: UsageSeriesPoint[];
  most_used_assistants: TopItem[];
  most_used_prompts: TopItem[];
  average_response_time_ms: number;
  average_conversation_length: number;
  estimated_time_saved_hours: number;
  estimated_api_cost_usd: number;
  top_active_users: TopItem[];
  knowledge_base_searches: number;
  document_uploads: number;
  total_conversations: number;
  total_messages: number;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  extra: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface AIProviderConfig {
  id: string;
  provider: AIProvider;
  display_name: string;
  default_model: string;
  available_models: string[];
  is_enabled: boolean;
  is_default: boolean;
  priority: number;
  data_retention_days: number;
  has_api_key: boolean;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  is_enabled: boolean;
}

export interface SystemSetting {
  key: string;
  value: Record<string, unknown>;
  description: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
}

export interface SearchResultItem {
  type: string;
  id: string;
  title: string;
  snippet: string;
  url: string;
}

export interface SearchResults {
  conversations: SearchResultItem[];
  knowledge_base: SearchResultItem[];
  prompts: SearchResultItem[];
  documents: SearchResultItem[];
  users: SearchResultItem[];
}

export type ChatStreamEvent =
  | { type: "delta"; content: string }
  | { type: "done"; conversation_id: string; message_id: string; citations: Citation[]; model: string | null }
  | { type: "error"; message: string }
  | { type: "blocked"; reason: string; phi_types: string[]; message: string };
