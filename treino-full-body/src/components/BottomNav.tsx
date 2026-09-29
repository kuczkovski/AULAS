"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHistory, IconProgram, IconToday, IconUser } from "./icons";

const ITEMS = [
  { href: "/", label: "Hoje", Icon: IconToday, match: (p: string) => p === "/" },
  { href: "/programa/", label: "Programa", Icon: IconProgram, match: (p: string) => p.startsWith("/programa") },
  { href: "/historico/", label: "Histórico", Icon: IconHistory, match: (p: string) => p.startsWith("/historico") },
  { href: "/perfil/", label: "Perfil", Icon: IconUser, match: (p: string) => p.startsWith("/perfil") },
];

export function BottomNav() {
  const pathname = usePathname() ?? "/";
  // A tela de treino ocupa a tela inteira para reduzir distrações.
  if (pathname.startsWith("/treino")) return null;
  return (
    <nav aria-label="Navegação principal" className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 backdrop-blur">
      <ul className="mx-auto grid h-[var(--nav-h)] max-w-xl grid-cols-4">
        {ITEMS.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-xs font-semibold transition ${active ? "text-accent" : "text-muted hover:text-ink"}`}
              >
                <Icon size={24} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
