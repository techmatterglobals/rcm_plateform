"use client";

import { useMemo, useState } from "react";
import { LibraryIcon, PlusIcon, SearchIcon } from "lucide-react";

import { PromptCard } from "@/components/prompts/prompt-card";
import { PromptFormDialog } from "@/components/prompts/prompt-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePrompts } from "@/hooks/use-prompts";
import type { PromptTemplate } from "@/lib/types";

const CATEGORIES = [
  { value: "medical_billing", label: "Medical Billing" },
  { value: "medical_coding", label: "Medical Coding" },
  { value: "prior_authorization", label: "Prior Authorization" },
  { value: "eligibility", label: "Eligibility" },
  { value: "appeals", label: "Appeals" },
  { value: "denials", label: "Denials" },
  { value: "general", label: "General" },
];

export default function PromptLibraryPage() {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<{ open: boolean; prompt?: PromptTemplate }>({ open: false });

  const { data: prompts = [], isLoading } = usePrompts({
    category: category === "all" ? undefined : category,
    search: search.trim() || undefined,
  });

  const sorted = useMemo(() => [...prompts].sort((a, b) => b.usage_count - a.usage_count), [prompts]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <LibraryIcon className="size-5 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">Prompt Library</h1>
              <p className="text-sm text-muted-foreground">
                Launch ready-made prompts or create your own reusable templates.
              </p>
            </div>
          </div>
          <Button onClick={() => setDialog({ open: true, prompt: undefined })}>
            <PlusIcon className="size-4" /> New prompt
          </Button>
        </div>

        <div className="mb-6 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts…"
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-48">
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

        {isLoading && <p className="py-10 text-center text-sm text-muted-foreground">Loading prompts…</p>}

        {!isLoading && sorted.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No prompts found. Create the first one.</p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {sorted.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} onEdit={(p) => setDialog({ open: true, prompt: p })} />
          ))}
        </div>

        <PromptFormDialog
          open={dialog.open}
          onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}
          prompt={dialog.prompt}
        />
      </div>
    </div>
  );
}
