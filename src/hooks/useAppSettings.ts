import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type AppSetting = Tables<'app_settings'>;
export type AppSettingInsert = TablesInsert<'app_settings'>;
export type AppSettingUpdate = TablesUpdate<'app_settings'>;

// Fetch all settings
export function useAppSettings() {
  return useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .order('category');

      if (error) throw error;
      
      // Convert array to object grouped by key
      const settings: Record<string, any> = {};
      data.forEach(setting => {
        settings[setting.key] = setting.value;
      });
      
      return { raw: data, grouped: settings };
    },
  });
}

// Fetch settings by category
export function useSettingsByCategory(category: string) {
  return useQuery({
    queryKey: ['app-settings', category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('category', category);

      if (error) throw error;
      return data;
    },
  });
}

// Update or create a setting
export function useUpsertSetting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ key, value, category }: { key: string; value: any; category: string }) => {
      // Try to update first
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', key)
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from('app_settings')
          .update({ value, category })
          .eq('key', key)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('app_settings')
          .insert({ key, value, category })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      toast.success('Settings saved successfully!');
    },
    onError: (error) => {
      toast.error('Failed to save settings: ' + error.message);
    },
  });
}

// Batch update settings
export function useBatchUpdateSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: Array<{ key: string; value: any; category: string }>) => {
      const results = [];
      
      for (const setting of settings) {
        const { data: existing } = await supabase
          .from('app_settings')
          .select('id')
          .eq('key', setting.key)
          .single();

        if (existing) {
          const { data, error } = await supabase
            .from('app_settings')
            .update({ value: setting.value, category: setting.category })
            .eq('key', setting.key)
            .select()
            .single();

          if (error) throw error;
          results.push(data);
        } else {
          const { data, error } = await supabase
            .from('app_settings')
            .insert(setting)
            .select()
            .single();

          if (error) throw error;
          results.push(data);
        }
      }
      
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      toast.success('Settings saved successfully!');
    },
    onError: (error) => {
      toast.error('Failed to save settings: ' + error.message);
    },
  });
}
