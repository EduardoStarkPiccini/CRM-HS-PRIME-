import type { Database } from '@/types/database.types';

export type Lead = Database['public']['Tables']['leads']['Row'];
export type Vendedor = { id: string; full_name: string; status?: string };
export type HistoryEntry = { id: string; event_date: string; description: string; created_at: string };
