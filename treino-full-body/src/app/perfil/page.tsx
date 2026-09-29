"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/Providers";
import { HealthNotice } from "@/components/HealthNotice";
import { IconCloud } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { Badge, Button, Card, Field, Page, PageHeader, Segmented, Sheet, TextInput } from "@/components/ui";
import { useProfile, useSyncStatus } from "@/lib/hooks";
import { clearLocalData, exportBackup, importBackup, saveProfile } from "@/lib/repo";
import { getSupabase } from "@/lib/supabase";
import { withBase } from "@/lib/base-path";
import { formatDate } from "@/lib/stats";
import type { SyncState } from "@/lib/sync";
import { firstError, parseDecimal, profileSchema } from "@/lib/validation";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export default function ProfilePage() {
  const profile = useProfile();
  const toast = useToast();
  const [name, setName] = useState(profile.displayName);
  const [step, setStep] = useState(String(profile.loadStep).replace(".", ","));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmClear, setConfirmClear] = useState(false);
  const [install, setInstall] = useState<BeforeInstallPromptEvent | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(profile.displayName);
    setStep(String(profile.loadStep).replace(".", ","));
  }, [profile.displayName, profile.loadStep]);

  useEffect(() => {
    const h = (e: Event) => {
      e.preventDefault();
      setInstall(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  async function update(patch: Partial<typeof profile>) {
    const next = { ...profile, ...patch };
    const parsed = profileSchema.safeParse(next);
    if (!parsed.success) {
      setErrors(firstError(parsed.error));
      return;
    }
    setErrors({});
    try {
      await saveProfile(next);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Falha ao salvar", "error");
    }
  }

  async function doExport() {
    try {
      const data = await exportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `treino-full-body-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Falha ao exportar", "error");
    }
  }

  async function doImport(file: File) {
    try {
      const n = await importBackup(JSON.parse(await file.text()));
      toast(`${n} registros importados`, "ok");
    } catch (err) {
      toast(err instanceof SyntaxError ? "Arquivo JSON inválido" : err instanceof Error ? err.message : "Falha ao importar", "error");
    }
  }

  return (
    <Page>
      <PageHeader title="Perfil" />
      <div className="space-y-4">
        <Card className="space-y-4">
          <h2 className="font-semibold">Preferências</h2>
          <Field label="Nome (opcional)" htmlFor="pf-name" error={errors.displayName}>
            <TextInput id="pf-name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} onBlur={() => name !== profile.displayName && update({ displayName: name.trim() })} />
          </Field>
          <Field label="Unidade de carga" htmlFor="pf-unit">
            <Segmented label="Unidade de carga" value={profile.loadUnit} onChange={(v) => update({ loadUnit: v })} options={[{ value: "kg", label: "kg" }, { value: "lb", label: "lb" }]} />
          </Field>
          <Field label="Incremento dos botões +/−" htmlFor="pf-step" error={errors.loadStep} hint="Usado apenas nos botões de ajuste; nada é preenchido automaticamente.">
            <TextInput
              id="pf-step"
              inputMode="decimal"
              value={step}
              onChange={(e) => setStep(e.target.value)}
              onBlur={() => {
                const v = parseDecimal(step);
                if (v === null || Number.isNaN(v)) setErrors({ loadStep: "Informe um número" });
                else if (v !== profile.loadStep) void update({ loadStep: v });
              }}
            />
          </Field>
          <Toggle label="Som ao fim do descanso" checked={profile.soundOnRestEnd} onChange={(v) => update({ soundOnRestEnd: v })} />
          <Toggle label="Vibrar ao fim do descanso" checked={profile.vibrateOnRestEnd} onChange={(v) => update({ vibrateOnRestEnd: v })} />
        </Card>

        <AccountCard />

        <Card className="space-y-3">
          <h2 className="font-semibold">Dados deste aparelho</h2>
          <p className="text-sm text-muted">Os registros ficam salvos no navegador e continuam disponíveis offline.</p>
          <Button block variant="secondary" onClick={doExport}>
            Exportar backup (JSON)
          </Button>
          <Button block variant="secondary" onClick={() => fileRef.current?.click()}>
            Importar backup
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void doImport(f);
              e.target.value = "";
            }}
          />
          <Button block variant="danger" onClick={() => setConfirmClear(true)}>
            Apagar dados locais
          </Button>
        </Card>

        {install && (
          <Button
            block
            onClick={async () => {
              await install.prompt().catch(() => undefined);
              setInstall(null);
            }}
          >
            Instalar aplicativo
          </Button>
        )}

        <HealthNotice />
        <p className="pb-2 text-center text-xs text-faint">
          Este aplicativo registra sua evolução individual. Não faz comparações com outras pessoas nem define metas estéticas.
        </p>
      </div>

      <Sheet open={confirmClear} onClose={() => setConfirmClear(false)} title="Apagar dados locais?">
        <p className="mb-4 text-muted">
          Sessões, exercícios personalizados e ajustes deste aparelho serão removidos. Dados já sincronizados permanecem na sua conta.
          Exporte um backup antes, se necessário.
        </p>
        <Button
          block
          variant="danger"
          onClick={async () => {
            try {
              await getSupabase()?.auth.signOut();
              await clearLocalData();
              setConfirmClear(false);
              toast("Dados locais apagados", "ok");
            } catch (err) {
              toast(err instanceof Error ? err.message : "Falha ao apagar", "error");
            }
          }}
        >
          Apagar
        </Button>
      </Sheet>
    </Page>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3">
      <span>{label}</span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-6 w-6 accent-[var(--color-accent)]" />
    </label>
  );
}

const STATE_LABEL: Record<SyncState, { text: string; tone: "ok" | "warn" | "danger" | "neutral" | "info" }> = {
  disabled: { text: "Modo local", tone: "neutral" },
  signed_out: { text: "Não conectado", tone: "neutral" },
  idle: { text: "Sincronizado", tone: "ok" },
  syncing: { text: "Sincronizando…", tone: "info" },
  offline: { text: "Offline", tone: "warn" },
  error: { text: "Erro", tone: "danger" },
  conflict: { text: "Conta diferente", tone: "danger" },
};

function AccountCard() {
  const { user, syncConfigured, requestSync, authReady } = useApp();
  const status = useSyncStatus();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const label = STATE_LABEL[status.state];

  if (!syncConfigured) {
    return (
      <Card className="space-y-2">
        <div className="flex items-center gap-2">
          <IconCloud size={20} className="text-muted" />
          <h2 className="flex-1 font-semibold">Conta e sincronização</h2>
          <Badge>Modo local</Badge>
        </div>
        <p className="text-sm text-muted">
          O Supabase não está configurado nesta instalação. Tudo funciona normalmente com os dados salvos neste aparelho.
        </p>
      </Card>
    );
  }

  async function auth(kind: "signin" | "signup" | "magic") {
    const client = getSupabase();
    if (!client) return;
    setErr(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErr("Informe um e-mail válido");
    if (kind !== "magic" && password.length < 8) return setErr("A senha deve ter ao menos 8 caracteres");
    if (!navigator.onLine) return setErr("Sem conexão. Conecte-se para entrar; seus registros continuam salvos no aparelho.");
    setBusy(true);
    try {
      const redirect = `${location.origin}${withBase("/perfil/")}`;
      const res =
        kind === "signin"
          ? await client.auth.signInWithPassword({ email: email.trim(), password })
          : kind === "signup"
            ? await client.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: redirect } })
            : await client.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirect } });
      if (res.error) throw res.error;
      if (kind === "magic") toast("Enviamos um link de acesso para o seu e-mail", "ok");
      else if (kind === "signup" && !res.data.session) toast("Confirme o cadastro pelo link enviado ao seu e-mail", "ok");
      setPassword("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha na autenticação");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <IconCloud size={20} className="text-muted" />
        <h2 className="flex-1 font-semibold">Conta e sincronização</h2>
        <Badge tone={label.tone}>{label.text}</Badge>
      </div>

      {!authReady ? (
        <p className="text-sm text-muted">Verificando sessão…</p>
      ) : user ? (
        <>
          <p className="text-sm">
            Conectado como <strong>{user.email}</strong>
          </p>
          <p className="text-sm text-muted">
            {status.pending > 0 ? `${status.pending} alteração(ões) aguardando envio. ` : "Nenhuma alteração pendente. "}
            {status.lastSyncAt ? `Última sincronização: ${formatDate(status.lastSyncAt, { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}.` : ""}
          </p>
          {status.error && (
            <p role="alert" className="rounded-xl border border-danger bg-danger-soft p-3 text-sm">
              {status.error}
            </p>
          )}
          {status.state === "conflict" && (
            <Button
              block
              variant="danger"
              onClick={async () => {
                try {
                  await clearLocalData();
                  requestSync();
                } catch (e) {
                  toast(e instanceof Error ? e.message : "Falha ao apagar", "error");
                }
              }}
            >
              Apagar dados locais e usar esta conta
            </Button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={requestSync} disabled={status.state === "syncing"}>
              Sincronizar agora
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                await getSupabase()?.auth.signOut();
                toast("Você saiu da conta. Os dados continuam neste aparelho.", "info");
              }}
            >
              Sair
            </Button>
          </div>
        </>
      ) : (
        <form
          className="space-y-3"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void auth("signin");
          }}
        >
          <p className="text-sm text-muted">Entre para guardar seus treinos na nuvem e usar em mais de um aparelho. O uso offline continua disponível.</p>
          <Field label="E-mail" htmlFor="au-email">
            <TextInput id="au-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Senha" htmlFor="au-pass" hint="Mínimo de 8 caracteres. Não é necessária para o link por e-mail.">
            <TextInput id="au-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {err && (
            <p role="alert" className="text-sm font-medium text-danger">
              {err}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button type="submit" disabled={busy}>
              Entrar
            </Button>
            <Button variant="secondary" onClick={() => auth("signup")} disabled={busy}>
              Criar conta
            </Button>
          </div>
          <Button block variant="ghost" onClick={() => auth("magic")} disabled={busy}>
            Receber link de acesso por e-mail
          </Button>
        </form>
      )}
    </Card>
  );
}
