import { useEffect, useState, useCallback } from 'react';
import { LinkService } from '../supabase/services/linkService';
import { ProductService } from '../supabase/services/productService';
import { LeadService } from '../supabase/services/leadService';
import { ActivityService } from '../supabase/services/activityService';
import { BioLink, ProductItem, LeadItem, ActivityItem, FunnelData } from '../types';
import { KpiData } from '../components/KpiMetrics';
import { isSupabaseConfigured } from '../supabase/client';

/**
 * Hook customizado para dados do PandaBio com Supabase
 * Substitui o uso de localStorage por banco de dados real
 */
export const useSupabaseData = () => {
  const [links, setLinks] = useState<BioLink[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados iniciais
  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [linksData, productsData, leadsData, activitiesData] = await Promise.all([
        LinkService.getLinks(),
        ProductService.getProducts(),
        LeadService.getLeads(),
        ActivityService.getActivities(20),
      ]);

      setLinks(linksData);
      setProducts(productsData);
      setLeads(leadsData);
      setActivities(activitiesData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Adicionar link
  const addLink = useCallback(async (link: Omit<BioLink, 'id'>) => {
    try {
      setError(null);
      const newLink = await LinkService.createLink(link);
      
      if (newLink) {
        setLinks(prev => [newLink, ...prev]);
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
  }, [loadData]);

  // Toggle link
  const toggleLink = useCallback(async (id: string) => {
    try {
      setError(null);
      const success = await LinkService.toggleLink(id);
      
      if (success) {
        setLinks(prev => prev.map(l => 
          l.id === id ? { ...l, active: !l.active } : l
        ));
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

  // Adicionar produto
  const addProduct = useCallback(async (product: Omit<ProductItem, 'id'>) => {
    try {
      setError(null);
      const newProduct = await ProductService.createProduct(product);
      
      if (newProduct) {
        setProducts(prev => [newProduct, ...prev]);
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
  }, [loadData]);

  // Adicionar lead
  const addLead = useCallback(async (lead: Omit<LeadItem, 'id' | 'createdAt'>) => {
    try {
      setError(null);
      const newLead = await LeadService.createLead(lead);
      
      if (newLead) {
        setLeads(prev => [newLead, ...prev]);
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
  }, [loadData]);

  // Cálculo de KPIs
  const realKpiData: KpiData = (() => {
    const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
    const totalLeads = leads.length;
    const totalConversions = products.reduce((sum, p) => sum + (p.salesCount || 0), 0);
    const estimatedVisits = totalClicks > 0 ? totalClicks * 2 : 0;
    const ctr = estimatedVisits > 0 ? (totalClicks / estimatedVisits) * 100 : 0;
    const leadRate = totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0;
    const convRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    return {
      visits: estimatedVisits,
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
    const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
    const totalLeads = leads.length;
    const totalConversions = products.reduce((sum, p) => sum + (p.salesCount || 0), 0);
    const estimatedVisits = totalClicks > 0 ? totalClicks * 2 : 0;

    return {
      visits: estimatedVisits,
      clicks: totalClicks,
      leads: totalLeads,
      conversions: totalConversions,
      ctr: estimatedVisits > 0 ? (totalClicks / estimatedVisits) * 100 : 0,
      leadRate: totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0,
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      leadToConversionRate: totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0,
    };
  })();

  return {
    links,
    products,
    leads,
    activities,
    loading,
    error,
    isSupabaseConfigured,
    addLink,
    toggleLink,
    addProduct,
    addLead,
    realKpiData,
    funnelData,
    refreshData: loadData,
  };
};