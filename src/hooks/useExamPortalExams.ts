import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ExamPortalExam {
  id: string;
  title: string;
  category?: string | null;
  difficulty?: string | null;
  duration?: number | null;
  passing_score?: number | null;
  is_active?: boolean | null;
  question_count?: number | null;
}

interface ExamListResponse {
  count: number;
  exams: ExamPortalExam[];
}

export function useExamPortalExams(activeOnly = true) {
  return useQuery({
    queryKey: ["exam-portal-exams", activeOnly],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<ExamListResponse>(
        "list-exam-portal-exams",
        { body: null, method: "GET", ...(activeOnly ? { headers: {} } : {}) },
      );
      // supabase-js doesn't expose query strings cleanly; fall back to raw fetch when needed
      if (error) throw error;
      return data?.exams ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
