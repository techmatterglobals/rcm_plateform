"""Idempotent seed data: permissions, roles, the first admin user, assistants, provider
configs, feature flags, and default system settings. Safe to re-run — every insert is
upsert-by-unique-key.

Usage: python -m app.db.seed
"""

import asyncio
import os

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.ai_provider import AIProviderConfig
from app.models.assistant import Assistant
from app.models.enums import RoleName
from app.models.settings import FeatureFlag, SystemSetting
from app.models.user import Permission, Role, User

PERMISSIONS = [
    ("users.manage", "Create, edit, deactivate users and manage roles"),
    ("providers.manage", "Configure AI provider API keys and models"),
    ("prompts.manage", "Create and manage shared prompt templates"),
    ("knowledge_base.manage", "Upload, reindex, and delete knowledge base documents"),
    ("analytics.view", "View platform analytics dashboards"),
    ("audit_logs.view", "View audit logs"),
    ("permissions.manage", "Manage roles and permission assignments"),
    ("team_activity.view", "View team conversation activity (supervisor)"),
    ("conversations.review", "Review other users' conversations"),
    ("reports.view", "Access supervisor reports"),
    ("assistants.use", "Use AI assistants and chat"),
    ("files.upload", "Upload files to chat, knowledge base, or document analyzer"),
    ("knowledge_base.search", "Search the knowledge base"),
    ("conversations.save", "Save and manage own conversations"),
]

ROLE_PERMISSIONS = {
    RoleName.ADMIN: [code for code, _ in PERMISSIONS],
    RoleName.SUPERVISOR: [
        "team_activity.view",
        "conversations.review",
        "reports.view",
        "analytics.view",
        "assistants.use",
        "files.upload",
        "knowledge_base.search",
        "conversations.save",
    ],
    RoleName.EMPLOYEE: [
        "assistants.use",
        "files.upload",
        "knowledge_base.search",
        "conversations.save",
    ],
}

