export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Role = 'vendedor' | 'gestor';
export type UserStatus = 'ativo' | 'inativo';
export type LeadStage = 'lead' | 'qualificado' | 'vendido' | 'perdido';
export type Probability = 'baixa' | 'média' | 'alta';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: Role;
          status: UserStatus;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: Role;
          status?: UserStatus;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: Role;
          status?: UserStatus;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          name: string;
          whatsapp: string | null;
          car_interest: string | null;
          origin: string | null;
          stage: LeadStage;
          assigned_to: string | null;
          entry_date: string;
          last_contact_date: string | null;
          next_action: string | null;
          next_action_date: string | null;
          probability: Probability | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          whatsapp?: string | null;
          car_interest?: string | null;
          origin?: string | null;
          stage?: LeadStage;
          assigned_to?: string | null;
          entry_date?: string;
          last_contact_date?: string | null;
          next_action?: string | null;
          next_action_date?: string | null;
          probability?: Probability | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          whatsapp?: string | null;
          car_interest?: string | null;
          origin?: string | null;
          stage?: LeadStage;
          assigned_to?: string | null;
          entry_date?: string;
          last_contact_date?: string | null;
          next_action?: string | null;
          next_action_date?: string | null;
          probability?: Probability | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'leads_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      lead_history: {
        Row: {
          id: string;
          lead_id: string;
          event_date: string;
          description: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          event_date?: string;
          description: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          event_date?: string;
          description?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lead_history_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lead_history_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: false;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          }
        ];
      };
      lead_actions: {
        Row: {
          id: string;
          lead_id: string;
          description: string;
          due_date: string | null;
          completed: boolean;
          completed_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          description: string;
          due_date?: string | null;
          completed?: boolean;
          completed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          description?: string;
          due_date?: string | null;
          completed?: boolean;
          completed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lead_actions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lead_actions_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: false;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          }
        ];
      };
      sales: {
        Row: {
          id: string;
          lead_id: string | null;
          seller_id: string | null;
          vehicle: string;
          sale_value: number;
          sale_date: string;
          origin: 'HS PRIME' | 'LOJA PARCEIRA' | null;
          commission_value: number | null;
          payment_method: string | null;
          down_payment: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          seller_id?: string | null;
          vehicle: string;
          sale_value: number;
          sale_date?: string;
          origin?: 'HS PRIME' | 'LOJA PARCEIRA' | null;
          commission_value?: number | null;
          payment_method?: string | null;
          down_payment?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string | null;
          seller_id?: string | null;
          vehicle?: string;
          sale_value?: number;
          sale_date?: string;
          origin?: 'HS PRIME' | 'LOJA PARCEIRA' | null;
          commission_value?: number | null;
          payment_method?: string | null;
          down_payment?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sales_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: false;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_seller_id_fkey';
            columns: ['seller_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      commission_settings: {
        Row: {
          id: string;
          car_origin: 'HS PRIME' | 'LOJA PARCEIRA';
          commission_value: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          car_origin: 'HS PRIME' | 'LOJA PARCEIRA';
          commission_value: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          car_origin?: 'HS PRIME' | 'LOJA PARCEIRA';
          commission_value?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      loss_reasons: {
        Row: {
          id: string;
          lead_id: string;
          reason: string;
          details: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          reason: string;
          details?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          reason?: string;
          details?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'loss_reasons_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: false;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
