"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { LogOutIcon, MonitorIcon, MoonIcon, ShieldIcon, SunIcon, TimerIcon, UserIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((part) => part.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your profile, appearance, and session.</p>
        </div>

        <div className="flex max-w-2xl flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="size-4" /> Profile
              </CardTitle>
              <CardDescription>Contact your admin to update your profile details.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pb-5">
              <div className="flex items-center gap-4">
                <Avatar className="size-14">
                  <AvatarImage src={user?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-base">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{user?.full_name}</span>
                    {user?.role && <Badge variant="secondary">{user.role.name}</Badge>}
                  </div>
                  <span className="text-sm text-muted-foreground">{user?.email}</span>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Department</span>
                  <span>{user?.department || "—"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Title</span>
                  <span>{user?.title || "—"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Choose how the workspace looks. Applied immediately.</CardDescription>
            </CardHeader>
            <CardContent className="pb-5">
              {mounted && (
                <RadioGroup
                  value={theme}
                  onValueChange={setTheme}
                  className="grid grid-cols-3 gap-3"
                >
                  {THEME_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const active = theme === option.value;
                    return (
                      <Label
                        key={option.value}
                        htmlFor={`theme-${option.value}`}
                        className={
                          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border px-3 py-4 text-sm font-medium transition-colors " +
                          (active ? "border-primary bg-accent/40" : "border-border hover:bg-accent/30")
                        }
                      >
                        <Icon className="size-4.5" />
                        {option.label}
                        <RadioGroupItem value={option.value} id={`theme-${option.value}`} className="sr-only" />
                      </Label>
                    );
                  })}
                </RadioGroup>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TimerIcon className="size-4" /> Session
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
              <p className="text-sm text-muted-foreground">
                Your session will time out after a period of inactivity per company policy. Contact an admin to
                adjust retention or session settings under Admin &rarr; Retention.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldIcon className="size-4" /> Account
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
              <Button variant="outline" onClick={() => logout()}>
                <LogOutIcon /> Log out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
