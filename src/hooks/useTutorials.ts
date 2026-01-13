import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Tutorial = Tables<'tutorials'>;
export type TutorialInsert = TablesInsert<'tutorials'>;
export type TutorialUpdate = TablesUpdate<'tutorials'>;

export interface TutorialWithDetails extends Tutorial {
  course_name?: string;
}

// Fetch all tutorials
export function useTutorials() {
  return useQuery({
    queryKey: ['tutorials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutorials')
        .select(`
          *,
          courses(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(tutorial => ({
        ...tutorial,
        course_name: tutorial.courses?.name,
      })) as TutorialWithDetails[];
    },
  });
}

// Create a new tutorial (admin only)
export function useCreateTutorial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tutorial: TutorialInsert) => {
      const { data, error } = await supabase
        .from('tutorials')
        .insert(tutorial)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
      toast.success('Tutorial created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create tutorial: ' + error.message);
    },
  });
}

// Update a tutorial
export function useUpdateTutorial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: TutorialUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('tutorials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
      toast.success('Tutorial updated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to update tutorial: ' + error.message);
    },
  });
}

// Delete a tutorial
export function useDeleteTutorial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tutorials')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
      toast.success('Tutorial deleted successfully!');
    },
    onError: (error) => {
      toast.error('Failed to delete tutorial: ' + error.message);
    },
  });
}
