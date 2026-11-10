"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardCheck, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabase } from "@/hooks/use-supabase";
import { safeNextPath } from "@/lib/safe-next-path";

type Stage = "email" | "code";

export function LoginForm() {
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));

  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "link"
      ? "That sign-in link didn't work in this browser. Request a new one and enter the 6-digit code instead."
      : null,
  );

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setBusy(false);
    if (error) return setError(error.message);
    setStage("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error) return setError("That code is invalid or has expired.");
    router.replace(next);
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="bg-primary text-primary-foreground mx-auto mb-2 flex size-12 items-center justify-center rounded-xl">
          <ClipboardCheck className="size-6" />
        </div>
        <CardTitle className="text-xl">SnagList</CardTitle>
        <CardDescription>
          {stage === "email"
            ? "Sign in with your email — no password needed."
            : `We've emailed ${email}. Tap the link in the email, or enter the 6-digit code.`}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {stage === "email" ? (
          <form onSubmit={sendLink} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@company.co.uk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            {error && <p className="text-destructive text-sm" role="alert">{error}</p>}
            <Button type="submit" size="lg" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <Mail />}
              Email me a sign-in link
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="code">6-digit code</Label>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-lg tracking-[0.4em]"
                required
                autoFocus
              />
            </div>
            {error && <p className="text-destructive text-sm" role="alert">{error}</p>}
            <Button type="submit" size="lg" disabled={busy || code.length !== 6}>
              {busy && <Loader2 className="animate-spin" />}
              Sign in
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setStage("email");
                setCode("");
                setError(null);
              }}
            >
              Use a different email
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
