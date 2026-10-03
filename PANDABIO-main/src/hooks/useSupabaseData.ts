import { useEffect, useState, useCallback, useRef } from 'react';
import { LinkService } from '../supabase/services/linkService';
import { ProductService } from '../supabase/services/productService';
import { LeadService } from '../supabase/services/leadService';
import { ActivityService } from '../supabase/services/activityService';
import { ProfileService } from '../supabase/services/profileService';
import {
  BioLink,
  ProductItem,
  LeadItem,
  ActivityItem,
  FunnelData,
  UserProfile,
  LeadStatus,
} from '../types';
import { KpiData } from '../components/KpiMetrics';
import { isSupabaseConfigured, supabase } from '../supabase/client';
import {
  PublicAnalyticsService,
  PublicAnalyticsSummary,
} from '../supabase/services/publicAnalyticsService';

const emptyPublicAnalytics: PublicAnalyticsSummary = {
  visits: 0,
  clicks: 0,
  uniqueVisitors: 0,
  events: [],
  sales: [],
  salesAvailable: false,
};

/**
 * Hook customizado para dados do PandaBio com Supabase
 * Mantém dados da aplicação sincronizados exclusivamente com Supabase
 */
export const useSupabaseData = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [links, setLinks] = useState<BioLink[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [publicAnalytics, setPublicAnalytics] =
    useState<PublicAnalyticsSummary>(emptyPublicAnalytics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadRequestRef = useRef<Promise<void> | null>(null);

  // Carregar dados iniciais
  const loadData = useCallback(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return Promise.resolve();
    }

    if (loadRequestRef.current) return loadRequestRef.current;

    const request = (async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { session },
        } = await supabase!.auth.getSession();
        if (!session) {
          setUser(null);
          setLinks([]);
          setProducts([]);
          setLeads([]);
          setActivities([]);
          setPublicAnalytics(emptyPublicAnalytics);
          setLoading(false);
          return;
        }

        const [profileData, linksData, productsData, leadsData, activitiesData, analyticsData] =
          await Promise.all([
            ProfileService.getCurrentProfile(),
            LinkService.getLinks(),
            ProductService.getProducts(),
            LeadService.getLeads(),
            ActivityService.getActivities(20),
            PublicAnalyticsService.getSummary(),
          ]);

        setUser(profileData);
        setLinks(linksData);
        setProducts(productsData);
        setLeads(leadsData);
        setActivities(activitiesData);
        setPublicAnalytics(analyticsData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    })();

    loadRequestRef.current = request;
    void request.finally(() => {
      if (loadRequestRef.current === request) loadRequestRef.current = null;
    });
    return request;
  }, []);

  useEffect(() => {
    void loadData();

    if (!isSupabaseConfigured() || !supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setLinks([]);
        setProducts([]);
        setLeads([]);
        setActivities([]);
        setPublicAnalytics(emptyPublicAnalytics);
        setLoading(false);
        return;
      }
      window.setTimeout(() => void loadData(), 0);
    });

    return () => subscription.unsubscribe();
  }, [loadData]);

  // Adicionar link
  const addLink = useCallback(
    async (link: Omit<BioLink, 'id'>) => {
      try {
        setError(null);
        const newLink = await LinkService.createLink(link);

        if (newLink) {
          setLinks((prev) => [newLink, ...prev]);
          await ActivityService.logNewLink(link.title);
          await loadData(); // Recarregar atividades
          return { success: true };
        }

        setError('Erro ao criar link');
        return { success: false, error: 'Erro ao criar link' };
      } catch (err) {
        console.error('Error adding link:', err);
        setError('Erro ao criar link');
        return { success: false, error: 'Erro ao criar link' };
      }
    },
    [loadData],
  );

  // Toggle link
  const toggleLink = useCallback(async (id: string) => {
    try {
      setError(null);
      const success = await LinkService.toggleLink(id);

      if (success) {
        setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, active: !l.active } : l)));
        return { success: true };
      }

      setError('Erro ao atualizar link');
      return { success: false, error: 'Erro ao atualizar link' };
    } catch (err) {
      console.error('Error toggling link:', err);
      setError('Erro ao atualizar link');
      return { success: false, error: 'Erro ao atualizar link' };
    }
  }, []);

  // Reordenar links
  const reorderLinks = useCallback(async (reordered: BioLink[]) => {
    try {
      setError(null);
      const success = await LinkService.reorderLinks(reordered.map((link) => link.id));

      if (success) {
        setLinks(reordered);
        return { success: true };
      }

      setError('Erro ao reordenar links');
      return { success: false, error: 'Erro ao reordenar links' };
    } catch (err) {
      console.error('Error reordering links:', err);
      setError('Erro ao reordenar links');
      return { success: false, error: 'Erro ao reordenar links' };
    }
  }, []);

  // Adicionar produto
  const addProduct = useCallback(
    async (product: Omit<ProductItem, 'id'>) => {
      try {
        setError(null);
        const newProduct = await ProductService.createProduct(product);

        if (newProduct) {
          setProducts((prev) => [newProduct, ...prev]);
          await ActivityService.logNewProduct(product.name, product.price);
          await loadData(); // Recarregar atividades
          return { success: true };
        }

        setError('Erro ao criar produto');
        return { success: false, error: 'Erro ao criar produto' };
      } catch (err) {
        console.error('Error adding product:', err);
        setError('Erro ao criar produto');
        return { success: false, error: 'Erro ao criar produto' };
      }
    },
    [loadData],
  );

  // Alternar status de produto
  const toggleProduct = useCallback(async (id: string, currentStatus: ProductItem['status']) => {
    try {
      setError(null);
      const nextStatus = currentStatus === 'active' ? 'draft' : 'active';
      const success = await ProductService.updateProduct(id, { status: nextStatus });

      if (success) {
        setProducts((prev) =>
          prev.map((product) => (product.id === id ? { ...product, status: nextStatus } : product)),
        );
        return { success: true };
      }

      setError('Erro ao atualizar produto');
      return { success: false, error: 'Erro ao atualizar produto' };
    } catch (err) {
      console.error('Error toggling product:', err);
      setError('Erro ao atualizar produto');
      return { success: false, error: 'Erro ao atualizar produto' };
    }
  }, []);

  // Atualizar produto
  const updateProduct = useCallback(async (id: string, updates: Partial<ProductItem>) => {
    try {
      setError(null);
      const success = await ProductService.updateProduct(id, updates);

      if (success) {
        setProducts((prev) =>
          prev.map((product) => (product.id === id ? { ...product, ...updates, id } : product)),
        );
        return { success: true };
      }

      setError('Erro ao atualizar produto');
      return { success: false, error: 'Erro ao atualizar produto' };
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Erro ao atualizar produto');
      return { success: false, error: 'Erro ao atualizar produto' };
    }
  }, []);

  // Atualizar perfil
  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      const previousProfile = user;
      if (previousProfile) {
        setUser({ ...previousProfile, ...updates });
      }

      try {
        setError(null);
        const updatedProfile = await ProfileService.upsertProfile(updates);

        if (updatedProfile) {
          setUser(updatedProfile);
          return { success: true, profile: updatedProfile };
        }

        if (previousProfile) setUser(previousProfile);
        setError('Erro ao atualizar perfil');
        return { success: false, error: 'Erro ao atualizar perfil' };
      } catch (err) {
        console.error('Error updating profile:', err);
        if (previousProfile) setUser(previousProfile);
        setError('Erro ao atualizar perfil');
        return { success: false, error: 'Erro ao atualizar perfil' };
      }
    },
    [user],
  );

  // Atualizar plano
  const upgradeToPro = useCallback(async () => {
    try {
      setError(null);
      const success = await ProfileService.upgradeToPro();

      if (success) return { success: true };

      setError('Erro ao atualizar plano');
      return { success: false, error: 'Erro ao atualizar plano' };
    } catch (err) {
      console.error('Error upgrading plan:', err);
      setError('Erro ao atualizar plano');
      return { success: false, error: 'Erro ao atualizar plano' };
    }
  }, []);

  // Adicionar lead
  const addLead = useCallback(
    async (lead: Omit<LeadItem, 'id' | 'createdAt'>) => {
      try {
        setError(null);
        const newLead = await LeadService.createLead(lead);

        if (newLead) {
          setLeads((prev) => [newLead, ...prev]);
          await ActivityService.logNewLead(lead.name);
          await loadData(); // Recarregar atividades
          return { success: true };
        }

        setError('Erro ao criar lead');
        return { success: false, error: 'Erro ao criar lead' };
      } catch (err) {
        console.error('Error adding lead:', err);
        setError('Erro ao criar lead');
        return { success: false, error: 'Erro ao criar lead' };
      }
    },
    [loadData],
  );

  const updateLeadStatus = useCallback(async (id: string, status: LeadStatus) => {
    try {
      setError(null);
      const updatedLead = await LeadService.updateLead(id, { status });
      if (!updatedLead) {
        setError('Erro ao atualizar status do lead');
        return { success: false, error: 'Erro ao atualizar status do lead' };
      }
      setLeads((previous) =>
        previous.map((lead) => (lead.id === id ? { ...lead, ...updatedLead } : lead)),
      );
      return { success: true, lead: updatedLead };
    } catch (err) {
      console.error('Error updating lead status:', err);
      setError('Erro ao atualizar status do lead');
      return { success: false, error: 'Erro ao atualizar status do lead' };
    }
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    try {
      setError(null);
      const success = await LeadService.deleteLead(id);
      if (!success) {
        setError('Erro ao excluir lead');
        return { success: false, error: 'Erro ao excluir lead' };
      }
      setLeads((previous) => previous.filter((lead) => lead.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Error deleting lead:', err);
      setError('Erro ao excluir lead');
      return { success: false, error: 'Erro ao excluir lead' };
    }
  }, []);

  // Cálculo de KPIs
  const realKpiData: KpiData = (() => {
    const totalClicks =
      publicAnalytics.clicks || links.reduce((sum, l) => sum + (l.clicks || 0), 0);
    const totalLeads = leads.length;
    const totalConversions = products.reduce((sum, p) => sum + (p.salesCount || 0), 0);
    const visits = publicAnalytics.visits;
    const ctr = visits > 0 ? (totalClicks / visits) * 100 : 0;
    const leadRate = totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0;
    const convRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    return {
      visits,
      visitsGrowth: 0,
      ctrGeneral: ctr,
      clicks: totalClicks,
      clicksGrowth: 0,
      clickRate: ctr,
      leads: totalLeads,
      leadsGrowth: 0,
      leadConversionRate: leadRate,
      conversions: totalConversions,
      conversionsGrowth: 0,
      finalConversionRate: convRate,
    };
  })();

  // Cálculo de Funil
  const funnelData: FunnelData = (() => {
    const totalClicks =
      publicAnalytics.clicks || links.reduce((sum, l) => sum + (l.clicks || 0), 0);
    const totalLeads = leads.length;
    const totalConversions = products.reduce((sum, p) => sum + (p.salesCount || 0), 0);
    const visits = publicAnalytics.visits;

    return {
      visits,
      clicks: totalClicks,
      leads: totalLeads,
      conversions: totalConversions,
      ctr: visits > 0 ? (totalClicks / visits) * 100 : 0,
      leadRate: totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0,
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      leadToConversionRate: totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0,
    };
  })();

  return {
    user,
    links,
    products,
    leads,
    activities,
    publicAnalytics,
    loading,
    error,
    isSupabaseConfigured,
    addLink,
    toggleLink,
    reorderLinks,
    addProduct,
    toggleProduct,
    updateProduct,
    addLead,
    updateLeadStatus,
    deleteLead,
    updateProfile,
    upgradeToPro,
    realKpiData,
    funnelData,
    refreshData: loadData,
  };
};
