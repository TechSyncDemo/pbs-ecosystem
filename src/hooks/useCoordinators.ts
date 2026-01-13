import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Coordinator = Tables<'coordinators'>;
export type CoordinatorInsert = TablesInsert<'coordinators'>;
export type CoordinatorUpdate = TablesUpdate<'coordinators'>;

// Fetch all coordinators
export function useCoordinators() {
  return useQuery({
    queryKey: ['coordinators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coordinators')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });
}

// Create a new coordinator
export function useCreateCoordinator() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (coordinator: CoordinatorInsert) => {
      const { data, error } = await supabase
        .from('coordinators')
        .insert(coordinator)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coordinators'] });
      toast.success('Coordinator created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create coordinator: ' + error.message);
    },
  });
}

// Update a coordinator
export function useUpdateCoordinator() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: CoordinatorUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('coordinators')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coordinators'] });
      toast.success('Coordinator updated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to update coordinator: ' + error.message);
    },
  });
}

// Delete a coordinator
export function useDeleteCoordinator() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coordinators')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coordinators'] });
      toast.success('Coordinator deleted successfully!');
    },
    onError: (error) => {
      toast.error('Failed to delete coordinator: ' + error.message);
    },
  });
}
