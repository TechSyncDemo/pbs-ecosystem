import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Course = Tables<"courses">;
export type CourseInsert = TablesInsert<"courses">;
export type CourseUpdate = TablesUpdate<"courses">;

export interface CourseWithStudentCount extends Course {
  studentCount: number;
}

export const useCourses = () => {
  return useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Course[];
    },
  });
};

export const useCourseStats = () => {
  return useQuery({
    queryKey: ["course-stats"],
    queryFn: async () => {
      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select("id, status, fee");

      if (coursesError) throw coursesError;

      const { count: totalStudents, error: studentsError } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });

      if (studentsError) throw studentsError;

      const total = courses?.length || 0;
      const active = courses?.filter((c) => c.status === "active").length || 0;
      const inactive = courses?.filter((c) => c.status !== "active").length || 0;
      const avgFee = courses?.length 
        ? courses.reduce((acc, c) => acc + Number(c.fee), 0) / courses.length 
        : 0;

      return {
        total,
        active,
        inactive,
        totalEnrollments: totalStudents || 0,
        avgFee: Math.round(avgFee),
      };
    },
  });
};

export const useCoursesWithStudentCount = () => {
  return useQuery({
    queryKey: ["courses-with-students"],
    queryFn: async () => {
      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (coursesError) throw coursesError;

      // Get student counts per course
      const { data: studentCounts, error: studentsError } = await supabase
        .from("students")
        .select("course_id");

      if (studentsError) throw studentsError;

      const countMap = (studentCounts || []).reduce((acc, s) => {
        acc[s.course_id] = (acc[s.course_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return (courses || []).map((course) => ({
        ...course,
        studentCount: countMap[course.id] || 0,
      })) as CourseWithStudentCount[];
    },
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (course: CourseInsert) => {
      const { data, error } = await supabase
        .from("courses")
        .insert(course)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses-with-students"] });
      queryClient.invalidateQueries({ queryKey: ["course-stats"] });
      toast.success("Course created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create course: ${error.message}`);
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CourseUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("courses")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses-with-students"] });
      queryClient.invalidateQueries({ queryKey: ["course-stats"] });
      toast.success("Course updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update course: ${error.message}`);
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses-with-students"] });
      queryClient.invalidateQueries({ queryKey: ["course-stats"] });
      toast.success("Course deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete course: ${error.message}`);
    },
  });
};

// Toggle course status (active/inactive)
export const useToggleCourseStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "inactive" }) => {
      const { data, error } = await supabase
        .from("courses")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses-with-students"] });
      queryClient.invalidateQueries({ queryKey: ["course-stats"] });
      toast.success("Course status updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update course status: ${error.message}`);
    },
  });
};
