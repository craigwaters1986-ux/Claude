"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClipboardCheck, KeyRound, LogOut, Settings, UserRound } from "lucide-react";
import { PasswordDialog } from "@/components/password-dialog";
import { SyncStatus } from "@/components/sync-status";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSupabase, useUser } from "@/hooks/use-supabase";

export function AppHeader() {
  const supabase = useSupabase();
  const { user } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [passwordOpen, setPasswordOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    queryClient.clear(); // don't leave the last user's projects in memory
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="bg-header text-header-foreground sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 lg:h-16 lg:max-w-6xl lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <span className="bg-brand text-brand-foreground flex size-8 items-center justify-center rounded-lg">
            <ClipboardCheck className="size-[18px]" strokeWidth={2.25} />
          </span>
          <span className="text-[17px] font-semibold tracking-tight whitespace-nowrap">
            Site Auditor <span className="text-brand">+</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
        <SyncStatus />
        {user?.email && <span className="hidden max-w-60 truncate text-sm text-white/60 lg:inline">{user.email}</span>}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account"
              className="flex size-10 items-center justify-center rounded-full text-white/85 transition-colors outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <UserRound className="size-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {user?.email && (
              <>
                <div className="text-muted-foreground truncate px-2 py-1.5 text-xs">{user.email}</div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setPasswordOpen(true)}>
              <KeyRound /> Set password
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={signOut}>
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
      <PasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </header>
  );
}
