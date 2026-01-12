export function digitsOnly(input: unknown): string {
  return String(input ?? "").replace(/\D/g, "");
}

export function maskDateBR(raw: string): string {
  const digits = digitsOnly(raw).slice(0, 8); 
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  if (digits.length <= 2) return dd;
  if (digits.length <= 4) return `${dd}/${mm}`;
  return `${dd}/${mm}/${yyyy}`;
}

export function formatDateBR(raw?: string | null): string {
  if (!raw) return "";
  const v = String(raw).trim();
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return v;
}

export function maskCEP(raw: string): string {
  const digits = digitsOnly(raw).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function maskPhoneBR(raw: string): string {
  const digitsAll = digitsOnly(raw).slice(0, 13);
  const hasCC = digitsAll.startsWith("55") && digitsAll.length > 11;
  const cc = hasCC ? "55" : "";
  const digits = hasCC ? digitsAll.slice(2) : digitsAll; 

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);

  let formatted = "";
  if (!ddd) formatted = "";
  else if (digits.length <= 2) formatted = `(${ddd}`;
  else {
    const isMobile = rest.length >= 9; 
    const part1Len = isMobile ? 5 : 4;
    const part1 = rest.slice(0, part1Len);
    const part2 = rest.slice(part1Len, part1Len + 4);
    formatted = `(${ddd}) ${part1}${part2 ? `-${part2}` : ""}`;
  }

  return cc ? `+${cc} ${formatted}`.trim() : formatted;
}

