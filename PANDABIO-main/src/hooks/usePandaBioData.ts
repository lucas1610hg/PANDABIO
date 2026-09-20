import { useMemo } from 'react';
import { usePandaBioStore } from '../store/usePandaBioStore';
import { KpiData } from '../components/KpiMetrics';
import { BioLink, ProductItem, FunnelData } from '../types';

/**
 * Hook customizado para extrair lógica de cálculo de dados do PandaBio
 * Remove lógica de negócio dos componentes e centraliza cálculos
 */
export const usePandaBioData = () => {
  const currentAccount = usePandaBioStore(state => state.getCurrentAccount());
  const user = currentAccount.profile;
  const links = currentAccount.links;
  const products = currentAccount.products;
  const leads = currentAccount.leads;
  const activities = currentAccount.activities;
  
  // Cálculo de KPIs memoizado
  const realKpiData: KpiData = useMemo(() => {
    const totalClicks = links.reduce((sum: number, l: BioLink) => sum + (l.clicks || 0), 0);
    const totalLeads = leads.length;
    const totalConversions = products.reduce((sum: number, p: ProductItem) => sum + (p.salesCount || 0), 0);
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
  }, [links, leads, products]);

  // Cálculo de Funil memoizado
  const funnelData: FunnelData = useMemo(() => {
    const totalClicks = links.reduce((sum: number, l: BioLink) => sum + (l.clicks || 0), 0);
    const totalLeads = leads.length;
    const totalConversions = products.reduce((sum: number, p: ProductItem) => sum + (p.salesCount || 0), 0);
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
  }, [links, leads, products]);

  return {
    user,
    links,
    products,
    leads,
    activities,
    realKpiData,
    funnelData,
  };
};