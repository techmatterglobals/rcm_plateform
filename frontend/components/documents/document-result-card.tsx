"use client";

import { CalendarIcon, CheckCircle2Icon, Loader2Icon, ShieldAlertIcon, StethoscopeIcon, XCircleIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppDocument } from "@/lib/types";

function extractedList(data: Record<string, unknown> | null, key: string): string[] {
  const value = data?.[key];
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export function DocumentResultCard({ document }: { document: AppDocument }) {
  const data = document.extracted_data;
  const keyDates = extractedList(data, "key_dates");
  const diagnoses = extractedList(data, "diagnoses");
  const procedures = extractedList(data, "procedures");
  const keyActions = extractedList(data, "key_actions");
  const insuranceDetails = (data?.insurance_details as Record<string, unknown> | undefined) ?? undefined;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-sm">{document.filename}</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">{(document.size_bytes / 1024).toFixed(0)} KB</p>
        </div>
        <StatusBadge status={document.status} />
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pb-5 text-sm">
        {document.status === "processing" || document.status === "uploaded" ? (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Loader2Icon className="size-3.5 animate-spin" /> Analyzing document…
          </p>
        ) : document.status === "failed" ? (
          <p className="text-destructive">{document.error_message || "Analysis failed."}</p>
        ) : (
          <>
            {document.phi_detected && (
              <p className="flex items-center gap-1.5 rounded-md bg-warning/10 px-2 py-1 text-xs text-warning-foreground">
                <ShieldAlertIcon className="size-3.5" /> PHI detected and masked in this summary
              </p>
            )}

            {document.extracted_summary && <p className="text-muted-foreground">{document.extracted_summary}</p>}

            {!!diagnoses.length && (
              <Field label="Diagnoses" icon={StethoscopeIcon}>
                <div className="flex flex-wrap gap-1">
                  {diagnoses.map((d) => (
                    <Badge key={d} variant="secondary">
                      {d}
                    </Badge>
                  ))}
                </div>
              </Field>
            )}

            {!!procedures.length && (
              <Field label="Procedures">
                <div className="flex flex-wrap gap-1">
                  {procedures.map((p) => (
                    <Badge key={p} variant="outline">
                      {p}
                    </Badge>
                  ))}
                </div>
              </Field>
            )}

            {!!keyDates.length && (
              <Field label="Key dates" icon={CalendarIcon}>
                <p className="text-muted-foreground">{keyDates.join(", ")}</p>
              </Field>
            )}

            {insuranceDetails && Object.keys(insuranceDetails).length > 0 && (
              <Field label="Insurance details">
                <p className="text-muted-foreground">
                  {Object.entries(insuranceDetails)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" · ")}
                </p>
              </Field>
            )}

            {!!keyActions.length && (
              <Field label="Key actions">
                <ul className="list-inside list-disc text-muted-foreground">
                  {keyActions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </Field>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon?: typeof CalendarIcon; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-foreground">
        {Icon && <Icon className="size-3.5" />} {label}
      </p>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: AppDocument["status"] }) {
  if (status === "completed") {
    return (
      <Badge variant="success">
        <CheckCircle2Icon /> Completed
      </Badge>
    );
  }
  if (status === "failed") {
    return (
      <Badge variant="destructive">
        <XCircleIcon /> Failed
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      <Loader2Icon className="animate-spin" /> {status === "processing" ? "Processing" : "Uploaded"}
    </Badge>
  );
}
