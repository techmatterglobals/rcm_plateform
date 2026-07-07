"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateAnnouncement,
  useSystemSettings,
  useUpdateSystemSetting,
} from "@/hooks/use-admin";
import { ApiError } from "@/lib/api-client";

function PhiHandlingCard() {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSystemSetting();
  const setting = settings?.find((s) => s.key === "phi_block_on_detection");
  const enabled = Boolean(setting?.value?.enabled);

  const handleToggle = async (checked: boolean) => {
    try {
      await updateSetting.mutateAsync({ key: "phi_block_on_detection", value: { enabled: checked } });
      toast.success(`PHI blocking ${checked ? "enabled" : "disabled"}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update PHI setting");
    }
  };

  if (isLoading) return <Skeleton className="h-28 w-full rounded-xl" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>PHI handling</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4 pb-5">
        <p className="text-sm text-muted-foreground">
          Block sending prompts containing detected PHI unless explicitly approved.
        </p>
        <Switch checked={enabled} onCheckedChange={handleToggle} disabled={updateSetting.isPending} />
      </CardContent>
    </Card>
  );
}

function ConversationRetentionCard() {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSystemSetting();
  const setting = settings?.find((s) => s.key === "conversation_retention_days");
  const [days, setDays] = useState("0");

  useEffect(() => {
    if (setting) setDays(String(setting.value?.days ?? 0));
  }, [setting]);

  const handleSave = async () => {
    const parsed = Number(days);
    if (Number.isNaN(parsed) || parsed < 0) {
      toast.error("Enter a valid number of days");
      return;
    }
    try {
      await updateSetting.mutateAsync({ key: "conversation_retention_days", value: { days: parsed } });
      toast.success("Conversation retention updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update conversation retention");
    }
  };

  if (isLoading) return <Skeleton className="h-32 w-full rounded-xl" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversation retention</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pb-5">
        <p className="text-sm text-muted-foreground">
          Conversations older than this (excluding pinned ones) are automatically deleted. Set to 0 to disable
          automatic deletion.
        </p>
        <div className="flex items-center gap-2">
          <Label htmlFor="conversation-retention-days" className="sr-only">
            Retention days
          </Label>
          <Input
            id="conversation-retention-days"
            type="number"
            min={0}
            className="w-32"
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
          <span className="text-sm text-muted-foreground">days</span>
          <Button size="sm" onClick={handleSave} disabled={updateSetting.isPending}>
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SessionTimeoutCard() {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSystemSetting();
  const setting = settings?.find((s) => s.key === "session_idle_timeout_minutes");
  const [minutes, setMinutes] = useState("30");

  useEffect(() => {
    if (setting) setMinutes(String(setting.value?.minutes ?? 30));
  }, [setting]);

  const handleSave = async () => {
    const parsed = Number(minutes);
    if (Number.isNaN(parsed) || parsed < 0) {
      toast.error("Enter a valid number of minutes");
      return;
    }
    try {
      await updateSetting.mutateAsync({ key: "session_idle_timeout_minutes", value: { minutes: parsed } });
      toast.success("Session timeout updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update session timeout");
    }
  };

  if (isLoading) return <Skeleton className="h-32 w-full rounded-xl" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session timeout</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pb-5">
        <p className="text-sm text-muted-foreground">
          Users are required to re-authenticate after this many minutes of inactivity.
        </p>
        <div className="flex items-center gap-2">
          <Label htmlFor="session-timeout-minutes" className="sr-only">
            Timeout minutes
          </Label>
          <Input
            id="session-timeout-minutes"
            type="number"
            min={0}
            className="w-32"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
          <span className="text-sm text-muted-foreground">minutes</span>
          <Button size="sm" onClick={handleSave} disabled={updateSetting.isPending}>
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AnnouncementCard() {
  const createAnnouncement = useCreateAnnouncement();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are required");
      return;
    }
    try {
      await createAnnouncement.mutateAsync({
        title: title.trim(),
        body: body.trim(),
        link: link.trim() || undefined,
      });
      toast.success("Announcement sent to all users");
      setTitle("");
      setBody("");
      setLink("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to send announcement");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post an announcement</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pb-5">
        <p className="text-sm text-muted-foreground">
          Announcements show up as notifications platform-wide.
        </p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="announcement-title">Title</Label>
          <Input
            id="announcement-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Scheduled maintenance this weekend"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="announcement-body">Body</Label>
          <Textarea
            id="announcement-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Details for the announcement"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="announcement-link">Link (optional)</Label>
          <Input
            id="announcement-link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <Button className="w-fit" onClick={handleSend} disabled={createAnnouncement.isPending}>
          Send
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AdminRetentionPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Retention & Compliance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          PHI handling policy, session timeout, and retention windows.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <PhiHandlingCard />
        <ConversationRetentionCard />
        <SessionTimeoutCard />
        <AnnouncementCard />
      </div>
    </div>
  );
}
