"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, PencilIcon, PlayIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { useDeletePrompt, useLaunchPrompt } from "@/hooks/use-prompts";
import type { PromptTemplate } from "@/lib/types";

const CATEGORY_LABELS: Record<string, string> = {
  medical_billing: "Medical Billing",
  medical_coding: "Medical Coding",
  prior_authorization: "Prior Authorization",
  eligibility: "Eligibility",
  appeals: "Appeals",
  denials: "Denials",
  general: "General",
};

export function PromptCard({
  prompt,
  onEdit,
}: {
  prompt: PromptTemplate;
  onEdit: (prompt: PromptTemplate) => void;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const launch = useLaunchPrompt();
  const deletePrompt = useDeletePrompt();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canManage = !!user && (user.id === prompt.created_by || user.role.name === "admin");

  const handleLaunch = () => {
    launch.mutate(prompt.id, {
      onSuccess: () => router.push(`/chat?prompt=${encodeURIComponent(prompt.content)}`),
      onError: () => toast.error("Failed to launch prompt"),
    });
  };

  const handleDelete = () => {
    deletePrompt.mutate(prompt.id, {
      onSuccess: () => {
        toast.success(`"${prompt.title}" deleted`);
        setConfirmDelete(false);
      },
      onError: () => toast.error("Failed to delete prompt"),
    });
  };

  return (
    <>
      <Card className="flex h-full flex-col">
        <CardHeader className="flex-row items-start justify-between gap-2">
          <div>
            <CardTitle>{prompt.title}</CardTitle>
            <Badge variant="outline" className="mt-2">
              {CATEGORY_LABELS[prompt.category] ?? prompt.category}
            </Badge>
          </div>
          {canManage && (
            <div className="flex shrink-0 gap-1">
              <Button variant="ghost" size="icon" onClick={() => onEdit(prompt)} title="Edit prompt">
                <PencilIcon className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(true)} title="Delete prompt">
                <Trash2Icon className="size-4 text-destructive" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 pb-3">
          <p className="text-sm text-muted-foreground">{prompt.description}</p>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{prompt.usage_count} uses</span>
          <Button size="sm" onClick={handleLaunch} disabled={launch.isPending}>
            {launch.isPending ? <Loader2Icon className="size-4 animate-spin" /> : <PlayIcon className="size-4" />}
            Launch
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete prompt?</DialogTitle>
            <DialogDescription>
              This will permanently remove &quot;{prompt.title}&quot; from the prompt library. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deletePrompt.isPending}>
              {deletePrompt.isPending && <Loader2Icon className="size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
