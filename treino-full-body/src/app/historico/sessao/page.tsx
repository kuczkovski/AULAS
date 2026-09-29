import { Suspense } from "react";
import { SessionDetail } from "@/components/SessionDetail";

export default function SessaoPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted">Carregando…</div>}>
      <SessionDetail />
    </Suspense>
  );
}
