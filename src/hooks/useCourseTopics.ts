import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CourseTopic {
  id: string;
  course_id: string;
  topic_name: string;
  max_marks: number;
  sort_order: number;
  created_at: string;
}

export interface CourseTopicInsert {
  course_id: string;
  topic_name: string;
  max_marks?: number;
  sort_order?: number;
}

export interface CourseTopicUpdate {
  id: string;
  topic_name?: string;
  max_marks?: number;
  sort_order?: number;
}

// Fetch topics for a specific course
export function useCourseTopics(courseId?: string) {
  return useQuery({
    queryKey: ['course-topics', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      
      const { data, error } = await supabase
        .from('course_topics')
        .select('*')
        .eq('course_id', courseId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as CourseTopic[];
    },
    enabled: !!courseId,
  });
}

// Create a new topic
export function useCreateCourseTopic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (topic: CourseTopicInsert) => {
      const { data, error } = await supabase
        .from('course_topics')
        .insert(topic)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-topics', variables.course_id] });
      toast.success('Topic added successfully!');
    },
    onError: (error) => {
      toast.error('Failed to add topic: ' + error.message);
    },
  });
}

// Update a topic
export function useUpdateCourseTopic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: CourseTopicUpdate) => {
      const { data, error } = await supabase
        .from('course_topics')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-topics', data.course_id] });
      toast.success('Topic updated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to update topic: ' + error.message);
    },
  });
}

// Delete a topic
export function useDeleteCourseTopic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, courseId }: { id: string; courseId: string }) => {
      const { error } = await supabase
        .from('course_topics')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { courseId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-topics', data.courseId] });
      toast.success('Topic deleted successfully!');
    },
    onError: (error) => {
      toast.error('Failed to delete topic: ' + error.message);
    },
  });
}

// Bulk update topic order
export function useReorderCourseTopics() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ topics, courseId }: { topics: { id: string; sort_order: number }[]; courseId: string }) => {
      const updates = topics.map(t => 
        supabase
          .from('course_topics')
          .update({ sort_order: t.sort_order })
          .eq('id', t.id)
      );
      
      await Promise.all(updates);
      return { courseId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-topics', data.courseId] });
      toast.success('Topics reordered successfully!');
    },
    onError: (error) => {
      toast.error('Failed to reorder topics: ' + error.message);
    },
  });
}
