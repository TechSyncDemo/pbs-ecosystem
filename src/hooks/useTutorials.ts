import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TutorialWithDetails {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  link: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  course_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  authorization_names?: string[];
  authorization_ids?: string[];
}

// Fetch all tutorials with their authorization links
export function useTutorials() {
  return useQuery({
    queryKey: ['tutorials'],
    queryFn: async () => {
      const { data: tutorials, error } = await supabase
        .from('tutorials')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch tutorial_authorizations join
      const { data: tutAuthLinks, error: linkError } = await supabase
        .from('tutorial_authorizations')
        .select('tutorial_id, authorization_id');
      if (linkError) throw linkError;

      // Fetch all authorizations for names
      const { data: auths, error: authError } = await supabase
        .from('authorizations')
        .select('id, name');
      if (authError) throw authError;

      const authMap = Object.fromEntries((auths || []).map(a => [a.id, a.name]));

      return (tutorials || []).map(t => {
        const links = (tutAuthLinks || []).filter(l => l.tutorial_id === t.id);
        return {
          ...t,
          authorization_ids: links.map(l => l.authorization_id),
          authorization_names: links.map(l => authMap[l.authorization_id] || 'Unknown'),
        };
      }) as TutorialWithDetails[];
    },
  });
}

// Fetch tutorials filtered by center's authorizations
export function useCenterTutorials(centerAuthorizationIds: string[]) {
  return useQuery({
    queryKey: ['center-tutorials', centerAuthorizationIds],
    enabled: centerAuthorizationIds.length > 0,
    queryFn: async () => {
      // Get tutorial IDs linked to center's authorizations
      const { data: tutAuthLinks, error: linkError } = await supabase
        .from('tutorial_authorizations')
        .select('tutorial_id, authorization_id')
        .in('authorization_id', centerAuthorizationIds);
      if (linkError) throw linkError;

      const tutorialIds = [...new Set((tutAuthLinks || []).map(l => l.tutorial_id))];
      if (tutorialIds.length === 0) return [];

      const { data: tutorials, error } = await supabase
        .from('tutorials')
        .select('*')
        .in('id', tutorialIds)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const { data: auths } = await supabase.from('authorizations').select('id, name');
      const authMap = Object.fromEntries((auths || []).map(a => [a.id, a.name]));

      return (tutorials || []).map(t => {
        const links = (tutAuthLinks || []).filter(l => l.tutorial_id === t.id);
        return {
          ...t,
          authorization_ids: links.map(l => l.authorization_id),
          authorization_names: links.map(l => authMap[l.authorization_id] || 'Unknown'),
        };
      }) as TutorialWithDetails[];
    },
  });
}

// Create tutorial with authorization links
export function useCreateTutorial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ authorization_ids, ...tutorial }: {
      title: string;
      description?: string | null;
      category?: string | null;
      link?: string | null;
      file_url?: string | null;
      file_name?: string | null;
      file_size?: number | null;
      authorization_ids: string[];
    }) => {
      const { data, error } = await supabase
        .from('tutorials')
        .insert({ title: tutorial.title, description: tutorial.description, category: tutorial.category, link: tutorial.link, file_url: tutorial.file_url, file_name: tutorial.file_name, file_size: tutorial.file_size })
        .select()
        .single();
      if (error) throw error;

      if (authorization_ids.length > 0) {
        const { error: linkError } = await supabase
          .from('tutorial_authorizations')
          .insert(authorization_ids.map(aid => ({ tutorial_id: data.id, authorization_id: aid })));
        if (linkError) throw linkError;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
      queryClient.invalidateQueries({ queryKey: ['center-tutorials'] });
      toast.success('Tutorial created successfully!');
    },
    onError: (error) => toast.error('Failed to create tutorial: ' + error.message),
  });
}

// Update tutorial with authorization links
export function useUpdateTutorial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, authorization_ids, ...updates }: {
      id: string;
      title?: string;
      description?: string | null;
      category?: string | null;
      link?: string | null;
      file_url?: string | null;
      file_name?: string | null;
      file_size?: number | null;
      authorization_ids?: string[];
    }) => {
      const { data, error } = await supabase
        .from('tutorials')
        .update({ title: updates.title, description: updates.description, category: updates.category, link: updates.link, file_url: updates.file_url, file_name: updates.file_name, file_size: updates.file_size })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      if (authorization_ids !== undefined) {
        // Delete old links and insert new
        await supabase.from('tutorial_authorizations').delete().eq('tutorial_id', id);
        if (authorization_ids.length > 0) {
          const { error: linkError } = await supabase
            .from('tutorial_authorizations')
            .insert(authorization_ids.map(aid => ({ tutorial_id: id, authorization_id: aid })));
          if (linkError) throw linkError;
        }
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
      queryClient.invalidateQueries({ queryKey: ['center-tutorials'] });
      toast.success('Tutorial updated successfully!');
    },
    onError: (error) => toast.error('Failed to update tutorial: ' + error.message),
  });
}

// Delete tutorial
export function useDeleteTutorial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tutorials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
      queryClient.invalidateQueries({ queryKey: ['center-tutorials'] });
      toast.success('Tutorial deleted successfully!');
    },
    onError: (error) => toast.error('Failed to delete tutorial: ' + error.message),
  });
}
