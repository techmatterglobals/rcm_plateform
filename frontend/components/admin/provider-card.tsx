"use client";

import { useState } from "react";
import { BotIcon, KeyIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useUpdateAIProvider } from "@/hooks/use-admin";
import { ApiError } from "@/lib/api-client";
import type { AIProviderConfig } from "@/lib/types";

export function ProviderCard({ provider }: { provider: AIProviderConfig }) {
  const updateProvider = useUpdateAIProvider();

  const [defaultModel, setDefaultModel] = useState(provider.default_model);
  const [priority, setPriority] = useState(String(provider.priority));
  const [retentionDays, setRetentionDays] = useState(String(provider.data_retention_days));

  const [isEditingKey, setIsEditingKey] = useState(false);
  const [apiKeyValue, setApiKeyValue] = useState("");

  const hasFieldChanges =
    defaultModel !== provider.default_model ||
    priority !== String(provider.priority) ||
    retentionDays !== String(provider.data_retention_days);

  const handleToggleEnabled = async (checked: boolean) => {
    try {
      await updateProvider.mutateAsync({ id: provider.id, is_enabled: checked });
      toast.success(`${provider.display_name} ${checked ? "enabled" : "disabled"}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update provider");
    }
  };

  const handleSetDefault = async () => {
    try {
      await updateProvider.mutateAsync({ id: provider.id, is_default: true });
      toast.success(`${provider.display_name} is now the default provider`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to set default provider");
    }
  };

  const handleSaveFields = async () => {
    const parsedPriority = Number(priority);
    const parsedRetention = Number(retentionDays);
    if (Number.isNaN(parsedPriority) || Number.isNaN(parsedRetention)) {
      toast.error("Priority and retention must be numbers");
      return;
    }
    try {
      await updateProvider.mutateAsync({
        id: provider.id,
        default_model: defaultModel,
        priority: parsedPriority,
        data_retention_days: parsedRetention,
      });
      toast.success(`${provider.display_name} settings saved`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save provider settings");
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyValue.trim()) {
      toast.error("Enter an API key before saving");
      return;
    }
    try {
      await updateProvider.mutateAsync({ id: provider.id, api_key: apiKeyValue.trim() });
      toast.success(`${provider.display_name} API key updated`);
      setApiKeyValue("");
      setIsEditingKey(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update API key");
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BotIcon className="size-4.5" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              {provider.display_name}
              {provider.is_default && <Badge>Default</Badge>}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{provider.provider}</p>
          </div>
        </div>
        <Switch checked={provider.is_enabled} onCheckedChange={handleToggleEnabled} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pb-5">
        {!provider.is_default && (
          <Button variant="outline" size="sm" className="w-fit" onClick={handleSetDefault} disabled={updateProvider.isPending}>
            Set as default
          </Button>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`model-${provider.id}`}>Default model</Label>
            <Select value={defaultModel} onValueChange={setDefaultModel}>
              <SelectTrigger id={`model-${provider.id}`} className="w-full">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {provider.available_models.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`priority-${provider.id}`}>Priority</Label>
            <Input
              id={`priority-${provider.id}`}
              type="number"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`retention-${provider.id}`}>
            Data retention (0 = provider default / zero retention)
          </Label>
          <Input
            id={`retention-${provider.id}`}
            type="number"
            min={0}
            value={retentionDays}
            onChange={(e) => setRetentionDays(e.target.value)}
          />
        </div>

        <Button
          size="sm"
          className="w-fit"
          onClick={handleSaveFields}
          disabled={!hasFieldChanges || updateProvider.isPending}
        >
          Save
        </Button>

        <div className="flex flex-col gap-1.5 border-t border-border pt-4">
          <Label className="flex items-center gap-2">
            <KeyIcon className="size-3.5" /> API key
          </Label>
          {isEditingKey ? (
            <div className="flex items-center gap-2">
              <Input
                type="password"
                autoFocus
                placeholder="Paste API key"
                value={apiKeyValue}
                onChange={(e) => setApiKeyValue(e.target.value)}
              />
              <Button size="sm" onClick={handleSaveApiKey} disabled={updateProvider.isPending}>
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditingKey(false);
                  setApiKeyValue("");
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="password"
                disabled
                value=""
                placeholder={provider.has_api_key ? "•••••••• (configured)" : "Not configured"}
                className="flex-1"
              />
              <Button size="sm" variant="outline" onClick={() => setIsEditingKey(true)}>
                Set API key
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
