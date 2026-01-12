import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Center = Tables<"centers">;
export type CenterInsert = TablesInsert<"centers">;
export type CenterUpdate = TablesUpdate<"centers">;

export const useCenters = () => {
  return useQuery({
    queryKey: ["centers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("centers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Center[];
    },
  });
};

export const useCenterStats = () => {
  return useQuery({
    queryKey: ["center-stats"],
    queryFn: async () => {
      const { data: centers, error: centersError } = await supabase
        .from("centers")
        .select("id, status");

      if (centersError) throw centersError;

      const { count: totalStudents, error: studentsError } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });

      if (studentsError) throw studentsError;

      const total = centers?.length || 0;
      const active = centers?.filter((c) => c.status === "active").length || 0;
      const inactive = centers?.filter((c) => c.status !== "active").length || 0;

      return {
        total,
        active,
        inactive,
        totalStudents: totalStudents || 0,
      };
    },
  });
};

export const useCenterWithStudentCount = () => {
  return useQuery({
    queryKey: ["centers-with-students"],
    queryFn: async () => {
      const { data: centers, error: centersError } = await supabase
        .from("centers")
        .select("*")
        .order("created_at", { ascending: false });

      if (centersError) throw centersError;

      // Get student counts per center
      const { data: studentCounts, error: studentsError } = await supabase
        .from("students")
        .select("center_id");

      if (studentsError) throw studentsError;

      const countMap = (studentCounts || []).reduce((acc, s) => {
        acc[s.center_id] = (acc[s.center_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return (centers || []).map((center) => ({
        ...center,
        studentCount: countMap[center.id] || 0,
      }));
    },
  });
};

export const useCreateCenter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (center: CenterInsert) => {
      const { data, error } = await supabase
        .from("centers")
        .insert(center)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
      queryClient.invalidateQueries({ queryKey: ["centers-with-students"] });
      queryClient.invalidateQueries({ queryKey: ["center-stats"] });
      toast.success("Center created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create center: ${error.message}`);
    },
  });
};

export const useUpdateCenter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CenterUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("centers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
      queryClient.invalidateQueries({ queryKey: ["centers-with-students"] });
      queryClient.invalidateQueries({ queryKey: ["center-stats"] });
      toast.success("Center updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update center: ${error.message}`);
    },
  });
};

export const useDeleteCenter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("centers").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
      queryClient.invalidateQueries({ queryKey: ["centers-with-students"] });
      queryClient.invalidateQueries({ queryKey: ["center-stats"] });
      toast.success("Center deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete center: ${error.message}`);
    },
  });
};
