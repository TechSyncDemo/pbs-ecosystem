import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ResultRow } from './useResults';

const Q = `
  id, student_id, course_id, exam_date,
  theory_marks, theory_total, practical_marks, practical_total,
  theory_grace, practical_grace,
  status, result_date, practical_submitted_at, certificate_printed_at, certificate_no,
  students!inner ( id, name, enrollment_no, center_id, centers ( id, name, code, city ) ),
  courses!inner ( id, name, code, duration_months, theory_max_marks, practical_max_marks, course_topics ( topic_name, sort_order ) )
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).rpc('submit_practical_marks', {
        _result_id: id,
        _practical_marks: practical_marks,
        _practical_total: practical_total,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['center_results'] });
      toast.success('Practical marks submitted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
