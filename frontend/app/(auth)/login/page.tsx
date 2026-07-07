"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2Icon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api-client";

const schema = z.object({
  email: z.string().email("Enter a valid work email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await login(values.email, values.password);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <SparklesIcon className="size-5" />
          </div>
          <h1 className="text-lg font-semibold">RCM AI Platform</h1>
          <p className="text-sm text-muted-foreground">Sign in with your company account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Use your TechMatter credentials to continue</CardDescription>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="mb-4 flex flex-col gap-2">
              <Button variant="outline" className="w-full" type="button" onClick={() => toast.info("Configure GOOGLE_CLIENT_ID to enable Google Workspace SSO")}>
                Continue with Google Workspace
              </Button>
              <Button variant="outline" className="w-full" type="button" onClick={() => toast.info("Configure AZURE_AD_CLIENT_ID to enable Microsoft Entra ID SSO")}>
                Continue with Microsoft Entra ID
              </Button>
            </div>

            <div className="relative mb-4 flex items-center">
              <Separator className="flex-1" />
              <span className="px-2 text-xs text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Work email</Label>
                <Input id="email" type="email" placeholder="you@techmatter.co" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              <Button type="submit" className="mt-1 w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Protected by company policy. All conversations are logged and monitored for compliance.
        </p>
      </div>
    </div>
  );
}
