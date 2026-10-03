import { supabase, isSupabaseConfigured } from '../client';
import { ProductItem } from '../../types';
import { ProfileService } from './profileService';

/**
 * Serviço para gerenciamento de produtos
 */
export class ProductService {
  /**
   * Obtém todos os produtos do usuário atual
   */
  static async getProducts(): Promise<ProductItem[]> {
    if (!isSupabaseConfigured() || !supabase) return [];

    try {
      const profileId = await ProfileService.getCurrentProfileId();
      if (!profileId) return [];

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        salesCount: product.sales_count,
        status: product.status,
        image: product.image,
        description: product.description,
        sourceUrl: product.source_url,
        purchaseUrl: product.purchase_url,
        purchaseType: product.purchase_type,
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  /**
   * Cria um novo produto
   */
  static async createProduct(product: Omit<ProductItem, 'id'>): Promise<ProductItem | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const profileId = await ProfileService.getCurrentProfileId();
      if (!profileId) return null;

      const { data, error } = await supabase
        .from('products')
        .insert({
          profile_id: profileId,
          name: product.name,
          price: product.price,
          sales_count: product.salesCount || 0,
          status: product.status,
          image: product.image,
          description: product.description,
          source_url: product.sourceUrl,
          purchase_url: product.purchaseUrl,
          purchase_type: product.purchaseType,
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        price: data.price,
        salesCount: data.sales_count,
        status: data.status,
        image: data.image,
        description: data.description,
        sourceUrl: data.source_url,
        purchaseUrl: data.purchase_url,
        purchaseType: data.purchase_type,
      };
    } catch (error) {
      console.error('Error creating product:', error);
      return null;
    }
  }

  /**
   * Atualiza um produto existente
   */
  static async updateProduct(id: string, updates: Partial<ProductItem>): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: updates.name,
          price: updates.price,
          status: updates.status,
          image: updates.image,
          description: updates.description,
          source_url: updates.sourceUrl,
          purchase_url: updates.purchaseUrl,
          purchase_type: updates.purchaseType,
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating product:', error);
      return false;
    }
  }

  /**
   * Deleta um produto
   */
  static async deleteProduct(id: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  }

  /**
   * Registra uma venda de produto
   */
  static async registerSale(productId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const profileId = await ProfileService.getCurrentProfileId();
      // Buscar valor atual e incrementar
      const { data: currentProduct } = await supabase
        .from('products')
        .select('sales_count, price')
        .eq('id', productId)
        .single();

      if (currentProduct) {
        if (profileId) {
          const { error: saleError } = await supabase.from('product_sales').insert({
            profile_id: profileId,
            product_id: productId,
            quantity: 1,
            amount: currentProduct.price,
          });
          if (saleError) console.warn('Product sale history unavailable:', saleError.message);
        }

        const { error } = await supabase
          .from('products')
          .update({ sales_count: (currentProduct.sales_count || 0) + 1 })
          .eq('id', productId);
        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error registering sale:', error);
      return false;
    }
  }
}
