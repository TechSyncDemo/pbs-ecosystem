import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type CenterCourse = Tables<'center_courses'>;
export type CenterCourseInsert = TablesInsert<'center_courses'>;
export type CenterCourseUpdate = TablesUpdate<'center_courses'>;

export interface CenterCourseWithDetails extends CenterCourse {
  course_name?: string;
  center_name?: string;
}

// Fetch all center-course authorizations (admin view)
export function useAllCenterCourses() {
  return useQuery({
    queryKey: ['all-center-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('center_courses')
        .select(`
          *,
          centers(name),
          courses(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(cc => ({
        ...cc,
        center_name: cc.centers?.name,
        course_name: cc.courses?.name,
      })) as CenterCourseWithDetails[];
    },
  });
}

// Fetch authorizations for a specific center
export function useCenterAuthorizations(centerId?: string) {
  return useQuery({
    queryKey: ['center-authorizations', centerId],
    queryFn: async () => {
      if (!centerId) return [];
      
      const { data, error } = await supabase
        .from('center_courses')
        .select(`
          *,
          courses(name, code, fee, duration_months)
        `)
        .eq('center_id', centerId);

      if (error) throw error;
      
      return data.map(cc => ({
        ...cc,
        course_name: cc.courses?.name,
        course_code: cc.courses?.code,
        course_fee: cc.courses?.fee,
        course_duration: cc.courses?.duration_months,
      }));
    },
    enabled: !!centerId,
  });
}

// Assign a course to a center
export function useAssignCourseToCenter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CenterCourseInsert) => {
      const { data: result, error } = await supabase
        .from('center_courses')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-center-courses'] });
      queryClient.invalidateQueries({ queryKey: ['center-authorizations'] });
      toast.success('Course assigned to center successfully!');
    },
    onError: (error) => {
      toast.error('Failed to assign course: ' + error.message);
    },
  });
}

// Update a center-course authorization
export function useUpdateCenterCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: CenterCourseUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('center_courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-center-courses'] });
      queryClient.invalidateQueries({ queryKey: ['center-authorizations'] });
      toast.success('Authorization updated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to update authorization: ' + error.message);
    },
  });
}

// Remove a course from a center
export function useRemoveCenterCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('center_courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-center-courses'] });
      queryClient.invalidateQueries({ queryKey: ['center-authorizations'] });
      toast.success('Course removed from center!');
    },
    onError: (error) => {
      toast.error('Failed to remove course: ' + error.message);
    },
  });
}
