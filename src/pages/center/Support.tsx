import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Clock,
  ShieldAlert,
  Ticket,
} from 'lucide-react';
import CenterLayout from '@/layouts/CenterLayout';
import { toast } from 'sonner';

// Mock support tickets data
const mockTickets = [
  {
    id: 'TKT-001',
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

type Ticket = typeof mockTickets[0];

export default function CenterSupport() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newReply, setNewReply] = useState('');
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: '',
    description: '',
    priority: 'Medium',
  });

  const handleCreateTicket = () => {
    toast.success('Ticket created successfully!', {
      description: `Ticket for "${newTicket.subject}" has been submitted.`,
    });
    setIsCreateDialogOpen(false);
    setNewTicket({ subject: '', category: '', description: '', priority: 'Medium' });
  };

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
                  <Input id="subject" placeholder="e.g., Issue with student admission" value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newTicket.category} onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technical">Technical</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Exam">Exam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newTicket.priority} onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Please provide a detailed description of the issue..." rows={4} value={newTicket.description} onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateTicket}>Submit Ticket</Button>
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
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTickets.map((ticket) => (
                    <TableRow key={ticket.id} className="cursor-pointer table-row-hover" onClick={() => handleViewTicket(ticket)}>
                      <TableCell className="font-medium">{ticket.id}</TableCell>
                      <TableCell>{ticket.subject}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
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

        {/* View Ticket Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle>Ticket: {selectedTicket?.subject}</DialogTitle>
              <DialogDescription>
                ID: {selectedTicket?.id} | Priority: {selectedTicket?.priority} | Category: {selectedTicket?.category}
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
                {selectedTicket?.replies.map((reply, index) => (
                  <div key={index} className={`flex gap-3 ${reply.user === 'Admin' ? 'justify-start' : 'justify-end'}`}>
                    {reply.user === 'Admin' && <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0"><ShieldAlert className="w-4 h-4" /></div>}
                    <div className={`p-3 rounded-lg max-w-[80%] ${reply.user === 'Admin' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                      <p className="text-sm">{reply.text}</p>
                      <p className={`text-xs mt-1 ${reply.user === 'Admin' ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
                        {reply.user} - {reply.timestamp}
                      </p>
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
              {selectedTicket?.status === 'Open' ? (
                <Button variant="destructive">
                  <XCircle className="w-4 h-4 mr-2" />
                  Close Ticket
                </Button>
              ) : (
                <Button className="bg-success hover:bg-success/90">
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