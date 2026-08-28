import { MESES, STAGES, type StageKey } from '@/lib/leads/constants';

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function monthKey(iso: string | null) {
  return iso && iso.length >= 7 ? iso.slice(0, 7) : '';
}

export function currentMonthKey() {
  return todayStr().slice(0, 7);
}

export function monthLabel(key: string) {
  if (!key || key === 'todos') return '';
  const [ano, mes] = key.split('-');
  const idx = parseInt(mes, 10) - 1;
  return `${(MESES[idx] || '').toUpperCase()} ${ano}`;
}

export function fmtDateShort(iso: string | null) {
  if (!iso) return '—';
  const p = iso.split('-');
  if (p.length !== 3) return iso;
  return `${p[2]}/${p[1]}`;
}

export function daysBetween(fromIso: string, toIso: string) {
  const a = new Date(fromIso + 'T00:00:00');
  const b = new Date(toIso + 'T00:00:00');
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function stageColor(key: string) {
  return STAGES.find((s) => s.key === key)?.color ?? '#5b8def';
}

export type Alerta = { level: 'atrasado' | 'hoje' | 'amanha' | 'futuro'; text: string; date: string } | null;

export function getAlerta(stage: StageKey | string, nextActionDate: string | null): Alerta {
  if (stage === 'vendido' || stage === 'perdido') return null;
  if (!nextActionDate) return null;
  const diff = daysBetween(todayStr(), nextActionDate);
  if (diff < 0) return { level: 'atrasado', text: `${Math.abs(diff)}d atrasado`, date: nextActionDate };
  if (diff === 0) return { level: 'hoje', text: 'Hoje', date: nextActionDate };
  if (diff === 1) return { level: 'amanha', text: 'Amanhã', date: nextActionDate };
  return { level: 'futuro', text: fmtDateShort(nextActionDate), date: nextActionDate };
}
