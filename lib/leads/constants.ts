export const STAGES = [
  { key: 'lead', label: 'LEAD', color: '#5b8def' },
  { key: 'qualificado', label: 'QUALIFICADO', color: '#a78bfa' },
  { key: 'vendido', label: 'VENDIDO', color: '#00c2a8' },
  { key: 'perdido', label: 'PERDIDO', color: '#ff5a5f' },
] as const;

export type StageKey = typeof STAGES[number]['key'];
export const STAGE_KEYS = STAGES.map((s) => s.key);
export const STAGE_LABEL: Record<string, string> = Object.fromEntries(STAGES.map((s) => [s.key, s.label]));

export const ORIGENS = [
  'Facebook Ads',
  'Instagram Ads',
  'Facebook Marketplace',
  'Instagram',
  'WhatsApp',
  'Indicação',
  'Orgânico',
  'Outro',
] as const;

export const MOTIVOS_PERDA = [
  'Comprou de outra loja',
  'Sem dinheiro',
  'Financiamento negado',
  'Desistiu',
  'Não respondeu',
  'Preço',
  'Não encontrou o veículo',
  'Outro',
] as const;

export const PROBABILIDADES = ['baixa', 'média', 'alta'] as const;

export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
