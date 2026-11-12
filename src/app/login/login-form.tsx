"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardCheck, KeyRound, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabase } from "@/hooks/use-supabase";
import { safeNextPath } from "@/lib/safe-next-path";

/**
 * email:    send a sign-in link / 6-digit code (first sign-in, or forgotten password)
 * code:     enter the 6-digit code from the email
 * password: sign in instantly with email + password (once one has been set)
 */
type Stage = "email" | "code" | "password";

// Per-device conveniences: the email last used here, and whether it signs in with a password.
const EMAIL_KEY = "snaglist.last-email";
const METHOD_KEY = "snaglist.sign-in-method";
const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    // storage blocked: nothing to remember
  }
};

export function LoginForm() {
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));

  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "link"
      ? "That sign-in link didn't work in this browser. Request a new one and enter the 6-digit code instead."
      : null,
  );

  // Returning on this device: prefill the email and offer the method used last time.
  useEffect(() => {
    const lastEmail = read(EMAIL_KEY);
    if (lastEmail) setEmail(lastEmail);
    if (read(METHOD_KEY) === "password" && searchParams.get("error") !== "link") setStage("password");
  }, [searchParams]);

  function signedIn(method: "password" | "email") {
    write(EMAIL_KEY, email.trim());
    write(METHOD_KEY, method);
    router.replace(next);
    router.refresh();
  }

  async function sendLink(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email.trim()) return setError("Enter your email first.");
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
    write(EMAIL_KEY, email.trim());
    setStage("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    setBusy(false);
    if (error) return setError("That code is invalid or has expired.");
    signedIn("email");
  }

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      return setError(
        /invalid login/i.test(error.message)
          ? "Wrong email or password. If you haven’t set a password yet, use “Email me a sign-in link”."
          : error.message,
      );
    }
    signedIn("password");
  }

  function switchTo(s: Stage) {
    setStage(s);
    setError(null);
    setCode("");
    setPassword("");
  }

  const emailField = (
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
        autoFocus={!email}
      />
    </div>
  );

  const errorText = error && (
    <p className="text-destructive text-sm" role="alert">
      {error}
    </p>
  );

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center text-center text-white">
        <div className="bg-brand text-brand-foreground mb-4 flex size-14 items-center justify-center rounded-2xl">
          <ClipboardCheck className="size-7" strokeWidth={2.25} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Site Auditor +</h1>
        <p className="mt-1 text-sm text-white/60">Snagging for building sites</p>
      </div>

      <Card className="gap-5 rounded-2xl border-0 py-7 shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{stage === "code" ? "Check your email" : "Sign in"}</CardTitle>
          <CardDescription>
            {stage === "email" && "Enter your email and we’ll send you a sign-in link."}
            {stage === "password" && "Sign in with the password you set in the app."}
            {stage === "code" && `We’ve emailed ${email}. Tap the link in the email, or enter the 6-digit code.`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {stage === "email" && (
            <form onSubmit={sendLink} className="grid gap-4">
              {emailField}
              {errorText}
              <Button type="submit" size="lg" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <Mail />}
                Email me a sign-in link
              </Button>
              <Button type="button" variant="ghost" onClick={() => switchTo("password")}>
                <KeyRound /> Sign in with password
              </Button>
            </form>
          )}

          {stage === "password" && (
            <form onSubmit={signInWithPassword} className="grid gap-4">
              {emailField}
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus={!!email}
                />
              </div>
              {errorText}
              <Button type="submit" size="lg" disabled={busy || !password}>
                {busy ? <Loader2 className="animate-spin" /> : <KeyRound />}
                Sign in
              </Button>
              <Button type="button" variant="ghost" onClick={() => sendLink()} disabled={busy}>
                Forgot password? Email me a sign-in link
              </Button>
            </form>
          )}

          {stage === "code" && (
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
              {errorText}
              <Button type="submit" size="lg" disabled={busy || code.length !== 6}>
                {busy && <Loader2 className="animate-spin" />}
                Sign in
              </Button>
              <Button type="button" variant="ghost" onClick={() => switchTo("email")}>
                Use a different email
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
