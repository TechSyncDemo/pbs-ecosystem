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
      // The proxy edge function appends ?active=true based on a custom header.
      // We use functions.invoke and rely on the edge function reading the header.
      const { data, error } = await supabase.functions.invoke<ExamListResponse>(
        `list-exam-portal-exams${activeOnly ? "?active=true" : ""}`,
        { method: "GET" },
      );
      if (error) throw error;
      return data?.exams ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
