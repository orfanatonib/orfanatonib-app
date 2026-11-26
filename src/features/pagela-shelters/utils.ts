import { useEffect, useState } from "react";
import type { Weekday } from "@/features/shelters/types";

export const WEEKDAY_PT: Record<Weekday, string> = {
    monday: "Segunda",
    tuesday: "Terça",
    wednesday: "Quarta",
    thursday: "Quinta",
    friday: "Sexta",
    saturday: "Sábado",
    sunday: "Domingo",
};

export function useDebounced<T>(value: T, delay = 350) {
    const [v, setV] = useState(value);
    useEffect(() => { const id = setTimeout(() => setV(value), delay); return () => clearTimeout(id); }, [value, delay]);
    return v;
}

/** `AAAA-MM-DD` é data de calendário: não passa por `Date` (UTC) para não voltar um dia em fusos negativos. */
const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function fmtDate(isoLike: string) {
    const calendar = CALENDAR_DATE.exec(isoLike);
    if (calendar) return `${calendar[3]}/${calendar[2]}/${calendar[1]}`;
    const d = new Date(isoLike);
    if (Number.isNaN(d.getTime())) return isoLike;
    return d.toLocaleDateString("pt-BR");
}

export function formatPhone(p?: string) {
    if (!p) return "-";
    const digits = p.replace(/\D/g, "");
    if (digits.length >= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    if (digits.length >= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
    return p;
}
