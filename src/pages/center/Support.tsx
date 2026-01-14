import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Ticket,
  Loader2,
} from 'lucide-react';
import CenterLayout from '@/layouts/CenterLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useCenterTickets, useCreateTicket, useAddTicketReply, useUpdateTicketStatus, type TicketWithDetails } from '@/hooks/useSupportTickets';
import { format } from 'date-fns';

export default function CenterSupport() {
  const { user } = useAuth();
  const centerId = user?.centerId;

  const { data: tickets = [], isLoading } = useCenterTickets(centerId);
  const createTicket = useCreateTicket();
  const addReply = useAddTicketReply();
  const updateStatus = useUpdateTicketStatus();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithDetails | null>(null);
  const [newReply, setNewReply] = useState('');
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'medium',
  });

  const handleCreateTicket = async () => {
    if (!centerId) return;

    await createTicket.mutateAsync({
      center_id: centerId,
      subject: newTicket.subject,
      description: newTicket.description,
      priority: newTicket.priority,
      status: 'open',
    });

    setIsCreateDialogOpen(false);
    setNewTicket({ subject: '', description: '', priority: 'medium' });
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !newReply.trim()) return;

    await addReply.mutateAsync({
      ticket_id: selectedTicket.id,
      message: newReply,
      sender_type: 'center',
    });

    setNewReply('');
    // Refresh ticket data
    const updatedReplies = [...(selectedTicket.replies || []), {
      id: 'temp',
      ticket_id: selectedTicket.id,
      message: newReply,
      sender_type: 'center',
      sender_id: null,
      created_at: new Date().toISOString(),
    }];
    setSelectedTicket({ ...selectedTicket, replies: updatedReplies });
  };

  const handleViewTicket = (ticket: TicketWithDetails) => {
    setSelectedTicket(ticket);
    setIsViewDialogOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!selectedTicket) return;
    const newStatus = selectedTicket.status === 'open' ? 'closed' : 'open';
    await updateStatus.mutateAsync({ id: selectedTicket.id, status: newStatus });
    setSelectedTicket({ ...selectedTicket, status: newStatus });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'open') {
      return <Badge className="bg-success hover:bg-success/90"><CheckCircle className="w-3 h-3 mr-1" />Open</Badge>;
    }
    return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Closed</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge className="bg-warning hover:bg-warning/90">Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  if (isLoading) {
    return (
      <CenterLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </CenterLayout>
    );
  }

  return (
    <CenterLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Support System</h1>
            <p className="text-muted-foreground mt-1">Raise tickets and get help from the admin team</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create a Support Ticket</DialogTitle>
                <DialogDescription>
                  Describe your issue, and our admin team will get back to you.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Issue with student admission"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newTicket.priority}
                    onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Please provide a detailed description of the issue..."
                    rows={4}
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTicket}
                  disabled={createTicket.isPending || !newTicket.subject || !newTicket.description}
                >
                  {createTicket.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit Ticket
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tickets Table */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="font-heading">My Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No support tickets yet. Create one if you need help!
              </div>
            ) : (
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Subject</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow
                        key={ticket.id}
                        className="cursor-pointer table-row-hover"
                        onClick={() => handleViewTicket(ticket)}
                      >
                        <TableCell className="font-medium">{ticket.subject}</TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell>{format(new Date(ticket.created_at), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Ticket Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle>Ticket: {selectedTicket?.subject}</DialogTitle>
              <DialogDescription>
                Priority: {selectedTicket?.priority} | Created: {selectedTicket ? format(new Date(selectedTicket.created_at), 'dd/MM/yyyy HH:mm') : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Initial Description */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">Initial Request</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedTicket?.description}</p>
              </div>

              {/* Chat-style replies */}
              <div className="space-y-4">
                {selectedTicket?.replies?.map((reply, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${reply.sender_type === 'admin' ? 'justify-start' : 'justify-end'}`}
                  >
                    {reply.sender_type === 'admin' && (
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`p-3 rounded-lg max-w-[80%] ${
                        reply.sender_type === 'admin' ? 'bg-muted' : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      <p className="text-sm">{reply.message}</p>
                      <p
                        className={`text-xs mt-1 ${
                          reply.sender_type === 'admin' ? 'text-muted-foreground' : 'text-primary-foreground/70'
                        }`}
                      >
                        {reply.sender_type === 'admin' ? 'Admin' : 'You'} - {format(new Date(reply.created_at), 'dd/MM HH:mm')}
                      </p>
                    </div>
                    {reply.sender_type !== 'admin' && (
                      <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0">
                        <Ticket className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {selectedTicket?.status === 'open' && (
              <div className="mt-4">
                <Label>Your Reply</Label>
                <div className="flex gap-2 mt-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    rows={2}
                  />
                  <Button
                    onClick={handleSendReply}
                    size="icon"
                    className="flex-shrink-0"
                    disabled={addReply.isPending || !newReply.trim()}
                  >
                    {addReply.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}
            <DialogFooter className="mt-4">
              {selectedTicket?.status === 'open' ? (
                <Button variant="destructive" onClick={handleToggleStatus} disabled={updateStatus.isPending}>
                  {updateStatus.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <XCircle className="w-4 h-4 mr-2" />
                  Close Ticket
                </Button>
              ) : (
                <Button className="bg-success hover:bg-success/90" onClick={handleToggleStatus} disabled={updateStatus.isPending}>
                  {updateStatus.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Re-open Ticket
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CenterLayout>
  );
}
