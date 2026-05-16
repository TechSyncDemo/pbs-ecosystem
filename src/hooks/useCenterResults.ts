import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ResultRow } from './useResults';

const Q = `
  id, student_id, course_id, exam_date,
  theory_marks, theory_total, practical_marks, practical_total,
  theory_grace, practical_grace,
  status, result_date, practical_submitted_at, certificate_printed_at,
  students!inner ( id, name, enrollment_no, center_id, centers ( id, name, code ) ),
  courses!inner ( id, name, code, duration_months, theory_max_marks, practical_max_marks )
`;

export function useCenterResults() {
  return useQuery({
    queryKey: ['center_results'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_results')
        .select(Q)
        .order('exam_date', { ascending: false });
      if (error) throw error;
      return (data as unknown as ResultRow[]) ?? [];
    },
  });
}

export function useSubmitPractical() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, practical_marks, practical_total }: { id: string; practical_marks: number; practical_total: number }) => {
      const { error } = await supabase
        .from('student_results')
        .update({
          practical_marks,
          practical_total,
          practical_submitted_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;

      // Flip to pending in a separate step (allowed because we just submitted)
      // Note: RLS limits center updates to awaiting_practical; status change
      // happens via the SECURITY DEFINER edge or via super admin path normally.
      // We rely on the awaiting_practical -> pending transition done by admin
      // when they pick up the row. To be safe, also try transitioning here:
      await supabase
        .from('student_results')
        .update({ status: 'pending' })
        .eq('id', id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['center_results'] });
      toast.success('Practical marks submitted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
