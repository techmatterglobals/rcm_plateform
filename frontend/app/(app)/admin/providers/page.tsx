"use client";

import { ProviderCard } from "@/components/admin/provider-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAIProviders } from "@/hooks/use-admin";

export default function AdminProvidersPage() {
  const { data: providers, isLoading } = useAIProviders();

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">AI Providers & API Keys</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure Claude, OpenAI, and Gemini — enable/disable providers, set the default, and store API keys.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-xl" />
          ))}
        </div>
      ) : providers && providers.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {providers.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No AI providers configured yet.
        </div>
      )}
    </div>
  );
}
