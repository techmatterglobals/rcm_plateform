"use client";

import { ScanSearchIcon } from "lucide-react";

import { DocumentUploader } from "@/components/documents/document-uploader";
import { DocumentResultCard } from "@/components/documents/document-result-card";
import { useDocuments } from "@/hooks/use-documents";

export default function DocumentAnalyzerPage() {
  const { data: documents = [], isLoading } = useDocuments("document_analyzer");

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 flex items-center gap-2.5">
          <ScanSearchIcon className="size-5 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">Document Analyzer</h1>
            <p className="text-sm text-muted-foreground">
              Extract key data, dates, diagnoses, procedures, and insurance details from uploaded documents.
            </p>
          </div>
        </div>

        <DocumentUploader source="document_analyzer" />

        <div className="mt-6 flex flex-col gap-4">
          {isLoading && <p className="text-center text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && documents.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">No documents analyzed yet.</p>
          )}
          {documents.map((doc) => (
            <DocumentResultCard key={doc.id} document={doc} />
          ))}
        </div>
      </div>
    </div>
  );
}
