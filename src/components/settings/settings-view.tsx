"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ImageUp, LayoutGrid, Loader2, Monitor, Moon, Rows3, Sun, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/hooks/use-settings";
import { useSupabase } from "@/hooks/use-supabase";
import { compressImage } from "@/lib/image/compress";
import { buildImagePath, getPublicImageUrl, removeImages, uploadImage } from "@/lib/services/storage";
import { ACCENTS, REPORT_COLORS, type Settings } from "@/lib/settings/settings";
import { SignatureField } from "./signature-field";
import { cn } from "@/lib/utils";
import { uuid } from "@/lib/uuid";

export function SettingsView() {
  const { settings, update } = useSettings();

  async function change(patch: Partial<Settings>, message?: string) {
    try {
      await update(patch);
      if (message) toast.success(message);
    } catch {
      toast.error("Saved on this device, but couldn’t sync to your account. It will sync next time.");
    }
  }

  return (
    <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6">
      <Link href="/" className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1 text-sm">
        <ArrowLeft className="size-4" /> Projects
      </Link>
      <div>
        <h1 className="text-[28px] leading-tight font-bold lg:text-4xl">Settings</h1>
        <p className="text-muted-foreground text-sm">Saved to your account, so your phone and computer match.</p>
      </div>

      <Section title="Appearance">
        <Field label="Theme">
          <Segmented
            name="theme"
            value={settings.theme}
            onChange={(theme) => change({ theme })}
            options={[
              { value: "light", label: "Light", icon: Sun },
              { value: "dark", label: "Dark", icon: Moon },
              { value: "system", label: "Automatic", icon: Monitor },
            ]}
          />
          <Hint>Automatic follows your phone or computer (for example, dark after sunset).</Hint>
        </Field>

        <Field label="Accent colour">
          <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Accent colour">
            {ACCENTS.map((a) => {
              const on = settings.accent === a.value;
              return (
                <button
                  key={a.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={a.label}
                  title={a.label}
                  onClick={() => change({ accent: a.value })}
                  className={cn(
                    "focus-visible:ring-ring/50 flex size-11 items-center justify-center rounded-full border-2 outline-none focus-visible:ring-[3px]",
                    on ? "border-foreground" : "border-transparent",
                  )}
                  style={{ backgroundColor: a.swatch }}
                >
                  {on && <Check className="size-5 text-black" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
          <Hint>Used for the logo mark, badges and highlights.</Hint>
        </Field>

        <Field label="Text size">
          <Segmented
            name="text"
            value={settings.textSize}
            onChange={(textSize) => change({ textSize })}
            options={[
              { value: "standard", label: "Standard" },
              { value: "large", label: "Larger" },
            ]}
          />
          <Hint>Larger text is easier to read outdoors or at arm’s length.</Hint>
        </Field>
      </Section>

      <Section title="Reports">
        <Field label="Company name" htmlFor="company-name">
          <Input
            id="company-name"
            defaultValue={settings.companyName}
            key={`company-${settings.companyName}`}
            placeholder="Shown at the top of every report"
            maxLength={120}
            onBlur={(e) => e.target.value.trim() !== settings.companyName && change({ companyName: e.target.value.trim() }, "Company name saved")}
          />
        </Field>
        <LogoField logoUrl={settings.logoUrl} logoPath={settings.logoPath} onChange={change} />
        <SignatureField signatureUrl={settings.signatureUrl} signaturePath={settings.signaturePath} onChange={change} />
        <Field label="Report colour">
          <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Report colour">
            {REPORT_COLORS.map((c) => {
              const on = settings.reportColor === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={`${c.label} reports`}
                  title={c.label}
                  onClick={() => change({ reportColor: c.value })}
                  className={cn(
                    "focus-visible:ring-ring/50 flex size-11 items-center justify-center rounded-full border-2 outline-none focus-visible:ring-[3px]",
                    on ? "border-foreground" : "border-transparent",
                  )}
                  style={{ backgroundColor: c.hex }}
                >
                  {on && <Check className="size-5 text-white" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
          <Hint>The rules and headings in your reports. Separate from the app’s accent so it always prints clearly.</Hint>
        </Field>
        <Field label="Default “Prepared by”" htmlFor="prepared-by">
          <Input
            id="prepared-by"
            defaultValue={settings.preparedBy}
            key={`prep-${settings.preparedBy}`}
            placeholder="Your name"
            maxLength={120}
            autoComplete="name"
            onBlur={(e) => e.target.value.trim() !== settings.preparedBy && change({ preparedBy: e.target.value.trim() }, "Saved")}
          />
          <Hint>Filled in on new reports. You can still change it each time.</Hint>
        </Field>
      </Section>

      <Section title="Issue list">
        <Field label="Layout on tablets and computers">
          <Segmented
            name="snag-view"
            value={settings.snagView}
            onChange={(snagView) => change({ snagView })}
            options={[
              { value: "table", label: "Table", icon: Rows3 },
              { value: "cards", label: "Cards", icon: LayoutGrid },
            ]}
          />
          <Hint>Phones always show cards.</Hint>
        </Field>
      </Section>
    </div>
  );
}

function LogoField({
  logoUrl,
  logoPath,
  onChange,
}: {
  logoUrl: string | null;
  logoPath: string | null;
  onChange: (patch: Partial<Settings>, message?: string) => Promise<void>;
}) {
  const supabase = useSupabase();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Please sign in again.");
      const blob = await compressImage(file, { maxDimension: 800, quality: 0.9 });
      const path = buildImagePath(data.session.user.id, "branding", uuid(), blob.type);
      await uploadImage(supabase, path, blob);
      const old = logoPath;
      await onChange({ logoUrl: getPublicImageUrl(supabase, path), logoPath: path }, "Logo saved");
      if (old) await removeImages(supabase, [old]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn’t upload the logo");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const old = logoPath;
    await onChange({ logoUrl: null, logoPath: null }, "Logo removed");
    if (old) await removeImages(supabase, [old]);
  }

  return (
    <Field label="Logo">
      <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={upload} data-testid="logo-input" />
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-32 items-center justify-center overflow-hidden rounded-lg border bg-white p-2">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Your logo" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-xs text-neutral-400">No logo</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => input.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <ImageUp />} {logoUrl ? "Replace" : "Upload logo"}
          </Button>
          {logoUrl && (
            <Button type="button" variant="ghost" onClick={remove} disabled={busy} aria-label="Remove logo">
              <Trash2 />
            </Button>
          )}
        </div>
      </div>
      <Hint>Shown at the top right of every report. A PNG or JPEG on a white or clear background works best.</Hint>
    </Field>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface grid min-w-0 grid-cols-1 gap-5 p-4 sm:p-6" aria-label={title}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-2">
      {htmlFor ? <Label htmlFor={htmlFor}>{label}</Label> : <span className="text-sm leading-none font-medium">{label}</span>}
      {children}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-xs">{children}</p>;
}

function Segmented<T extends string>({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; icon?: React.ComponentType<{ className?: string }> }[];
}) {
  return (
    <div className="bg-muted grid auto-cols-[minmax(0,1fr)] grid-flow-col gap-1 rounded-lg p-1" role="radiogroup" aria-label={name}>
      {options.map(({ value: v, label, icon: Icon }) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={cn(
            "inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-md px-1 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            value === v ? "bg-card shadow-xs" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {Icon && <Icon className="size-4 shrink-0 max-[379px]:hidden" />}
          {label}
        </button>
      ))}
    </div>
  );
}
