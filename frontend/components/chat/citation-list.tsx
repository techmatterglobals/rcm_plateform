"use client";

import { FileTextIcon } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Citation } from "@/lib/types";

export function CitationList({ citations }: { citations: Citation[] }) {
  if (!citations.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {citations.map((citation, index) => (
        <Popover key={`${citation.kb_document_id}-${index}`}>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <FileTextIcon className="size-3" />
              [{index + 1}] {citation.title}
              {citation.page_number ? ` · p.${citation.page_number}` : ""}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 text-sm">
            <p className="mb-1 font-medium">{citation.title}</p>
            {citation.page_number && <p className="mb-2 text-xs text-muted-foreground">Page {citation.page_number}</p>}
            <p className="text-xs leading-relaxed text-muted-foreground">{citation.snippet}</p>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  );
}
