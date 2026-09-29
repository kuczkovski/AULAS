"use client";

import Link from "next/link";
import { useState } from "react";
import { IconPlus, IconRight } from "@/components/icons";
import { Badge, EmptyState, LinkButton, Page, PageHeader, Select, TextInput } from "@/components/ui";
import { useExercises } from "@/lib/hooks";
import { EQUIPMENT_LABELS, MUSCLE_GROUPS, MUSCLE_LABELS, type MuscleGroup } from "@/lib/types";

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function ExercisesPage() {
  const exercises = useExercises();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<MuscleGroup | "">("");

  const list = (exercises ?? []).filter((e) => (!group || e.muscleGroup === group) && (!q || normalize(e.name).includes(normalize(q))));

  return (
    <Page>
      <PageHeader
        title="Exercícios"
        back="/programa/"
        action={
          <LinkButton href="/programa/exercicio/editar/" size="md">
            <IconPlus size={18} /> Novo
          </LinkButton>
        }
      />
      <div className="mb-4 grid grid-cols-[1fr_auto] gap-2">
        <TextInput type="search" aria-label="Buscar exercício" placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select aria-label="Filtrar por grupo muscular" value={group} onChange={(e) => setGroup(e.target.value as MuscleGroup | "")} className="!w-40">
          <option value="">Todos</option>
          {MUSCLE_GROUPS.map((g) => (
            <option key={g} value={g}>
              {MUSCLE_LABELS[g]}
            </option>
          ))}
        </Select>
      </div>
      {exercises && list.length === 0 ? (
        <EmptyState title="Nenhum exercício encontrado" />
      ) : (
        <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
          {list.map((e) => (
            <li key={e.id}>
              <Link href={`/programa/exercicio/?id=${e.id}`} className="flex min-h-16 items-center gap-3 px-4 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{e.name}</span>
                  <span className="block text-xs text-muted">
                    {MUSCLE_LABELS[e.muscleGroup]} · {EQUIPMENT_LABELS[e.equipment]} · {e.alternativeIds.length} alternativas
                  </span>
                </span>
                {e.custom && <Badge tone="accent">Seu</Badge>}
                <IconRight className="text-faint" size={18} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
