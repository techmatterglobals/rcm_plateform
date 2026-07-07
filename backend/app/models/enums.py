import enum


class RoleName(str, enum.Enum):
    ADMIN = "admin"
    SUPERVISOR = "supervisor"
    EMPLOYEE = "employee"


class MessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class AIProviderName(str, enum.Enum):
    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    GEMINI = "gemini"
    AUTO = "auto"


class DocumentStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class DocumentSource(str, enum.Enum):
    CHAT_UPLOAD = "chat_upload"
    DOCUMENT_ANALYZER = "document_analyzer"
    MEDICAL_RECORD_REVIEW = "medical_record_review"
    KNOWLEDGE_BASE = "knowledge_base"


class KBDocumentStatus(str, enum.Enum):
    PENDING = "pending"
    INDEXING = "indexing"
    INDEXED = "indexed"
    FAILED = "failed"


class PromptCategory(str, enum.Enum):
    MEDICAL_BILLING = "medical_billing"
    MEDICAL_CODING = "medical_coding"
    PRIOR_AUTHORIZATION = "prior_authorization"
    ELIGIBILITY = "eligibility"
    APPEALS = "appeals"
    DENIALS = "denials"
    GENERAL = "general"


class NotificationType(str, enum.Enum):
    DOCUMENT_ANALYSIS_COMPLETE = "document_analysis_complete"
    KB_INDEXING_COMPLETE = "kb_indexing_complete"
    ADMIN_ANNOUNCEMENT = "admin_announcement"
    SYSTEM_UPDATE = "system_update"


class SsoProvider(str, enum.Enum):
    GOOGLE = "google"
    MICROSOFT = "microsoft"
    NONE = "none"
