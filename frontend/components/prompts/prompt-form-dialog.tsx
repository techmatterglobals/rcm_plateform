"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePrompt, useUpdatePrompt } from "@/hooks/use-prompts";
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

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Select a category"),
  content: z.string().min(1, "Prompt content is required"),
});

type FormValues = z.infer<typeof schema>;

const EMPTY_VALUES: FormValues = { title: "", description: "", category: "general", content: "" };

export function PromptFormDialog({
  open,
  onOpenChange,
  prompt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt?: PromptTemplate;
}) {
  const isEditing = !!prompt;
  const createPrompt = useCreatePrompt();
  const updatePrompt = useUpdatePrompt();
  const isSubmitting = createPrompt.isPending || updatePrompt.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      prompt
        ? { title: prompt.title, description: prompt.description, category: prompt.category, content: prompt.content }
        : EMPTY_VALUES
    );
  }, [open, prompt, reset]);

  const onSubmit = (values: FormValues) => {
    if (isEditing && prompt) {
      updatePrompt.mutate(
        { id: prompt.id, ...values },
        {
          onSuccess: () => {
            toast.success("Prompt updated");
            onOpenChange(false);
          },
          onError: () => toast.error("Failed to update prompt"),
        }
      );
    } else {
      createPrompt.mutate(values, {
        onSuccess: () => {
          toast.success("Prompt created");
          onOpenChange(false);
        },
        onError: () => toast.error("Failed to create prompt"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit prompt" : "New prompt"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this reusable prompt template."
              : "Create a reusable prompt template. Shared with your team by default."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prompt-title">Title</Label>
            <Input id="prompt-title" placeholder="e.g. Denial appeal letter — commercial payer" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prompt-description">Description</Label>
            <Textarea id="prompt-description" placeholder="What this prompt is for" {...register("description")} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prompt-category">Category</Label>
            <Select
              value={watch("category")}
              onValueChange={(value) => setValue("category", value, { shouldValidate: true })}
            >
              <SelectTrigger id="prompt-category" className="w-full">
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
            {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prompt-content">Prompt content</Label>
            <Textarea
              id="prompt-content"
              className="min-h-32"
              placeholder="Write the prompt. Use {{placeholders}} for details to fill in at launch, e.g. Draft an appeal letter for {{payer_name}} denial code {{denial_code}}."
              {...register("content")}
            />
            {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
          </div>

          <DialogFooter className="mt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
              {isEditing ? "Save changes" : "Create prompt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
