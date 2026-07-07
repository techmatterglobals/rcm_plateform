"use client";

import { SparklesIcon } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AIProvider } from "@/lib/types";

const PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "anthropic", label: "Claude" },
  { value: "openai", label: "GPT" },
  { value: "gemini", label: "Gemini" },
];

export function ProviderSelector({
  value,
  onChange,
}: {
  value: AIProvider;
  onChange: (value: AIProvider) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as AIProvider)}>
      <SelectTrigger size="sm" className="h-8 gap-1.5 border-none bg-muted/70 text-xs font-medium shadow-none">
        <SparklesIcon className="size-3.5 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start">
        {PROVIDERS.map((p) => (
          <SelectItem key={p.value} value={p.value}>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
