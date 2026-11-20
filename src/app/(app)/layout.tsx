import { AppHeader } from "@/components/app-header";

/** Shell for every signed-in screen. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:max-w-6xl lg:px-8 lg:pt-8 lg:pb-16">
        {children}
      </main>
    </div>
  );
}
