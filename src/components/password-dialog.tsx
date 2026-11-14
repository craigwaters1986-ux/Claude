"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabase } from "@/hooks/use-supabase";
import { timesPasswordLeaked } from "@/lib/auth/pwned-password";

const MIN_LENGTH = 8;

/** Set or change the password, so other devices can sign in without an email. */
export function PasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">{open && <PasswordForm onDone={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
  );
}

function PasswordForm({ onDone }: { onDone: () => void }) {
  const supabase = useSupabase();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_LENGTH) return setError(`Use at least ${MIN_LENGTH} characters.`);
    if (password !== confirm) return setError("The two passwords don’t match.");
    setBusy(true);
    setError(null);
    const leaked = await timesPasswordLeaked(password);
    if (leaked) {
      setBusy(false);
      return setError(
        `This password has appeared in ${leaked.toLocaleString("en-GB")} data breach${leaked === 1 ? "" : "es"} elsewhere, so it’s easy to guess. Please choose a different one.`,
      );
    }
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      return setError(
        /same/i.test(error.message) ? "That’s already your password." : /weak|short|characters/i.test(error.message) ? `Choose a stronger password: ${error.message}` : error.message,
      );
    }
    try {
      localStorage.setItem("snaglist.sign-in-method", "password");
    } catch {
      // ignore
    }
    toast.success("Password saved. Use it to sign in on your other devices.");
    onDone();
  }

  return (
    // noValidate: our own messages are clearer than the browser's bubbles.
    <form onSubmit={save} noValidate className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Set a password</DialogTitle>
        <DialogDescription>
          Sign in on your phone, tablet or computer with your email and this password, without waiting for an email.
        </DialogDescription>
      </DialogHeader>
      {/* Lets password managers save it against the right account */}
      <input type="email" autoComplete="username" className="sr-only" tabIndex={-1} aria-hidden readOnly value="" />
      <div className="grid gap-2">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
        />
        <p className="text-muted-foreground text-xs">
          At least {MIN_LENGTH} characters. Passwords known from data breaches aren’t allowed.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirm-password">Confirm password</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </div>
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
      <DialogFooter>
        <Button type="submit" size="lg" disabled={busy || !password || !confirm}>
          {busy && <Loader2 className="animate-spin" />} Save password
        </Button>
      </DialogFooter>
    </form>
  );
}
