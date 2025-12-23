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
import { toast } from 'sonner';

// Mock support tickets data from all centers
const mockAdminTickets = [
  {
    id: 'TKT-001',
    centerName: 'PBS Computer Education - City Center',
    subject: 'Exam credentials not received for a student',
    category: 'Exam',
    status: 'Open',
    priority: 'High',
    date: '2024-03-21',
    description: 'Student Priya Gupta (STU-002) has not received her exam credentials yet. The exam is scheduled for tomorrow. Please assist urgently.',
    replies: [
      { user: 'Center Staff', text: 'We have raised a ticket for the issue.', timestamp: '2024-03-21 10:00' },
      { user: 'Admin', text: 'We are looking into it. The credentials will be resent shortly.', timestamp: '2024-03-21 10:15' },
    ],
  },
  {
    id: 'TKT-002',
    centerName: 'Vocational Skills Institute - Suburb',
    subject: 'Issue with stock order ORD-2024-099',
    category: 'Admin',
    status: 'Closed',
    priority: 'Medium',
    date: '2024-03-18',
    description: 'Our payment for order ORD-2024-099 was successful via Bank Transfer, but the order status is still "Pending".',
    replies: [
      { user: 'Center Staff', text: 'Please check the payment status for our recent order.', timestamp: '2024-03-18 14:00' },
      { user: 'Admin', text: 'We have verified the payment. The order has been approved.', timestamp: '2024-03-18 16:30' },
      { user: 'Center Staff', text: 'Thank you for the quick resolution!', timestamp: '2024-03-18 16:35' },
    ],
  },
  {
    id: 'TKT-003',
    centerName: 'Tech Learners Hub - North',
    subject: 'Login issue on the portal',
    category: 'Technical',
    status: 'Open',
    priority: 'Low',
    date: '2024-03-20',
    description: 'One of our staff members is unable to log in. They are getting a "password incorrect" error, but the password is correct.',
    replies: [
      { user: 'Center Staff', text: 'We are facing a login problem.', timestamp: '2024-03-20 11:00' },
    ],
  },
];

type Ticket = typeof mockAdminTickets[0];

const StatCard = ({ icon: Icon, label, value, color }) => (
  <Card className="border-0 shadow-card">
    <CardContent className="p-4">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg ${color}/10 flex items-center justify-center`}>
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
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newReply, setNewReply] = useState('');

  const handleSendReply = () => {
    if (newReply.trim()) {
      toast.success('Reply sent!');
      setNewReply('');
    }
  };

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Open') {
      return <Badge className="bg-success hover:bg-success/90"><CheckCircle className="w-3 h-3 mr-1" />Open</Badge>;
    }
    return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Closed</Badge>;
  };

  const openTicketsCount = mockAdminTickets.filter(t => t.status === 'Open').length;
  const highPriorityCount = mockAdminTickets.filter(t => t.priority === 'High' && t.status === 'Open').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Support & Tickets</h1>
          <p className="text-muted-foreground mt-1">View and respond to support tickets from all centers.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Ticket} label="Open Tickets" value={openTicketsCount} color="success" />
          <StatCard icon={AlertTriangle} label="High Priority" value={highPriorityCount} color="destructive" />
        </div>

        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="font-heading">All Tickets</CardTitle>
          </CardHeader>
          <CardContent>
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
                  {mockAdminTickets.map((ticket) => (
                    <TableRow key={ticket.id} className="cursor-pointer table-row-hover" onClick={() => handleViewTicket(ticket)}>
                      <TableCell className="font-medium">{ticket.centerName}</TableCell>
                      <TableCell>{ticket.subject}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell><Badge variant={ticket.priority === 'High' ? 'destructive' : 'outline'}>{ticket.priority}</Badge></TableCell>
                      <TableCell>{new Date(ticket.date).toLocaleDateString()}</TableCell>
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
          </CardContent>
        </Card>

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle>Ticket: {selectedTicket?.subject}</DialogTitle>
              <DialogDescription>From: {selectedTicket?.centerName} | ID: {selectedTicket?.id}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">Initial Request</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedTicket?.description}</p>
              </div>
              <div className="space-y-4">
                {selectedTicket?.replies.map((reply, index) => (
                  <div key={index} className={`flex gap-3 ${reply.user === 'Admin' ? 'justify-start' : 'justify-end'}`}>
                    {reply.user === 'Admin' && <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0"><ShieldAlert className="w-4 h-4" /></div>}
                    <div className={`p-3 rounded-lg max-w-[80%] ${reply.user === 'Admin' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                      <p className="text-sm">{reply.text}</p>
                      <p className={`text-xs mt-1 ${reply.user === 'Admin' ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>{reply.user} - {reply.timestamp}</p>
                    </div>
                    {reply.user !== 'Admin' && <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0"><Ticket className="w-4 h-4" /></div>}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <Label>Your Reply</Label>
              <div className="flex gap-2 mt-2">
                <Textarea placeholder="Type your message..." value={newReply} onChange={(e) => setNewReply(e.target.value)} rows={2} />
                <Button onClick={handleSendReply} size="icon" className="flex-shrink-0"><Send className="w-4 h-4" /></Button>
              </div>
            </div>
            <DialogFooter className="mt-4">
              {selectedTicket?.status === 'Open' && (
                <Button variant="destructive" onClick={() => toast.info('Ticket has been closed.')}>
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