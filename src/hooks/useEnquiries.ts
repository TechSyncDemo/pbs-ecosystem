import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Enquiry = Tables<'enquiries'>;
export type EnquiryInsert = TablesInsert<'enquiries'>;
export type EnquiryUpdate = TablesUpdate<'enquiries'>;

export interface EnquiryWithDetails extends Enquiry {
  course_name?: string;
}

// Fetch enquiries for a center
export function useCenterEnquiries(centerId?: string) {
  return useQuery({
    queryKey: ['center-enquiries', centerId],
    queryFn: async () => {
      if (!centerId) return [];
      
      const { data, error } = await supabase
        .from('enquiries')
        .select(`
          *,
          courses(name)
        `)
        .eq('center_id', centerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(enquiry => ({
        ...enquiry,
        course_name: enquiry.courses?.name,
      })) as EnquiryWithDetails[];
    },
    enabled: !!centerId,
  });
}

// Fetch all enquiries (admin view)
export function useAllEnquiries() {
  return useQuery({
    queryKey: ['all-enquiries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enquiries')
        .select(`
          *,
          courses(name),
          centers(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

// Enquiry statistics
export function useEnquiryStats(centerId?: string) {
  return useQuery({
    queryKey: ['enquiry-stats', centerId],
    queryFn: async () => {
      let query = supabase.from('enquiries').select('status');
      
      if (centerId) {
        query = query.eq('center_id', centerId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        total: data.length,
        new: data.filter(e => e.status === 'new').length,
        callback: data.filter(e => e.status === 'callback').length,
        enrolled: data.filter(e => e.status === 'enrolled').length,
        notInterested: data.filter(e => e.status === 'not_interested').length,
      };
    },
    enabled: centerId === undefined || !!centerId,
  });
}

// Create a new enquiry
export function useCreateEnquiry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (enquiry: EnquiryInsert) => {
      const { data, error } = await supabase
        .from('enquiries')
        .insert(enquiry)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center-enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['all-enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['enquiry-stats'] });
      toast.success('Enquiry added successfully!');
    },
    onError: (error) => {
      toast.error('Failed to add enquiry: ' + error.message);
    },
  });
}

// Update an enquiry
export function useUpdateEnquiry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: EnquiryUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('enquiries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center-enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['all-enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['enquiry-stats'] });
      toast.success('Enquiry updated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to update enquiry: ' + error.message);
    },
  });
}
