"use client";

import { useState } from "react";
import { BookOpenIcon } from "lucide-react";

import { KBDocumentList } from "@/components/kb/kb-document-list";
import { KBSearchBar } from "@/components/kb/kb-search-bar";
import { KBUploadDialog } from "@/components/kb/kb-upload-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";

const CATEGORIES = [
  { value: "medical_billing", label: "Medical Billing" },
  { value: "medical_coding", label: "Medical Coding" },
  { value: "prior_authorization", label: "Prior Authorization" },
  { value: "eligibility", label: "Eligibility" },
  { value: "appeals", label: "Appeals" },
  { value: "denials", label: "Denials" },
  { value: "general", label: "General" },
];

export default function KnowledgeBasePage() {
  const { user } = useAuth();
  const isAdmin = user?.role.name === "admin";
  const [category, setCategory] = useState("all");

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center gap-2.5">
          <BookOpenIcon className="size-5 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">Knowledge Base</h1>
            <p className="text-sm text-muted-foreground">
              Search policies, SOPs, training manuals, payer guidelines, and FAQs with cited answers.
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-border bg-card p-5 shadow-sm">
          <KBSearchBar />
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Category</span>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isAdmin && <KBUploadDialog />}
        </div>

        <KBDocumentList category={category} />
      </div>
    </div>
  );
}
