import { UserProfile, BioLink, ProductItem, LeadItem, ActivityItem } from '../types';
import {
  initialProfile,
  initialLinks,
  initialActivities,
  initialProducts,
  initialLeads,
} from '../data/mockData';

export interface UserAccountData {
  profile: UserProfile;
  links: BioLink[];
  products: ProductItem[];
  leads: LeadItem[];
  activities: ActivityItem[];
}

const STORAGE_USERS_KEY = 'pandabio_accounts_v2';
const STORAGE_CURRENT_USER_ID_KEY = 'pandabio_current_user_id_v2';

/**
 * Multi-user storage manager with local-storage caching and cross-session isolation.
 * Guarantees that each user account maintains separate links, products, metrics, and profiles,
 * without pre-seeded fictional data.
 */
class MultiUserStore {
  private accounts: Record<string, UserAccountData> = {};
  private currentUserId: string = 'usuario@email.com';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_USERS_KEY);
      if (stored) {
        this.accounts = JSON.parse(stored);
      } else {
        // Initial clean account without fictitious links or mock data
        this.accounts = {
          'usuario@email.com': {
            profile: initialProfile,
            links: initialLinks,
            products: initialProducts,
            leads: initialLeads,
            activities: initialActivities,
          },
        };
        this.saveAccounts();
      }

      const activeId = localStorage.getItem(STORAGE_CURRENT_USER_ID_KEY);
      if (activeId && this.accounts[activeId]) {
        this.currentUserId = activeId;
      } else {
        this.currentUserId = Object.keys(this.accounts)[0] || 'usuario@email.com';
        localStorage.setItem(STORAGE_CURRENT_USER_ID_KEY, this.currentUserId);
      }
    } catch {
      this.accounts = {
        'usuario@email.com': {
          profile: initialProfile,
          links: initialLinks,
          products: initialProducts,
          leads: initialLeads,
          activities: initialActivities,
        },
      };
      this.currentUserId = 'usuario@email.com';
    }
  }

  private saveAccounts() {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(this.accounts));
    } catch (e) {
      console.warn('Falha ao persistir dados locais:', e);
    }
  }

  public getCurrentUserId(): string {
    return this.currentUserId;
  }

  public getCurrentAccount(): UserAccountData {
    if (!this.accounts[this.currentUserId]) {
      const firstId = Object.keys(this.accounts)[0] || 'usuario@email.com';
      this.currentUserId = firstId;
      if (!this.accounts[firstId]) {
        this.accounts[firstId] = {
          profile: initialProfile,
          links: initialLinks,
          products: initialProducts,
          leads: initialLeads,
          activities: initialActivities,
        };
      }
    }
    return this.accounts[this.currentUserId];
  }

  public getAllAccountsList(): UserProfile[] {
    return Object.values(this.accounts).map((acc) => acc.profile);
  }

  public switchUser(email: string): UserAccountData {
    const cleanEmail = email.toLowerCase().trim();
    if (this.accounts[cleanEmail]) {
      this.currentUserId = cleanEmail;
      localStorage.setItem(STORAGE_CURRENT_USER_ID_KEY, cleanEmail);
      return this.accounts[cleanEmail];
    }
    return this.getCurrentAccount();
  }

  public authenticate(
    email: string,
    fallbackProfile?: Partial<UserProfile>
  ): UserAccountData {
    const cleanEmail = email.toLowerCase().trim();

    if (!this.accounts[cleanEmail]) {
      // Create new clean user account without mock items
      const username = fallbackProfile?.username || cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') || 'usuario';
      const newProfile: UserProfile = {
        name: fallbackProfile?.name || 'Novo Usuário',
        username: username,
        email: cleanEmail,
        plan: 'Gratuito',
        bioUrl: `panda.bio/${username}`,
        pageTitle: `${fallbackProfile?.name || 'Minha Página'} • Bio Oficial`,
        bioDescription: fallbackProfile?.bioDescription || 'Adicione uma breve descrição sobre você ou seu projeto.',
        avatarUrl:
          fallbackProfile?.avatarUrl ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
            fallbackProfile?.name || username
          )}&backgroundColor=ff6600,161823`,
      };

      this.accounts[cleanEmail] = {
        profile: newProfile,
        links: [],
        products: [],
        leads: [],
        activities: [],
      };

      this.saveAccounts();
    }

    this.currentUserId = cleanEmail;
    localStorage.setItem(STORAGE_CURRENT_USER_ID_KEY, cleanEmail);
    return this.accounts[cleanEmail];
  }

  public updateCurrentAccount(updates: Partial<UserAccountData>) {
    const acc = this.getCurrentAccount();
    this.accounts[this.currentUserId] = {
      ...acc,
      ...updates,
      profile: updates.profile ? { ...acc.profile, ...updates.profile } : acc.profile,
    };
    this.saveAccounts();
  }

  public logout() {
    this.currentUserId = '';
    localStorage.removeItem(STORAGE_CURRENT_USER_ID_KEY);
  }
}

export const multiUserStore = new MultiUserStore();
