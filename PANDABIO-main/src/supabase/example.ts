/**
 * Exemplo de uso dos serviços Supabase
 * Este arquivo demonstra como usar os serviços implementados
 */

import { ProfileService } from './services/profileService';
import { LinkService } from './services/linkService';
import { ProductService } from './services/productService';
import { LeadService } from './services/leadService';
import { ActivityService } from './services/activityService';
import { AuthService } from './services/authService';
import { isSupabaseConfigured } from './client';

/**
 * Exemplo 1: Autenticação
 */
export async function authExample() {
  if (!isSupabaseConfigured()) {
    console.log('Supabase não configurado - usando modo local');
    return;
  }

  // Sign up
  const signUpResult = await AuthService.signUp('novo.usuario@example.com', 'senha123', {
    name: 'Novo Usuário',
    username: 'novousuario',
    bioUrl: 'panda.bio/novousuario',
    pageTitle: 'Minha Página • Bio Oficial',
    bioDescription: 'Descrição do meu perfil',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Novo',
  });

  if (signUpResult.success) {
    console.log('Usuário criado:', signUpResult.user);
  }

  // Sign in
  const signInResult = await AuthService.signIn('novo.usuario@example.com', 'senha123');

  if (signInResult.success) {
    console.log('Login realizado:', signInResult.user);
  }

  // Get current user
  const currentUser = await AuthService.getCurrentUser();
  console.log('Usuário atual:', currentUser);
}

/**
 * Exemplo 2: Gerenciar Perfil
 */
export async function profileExample() {
  if (!isSupabaseConfigured()) return;

  // Obter perfil atual
  const profile = await ProfileService.getCurrentProfile();
  console.log('Perfil atual:', profile);

  // Atualizar perfil
  if (profile) {
    const updated = await ProfileService.upsertProfile({
      ...profile,
      name: 'Nome Atualizado',
      bioDescription: 'Nova descrição do perfil',
    });
    console.log('Perfil atualizado:', updated);
  }

  // Upgrade para PRO
  const upgraded = await ProfileService.upgradeToPro();
  console.log('Upgrade para PRO:', upgraded);
}

/**
 * Exemplo 3: Gerenciar Links
 */
export async function linksExample() {
  if (!isSupabaseConfigured()) return;

  // Obter links
  const links = await LinkService.getLinks();
  console.log('Links:', links);

  // Criar novo link
  const newLink = await LinkService.createLink({
    title: 'Meu Portfólio',
    url: 'https://meuportfolio.com',
    clicks: 0,
    leads: 0,
    active: true,
    icon: 'portfolio',
    type: 'portfolio',
  });
  console.log('Novo link criado:', newLink);

  if (newLink) {
    // Atualizar link
    await LinkService.updateLink(newLink.id, {
      title: 'Portfólio Atualizado',
    });

    // Toggle status
    await LinkService.toggleLink(newLink.id);

    // Registrar clique
    await LinkService.registerClick(newLink.id);

    // Reordenar links
    if (links.length > 0) {
      await LinkService.reorderLinks([newLink.id, ...links.slice(0, 3).map((l) => l.id)]);
    }
  }
}

/**
 * Exemplo 4: Gerenciar Produtos
 */
export async function productsExample() {
  if (!isSupabaseConfigured()) return;

  // Obter produtos
  const products = await ProductService.getProducts();
  console.log('Produtos:', products);

  // Criar novo produto
  const newProduct = await ProductService.createProduct({
    name: 'Consultoria VIP',
    price: 197.0,
    salesCount: 0,
    status: 'active',
    image: 'https://example.com/product.jpg',
  });
  console.log('Novo produto criado:', newProduct);

  if (newProduct) {
    // Atualizar produto
    await ProductService.updateProduct(newProduct.id, {
      name: 'Consultoria Premium',
      price: 297.0,
    });

    // Registrar venda
    await ProductService.registerSale(newProduct.id);
  }
}

/**
 * Exemplo 5: Gerenciar Leads
 */
export async function leadsExample() {
  if (!isSupabaseConfigured()) return;

  // Obter leads
  const leads = await LeadService.getLeads();
  console.log('Leads:', leads);

  // Criar novo lead
  const newLead = await LeadService.createLead({
    name: 'Cliente Interessado',
    email: 'cliente@example.com',
    phone: '+55 11 99999-9999',
    channel: 'WhatsApp',
  });
  console.log('Novo lead criado:', newLead);

  // Obter leads por link específico
  if (leads.length > 0) {
    const leadsByLink = await LeadService.getLeadsByLink(leads[0].id);
    console.log('Leads por link:', leadsByLink);
  }

  // Exportar leads para CSV
  const csv = await LeadService.exportLeadsToCSV();
  console.log('Leads em CSV:', csv);
}

/**
 * Exemplo 6: Gerenciar Atividades
 */
export async function activitiesExample() {
  if (!isSupabaseConfigured()) return;

  // Obter atividades
  const activities = await ActivityService.getActivities(10);
  console.log('Atividades:', activities);

  // Criar atividades específicas
  await ActivityService.logNewLink('Meu Novo Link');
  await ActivityService.logNewProduct('E-book Premium', 47.0);
  await ActivityService.logNewLead('João Silva');

  // Criar atividade customizada
  await ActivityService.createActivity({
    title: 'Meta alcançada',
    subtitle: '1000 cliques atingidos',
    timeAgo: 'hoje',
    type: 'clicks',
    timestamp: new Date().toISOString(),
  });

  // Limpar atividades antigas
  await ActivityService.cleanupOldActivities(30);
}

/**
 * Exemplo 7: Integração Completa
 */
export async function completeIntegrationExample() {
  if (!isSupabaseConfigured()) {
    console.log(' Supabase não configurado - executando em modo local');
    return;
  }

  console.log(' Iniciando integração completa com Supabase...');

  try {
    // 1. Autenticação
    console.log(' Passo 1: Autenticação');
    await authExample();

    // 2. Perfil
    console.log(' Passo 2: Gerenciar Perfil');
    await profileExample();

    // 3. Links
    console.log(' Passo 3: Gerenciar Links');
    await linksExample();

    // 4. Produtos
    console.log(' Passo 4: Gerenciar Produtos');
    await productsExample();

    // 5. Leads
    console.log(' Passo 5: Gerenciar Leads');
    await leadsExample();

    // 6. Atividades
    console.log(' Passo 6: Gerenciar Atividades');
    await activitiesExample();

    console.log(' Integração completa finalizada com sucesso!');
  } catch (error) {
    console.error(' Erro na integração:', error);
  }
}

/**
 * Exemplo 8: Uso em Componentes React
 */
export function componentUsageExample() {
  // Em um componente React:
  /*
  import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
  import { useSupabaseData } from '../hooks/useSupabaseData';

  function MyComponent() {
    const { user, profile, signIn, signOut, loading } = useSupabaseAuth();
    const { links, products, leads, addLink, toggleLink } = useSupabaseData();

    if (loading) return <div>Carregando...</div>;

    return (
      <div>
        <h1>Bem-vindo, {profile?.name}</h1>
        <p>Você tem {links.length} links</p>
        <button onClick={() => signOut()}>Sair</button>
      </div>
    );
  }
  */
}

// Exportar exemplos para uso
export const examples = {
  authExample,
  profileExample,
  linksExample,
  productsExample,
  leadsExample,
  activitiesExample,
  completeIntegrationExample,
  componentUsageExample,
};
