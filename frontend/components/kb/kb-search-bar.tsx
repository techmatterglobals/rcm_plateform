"use client";

import { useState } from "react";
import { FileSearchIcon, Loader2Icon, SearchIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchKB } from "@/hooks/use-kb";

const CATEGORIES = [
  { value: "medical_billing", label: "Medical Billing" },
  { value: "medical_coding", label: "Medical Coding" },
  { value: "prior_authorization", label: "Prior Authorization" },
  { value: "eligibility", label: "Eligibility" },
  { value: "appeals", label: "Appeals" },
  { value: "denials", label: "Denials" },
  { value: "general", label: "General" },
];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

export function KBSearchBar() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const search = useSearchKB();

  const handleSearch = () => {
    if (!query.trim()) return;
    search.mutate({ query: query.trim(), category: category === "all" ? undefined : category });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            placeholder="Search policies, SOPs, payer guidelines, FAQs…"
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
        <Button onClick={handleSearch} disabled={search.isPending || !query.trim()}>
          {search.isPending ? <Loader2Icon className="size-4 animate-spin" /> : <SearchIcon className="size-4" />}
          Search
        </Button>
      </div>

      {search.isPending && <p className="text-sm text-muted-foreground">Searching knowledge base…</p>}

      {search.isSuccess && (
        <div className="flex flex-col gap-2">
          {search.data.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No matching results. Try different terms.</p>
          ) : (
            search.data.map((result, idx) => (
              <Card key={`${result.kb_document_id}-${idx}`}>
                <CardContent className="flex flex-col gap-1.5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <FileSearchIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-medium">{result.title}</span>
                    <Badge variant="outline">{CATEGORY_LABELS[result.category] ?? result.category}</Badge>
                    {result.page_number !== null && <Badge variant="secondary">Page {result.page_number}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{result.snippet}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
