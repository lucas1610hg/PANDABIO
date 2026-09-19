/**
 * Tipos do banco de dados Supabase
 * Baseados nos tipos do aplicativo existentes
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          username: string;
          email: string;
          plan: 'Gratuito' | 'PRO';
          bio_url: string;
          page_title: string;
          bio_description: string;
          avatar_url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          username: string;
          email: string;
          plan?: 'Gratuito' | 'PRO';
          bio_url: string;
          page_title: string;
          bio_description?: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          username?: string;
          email?: string;
          plan?: 'Gratuito' | 'PRO';
          bio_url?: string;
          page_title?: string;
          bio_description?: string;
          avatar_url?: string;
          updated_at?: string;
        };
      };
      links: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          url: string;
          clicks: number;
          leads: number;
          active: boolean;
          icon: string;
          type: 'social' | 'whatsapp' | 'portfolio' | 'store' | 'custom';
          link_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          url: string;
          clicks?: number;
          leads?: number;
          active?: boolean;
          icon?: string;
          type: 'social' | 'whatsapp' | 'portfolio' | 'store' | 'custom';
          link_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          url?: string;
          clicks?: number;
          leads?: number;
          active?: boolean;
          icon?: string;
          type?: 'social' | 'whatsapp' | 'portfolio' | 'store' | 'custom';
          link_order?: number;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          price: number;
          sales_count: number;
          status: 'active' | 'draft';
          image?: string;
          description?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          price: number;
          sales_count?: number;
          status?: 'active' | 'draft';
          image?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          price?: number;
          sales_count?: number;
          status?: 'active' | 'draft';
          image?: string;
          description?: string;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          phone?: string;
          channel: string;
          link_id?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email: string;
          phone?: string;
          channel: string;
          link_id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string;
          phone?: string;
          channel?: string;
          link_id?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          subtitle: string;
          time_ago: string;
          type: 'lead' | 'clicks' | 'order' | 'visits';
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          subtitle: string;
          time_ago: string;
          type: 'lead' | 'clicks' | 'order' | 'visits';
          timestamp: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          subtitle?: string;
          time_ago?: string;
          type?: 'lead' | 'clicks' | 'order' | 'visits';
          timestamp?: string;
        };
      };
      analytics: {
        Row: {
          id: string;
          user_id: string;
          link_id: string;
          event_type: 'click' | 'view' | 'conversion';
          device_type: 'mobile' | 'desktop' | 'tablet';
          referrer?: string;
          ip_address?: string;
          user_agent?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          link_id: string;
          event_type: 'click' | 'view' | 'conversion';
          device_type: 'mobile' | 'desktop' | 'tablet';
          referrer?: string;
          ip_address?: string;
          user_agent?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          link_id?: string;
          event_type?: 'click' | 'view' | 'conversion';
          device_type?: 'mobile' | 'desktop' | 'tablet';
          referrer?: string;
          ip_address?: string;
          user_agent?: string;
        };
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
  };
}