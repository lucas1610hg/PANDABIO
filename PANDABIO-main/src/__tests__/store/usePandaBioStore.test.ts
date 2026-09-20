import { describe, expect, it, beforeEach } from 'vitest';
import { usePandaBioStore } from '../../store/usePandaBioStore';
import type { BioLink } from '../../types';

const makeLink = (id: string, active = true): BioLink => ({
  id,
  title: `Link ${id}`,
  url: 'https://example.com',
  clicks: 0,
  leads: 0,
  active,
  icon: id,
  type: 'custom',
});

const resetStore = () => {
  localStorage.clear();
  usePandaBioStore.setState({ accounts: {}, currentUserId: '' });
};

describe('usePandaBioStore', () => {
  beforeEach(resetStore);

  it('authenticate cria uma nova conta e define como usuário atual', () => {
    const account = usePandaBioStore.getState().authenticate('novo@email.com');
    expect(account.profile.username).toBe('novo');
    expect(account.profile.plan).toBe('Gratuito');
    expect(usePandaBioStore.getState().currentUserId).toBe('novo@email.com');
  });

  it('authenticate com e-mail existente apenas troca de usuário (não zera dados)', () => {
    const { authenticate, addLink } = usePandaBioStore.getState();
    authenticate('a@email.com');
    addLink(makeLink('link-1'));
    authenticate('b@email.com');
    authenticate('a@email.com');
    expect(usePandaBioStore.getState().currentUserId).toBe('a@email.com');
    const account = usePandaBioStore.getState().getCurrentAccount();
    expect(account.links).toHaveLength(1);
  });

  it('addLink adiciona no topo e cria atividade', () => {
    const { authenticate, addLink } = usePandaBioStore.getState();
    authenticate('a@email.com');
    addLink(makeLink('l1'));
    addLink(makeLink('l2'));
    const { links, activities } = usePandaBioStore.getState().getCurrentAccount();
    expect(links).toHaveLength(2);
    expect(links[0].id).toBe('l2');
    expect(activities[0].title).toContain('Novo link adicionado');
  });

  it('toggleLink inverte o estado ativo e é idempotente (2x volta ao original)', () => {
    const { authenticate, addLink, toggleLink } = usePandaBioStore.getState();
    authenticate('a@email.com');
    addLink(makeLink('l1'));
    toggleLink('l1');
    expect(usePandaBioStore.getState().getCurrentAccount().links[0].active).toBe(false);
    toggleLink('l1');
    expect(usePandaBioStore.getState().getCurrentAccount().links[0].active).toBe(true);
  });

  it('upgradeToPro muda o plano para PRO', () => {
    const { authenticate, upgradeToPro } = usePandaBioStore.getState();
    authenticate('a@email.com');
    expect(usePandaBioStore.getState().getCurrentAccount().profile.plan).toBe('Gratuito');
    upgradeToPro();
    expect(usePandaBioStore.getState().getCurrentAccount().profile.plan).toBe('PRO');
  });

  it('updateUserProfile mergeia campos no perfil atual', () => {
    const { authenticate, updateUserProfile } = usePandaBioStore.getState();
    authenticate('a@email.com');
    updateUserProfile({ name: 'Maria Souza', bioDescription: 'Nova bio' });
    const profile = usePandaBioStore.getState().getCurrentAccount().profile;
    expect(profile.name).toBe('Maria Souza');
    expect(profile.bioDescription).toBe('Nova bio');
    expect(profile.username).toBe('a');
  });

  it('getAllAccountsList retorna todos os perfis', () => {
    const { authenticate } = usePandaBioStore.getState();
    authenticate('a@email.com');
    authenticate('b@email.com');
    expect(usePandaBioStore.getState().getAllAccountsList()).toHaveLength(2);
  });

  it('reorderLinks substitui a ordem dos links', () => {
    const { authenticate, addLink, reorderLinks } = usePandaBioStore.getState();
    authenticate('a@email.com');
    addLink(makeLink('l1'));
    addLink(makeLink('l2'));
    addLink(makeLink('l3'));
    reorderLinks([makeLink('l3'), makeLink('l2'), makeLink('l1')]);
    const ids = usePandaBioStore
      .getState()
      .getCurrentAccount()
      .links.map((l) => l.id);
    expect(ids).toEqual(['l3', 'l2', 'l1']);
  });

  it('switchUser troca para conta existente preservando dados', () => {
    const { authenticate, addLink, switchUser } = usePandaBioStore.getState();
    authenticate('a@email.com');
    addLink(makeLink('l1'));
    authenticate('b@email.com');
    switchUser('a@email.com');
    const account = usePandaBioStore.getState().getCurrentAccount();
    expect(account.links).toHaveLength(1);
  });

  it('logout limpa o usuário atual', () => {
    const { authenticate, logout } = usePandaBioStore.getState();
    authenticate('a@email.com');
    logout();
    expect(usePandaBioStore.getState().currentUserId).toBe('');
  });
});
