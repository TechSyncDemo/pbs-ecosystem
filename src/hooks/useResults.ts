import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ResultRow = {
  id: string;
  student_id: string;
  course_id: string;
  exam_date: string;
  theory_marks: number;
  theory_total: number;
  practical_marks: number;
  practical_total: number;
  theory_grace: number;
  practical_grace: number;
  status: string;
  result_date: string | null;
  practical_submitted_at: string | null;
  certificate_printed_at: string | null;
  certificate_no: string | null;
  students: {
    id: string;
    name: string;
    enrollment_no: string;
    center_id: string;
    centers: { id: string; name: string; code: string } | null;
  } | null;
  courses: { id: string; name: string; code: string; duration_months: number; theory_max_marks: number; practical_max_marks: number } | null;
};

const RESULTS_QUERY = `
  id, student_id, course_id, exam_date,
  theory_marks, theory_total, practical_marks, practical_total,
  theory_grace, practical_grace,
  status, result_date, practical_submitted_at, certificate_printed_at, certificate_no,
  students!inner ( id, name, enrollment_no, center_id, centers ( id, name, code ) ),
  courses!inner ( id, name, code, duration_months, theory_max_marks, practical_max_marks )
`;

export function usePendingResults() {
  return useQuery({
    queryKey: ['student_results', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_results')
        .select(RESULTS_QUERY)
        .eq('status', 'pending')
        .order('practical_submitted_at', { ascending: false });
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

export function useUpdateGrace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: 'theory_grace' | 'practical_grace'; value: number }) => {
      const { error } = await supabase
        .from('student_results')
        .update({ [field]: value })
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
        .select('id, student_id, theory_marks, theory_grace, practical_marks, practical_grace, theory_total, practical_total, certificate_no')
        .in('id', ids);
      if (fetchErr) throw fetchErr;

      // Persist combined totals for compatibility
      for (const r of results ?? []) {
        const final = Number(r.theory_marks) + Number(r.theory_grace) + Number(r.practical_marks) + Number(r.practical_grace);
        const total = Number(r.theory_total) + Number(r.practical_total);
        let certNo: string | null = r.certificate_no ?? null;
        if (!certNo) {
          const { data: gen } = await supabase.rpc('generate_certificate_no');
          certNo = (gen as unknown as string) ?? null;
        }
        await supabase.from('student_results').update({
          marks_obtained: Number(r.theory_marks) + Number(r.practical_marks),
          total_marks: total,
          grace_marks: Number(r.theory_grace) + Number(r.practical_grace),
          status: 'declared',
          result_date: new Date().toISOString(),
          declared_by: userData.user?.id ?? null,
          certificate_no: certNo,
        }).eq('id', r.id);
        void final;
      }

      const studentIds = (results ?? []).map((r) => r.student_id);
      if (studentIds.length > 0) {
        await supabase.from('students').update({ status: 'completed' }).in('id', studentIds);
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

export function useMarkPrinted() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('student_results')
        .update({ certificate_printed_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['student_results'] }),
  });
}

export function useAddResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      student_id: string;
      course_id: string;
      exam_date: string;
      theory_marks: number;
      theory_total: number;
      practical_total: number;
    }) => {
      const { error } = await supabase.from('student_results').insert({
        ...input,
        marks_obtained: input.theory_marks,
        total_marks: input.theory_total + input.practical_total,
        status: 'awaiting_practical',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student_results'] });
      toast.success('Result added — awaiting practical from center');
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
        .select('id, name, enrollment_no, course_id, center_id, courses ( id, name, theory_max_marks, practical_max_marks ), centers ( id, name )')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });
}
