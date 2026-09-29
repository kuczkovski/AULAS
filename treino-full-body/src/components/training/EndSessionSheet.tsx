"use client";

import { useState } from "react";
import { Button, Field, Sheet, TextInput } from "../ui";

export function EndSessionSheet({
  open,
  onClose,
  done,
  total,
  onFinish,
  onDiscard,
}: {
  open: boolean;
  onClose: () => void;
  done: number;
  total: number;
  onFinish: (status: "completed" | "interrupted", reason: string | null) => void;
  onDiscard: () => void;
}) {
  const [reason, setReason] = useState("");
  const complete = done >= total && total > 0;

  return (
    <Sheet open={open} onClose={onClose} title="Encerrar sessão">
      <div className="space-y-4">
        <p className="tabular text-muted">
          {done} de {total} séries concluídas.
        </p>
        {complete ? (
          <Button block size="xl" onClick={() => onFinish("completed", null)}>
            Concluir sessão
          </Button>
        ) : (
          <>
            <Button block size="xl" onClick={() => onFinish("completed", null)} disabled={done === 0}>
              Concluir com o que foi feito
            </Button>
            <Field label="Motivo da interrupção (opcional)" htmlFor="end-reason">
              <TextInput id="end-reason" value={reason} maxLength={120} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: falta de tempo, cansaço" />
            </Field>
            <Button block variant="warn" onClick={() => onFinish("interrupted", reason.trim() || null)} disabled={done === 0}>
              Marcar como interrompida
            </Button>
          </>
        )}
        {done === 0 && (
          <Button block variant="danger" onClick={onDiscard}>
            Descartar sessão (nada foi registrado)
          </Button>
        )}
        <Button block variant="ghost" onClick={onClose}>
          Voltar ao treino
        </Button>
      </div>
    </Sheet>
  );
}
