"use client";

import { useDropzone } from "react-dropzone";
import { UploadCloudIcon } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useUploadDocument } from "@/hooks/use-documents";
import type { DocumentSource } from "@/lib/types";

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
};

export function DocumentUploader({ source }: { source: DocumentSource }) {
  const upload = useUploadDocument();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_TYPES,
    maxSize: 25 * 1024 * 1024,
    onDrop: (accepted, rejected) => {
      rejected.forEach((r) => toast.error(`${r.file.name} was rejected (unsupported type or too large)`));
      accepted.forEach((file) =>
        upload.mutate(
          { file, source },
          {
            onSuccess: () => toast.success(`"${file.name}" uploaded — analyzing…`),
            onError: () => toast.error(`Failed to upload "${file.name}"`),
          }
        )
      );
    },
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card px-6 py-10 text-center transition-colors",
        isDragActive && "border-primary bg-primary/5"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <UploadCloudIcon className="size-5" />
      </div>
      <p className="text-sm font-medium">Drop a file to analyze, or click to browse</p>
      <p className="text-xs text-muted-foreground">
        PDF, Word, Excel, or images — insurance cards, EOBs, ERAs, referrals, authorization letters, medical records
      </p>
    </div>
  );
}
