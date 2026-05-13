import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_discount: number | null;
  min_order_amount: number;
  usage_limit: number | null;
  usage_count: number;
  per_center_limit: number | null;
  valid_from: string;
  valid_until: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export function useCoupons() {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Coupon[];
    },
  });
}

export function useUpsertCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (coupon: Partial<Coupon> & { code: string; discount_type: string; discount_value: number }) => {
      const payload: any = { ...coupon, code: coupon.code.toUpperCase().trim() };
      const { id, ...rest } = payload;
      if (id) {
        const { error } = await (supabase as any).from('coupons').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('coupons').insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon saved');
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save coupon'),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('coupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon deleted');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useToggleCouponStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'inactive' }) => {
      const { error } = await (supabase as any).from('coupons').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
}

export interface ValidatedCoupon {
  valid: boolean;
  error?: string;
  coupon_id?: string;
  code?: string;
  discount_amount?: number;
  discount_type?: string;
  discount_value?: number;
}

export async function validateCoupon(code: string, centerId: string, orderAmount: number): Promise<ValidatedCoupon> {
  const { data, error } = await (supabase as any).rpc('validate_coupon', {
    _code: code,
    _center_id: centerId,
    _order_amount: orderAmount,
  });
  if (error) return { valid: false, error: error.message };
  return data as ValidatedCoupon;
}

export async function applyCouponToOrder(code: string, centerId: string, orderId: string, orderAmount: number): Promise<ValidatedCoupon> {
  const { data, error } = await (supabase as any).rpc('apply_coupon_to_order', {
    _code: code,
    _center_id: centerId,
    _order_id: orderId,
    _order_amount: orderAmount,
  });
  if (error) return { valid: false, error: error.message };
  return data as ValidatedCoupon;
}
