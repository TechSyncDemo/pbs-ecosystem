import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Ticket,
  AlertTriangle,
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  useAllTickets,
  useTicketStats,
  useAddTicketReply,
  useUpdateTicketStatus,
  type TicketWithDetails,
} from '@/hooks/useSupportTickets';

const StatCard = ({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) => (
  <Card className="border-0 shadow-card">
    <CardContent className="p-4">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg bg-${color}/10 flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}`} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function AdminSupport() {
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithDetails | null>(null);
  const [newReply, setNewReply] = useState('');

  const { user } = useAuth();
  const { data: tickets = [], isLoading: ticketsLoading } = useAllTickets();
  const { data: stats, isLoading: statsLoading } = useTicketStats();
  const addReply = useAddTicketReply();
  const updateStatus = useUpdateTicketStatus();

  const handleSendReply = () => {
    if (!newReply.trim() || !selectedTicket || !user) return;

    addReply.mutate({
      ticket_id: selectedTicket.id,
      message: newReply,
      sender_type: 'admin',
      sender_id: user.id,
    }, {
      onSuccess: () => {
        setNewReply('');
      },
    });
  };

  const handleCloseTicket = () => {
    if (!selectedTicket) return;
    updateStatus.mutate({ id: selectedTicket.id, status: 'closed' }, {
      onSuccess: () => {
        setIsViewDialogOpen(false);
        setSelectedTicket(null);
      },
    });
  };

  const handleViewTicket = (ticket: TicketWithDetails) => {
    setSelectedTicket(ticket);
    setIsViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'open') {
      return <Badge className="bg-success hover:bg-success/90"><CheckCircle className="w-3 h-3 mr-1" />Open</Badge>;
    }
    return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Closed</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Support & Tickets</h1>
          <p className="text-muted-foreground mt-1">View and respond to support tickets from all centers.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading ? (
            <>
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="border-0 shadow-card">
                  <CardContent className="p-4">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <StatCard icon={Ticket} label="Open Tickets" value={stats?.open || 0} color="success" />
              <StatCard icon={AlertTriangle} label="High Priority" value={stats?.highPriority || 0} color="destructive" />
            </>
          )}
        </div>

        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="font-heading">All Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            {ticketsLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Center</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No tickets found
                        </TableCell>
                      </TableRow>
                    ) : (
                      tickets.map((ticket) => (
                        <TableRow key={ticket.id} className="cursor-pointer table-row-hover" onClick={() => handleViewTicket(ticket)}>
                          <TableCell className="font-medium">{ticket.center_name}</TableCell>
                          <TableCell>{ticket.subject}</TableCell>
                          <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                          <TableCell><Badge variant={ticket.priority === 'high' ? 'destructive' : 'outline'}>{ticket.priority}</Badge></TableCell>
                          <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle>Ticket: {selectedTicket?.subject}</DialogTitle>
              <DialogDescription>From: {selectedTicket?.center_name}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">Initial Request</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedTicket?.description}</p>
              </div>
              <div className="space-y-4">
                {selectedTicket?.replies?.map((reply) => (
                  <div key={reply.id} className={`flex gap-3 ${reply.sender_type === 'admin' ? 'justify-start' : 'justify-end'}`}>
                    {reply.sender_type === 'admin' && <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0"><ShieldAlert className="w-4 h-4" /></div>}
                    <div className={`p-3 rounded-lg max-w-[80%] ${reply.sender_type === 'admin' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                      <p className="text-sm">{reply.message}</p>
                      <p className={`text-xs mt-1 ${reply.sender_type === 'admin' ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
                        {reply.sender_type === 'admin' ? 'Admin' : 'Center'} - {new Date(reply.created_at).toLocaleString()}
                      </p>
                    </div>
                    {reply.sender_type !== 'admin' && <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0"><Ticket className="w-4 h-4" /></div>}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <Label>Your Reply</Label>
              <div className="flex gap-2 mt-2">
                <Textarea placeholder="Type your message..." value={newReply} onChange={(e) => setNewReply(e.target.value)} rows={2} />
                <Button onClick={handleSendReply} size="icon" className="flex-shrink-0" disabled={addReply.isPending}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <DialogFooter className="mt-4">
              {selectedTicket?.status === 'open' && (
                <Button variant="destructive" onClick={handleCloseTicket} disabled={updateStatus.isPending}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Close Ticket
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
