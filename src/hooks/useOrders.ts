import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Order = Tables<'orders'>;
export type OrderInsert = TablesInsert<'orders'>;
export type OrderUpdate = TablesUpdate<'orders'>;
export type OrderItem = Tables<'order_items'>;

export interface OrderWithDetails extends Order {
  center_name?: string;
  items?: OrderItem[];
}

// Fetch all orders (admin view)
export function useAllOrders() {
  return useQuery({
    queryKey: ['all-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          centers(name),
          order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(order => ({
        ...order,
        center_name: order.centers?.name,
        items: order.order_items,
      })) as OrderWithDetails[];
    },
  });
}

// Fetch orders for a specific center
export function useCenterOrders(centerId?: string) {
  return useQuery({
    queryKey: ['center-orders', centerId],
    queryFn: async () => {
      if (!centerId) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            stock_items(name, code)
          )
        `)
        .eq('center_id', centerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!centerId,
  });
}

// Order statistics
export function useOrderStats() {
  return useQuery({
    queryKey: ['order-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('status, total_amount');

      if (error) throw error;

      return {
        total: data.length,
        pending: data.filter(o => o.status === 'pending').length,
        completed: data.filter(o => o.status === 'completed').length,
        totalValue: data.reduce((sum, o) => sum + Number(o.total_amount), 0),
      };
    },
  });
}

// Create a new order
export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ order, items }: { order: OrderInsert; items: Omit<TablesInsert<'order_items'>, 'order_id'>[] }) => {
      // Create order first
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(order)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      if (items.length > 0) {
        const orderItems = items.map(item => ({
          ...item,
          order_id: orderData.id,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      return orderData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
      queryClient.invalidateQueries({ queryKey: ['center-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-stats'] });
      toast.success('Order placed successfully!');
    },
    onError: (error) => {
      toast.error('Failed to place order: ' + error.message);
    },
  });
}

// Update order status (admin approval)
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  const updateStock = async (order: OrderWithDetails) => {
    if (!order.center_id || !order.items || order.items.length === 0) return;

    const stockUpdates = order.items.map(item => {
      return supabase.rpc('increment_center_stock' as any, {
        p_center_id: order.center_id!,
        p_stock_item_id: item.stock_item_id,
        p_quantity: item.quantity
      });
    });

    const results = await Promise.all(stockUpdates);
    results.forEach(result => {
      if (result.error) {
        throw new Error(`Failed to update stock: ${result.error.message}`);
      }
    });
  };

  return useMutation({
    mutationFn: async ({ id, status, payment_status, order }: { id: string; status?: string; payment_status?: string, order?: OrderWithDetails }) => {
      const updates: OrderUpdate = {};
      if (status) updates.status = status;
      if (payment_status) updates.payment_status = payment_status;

      // If approving, update stock first
      if (status === 'approved' && order) {
        await updateStock(order);
      } else if (status === 'approved' && !order) {
        console.warn('Order details not provided for stock update. This is not ideal.');
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
      queryClient.invalidateQueries({ queryKey: ['center-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-stats'] });
      queryClient.invalidateQueries({ queryKey: ['all-center-stocks'] });
      queryClient.invalidateQueries({ queryKey: ['center-stock'] });
      toast.success('Order updated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to update order: ' + error.message);
    },
  });
}
