import { create } from 'zustand';
import { UserProfile, BioLink, ProductItem, UserAccountData } from '../types';
import { initialProfile, initialLinks, initialProducts, initialLeads, initialActivities } from '../data/mockData';
import { safeStorage } from '../utils/storage';

const STORAGE_USERS_KEY = 'pandabio_accounts_v2';
const STORAGE_CURRENT_USER_ID_KEY = 'pandabio_current_user_id_v2';

interface PandaBioStore {
  // Estado
  currentUserId: string;
  accounts: Record<string, UserAccountData>;
  
  // Selectors
  getCurrentAccount: () => UserAccountData;
  getAllAccountsList: () => UserProfile[];
  
  // Actions
  setCurrentAccount: (userId: string) => void;
  updateCurrentAccount: (updater: (prev: UserAccountData) => UserAccountData) => void;
  switchUser: (email: string) => UserAccountData;
  authenticate: (email: string, fallbackProfile?: Partial<UserProfile>) => UserAccountData;
  logout: () => void;
  
  // Actions específicas
  toggleLink: (linkId: string) => void;
  addLink: (link: BioLink) => void;
  reorderLinks: (reordered: BioLink[]) => void;
  addProduct: (product: ProductItem) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  upgradeToPro: () => void;
}

const loadFromStorage = (): { accounts: Record<string, UserAccountData>; currentUserId: string } => {
  try {
    const stored = safeStorage.get<Record<string, UserAccountData> | null>(STORAGE_USERS_KEY, null);
    const activeId = safeStorage.get<string | null>(STORAGE_CURRENT_USER_ID_KEY, null);
    
    if (stored && activeId && stored[activeId]) {
      return { accounts: stored, currentUserId: activeId };
    }
    
    // Initial clean account
    const initialAccounts: Record<string, UserAccountData> = {
      'usuario@email.com': {
        profile: initialProfile,
        links: initialLinks,
        products: initialProducts,
        leads: initialLeads,
        activities: initialActivities,
      },
    };
    
    safeStorage.set(STORAGE_USERS_KEY, initialAccounts);
    safeStorage.set(STORAGE_CURRENT_USER_ID_KEY, 'usuario@email.com');
    
    return { accounts: initialAccounts, currentUserId: 'usuario@email.com' };
  } catch (error) {
    console.error('Error loading from storage:', error);
    return {
      accounts: {
        'usuario@email.com': {
          profile: initialProfile,
          links: initialLinks,
          products: initialProducts,
          leads: initialLeads,
          activities: initialActivities,
        },
      },
      currentUserId: 'usuario@email.com',
    };
  }
};

const saveToStorage = (accounts: Record<string, UserAccountData>, currentUserId: string) => {
  safeStorage.set(STORAGE_USERS_KEY, accounts);
  safeStorage.set(STORAGE_CURRENT_USER_ID_KEY, currentUserId);
};

