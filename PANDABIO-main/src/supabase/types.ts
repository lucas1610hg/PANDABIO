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
          custom_domain?: string | null;
          custom_domain_verified: boolean;
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
          custom_domain?: string | null;
          custom_domain_verified?: boolean;
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
          custom_domain?: string | null;
          custom_domain_verified?: boolean;
        };
      };
      links: {
        Row: {
          id: string;
          profile_id: string;
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
          profile_id: string;
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
          profile_id?: string;
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
          profile_id: string;
          name: string;
          price: number;
          sales_count: number;
          status: 'active' | 'draft';
          image?: string;
          description?: string;
          source_url?: string;
          purchase_url?: string;
          purchase_type?: 'sales' | 'whatsapp';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          name: string;
          price: number;
          sales_count?: number;
          status?: 'active' | 'draft';
          image?: string;
          description?: string;
          source_url?: string;
          purchase_url?: string;
          purchase_type?: 'sales' | 'whatsapp';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          name?: string;
          price?: number;
          sales_count?: number;
          status?: 'active' | 'draft';
          image?: string;
          description?: string;
          source_url?: string;
          purchase_url?: string;
          purchase_type?: 'sales' | 'whatsapp';
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          profile_id: string;
          name: string;
          email: string;
          phone?: string;
          channel: string;
          link_id?: string;
          status?: 'new' | 'contacted' | 'interested' | 'converted' | 'lost';
          source?: string;
          medium?: string;
          campaign?: string;
          referrer?: string;
          landing_page?: string;
          device?: 'mobile' | 'desktop' | 'tablet';
          country?: string;
          city?: string;
          score?: number;
          interest?: 'low' | 'medium' | 'high';
          first_access_at?: string;
          last_access_at?: string;
          related_type?: 'product' | 'service' | 'link';
          related_name?: string;
          consent_at?: string;
          visitor_id?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          name: string;
          email: string;
          phone?: string;
          channel: string;
          link_id?: string;
          status?: 'new' | 'contacted' | 'interested' | 'converted' | 'lost';
          source?: string;
          medium?: string;
          campaign?: string;
          referrer?: string;
          landing_page?: string;
          device?: 'mobile' | 'desktop' | 'tablet';
          country?: string;
          city?: string;
          score?: number;
          interest?: 'low' | 'medium' | 'high';
          first_access_at?: string;
          last_access_at?: string;
          related_type?: 'product' | 'service' | 'link';
          related_name?: string;
          consent_at?: string;
          visitor_id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          name?: string;
          email?: string;
          phone?: string;
          channel?: string;
          link_id?: string;
          status?: 'new' | 'contacted' | 'interested' | 'converted' | 'lost';
          source?: string;
          medium?: string;
          campaign?: string;
          referrer?: string;
          landing_page?: string;
          device?: 'mobile' | 'desktop' | 'tablet';
          country?: string;
          city?: string;
          score?: number;
          interest?: 'low' | 'medium' | 'high';
          first_access_at?: string;
          last_access_at?: string;
          related_type?: 'product' | 'service' | 'link';
          related_name?: string;
          consent_at?: string;
          visitor_id?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          profile_id: string;
          title: string;
          subtitle: string;
          time_ago: string;
          type: 'lead' | 'clicks' | 'order' | 'visits';
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          title: string;
          subtitle: string;
          time_ago: string;
          type: 'lead' | 'clicks' | 'order' | 'visits';
          timestamp: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
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
          profile_id: string;
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
          profile_id: string;
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
          profile_id?: string;
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
