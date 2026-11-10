import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · SnagList" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
