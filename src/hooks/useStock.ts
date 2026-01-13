import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';

export type StockItem = Tables<'stock_items'>;
export type CenterStock = Tables<'center_stock'>;

export interface CenterStockWithDetails extends CenterStock {
  stock_item?: StockItem;
}

// Fetch all stock items (master list)
export function useStockItems() {
  return useQuery({
    queryKey: ['stock-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return data;
    },
  });
}

// Fetch stock for a specific center
export function useCenterStock(centerId?: string) {
  return useQuery({
    queryKey: ['center-stock', centerId],
    queryFn: async () => {
      if (!centerId) return [];
      
      const { data, error } = await supabase
        .from('center_stock')
        .select(`
          *,
          stock_items(*)
        `)
        .eq('center_id', centerId);

      if (error) throw error;
      
      return data.map(stock => ({
        ...stock,
        stock_item: stock.stock_items,
      })) as CenterStockWithDetails[];
    },
    enabled: !!centerId,
  });
}

// Stock statistics for a center
export function useCenterStockStats(centerId?: string) {
  return useQuery({
    queryKey: ['center-stock-stats', centerId],
    queryFn: async () => {
      if (!centerId) return { total: 0, lowStock: 0 };
      
      const { data, error } = await supabase
        .from('center_stock')
        .select('quantity')
        .eq('center_id', centerId);

      if (error) throw error;

      return {
        total: data.reduce((sum, s) => sum + s.quantity, 0),
        lowStock: data.filter(s => s.quantity <= 5).length,
      };
    },
    enabled: !!centerId,
  });
}

// Update center stock quantity
export function useUpdateCenterStock() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { data, error } = await supabase
        .from('center_stock')
        .update({ quantity, last_updated: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center-stock'] });
      queryClient.invalidateQueries({ queryKey: ['center-stock-stats'] });
      toast.success('Stock updated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to update stock: ' + error.message);
    },
  });
}

// Get all center stocks (admin view)
export function useAllCenterStocks() {
  return useQuery({
    queryKey: ['all-center-stocks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('center_stock')
        .select(`
          *,
          centers(name),
          stock_items(name, code)
        `);

      if (error) throw error;
      return data;
    },
  });
}
