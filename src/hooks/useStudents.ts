import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Student = Tables<'students'>;
export type StudentInsert = TablesInsert<'students'>;
export type StudentUpdate = TablesUpdate<'students'>;

export interface StudentWithDetails extends Student {
  center_name?: string;
  course_name?: string;
}

// Fetch all students (admin view - all centers)
export function useAllStudents() {
  return useQuery({
    queryKey: ['all-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          centers(name),
          courses(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(student => ({
        ...student,
        center_name: student.centers?.name,
        course_name: student.courses?.name,
      })) as StudentWithDetails[];
    },
  });
}

// Fetch students for a specific center (center view)
export function useCenterStudents(centerId?: string) {
  return useQuery({
    queryKey: ['center-students', centerId],
    queryFn: async () => {
      if (!centerId) return [];
      
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          courses(name)
        `)
        .eq('center_id', centerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(student => ({
        ...student,
        course_name: student.courses?.name,
      })) as StudentWithDetails[];
    },
    enabled: !!centerId,
  });
}

// Student statistics for admin
export function useStudentStats() {
  return useQuery({
    queryKey: ['student-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('status');

      if (error) throw error;

      return {
        total: data.length,
        active: data.filter(s => s.status === 'active').length,
        completed: data.filter(s => s.status === 'completed').length,
        certified: data.filter(s => s.status === 'certified').length,
      };
    },
  });
}

// Create a new student
export function useCreateStudent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (student: StudentInsert) => {
      const { data, error } = await supabase
        .from('students')
        .insert(student)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-students'] });
      queryClient.invalidateQueries({ queryKey: ['center-students'] });
      queryClient.invalidateQueries({ queryKey: ['student-stats'] });
      toast.success('Student admitted successfully!');
    },
    onError: (error) => {
      toast.error('Failed to add student: ' + error.message);
    },
  });
}

// Update a student
export function useUpdateStudent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: StudentUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-students'] });
      queryClient.invalidateQueries({ queryKey: ['center-students'] });
      queryClient.invalidateQueries({ queryKey: ['student-stats'] });
      toast.success('Student updated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to update student: ' + error.message);
    },
  });
}
