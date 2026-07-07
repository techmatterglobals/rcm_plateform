"use client";

import { useState } from "react";
import { Loader2Icon, UploadIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUploadKBDocument } from "@/hooks/use-kb";

const CATEGORIES = [
  { value: "medical_billing", label: "Medical Billing" },
  { value: "medical_coding", label: "Medical Coding" },
  { value: "prior_authorization", label: "Prior Authorization" },
  { value: "eligibility", label: "Eligibility" },
  { value: "appeals", label: "Appeals" },
  { value: "denials", label: "Denials" },
  { value: "general", label: "General" },
];

export function KBUploadDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const upload = useUploadKBDocument();

  const reset = () => {
    setTitle("");
    setCategory("");
    setFile(null);
  };

  const handleSubmit = () => {
    if (!title.trim() || !category || !file) {
      toast.error("Add a title, category, and file to upload.");
      return;
    }
    upload.mutate(
      { file, title: title.trim(), category },
      {
        onSuccess: () => {
          toast.success(`"${title.trim()}" uploaded — indexing will begin shortly.`);
          reset();
          setOpen(false);
        },
        onError: () => toast.error("Failed to upload document."),
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UploadIcon className="size-4" /> Upload document
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload knowledge base document</DialogTitle>
          <DialogDescription>
            Add a policy, SOP, training manual, payer guideline, or FAQ. Documents are chunked and indexed for RAG
            search.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kb-title">Title</Label>
            <Input
              id="kb-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Aetna Prior Authorization Guidelines 2026"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kb-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="kb-category" className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kb-file">File</Label>
            <Input
              id="kb-file"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">PDF, Word, or plain text.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={upload.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={upload.isPending}>
            {upload.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
