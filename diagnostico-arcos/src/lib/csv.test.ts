import { describe, expect, it } from "vitest";
import { celulaCsv, linhasParaCsv } from "./csv";

describe("csv", () => {
  it("neutraliza fórmulas e escapa separadores e aspas", () => {
    expect(celulaCsv("=1+1")).toBe("'=1+1");
    expect(celulaCsv("-2")).toBe("'-2");
    expect(celulaCsv("@SOMA(A1)")).toBe("'@SOMA(A1)");
    expect(celulaCsv('Ana; "Lu"')).toBe('"Ana; ""Lu"""');
    expect(celulaCsv(null)).toBe("");
    expect(celulaCsv(12.5)).toBe("12.5");
  });
  it("monta linhas com BOM", () => {
    expect(linhasParaCsv([["a", 1], ["b", null]])).toBe("﻿a;1\r\nb;\r\n");
  });
});