ASSISTANTS = [
    {
        "slug": "ai-chat",
        "name": "AI Chat",
        "category": "general",
        "icon": "message-circle",
        "description": "General-purpose AI assistant for medical billing and RCM operations.",
        "system_prompt": (
            "You are the RCM AI Platform general assistant. Help employees with medical "
            "billing, coding, eligibility, prior authorization, denials, and appeals questions. "
            "Stay strictly within RCM/healthcare administration topics."
        ),
        "capabilities": ["General Q&A", "Drafting", "Summarization", "Multi-turn context"],
        "suggested_prompts": [
            "Explain the difference between a hard and soft denial",
            "What's the timely filing limit for Medicare Part B?",
        ],
        "requires_kb": True,
        "sort_order": 0,
    },
    {
        "slug": "medical-coding",
        "name": "Medical Coding",
        "category": "medical_coding",
        "icon": "hash",
        "description": "ICD-10, CPT, HCPCS, modifier, DRG, and HCC coding guidance with confidence scoring.",
        "system_prompt": (
            "You are a certified medical coding assistant. Provide ICD-10, CPT, HCPCS, and "
            "modifier guidance, review documentation for coding validity and medical "
            "necessity, explain DRG and HCC implications, and cite official coding "
            "guidelines. Always end substantive coding recommendations with a confidence "
            "score (High/Medium/Low) and your reasoning."
        ),
        "capabilities": [
            "ICD-10 guidance", "CPT guidance", "HCPCS guidance", "Modifier recommendations",
            "Documentation review", "Coding validation", "Medical necessity guidance",
            "DRG guidance", "HCC guidance", "Confidence scoring",
        ],
        "suggested_prompts": [
            "Suggest ICD-10 codes for this progress note",
            "Is modifier -25 appropriate for this E/M + procedure combination?",
        ],
        "requires_kb": True,
        "supports_confidence_score": True,
        "sort_order": 1,
    },
    {
        "slug": "medical-billing",
        "name": "Medical Billing",
        "category": "medical_billing",
        "icon": "receipt",
        "description": "Claim review, payment posting, EOB/ERA explanation, and denial prevention.",
        "system_prompt": (
            "You are a medical billing assistant. Help with claim review, payment posting, "
            "timely filing, coordination of benefits, claim correction and rebilling, patient "
            "balance explanations, and EOB/ERA interpretation. Proactively flag denial risk."
        ),
        "capabilities": [
            "Claim review", "Payment posting guidance", "Timely filing guidance",
            "Insurance questions", "Coordination of Benefits", "Claim correction",
            "Rebilling guidance", "Patient balance explanation", "EOB explanation",
            "ERA explanation", "Denial prevention",
        ],
        "suggested_prompts": [
            "Walk me through this EOB",
            "Why might this claim be at risk of denial before submission?",
        ],
        "requires_kb": True,
        "sort_order": 2,
    },
    {
        "slug": "eligibility-vob",
        "name": "Eligibility & VOB",
        "category": "eligibility",
        "icon": "shield-check",
        "description": "Coverage, deductible, coinsurance, copay, network, and authorization explanations.",
        "system_prompt": (
            "You are an eligibility and verification of benefits (VOB) assistant. Explain "
            "coverage, deductibles, coinsurance, copays, network status, referral and "
            "authorization requirements, and general insurance terminology clearly."
        ),
        "capabilities": [
            "Coverage explanation", "Deductible", "Coinsurance", "Copay",
            "Network verification", "Referral requirements", "Authorization requirements",
            "Insurance terminology", "Benefits explanation",
        ],
        "suggested_prompts": ["Explain this patient's deductible and coinsurance", "Does this plan require a referral?"],
        "requires_kb": True,
        "sort_order": 3,
    },
    {
        "slug": "prior-authorization",
        "name": "Prior Authorization",
        "category": "prior_authorization",
        "icon": "clipboard-check",
        "description": "Required documentation, submission checklists, and authorization workflow guidance.",
        "system_prompt": (
            "You are a prior authorization assistant. Identify required documentation, build "
            "submission checklists, review clinical documentation for completeness, flag "
            "missing documentation, and explain the authorization workflow and appeal options."
        ),
        "capabilities": [
            "Required documentation", "Submission checklist", "Clinical documentation review",
            "Missing documentation detection", "Authorization workflow", "Appeal recommendations",
        ],
        "suggested_prompts": ["Build a PA submission checklist for this procedure", "What's missing from this clinical documentation?"],
        "requires_kb": True,
        "sort_order": 4,
    },
    {
        "slug": "denial-management",
        "name": "Denial Management",
        "category": "denial_management",
        "icon": "alert-triangle",
        "description": "CARC/RARC explanation, root cause analysis, and appeal strategy recommendations.",
        "system_prompt": (
            "You are a denial management assistant. Analyze denials, explain CARC and RARC "
            "codes, determine root cause, recommend next actions and appeal strategy, list "
            "supporting documents needed, and suggest preventive measures."
        ),
        "capabilities": [
            "Analyze denial", "Explain CARC codes", "Explain RARC codes",
            "Determine root cause", "Recommend next actions", "Suggest appeal strategy",
            "Recommend supporting documents", "Suggest preventive measures",
        ],
        "suggested_prompts": ["Explain CARC 197 and how to prevent it", "What's the root cause of this denial and how do I appeal it?"],
        "requires_kb": True,
        "sort_order": 5,
    },
    {
        "slug": "appeal-generator",
        "name": "Appeal Generator",
        "category": "appeals",
        "icon": "file-edit",
        "description": "Draft appeal letters, medical necessity letters, and reconsideration requests.",
        "system_prompt": (
            "You are an appeal letter generator. Draft professional, well-structured appeal "
            "letters, medical necessity letters, reconsideration letters, and provider "
            "communications tailored to the payer and denial reason provided. Use a formal "
            "business letter format ready to export."
        ),
        "capabilities": ["Appeal letters", "Medical necessity letters", "Reconsideration letters", "Provider communication"],
        "suggested_prompts": ["Draft a medical necessity appeal letter for this denial", "Write a reconsideration request for this claim"],
        "requires_kb": True,
        "sort_order": 6,
    },
    {
        "slug": "medical-record-review",
        "name": "Medical Record Review",
        "category": "medical_record_review",
        "icon": "file-text",
        "description": "Summarize records, flag missing documentation, and highlight coding opportunities.",
        "system_prompt": (
            "You are a medical record review assistant. Summarize operative reports, progress "
            "notes, and clinical documentation; highlight missing documentation; suggest "
            "coding improvements; find inconsistencies; and highlight important diagnoses. "
            "Mask any PHI in your summaries."
        ),
        "capabilities": ["Summarize", "Highlight missing documentation", "Suggest coding improvements", "Find inconsistencies", "Highlight important diagnoses"],
        "suggested_prompts": ["Summarize this operative report and flag missing documentation"],
        "requires_kb": False,
        "sort_order": 7,
    },
    {
        "slug": "document-analyzer",
        "name": "Document Analyzer",
        "category": "document_analysis",
        "icon": "scan-search",
        "description": "Extract structured data from EOBs, ERAs, insurance cards, and authorization letters.",
        "system_prompt": (
            "You are a document analysis assistant. Extract key data, dates, diagnosis and "
            "procedure codes, and insurance details from uploaded documents. Mask patient "
            "identifiers. Summarize the document and list key follow-up actions."
        ),
        "capabilities": ["Data extraction", "Date extraction", "Masked patient identifiers", "Diagnosis extraction", "Procedure extraction", "Insurance detail extraction", "Summary", "Key actions"],
        "suggested_prompts": ["Extract the key details from this EOB"],
        "requires_kb": False,
        "sort_order": 8,
    },
]

