import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, CreditCard, Crown, HelpCircle, Sparkles, Zap } from 'lucide-react';
import { PANDABIO_ASSETS } from '../constants/assets';
import type { UserProfile } from '../types';

type BillingCycle = 'monthly' | 'annual';

type Plan = {
  id: 'free' | 'creator' | 'pro' | 'business';
  name: string;
  description: string;
  monthly: number;
  annual: number;
  accent: string;
  featured?: boolean;
  features: string[];
};

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    description: 'Comece sua presença digital sem custo.',
    monthly: 0,
    annual: 0,
    accent: '#64748b',
    features: ['1 página pública', 'Até 5 links', 'Até 3 produtos', 'Analytics dos últimos 7 dias', 'Marca PandaBio'],
  },
  {
    id: 'creator',
    name: 'Creator',
    description: 'Mais controle para criadores e profissionais.',
    monthly: 14.9,
    annual: 149,
    accent: '#0284c7',
    features: ['Links ilimitados', 'Até 20 produtos', 'Analytics por 90 dias', 'Analytics detalhado de produtos', 'Leads e agendamentos básicos'],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Ferramentas completas para vender e crescer.',
    monthly: 29.9,
    annual: 299,
    accent: '#ff7a00',
    featured: true,
    features: ['Tudo do Creator', 'Analytics histórico completo', 'Domínio próprio', 'Exportação de leads', 'Pixel e Google Analytics', 'Agendamentos completos'],
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Estrutura para equipes e operações maiores.',
    monthly: 79.9,
    annual: 799,
    accent: '#3525cd',
    features: ['Tudo do Pro', 'Múltiplos profissionais', 'Workspaces adicionais', 'Relatórios avançados', 'Equipe e permissões', 'Suporte prioritário'],
  },
];

const formatPrice = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface PlanSectionProps {
  user?: UserProfile;
}

export const PlanSection: React.FC<PlanSectionProps> = ({ user }) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#101321] p-4 text-white shadow-[0_20px_70px_rgba(19,27,46,0.18)] sm:p-7 lg:p-9">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#ff7a00]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-[#3525cd]/25 blur-3xl" />
      <div className="relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-3">
              <img src={PANDABIO_ASSETS.logoDark} alt="PandaBio" className="h-8 w-auto" />
              <span className="rounded-full bg-[#ff7a00] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]">Planos PandaBio</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Escolha o ritmo do seu crescimento.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/65 sm:text-base">Planos claros para transformar sua bio em uma experiência profissional, mensurável e pronta para vender.</p>
          </div>
          <motion.img
            src={PANDABIO_ASSETS.mascot3D}
            alt="Mascote PandaBio"
            className="mx-auto h-36 w-auto object-contain drop-shadow-2xl lg:mx-0 lg:h-44"
            animate={{ y: [0, -8, 0], rotate: [0, 2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="mt-8 flex flex-col gap-4 border-y border-white/10 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold">{user?.plan === 'PRO' ? 'Plano atual: Pro' : 'Plano atual: Gratuito'}</p>
            <p className="mt-1 text-xs text-white/50">Pagamento Stripe será conectado quando suas chaves estiverem configuradas.</p>
          </div>
          <div className="flex rounded-xl bg-white/10 p-1">
            {(['monthly', 'annual'] as BillingCycle[]).map((cycle) => (
              <button key={cycle} type="button" onClick={() => setBillingCycle(cycle)} className={`rounded-lg px-4 py-2 text-xs font-bold transition ${billingCycle === cycle ? 'bg-[#ff7a00] text-white shadow-lg' : 'text-white/60 hover:text-white'}`}>
                {cycle === 'monthly' ? 'Mensal' : 'Anual · economize'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7 grid gap-4 xl:grid-cols-4">
          {plans.map((plan, index) => {
            const price = billingCycle === 'monthly' ? plan.monthly : plan.annual / 12;
            const isCurrent = (user?.plan === 'PRO' && plan.id === 'pro') || (!user?.plan || user.plan === 'Gratuito') && plan.id === 'free';
            return (
              <motion.article key={plan.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} whileHover={{ y: -6 }} className={`relative flex flex-col rounded-3xl border p-5 ${plan.featured ? 'border-[#ff7a00] bg-white text-[#131b2e] shadow-[0_15px_45px_rgba(255,122,0,0.22)]' : 'border-white/10 bg-white/[0.07] text-white'}`}>
                {plan.featured && <div className="absolute -top-3 left-5 rounded-full bg-[#ff7a00] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white"><Sparkles className="mr-1 inline h-3 w-3" />Mais escolhido</div>}
                <div className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: `${plan.accent}22`, color: plan.accent }}><Crown className="h-5 w-5" /></div>{isCurrent && <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-400">Atual</span>}</div>
                <h2 className="mt-5 text-xl font-black">{plan.name}</h2>
                <p className={`mt-2 min-h-10 text-xs leading-5 ${plan.featured ? 'text-[#777587]' : 'text-white/55'}`}>{plan.description}</p>
                <div className="mt-5"><span className="text-3xl font-black">{price === 0 ? 'Grátis' : formatPrice(price)}</span>{price > 0 && <span className={`text-xs ${plan.featured ? 'text-[#777587]' : 'text-white/50'}`}> /mês</span>}</div>
                <div className={`my-5 h-px ${plan.featured ? 'bg-[#eaedff]' : 'bg-white/10'}`} />
                <ul className="flex flex-1 flex-col gap-3">{plan.features.map((feature) => <li key={feature} className={`flex gap-2 text-xs ${plan.featured ? 'text-[#464555]' : 'text-white/75'}`}><Check className="h-4 w-4 shrink-0 text-emerald-400" />{feature}</li>)}</ul>
                <button type="button" disabled={isCurrent} onClick={() => setSelectedPlan(plan.id)} className={`mt-7 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-black transition ${isCurrent ? 'cursor-default bg-white/10 text-white/40' : plan.featured ? 'bg-[#ff7a00] text-white hover:brightness-110' : 'bg-white text-[#131b2e] hover:bg-[#ff7a00] hover:text-white'}`}><CreditCard className="h-4 w-4" />{isCurrent ? 'Plano atual' : `Escolher ${plan.name}`}</button>
              </motion.article>
            );
          })}
        </div>

        {selectedPlan && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#ff7a00]/30 bg-[#ff7a00]/10 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"><span><b>{plans.find((plan) => plan.id === selectedPlan)?.name}</b> selecionado. Stripe ficará disponível após configuração das chaves e Price IDs.</span><button type="button" onClick={() => setSelectedPlan(null)} className="flex items-center gap-2 text-xs font-bold text-[#ffb37a]"><HelpCircle className="h-4 w-4" />Entendi</button></motion.div>}
        <div className="mt-7 flex items-center justify-center gap-2 text-xs text-white/45"><Zap className="h-4 w-4 text-[#ff7a00]" />Sem cobrança ativa até Stripe ser configurado.</div>
      </div>
    </section>
  );
};
