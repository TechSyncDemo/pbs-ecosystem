import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type SupportTicket = Tables<'support_tickets'>;
export type SupportTicketInsert = TablesInsert<'support_tickets'>;
export type SupportTicketReply = Tables<'support_ticket_replies'>;

export interface TicketWithDetails extends SupportTicket {
  center_name?: string;
  replies?: SupportTicketReply[];
}

// Fetch all tickets (admin view)
export function useAllTickets() {
  return useQuery({
    queryKey: ['all-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          centers(name),
          support_ticket_replies(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(ticket => ({
        ...ticket,
        center_name: ticket.centers?.name,
        replies: ticket.support_ticket_replies,
      })) as TicketWithDetails[];
    },
  });
}

// Fetch tickets for a specific center
export function useCenterTickets(centerId?: string) {
  return useQuery({
    queryKey: ['center-tickets', centerId],
    queryFn: async () => {
      if (!centerId) return [];
      
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          support_ticket_replies(*)
        `)
        .eq('center_id', centerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(ticket => ({
        ...ticket,
        replies: ticket.support_ticket_replies,
      })) as TicketWithDetails[];
    },
    enabled: !!centerId,
  });
}

// Ticket statistics
export function useTicketStats() {
  return useQuery({
    queryKey: ['ticket-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('status, priority');

      if (error) throw error;

      return {
        total: data.length,
        open: data.filter(t => t.status === 'open').length,
        closed: data.filter(t => t.status === 'closed').length,
        highPriority: data.filter(t => t.priority === 'high' && t.status === 'open').length,
      };
    },
  });
}

// Create a new ticket
export function useCreateTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ticket: SupportTicketInsert) => {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert(ticket)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['center-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
      toast.success('Ticket created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create ticket: ' + error.message);
    },
  });
}

// Add a reply to a ticket
export function useAddTicketReply() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reply: TablesInsert<'support_ticket_replies'>) => {
      const { data, error } = await supabase
        .from('support_ticket_replies')
        .insert(reply)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['center-tickets'] });
      toast.success('Reply sent!');
    },
    onError: (error) => {
      toast.error('Failed to send reply: ' + error.message);
    },
  });
}

// Update ticket status
export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['center-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
      toast.success(`Ticket ${status === 'closed' ? 'closed' : 'reopened'}!`);
    },
    onError: (error) => {
      toast.error('Failed to update ticket: ' + error.message);
    },
  });
}