FEATURE_FLAGS = [
    ("global_search", "Global Search", "Enable the cross-module global search bar", True),
    ("prompt_library_sharing", "Prompt Library Sharing", "Allow employees to share prompt templates platform-wide", True),
    ("document_analyzer_vision", "Document Analyzer Vision", "Use vision-capable models for image document analysis", True),
    ("conversation_export", "Conversation Export", "Allow exporting conversations to PDF/Markdown", True),
]

SYSTEM_SETTINGS = [
    ("phi_block_on_detection", {"enabled": True}, "Block sending prompts with detected PHI unless approved"),
    ("conversation_retention_days", {"days": 365}, "Days to retain non-pinned conversations before deletion"),
    ("session_idle_timeout_minutes", {"minutes": 30}, "Idle session timeout before forced re-authentication"),
]


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        permission_by_code: dict[str, Permission] = {}
        for code, description in PERMISSIONS:
            result = await db.execute(select(Permission).where(Permission.code == code))
            permission = result.scalar_one_or_none()
            if permission is None:
                permission = Permission(code=code, description=description)
                db.add(permission)
            permission_by_code[code] = permission
        await db.flush()

        role_by_name: dict[str, Role] = {}
        for role_name, codes in ROLE_PERMISSIONS.items():
            result = await db.execute(select(Role).where(Role.name == role_name.value))
            role = result.scalar_one_or_none()
            if role is None:
                role = Role(name=role_name.value, description=f"{role_name.value.title()} role", is_system=True)
                db.add(role)
            role.permissions = [permission_by_code[c] for c in codes]
            role_by_name[role_name.value] = role
        await db.flush()

        admin_email = os.environ.get("SEED_ADMIN_EMAIL", "admin@techmatter.co")
        admin_password = os.environ.get("SEED_ADMIN_PASSWORD", "ChangeMe123!")
        result = await db.execute(select(User).where(User.email == admin_email))
        if result.scalar_one_or_none() is None:
            db.add(
                User(
                    email=admin_email,
                    full_name="Platform Admin",
                    hashed_password=hash_password(admin_password),
                    role_id=role_by_name[RoleName.ADMIN.value].id,
                )
            )

        for data in ASSISTANTS:
            result = await db.execute(select(Assistant).where(Assistant.slug == data["slug"]))
            if result.scalar_one_or_none() is None:
                db.add(Assistant(**data))

        provider_defaults = [
            ("anthropic", "Anthropic Claude", "claude-sonnet-5", ["claude-sonnet-5", "claude-opus-4-8", "claude-haiku-4-5"]),
            ("openai", "OpenAI GPT", "gpt-4.1", ["gpt-4.1", "gpt-4.1-mini", "o3"]),
            ("gemini", "Google Gemini", "gemini-2.0-pro", ["gemini-2.0-pro", "gemini-2.0-flash"]),
        ]
        for provider, display_name, default_model, models in provider_defaults:
            result = await db.execute(select(AIProviderConfig).where(AIProviderConfig.provider == provider))
            if result.scalar_one_or_none() is None:
                db.add(
                    AIProviderConfig(
                        provider=provider,
                        display_name=display_name,
                        default_model=default_model,
                        available_models=models,
                        is_default=(provider == "anthropic"),
                    )
                )

        for key, name, description, enabled in FEATURE_FLAGS:
            result = await db.execute(select(FeatureFlag).where(FeatureFlag.key == key))
            if result.scalar_one_or_none() is None:
                db.add(FeatureFlag(key=key, name=name, description=description, is_enabled=enabled))

        for key, value, description in SYSTEM_SETTINGS:
            result = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
            if result.scalar_one_or_none() is None:
                db.add(SystemSetting(key=key, value=value, description=description))

        await db.commit()
        print(f"Seed complete. Admin login: {admin_email} / {admin_password}")


if __name__ == "__main__":
    asyncio.run(seed())
