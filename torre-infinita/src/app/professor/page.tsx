import type { Metadata } from "next";
import { PainelProfessor } from "@/components/PainelProfessor";

export const metadata: Metadata = { title: "Professor · Torre Infinita", robots: { index: false } };

export default function ProfessorPage() {
  return <PainelProfessor />;
}
