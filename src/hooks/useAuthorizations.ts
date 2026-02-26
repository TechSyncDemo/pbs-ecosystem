import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Authorization {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AuthorizationInsert {
  name: string;
  code: string;
  description?: string | null;
  status?: string;
}

export interface AuthorizationUpdate {
  id: string;
  name?: string;
  code?: string;
  description?: string | null;
  status?: string;
}

export interface AuthorizationWithCourseCount extends Authorization {
  courseCount: number;
}

export const useAuthorizations = () => {
  return useQuery({
    queryKey: ['authorizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authorizations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Authorization[];
    },
  });
};

export const useAuthorizationsWithCourseCount = () => {
  return useQuery({
    queryKey: ['authorizations-with-courses'],
    queryFn: async () => {
      const { data: auths, error: authError } = await supabase
        .from('authorizations')
        .select('*')
        .order('name', { ascending: true });
      if (authError) throw authError;

      const { data: courses, error: courseError } = await supabase
        .from('courses')
        .select('authorization_id');
      if (courseError) throw courseError;

      const countMap = (courses || []).reduce((acc, c) => {
        if (c.authorization_id) {
          acc[c.authorization_id] = (acc[c.authorization_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      return (auths || []).map(a => ({
        ...a,
        courseCount: countMap[a.id] || 0,
      })) as AuthorizationWithCourseCount[];
    },
  });
};

export const useCreateAuthorization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (auth: AuthorizationInsert) => {
      const { data, error } = await supabase
        .from('authorizations')
        .insert(auth)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authorizations'] });
      queryClient.invalidateQueries({ queryKey: ['authorizations-with-courses'] });
      toast.success('Authorization created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create authorization: ${error.message}`);
    },
  });
};

export const useUpdateAuthorization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: AuthorizationUpdate) => {
      const { data, error } = await supabase
        .from('authorizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authorizations'] });
      queryClient.invalidateQueries({ queryKey: ['authorizations-with-courses'] });
      toast.success('Authorization updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update authorization: ${error.message}`);
    },
  });
};

export const useToggleAuthorizationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'inactive' }) => {
      const { data, error } = await supabase
        .from('authorizations')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authorizations'] });
      queryClient.invalidateQueries({ queryKey: ['authorizations-with-courses'] });
      toast.success('Authorization status updated');
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });
};
