"use client";

import { useEffect, useState } from "react";
import { KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordDialog } from "@/components/password-dialog";

const METHOD_KEY = "snaglist.sign-in-method";
const DISMISSED_KEY = "snaglist.password-prompt-dismissed";

const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};

/**
 * After signing in with an emailed code or link, suggest setting a password:
 * then this person never waits for (or uses up) a sign-in email again.
 */
export function PasswordPrompt() {
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setShow(read(METHOD_KEY) === "email" && read(DISMISSED_KEY) !== "1");
  }, []);

  if (!show) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {}
    setShow(false);
  }

  return (
    <div className="surface flex items-start gap-3 p-3.5" data-testid="password-prompt">
      <span className="bg-brand text-brand-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
        <KeyRound className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Set a password for quicker sign-in</p>
        <p className="text-muted-foreground text-sm">Sign in on any phone or computer straight away, without waiting for an email.</p>
        <Button type="button" size="sm" className="mt-2" onClick={() => setOpen(true)}>
          Set password
        </Button>
      </div>
      <Button type="button" variant="ghost" size="icon" className="-mt-1 -mr-1 shrink-0" onClick={dismiss} aria-label="Not now">
        <X />
      </Button>
      <PasswordDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o && read(METHOD_KEY) === "password") setShow(false);
        }}
      />
    </div>
  );
}
