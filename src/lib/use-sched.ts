import { useMemo } from "react";
import { useStore } from "./store";
import type { SchedData } from "./schedule";

export function useSched(): SchedData {
  const shifts = useStore((s) => s.shifts);
  const skips = useStore((s) => s.skips);
  const timeOff = useStore((s) => s.timeOff);
  const appts = useStore((s) => s.appts);
  return useMemo(() => ({ shifts, skips, timeOff, appts }), [shifts, skips, timeOff, appts]);
}

export const fmtH = (min: number) => { const h = min / 60; return `${Number.isInteger(h) ? h : h.toFixed(1)} h`; };