export const usePandaBioStore = create<PandaBioStore>((set, get) => {
  const { accounts, currentUserId } = loadFromStorage();
  
  return {
    currentUserId,
    accounts,
    
    getCurrentAccount: () => {
      const { accounts, currentUserId } = get();
      if (!accounts[currentUserId]) {
        const firstId = Object.keys(accounts)[0] || 'usuario@email.com';
        set({ currentUserId: firstId });
        return accounts[firstId];
      }
      return accounts[currentUserId];
    },
    
    getAllAccountsList: () => {
      const { accounts } = get();
      return Object.values(accounts).map(acc => acc.profile);
    },
    
    setCurrentAccount: (userId: string) => {
      set({ currentUserId: userId });
      const { accounts } = get();
      saveToStorage(accounts, userId);
    },
    
    updateCurrentAccount: (updater: (prev: UserAccountData) => UserAccountData) => {
      const { accounts, currentUserId } = get();
      const currentAccount = accounts[currentUserId];
      const updatedAccount = updater(currentAccount);
      
      set({
        accounts: {
          ...accounts,
          [currentUserId]: updatedAccount,
        },
      });
      
      saveToStorage({ ...accounts, [currentUserId]: updatedAccount }, currentUserId);
    },
    
    switchUser: (email: string) => {
      const cleanEmail = email.toLowerCase().trim();
      const { accounts } = get();
      
      if (accounts[cleanEmail]) {
        set({ currentUserId: cleanEmail });
        saveToStorage(accounts, cleanEmail);
        return accounts[cleanEmail];
      }
      
      return get().getCurrentAccount();
    },
    
    authenticate: (email: string, fallbackProfile?: Partial<UserProfile>) => {
      const cleanEmail = email.toLowerCase().trim();
      const { accounts } = get();
      
      if (!accounts[cleanEmail]) {
        const username = fallbackProfile?.username || cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') || 'usuario';
        const newProfile: UserProfile = {
          name: fallbackProfile?.name || 'Novo Usuário',
          username: username,
          email: cleanEmail,
          plan: 'Gratuito',
          bioUrl: `panda.bio/${username}`,
          pageTitle: `${fallbackProfile?.name || 'Minha Página'} • Bio Oficial`,
          bioDescription: fallbackProfile?.bioDescription || 'Adicione uma breve descrição sobre você ou seu projeto.',
          avatarUrl: fallbackProfile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fallbackProfile?.name || username)}&backgroundColor=ff6600,161823`,
        };
        
        const newAccount: UserAccountData = {
          profile: newProfile,
          links: [],
          products: [],
          leads: [],
          activities: [],
        };
        
        set({
          accounts: {
            ...accounts,
            [cleanEmail]: newAccount,
          },
          currentUserId: cleanEmail,
        });
        
        saveToStorage({ ...accounts, [cleanEmail]: newAccount }, cleanEmail);
        return newAccount;
      }
      
      set({ currentUserId: cleanEmail });
      saveToStorage(accounts, cleanEmail);
      return accounts[cleanEmail];
    },
    
    logout: () => {
      set({ currentUserId: '' });
      safeStorage.remove(STORAGE_CURRENT_USER_ID_KEY);
    },
    
    toggleLink: (linkId: string) => {
      get().updateCurrentAccount((prev) => ({
        ...prev,
        links: prev.links.map((l: BioLink) => (l.id === linkId ? { ...l, active: !l.active } : l)),
      }));
    },
    
    addLink: (link: BioLink) => {
      get().updateCurrentAccount((prev) => ({
        ...prev,
        links: [link, ...prev.links],
        activities: [
          {
            id: `act-${Date.now()}`,
            title: `Novo link adicionado: ${link.title}`,
            subtitle: 'Publicado na bio',
timeAgo: 'agora',
            type: 'clicks',
            timestamp: 'Agora mesmo',
            date: Date.now(),
          },
          ...prev.activities,
        ],
      }));
    },

    reorderLinks: (reordered: BioLink[]) => {
      get().updateCurrentAccount((prev) => ({ ...prev, links: reordered }));
    },

    addProduct: (product: ProductItem) => {
      get().updateCurrentAccount((prev) => ({
        ...prev,
        products: [product, ...prev.products],
        activities: [
          {
            id: `act-${Date.now()}`,
            title: `Novo produto criado: ${product.name}`,
            subtitle: `R$ ${product.price.toFixed(2)}`,
            timeAgo: 'agora',
            type: 'order',
            timestamp: 'Agora mesmo',
            date: Date.now(),
          },
          ...prev.activities,
        ],
      }));
    },
    
    updateUserProfile: (updates: Partial<UserProfile>) => {
      get().updateCurrentAccount((prev) => ({
        ...prev,
        profile: { ...prev.profile, ...updates },
      }));
    },
    
    upgradeToPro: () => {
      get().updateCurrentAccount((prev) => ({
        ...prev,
        profile: { ...prev.profile, plan: 'PRO' },
      }));
    },
  };
});