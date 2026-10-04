import React, { useMemo, useState } from 'react';
import { BookOpen, ChevronDown, FileText, HelpCircle, Mail, MessageCircle, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { PANDABIO_ASSETS } from '../constants/assets';

type HelpCategory = 'guia' | 'conta' | 'produtos' | 'agendamentos' | 'analytics' | 'privacidade' | 'termos' | 'dados' | 'suporte';

type HelpArticle = {
  id: string;
  category: HelpCategory;
  title: string;
  summary: string;
  sections: { title: string; content: string }[];
};

const articles: HelpArticle[] = [
  {
    id: 'comece', category: 'guia', title: 'Como começar na PandaBio', summary: 'Configure sua página, publique seu link e acompanhe os resultados.', sections: [
      { title: '1. Complete seu perfil', content: 'Abra Perfil e informe nome, usuário, foto, descrição e localização. Seu nome de usuário forma o endereço público da sua página.' },
      { title: '2. Monte sua página', content: 'Em Minha Página, escolha tema, cores e blocos. Use links para divulgar canais, Produtos para destacar ofertas, Redes sociais para conectar seus perfis e Agendamentos para receber reservas.' },
      { title: '3. Configure cada bloco', content: 'Clique no bloco para editar título, descrição, imagem, endereço e botão. No bloco de produtos, selecione os produtos que aparecerão na página pública.' },
      { title: '4. Publique e compartilhe', content: 'Copie o link exibido no painel e coloque na bio do Instagram, TikTok, WhatsApp ou outras redes. Visitantes não precisam de conta para acessar sua página.' },
      { title: '5. Acompanhe seus resultados', content: 'Estatísticas mostram visitas, cliques, fontes, dispositivos, leads, produtos mais clicados e interações por período. Use os dados para ajustar títulos, ordem e destaque dos blocos.' },
    ],
  },
  {
    id: 'links-produtos', category: 'guia', title: 'Links, produtos e cliques', summary: 'Aprenda como divulgar ofertas e medir interesse real.', sections: [
      { title: 'Links', content: 'Em Links, crie um botão com título, URL e tipo. Mantenha apenas links ativos que deseja mostrar na página pública.' },
      { title: 'Produtos', content: 'Cadastre nome, preço, imagem, descrição e endereço de compra. O botão Comprar leva o visitante ao endereço configurado.' },
      { title: 'Analytics de produtos', content: 'Cada produto selecionado no bloco recebe identificação própria. A PandaBio registra visualizações e cliques no botão Comprar, permitindo comparar produto mais e menos clicado. A finalização da compra em site externo não é atribuída automaticamente.' },
    ],
  },
  {
    id: 'conta', category: 'conta', title: 'Conta, acesso e perfil', summary: 'Resolva dúvidas sobre login, usuário, senha e publicação.', sections: [
      { title: 'Não consigo entrar', content: 'Confirme o e-mail e a senha, verifique sua conexão e use a opção de recuperação de senha. Se o e-mail não chegar, confira spam e promoções.' },
      { title: 'Alterar nome de usuário', content: 'O nome de usuário aparece no link público. Ao alterar, atualize o link na bio das suas redes e teste o novo endereço em uma janela anônima.' },
      { title: 'Página não aparece', content: 'Confirme que o perfil está publicado, que o usuário está correto e que os dados foram salvos. Links antigos podem continuar apontando para o endereço anterior.' },
      { title: 'Trocar foto ou capa', content: 'Abra Perfil ou Minha Página, envie uma imagem compatível e salve. Evite arquivos muito grandes para carregar mais rápido.' },
    ],
  },
  {
    id: 'produtos-ajuda', category: 'produtos', title: 'Produtos e divulgação', summary: 'Configure catálogo, botão Comprar e métricas sem confusão.', sections: [
      { title: 'Cadastrar um produto', content: 'Abra Produtos, escolha criar produto e informe nome, preço, descrição, imagem e URL de compra. Salve antes de adicioná-lo a um bloco.' },
      { title: 'Adicionar ao link da bio', content: 'Em Minha Página, adicione ou edite o bloco Produtos e selecione os produtos que deseja exibir. Salvar o bloco publica a seleção.' },
      { title: 'O botão não abre', content: 'Verifique se a URL começa com https:// e se o endereço externo está ativo. Teste o link diretamente em uma nova aba.' },
      { title: 'O que o analytics mede', content: 'A PandaBio registra visualizações do produto e cliques no botão Comprar. Se a pessoa for redirecionada para outro site, a conclusão da compra não é confirmada pela PandaBio.' },
    ],
  },
  {
    id: 'agendamentos-ajuda', category: 'agendamentos', title: 'Agendamentos passo a passo', summary: 'Configure serviços, horários, profissionais e reservas.', sections: [
      { title: 'Configuração inicial', content: 'Crie seu workspace, defina fuso e regras, cadastre serviços, profissionais e horários disponíveis. Revise intervalos, duração e antecedência.' },
      { title: 'Publicar agenda', content: 'Adicione o bloco Agendamentos em Minha Página e selecione o workspace ativo. A disponibilidade exibida depende dos horários e bloqueios cadastrados.' },
      { title: 'Gerenciar reservas', content: 'Use Agendamentos para confirmar, cancelar, reagendar, iniciar, concluir ou marcar ausência. Registre alterações com atenção para manter a agenda correta.' },
      { title: 'Horários indisponíveis', content: 'Confira disponibilidade semanal, bloqueios, serviços vinculados ao profissional e conflitos de horário. Atualize a página pública após mudanças.' },
    ],
  },
  {
    id: 'analytics-ajuda', category: 'analytics', title: 'Entenda suas estatísticas', summary: 'Leia corretamente visitas, cliques, leads e desempenho.', sections: [
      { title: 'Períodos', content: 'Use 7, 30, 90 dias ou todo o período. Eventos novos podem levar alguns instantes para aparecer após o carregamento do painel.' },
      { title: 'Visitas e visitantes', content: 'Visitas representam eventos de acesso registrados. Visitantes únicos são uma estimativa baseada em identificador técnico e podem variar por navegador, privacidade e bloqueadores.' },
      { title: 'Cliques por produto', content: 'Visualizações mostram interesse na exibição. Cliques contam acionamentos do botão Comprar por produto. O ranking indica quais produtos despertam mais interesse, não vendas confirmadas.' },
      { title: 'Leads e conversões', content: 'Leads são contatos enviados pelos formulários. Vendas só devem ser consideradas confirmadas quando registradas por um fluxo de venda integrado ou lançamento confiável.' },
      { title: 'Dados não aparecem', content: 'Atualize a página, selecione Todo o período e teste em janela anônima. Verifique se o evento aparece no Supabase e se o perfil correto está conectado.' },
    ],
  },
  {
    id: 'privacidade', category: 'privacidade', title: 'Política de Privacidade', summary: 'Como a PandaBio coleta, usa e protege informações.', sections: [
      { title: 'Dados coletados', content: 'Podemos armazenar dados de cadastro, perfil, conteúdo publicado, leads, informações de agendamento, arquivos enviados e eventos de uso da página, como visitas, cliques, dispositivo e origem.' },
      { title: 'Uso dos dados', content: 'Os dados são usados para autenticar sua conta, publicar sua página, fornecer recursos, gerar estatísticas, processar leads, operar agendamentos, prevenir abuso e melhorar a plataforma.' },
      { title: 'Compartilhamento', content: 'Não vendemos dados pessoais. O compartilhamento ocorre somente quando necessário para operar serviços contratados, cumprir obrigação legal, proteger direitos ou quando você publica uma informação em sua página pública.' },
      { title: 'Segurança e retenção', content: 'Aplicamos controles de acesso e políticas de banco de dados. Mantemos dados enquanto a conta estiver ativa ou pelo período necessário para cumprir obrigações legais e resolver disputas.' },
      { title: 'Seus direitos', content: 'Você pode solicitar acesso, correção, portabilidade ou exclusão de dados, respeitadas obrigações legais e registros necessários à segurança.' },
    ],
  },
  {
    id: 'dados', category: 'dados', title: 'Política de Dados', summary: 'Regras para conteúdo, leads, analytics e informações públicas.', sections: [
      { title: 'Conteúdo público', content: 'Nome, foto, descrição, links, produtos e blocos publicados podem ser acessados por qualquer visitante. Não publique dados sensíveis ou informações de terceiros sem autorização.' },
      { title: 'Leads e consentimento', content: 'Use formulários apenas para finalidades informadas. Leads devem ser tratados com responsabilidade, sem spam, venda indevida ou compartilhamento não autorizado.' },
      { title: 'Analytics', content: 'Eventos de visitas e interações servem para medir desempenho. Não use a plataforma para tentar identificar pessoas, manipular métricas ou coletar informações sem base legal.' },
      { title: 'Exclusão e responsabilidade', content: 'Você é responsável pelo conteúdo que publica e pelos dados que coleta. Solicitações de exclusão podem ser feitas pelo suporte.' },
    ],
  },
  {
    id: 'suporte', category: 'suporte', title: 'Quando falar com o suporte', summary: 'Informações para resolver problemas com rapidez.', sections: [
      { title: 'Inclua estas informações', content: 'Envie seu usuário PandaBio, e-mail da conta, link público, horário aproximado do problema, dispositivo/navegador e uma captura de tela sem dados sensíveis.' },
      { title: 'Prazo e acompanhamento', content: 'Descreva um problema por mensagem e aguarde a orientação. Não envie senhas, tokens, chaves Stripe, códigos de autenticação ou dados completos de clientes.' },
      { title: 'Atendimento', content: 'E-mail: resellr7@gmail.com. WhatsApp: +55 (33) 99854-2100. Para assuntos de privacidade ou exclusão de dados, identifique claramente a solicitação.' },
    ],
  },
  {
    id: 'termos', category: 'termos', title: 'Termos de Uso', summary: 'Condições para utilizar a PandaBio com segurança.', sections: [
      { title: 'Uso permitido', content: 'A PandaBio deve ser usada para criar páginas legítimas, divulgar conteúdo lícito, apresentar produtos e facilitar contatos ou agendamentos.' },
      { title: 'Proibições', content: 'É proibido usar a plataforma para fraude, phishing, malware, spam, conteúdo ilegal, violação de direitos autorais, assédio, desinformação maliciosa ou coleta abusiva de dados.' },
      { title: 'Conta e conteúdo', content: 'Você deve proteger suas credenciais e possui responsabilidade pelo conteúdo publicado. Podemos limitar ou suspender contas que violem estes termos ou ofereçam risco à comunidade.' },
      { title: 'Serviços e disponibilidade', content: 'Recursos podem evoluir, ser alterados ou ficar temporariamente indisponíveis para manutenção. Integrações e links externos seguem as regras dos respectivos serviços.' },
    ],
  },
];

const categoryLabels: Record<HelpCategory, string> = { guia: 'Primeiros passos', conta: 'Conta e perfil', produtos: 'Produtos', agendamentos: 'Agendamentos', analytics: 'Estatísticas', privacidade: 'Privacidade', termos: 'Termos de uso', dados: 'Política de dados', suporte: 'Suporte' };

export const HelpSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<HelpCategory>('guia');
  const [query, setQuery] = useState('');
  const [openArticle, setOpenArticle] = useState('comece');
  const filteredArticles = useMemo(
    () => articles.filter((article) => {
      const searchableText = [article.title, article.summary, ...article.sections.flatMap((section) => [section.title, section.content])].join(' ').toLowerCase();
      return article.category === activeCategory && searchableText.includes(query.toLowerCase());
    }),
    [activeCategory, query],
  );
  const categories: HelpCategory[] = ['guia', 'conta', 'produtos', 'agendamentos', 'analytics', 'privacidade', 'termos', 'dados', 'suporte'];

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#131b2e] via-[#21182a] to-[#3525cd] p-5 text-white shadow-[0_16px_50px_rgba(53,37,205,0.18)] sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-[#ff7a00]/25 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl"><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#ff7a00]" /><span className="text-xs font-black uppercase tracking-[0.18em] text-[#ffb37a]">Central PandaBio</span></div><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Como podemos ajudar?</h1><p className="mt-2 text-sm leading-6 text-white/65">Encontre orientações para criar sua página, proteger seus dados e aproveitar cada recurso da PandaBio.</p><div className="relative mt-5 max-w-xl"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar na central de ajuda" className="w-full rounded-xl border border-white/10 bg-white/10 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/45 focus:border-[#ff7a00]" /></div></div><img src={PANDABIO_ASSETS.mascot3D} alt="Mascote PandaBio" className="mx-auto h-32 object-contain drop-shadow-2xl sm:mx-0 sm:h-40" /></div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-[#eaedff] bg-white p-2 shadow-[0_1px_3px_rgba(15,23,42,0.04)] lg:sticky lg:top-5 lg:block lg:max-h-[calc(100vh-7rem)] lg:space-y-1 lg:overflow-y-auto">
          {categories.map((category) => <button key={category} type="button" onClick={() => { setActiveCategory(category); setOpenArticle(articles.find((article) => article.category === category)?.id || ''); }} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-3 text-left text-xs font-bold transition lg:w-full ${activeCategory === category ? 'bg-[#fff3e6] text-[#ff7a00]' : 'text-[#777587] hover:bg-[#faf8ff] hover:text-[#131b2e]'}`}><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-current/10">{category === 'guia' || category === 'produtos' || category === 'agendamentos' ? <BookOpen className="h-4 w-4" /> : category === 'privacidade' || category === 'dados' ? <ShieldCheck className="h-4 w-4" /> : category === 'termos' ? <FileText className="h-4 w-4" /> : <HelpCircle className="h-4 w-4" />}</span>{categoryLabels[category]}</button>)}
        </nav>

        <div className="space-y-3">{filteredArticles.length > 0 ? filteredArticles.map((article) => <article key={article.id} className="overflow-hidden rounded-2xl border border-[#eaedff] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]"><button type="button" onClick={() => setOpenArticle(openArticle === article.id ? '' : article.id)} className="flex w-full items-center justify-between gap-3 p-4 text-left sm:p-5"><span><span className="block text-sm font-extrabold text-[#131b2e]">{article.title}</span><span className="mt-1 block text-xs text-[#777587]">{article.summary}</span></span><ChevronDown className={`h-4 w-4 shrink-0 text-[#969cb0] transition-transform ${openArticle === article.id ? 'rotate-180' : ''}`} /></button>{openArticle === article.id && <div className="space-y-4 border-t border-[#eaedff] px-4 pb-5 pt-4 sm:px-5">{article.sections.map((section) => <div key={section.title}><h3 className="text-xs font-extrabold text-[#131b2e]">{section.title}</h3><p className="mt-1 text-xs leading-6 text-[#626276]">{section.content}</p></div>)}</div>}</article>) : <div className="rounded-2xl border border-dashed border-[#dfe3f4] bg-white p-8 text-center text-sm text-[#777587]">Nenhum artigo encontrado.</div>}</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2"><a href="mailto:resellr7@gmail.com" className="flex items-center gap-4 rounded-2xl border border-[#eaedff] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff3e6] text-[#ff7a00]"><Mail className="h-5 w-5" /></span><span><b className="block text-sm text-[#131b2e]">Suporte por e-mail</b><span className="mt-1 block text-xs text-[#777587]">resellr7@gmail.com</span></span></a><a href="https://wa.me/5533998542100" target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-2xl border border-[#eaedff] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e6f8f3] text-[#059669]"><MessageCircle className="h-5 w-5" /></span><span><b className="block text-sm text-[#131b2e]">Suporte por WhatsApp</b><span className="mt-1 block text-xs text-[#777587]">+55 (33) 99854-2100</span></span></a></div>
    </section>
  );
};
