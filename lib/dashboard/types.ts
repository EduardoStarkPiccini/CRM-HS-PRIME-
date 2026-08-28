import type { Lead } from '@/lib/leads/types';
import type { Database } from '@/types/database.types';

export type Sale = Database['public']['Tables']['sales']['Row'];
export type LossReason = { id: string; lead_id: string; reason: string };
export type VendedorInfo = { id: string; full_name: string; avatar_url: string | null };

export type DashboardFilters = {
  ano: string;
  mes: string; // '01'..'12' ou 'todos'
  vendedorId: string; // 'todos' ou um id
  origemCarro: string; // 'todos' | 'HS PRIME' | 'LOJA PARCEIRA'
  origemLead: string; // 'todos' | uma das ORIGENS
};

export type Stats = {
  totalLeads: number;
  qualificados: number;
  vendidos: number;
  perdidos: number;
  taxaConversao: number;
  carrosVendidos: number;
  faturamento: number;
  ticketMedio: number;
  comissaoTotal: number;
  hsPrime: { qtd: number; faturamento: number; comissao: number };
  lojaParceira: { qtd: number; faturamento: number; comissao: number };
};
