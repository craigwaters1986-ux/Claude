import { AppHeader } from "@/components/app-header";

/** Shell for every signed-in screen. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
    </div>
  );
}
