import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ResultRow = {
  id: string;
  student_id: string;
  course_id: string;
  exam_date: string;
  marks_obtained: number;
  total_marks: number;
  grace_marks: number;
  status: string;
  result_date: string | null;
  students: {
    id: string;
    name: string;
    enrollment_no: string;
    center_id: string;
    centers: { id: string; name: string; code: string } | null;
  } | null;
  courses: { id: string; name: string; code: string; max_marks: number; duration_months: number } | null;
};

const RESULTS_QUERY = `
  id, student_id, course_id, exam_date, marks_obtained, total_marks,
  grace_marks, status, result_date,
  students!inner ( id, name, enrollment_no, center_id, centers ( id, name, code ) ),
  courses!inner ( id, name, code, max_marks, duration_months )
`;

export function usePendingResults() {
  return useQuery({
    queryKey: ['student_results', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_results')
        .select(RESULTS_QUERY)
        .eq('status', 'pending')
        .order('exam_date', { ascending: false });
      if (error) throw error;
      return (data as unknown as ResultRow[]) ?? [];
    },
  });
}

export function useDeclaredResults() {
  return useQuery({
    queryKey: ['student_results', 'declared'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_results')
        .select(RESULTS_QUERY)
        .eq('status', 'declared')
        .order('result_date', { ascending: false });
      if (error) throw error;
      return (data as unknown as ResultRow[]) ?? [];
    },
  });
}

export function useUpdateGraceMarks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, grace_marks }: { id: string; grace_marks: number }) => {
      const { error } = await supabase
        .from('student_results')
        .update({ grace_marks })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['student_results'] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeclareResults() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data: results, error: fetchErr } = await supabase
        .from('student_results')
        .select('id, student_id')
        .in('id', ids);
      if (fetchErr) throw fetchErr;

      const { error } = await supabase
        .from('student_results')
        .update({
          status: 'declared',
          result_date: new Date().toISOString(),
          declared_by: userData.user?.id ?? null,
        })
        .in('id', ids);
      if (error) throw error;

      const studentIds = (results ?? []).map((r) => r.student_id);
      if (studentIds.length > 0) {
        await supabase
          .from('students')
          .update({ status: 'completed' })
          .in('id', studentIds);
      }
      return ids.length;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ['student_results'] });
      qc.invalidateQueries({ queryKey: ['students'] });
      toast.success(`${count} result(s) declared`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAddResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      student_id: string;
      course_id: string;
      exam_date: string;
      marks_obtained: number;
      total_marks: number;
    }) => {
      const { error } = await supabase.from('student_results').insert({
        ...input,
        status: 'pending',
        grace_marks: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student_results'] });
      toast.success('Result added');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useStudentsForResults() {
  return useQuery({
    queryKey: ['students', 'for-results'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, enrollment_no, course_id, center_id, courses ( id, name, max_marks ), centers ( id, name )')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });
}
