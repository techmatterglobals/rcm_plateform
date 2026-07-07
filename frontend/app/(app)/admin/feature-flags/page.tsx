"use client";

import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useFeatureFlags, useUpdateFeatureFlag } from "@/hooks/use-admin";
import { ApiError } from "@/lib/api-client";

export default function AdminFeatureFlagsPage() {
  const { data: flags, isLoading } = useFeatureFlags();
  const updateFlag = useUpdateFeatureFlag();

  const handleToggle = async (id: string, name: string, is_enabled: boolean) => {
    try {
      await updateFlag.mutateAsync({ id, is_enabled });
      toast.success(`${name} ${is_enabled ? "enabled" : "disabled"}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update feature flag");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Feature Flags</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Turn platform features on or off without a deploy.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : flags && flags.length > 0 ? (
        <div className="rounded-xl border border-border shadow-sm">
          {flags.map((flag, i) => (
            <div
              key={flag.id}
              className={`flex items-center justify-between gap-4 px-5 py-4 ${
                i !== flags.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div>
                <p className="text-sm font-medium">{flag.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{flag.description}</p>
              </div>
              <Switch
                checked={flag.is_enabled}
                onCheckedChange={(checked) => handleToggle(flag.id, flag.name, checked)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No feature flags defined yet.
        </div>
      )}
    </div>
  );
}
