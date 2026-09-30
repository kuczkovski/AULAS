"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getBackend } from "@/lib/backend";
import { gravarDados, lerDados, lerId, mesclar, sincronizar, type DadosLocais } from "@/lib/sessao";
import { ErroNegocio, type EstadoTentativa } from "@/lib/tipos";

export interface Sessao {
  id: string;
  dados: DadosLocais;
  atualizar: () => void;
}

/**
 * Carrega a tentativa em andamento (id guardado no navegador + estado do servidor).
 * Sem id, volta para a tela inicial; tentativa já encerrada vai para /concluido
 * (a não ser que `permitirEncerrada`, usado pela própria tela de encerramento).
 */
export function useTentativa(opts: { permitirEncerrada?: boolean } = {}) {
  const router = useRouter();
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [estado, setEstado] = useState<EstadoTentativa | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const idRef = useRef<string | null>(null);

  const atualizar = useCallback(() => {
    const id = idRef.current;
    if (!id) return;
    const d = lerDados(id);
    if (d) setSessao({ id, dados: { ...d }, atualizar });
  }, []);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const id = lerId();
      if (!id) { router.replace("/"); return; }
      idRef.current = id;
      try {
        const backend = await getBackend();
        // manda primeiro o que ficou pendente de uma queda anterior
        await sincronizar(id).catch(() => undefined);
        const e = await backend.obter(id);
        if (!vivo) return;
        if (e.status !== "em_andamento" && !opts.permitirEncerrada) { router.replace("/concluido"); return; }
        gravarDados(id, mesclar(e, lerDados(id)));
        setEstado(e);
        atualizar();
      } catch (e) {
        if (!vivo) return;
        if (e instanceof ErroNegocio) { router.replace("/"); return; }
        // sem conexão: segue com o que está guardado neste aparelho
        const d = lerDados(id);
        if (!d) { setErro("Sem conexão com o servidor. Conecte-se à internet e recarregue a página."); return; }
        setOffline(true);
        atualizar();
      }
    })();
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { sessao, estado, erro, offline, setOffline };
}
