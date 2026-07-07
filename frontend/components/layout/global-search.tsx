"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useGlobalSearch } from "@/hooks/use-search";

const GROUPS: { key: keyof ReturnType<typeof emptyResults>; label: string }[] = [
  { key: "conversations", label: "Conversations" },
  { key: "knowledge_base", label: "Knowledge Base" },
  { key: "prompts", label: "Prompt Library" },
  { key: "documents", label: "Documents" },
  { key: "users", label: "Users" },
];

function emptyResults() {
  return { conversations: [], knowledge_base: [], prompts: [], documents: [], users: [] };
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { data: results } = useGlobalSearch(query);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const data = results ?? emptyResults();
  const hasResults = GROUPS.some((g) => data[g.key]?.length);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-8 w-64 items-center gap-2 rounded-lg border border-border bg-muted/50 px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
      >
        <SearchIcon className="size-3.5" />
        <span className="flex-1 text-left">Search everything…</span>
        <kbd className="rounded border border-border bg-background px-1 font-mono text-[10px]">⌘K</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search conversations, knowledge base, prompts, documents…" value={query} onValueChange={setQuery} />
        <CommandList>
          {!hasResults && <CommandEmpty>{query.length > 1 ? "No results found." : "Type to search."}</CommandEmpty>}
          {GROUPS.map((group) => {
            const items = data[group.key] ?? [];
            if (!items.length) return null;
            return (
              <CommandGroup key={group.key} heading={group.label}>
                {items.map((item) => (
                  <CommandItem
                    key={`${item.type}-${item.id}`}
                    value={item.title}
                    onSelect={() => {
                      setOpen(false);
                      router.push(item.url);
                    }}
                  >
                    <span className="truncate">{item.title}</span>
                    {item.snippet && <span className="ml-auto truncate text-xs text-muted-foreground">{item.snippet}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
