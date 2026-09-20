/**
 * Wrapper seguro para operações de localStorage
 * Trata erros de forma graceful e evita crashes da aplicação
 */

export const safeStorage = {
  /**
   * Lê um valor do localStorage com tratamento de erros
   * @param key - Chave do valor a ser lido
   * @param defaultValue - Valor padrão caso ocorra erro ou chave não exista
   * @returns Valor armazenado ou defaultValue
   */
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return defaultValue;
    }
  },

  /**
   * Escreve um valor no localStorage com tratamento de erros
   * @param key - Chave do valor a ser escrito
   * @param value - Valor a ser armazenado
   * @returns true se sucesso, false se erro
   */
  set: <T>(key: string, value: T): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error);
      return false;
    }
  },

  /**
   * Remove um valor do localStorage com tratamento de erros
   * @param key - Chave do valor a ser removido
   * @returns true se sucesso, false se erro
   */
  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
      return false;
    }
  },

  /**
   * Limpa todo o localStorage com tratamento de erros
   * @returns true se sucesso, false se erro
   */
  clear: (): boolean => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  },
};
