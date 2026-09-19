import { BioLink, ActivityItem, ProductItem, LeadItem, UserProfile } from '../types';

export const initialProfile: UserProfile = {
  name: 'Seu Nome',
  username: 'seuperfil',
  email: 'usuario@email.com',
  plan: 'Gratuito',
  bioUrl: 'panda.bio/seuperfil',
  pageTitle: 'Minha Página • Bio Oficial',
  bioDescription: 'Adicione uma breve descrição sobre você, seu negócio ou seus projetos.',
  avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=PandaBio&backgroundColor=ff6600,161823',
};

export const initialLinks: BioLink[] = [];

export const initialActivities: ActivityItem[] = [];

export const initialProducts: ProductItem[] = [];

export const initialLeads: LeadItem[] = [];
