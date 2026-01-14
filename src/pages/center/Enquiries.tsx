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
  UserPlus,
  Search,
  Plus,
  Phone,
  MessageSquare,
  MoreHorizontal,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CenterLayout from '@/layouts/CenterLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useCenterEnquiries, useEnquiryStats, useCreateEnquiry, useUpdateEnquiry, type EnquiryWithDetails } from '@/hooks/useEnquiries';
import { useCourses } from '@/hooks/useCourses';
import { format } from 'date-fns';

export default function CenterEnquiries() {
  const { user } = useAuth();
  const centerId = user?.centerId;

  const { data: enquiries = [], isLoading } = useCenterEnquiries(centerId);
  const { data: stats } = useEnquiryStats(centerId);
  const { data: courses = [] } = useCourses();
  const createEnquiry = useCreateEnquiry();
  const updateEnquiry = useUpdateEnquiry();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryWithDetails | null>(null);
  const [newRemark, setNewRemark] = useState('');
  const [newEnquiry, setNewEnquiry] = useState({
    name: '',
    phone: '',
    email: '',
    course_id: '',
    source: '',
  });

  const filteredEnquiries = enquiries.filter((enquiry) => {
    const matchesSearch =
      enquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enquiry.phone.includes(searchQuery) ||
      (enquiry.course_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || enquiry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddEnquiry = async () => {
    if (!centerId) return;

    await createEnquiry.mutateAsync({
      center_id: centerId,
      name: newEnquiry.name,
      phone: newEnquiry.phone,
      email: newEnquiry.email || null,
      course_id: newEnquiry.course_id || null,
      source: newEnquiry.source || 'walk-in',
      status: 'new',
    });

    setIsAddDialogOpen(false);
    setNewEnquiry({ name: '', phone: '', email: '', course_id: '', source: '' });
  };

  const handleAddRemark = async () => {
    if (!selectedEnquiry || !newRemark.trim()) return;

    const currentNotes = selectedEnquiry.notes || '';
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm');
    const newNote = `[${timestamp}] ${newRemark}`;
    const updatedNotes = currentNotes ? `${currentNotes}\n${newNote}` : newNote;

    await updateEnquiry.mutateAsync({
      id: selectedEnquiry.id,
      notes: updatedNotes,
    });

    setNewRemark('');
    setSelectedEnquiry({ ...selectedEnquiry, notes: updatedNotes });
  };

  const handleStatusChange = async (enquiryId: string, newStatus: string) => {
    await updateEnquiry.mutateAsync({
      id: enquiryId,
      status: newStatus,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="w-3 h-3" />;
      case 'callback':
        return <Phone className="w-3 h-3" />;
      case 'enrolled':
        return <CheckCircle className="w-3 h-3" />;
      case 'not_interested':
        return <XCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-info hover:bg-info/90';
      case 'callback':
        return 'bg-warning hover:bg-warning/90';
      case 'enrolled':
        return 'bg-success hover:bg-success/90';
      case 'not_interested':
        return 'bg-muted-foreground/50';
      default:
        return '';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'New';
      case 'callback': return 'Callback';
      case 'enrolled': return 'Enrolled';
      case 'not_interested': return 'Not Interested';
      default: return status;
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
            <h1 className="text-3xl font-heading font-bold text-foreground">Enquiry Management</h1>
            <p className="text-muted-foreground mt-1">Track and manage all leads and enquiries</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Enquiry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Enquiry</DialogTitle>
                <DialogDescription>
                  Record a new lead or enquiry from a prospective student.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    value={newEnquiry.name}
                    onChange={(e) => setNewEnquiry({ ...newEnquiry, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Mobile Number</Label>
                    <Input
                      id="phone"
                      placeholder="+91 98765 43210"
                      value={newEnquiry.phone}
                      onChange={(e) => setNewEnquiry({ ...newEnquiry, phone: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={newEnquiry.email}
                      onChange={(e) => setNewEnquiry({ ...newEnquiry, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="course">Interested Course</Label>
                  <Select
                    value={newEnquiry.course_id}
                    onValueChange={(value) => setNewEnquiry({ ...newEnquiry, course_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="source">Source</Label>
                  <Select
                    value={newEnquiry.source}
                    onValueChange={(value) => setNewEnquiry({ ...newEnquiry, source: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="How did they hear about us?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walk-in">Walk-in</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="social-media">Social Media</SelectItem>
                      <SelectItem value="newspaper">Newspaper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddEnquiry} disabled={createEnquiry.isPending || !newEnquiry.name || !newEnquiry.phone}>
                  {createEnquiry.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Enquiry
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.new || 0}</p>
                  <p className="text-sm text-muted-foreground">New</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.callback || 0}</p>
                  <p className="text-sm text-muted-foreground">Callback</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.enrolled || 0}</p>
                  <p className="text-sm text-muted-foreground">Enrolled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="font-heading">All Enquiries</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search enquiries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="callback">Callback</SelectItem>
                    <SelectItem value="enrolled">Enrolled</SelectItem>
                    <SelectItem value="not_interested">Not Interested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredEnquiries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {enquiries.length === 0 ? 'No enquiries yet. Add your first enquiry!' : 'No enquiries match your search.'}
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Prospect</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEnquiries.map((enquiry) => (
                      <TableRow key={enquiry.id} className="table-row-hover">
                        <TableCell>
                          <div>
                            <p className="font-medium">{enquiry.name}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {enquiry.phone}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{enquiry.course_name || 'Not specified'}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{enquiry.source?.replace('-', ' ') || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(enquiry.created_at), 'dd/MM/yyyy')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(enquiry.status || 'new')}>
                            {getStatusIcon(enquiry.status || 'new')}
                            <span className="ml-1">{getStatusLabel(enquiry.status || 'new')}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DialogTrigger asChild>
                                  <DropdownMenuItem onClick={() => setSelectedEnquiry(enquiry)}>
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    View & Add Remark
                                  </DropdownMenuItem>
                                </DialogTrigger>
                                <DropdownMenuItem onClick={() => handleStatusChange(enquiry.id, 'callback')}>
                                  <Phone className="w-4 h-4 mr-2" />
                                  Mark as Callback
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(enquiry.id, 'enrolled')}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Mark as Enrolled
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(enquiry.id, 'not_interested')}>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Mark as Not Interested
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <DialogContent className="sm:max-w-[600px]">
                              <DialogHeader>
                                <DialogTitle>Enquiry Details - {selectedEnquiry?.name}</DialogTitle>
                                <DialogDescription>
                                  Phone: {selectedEnquiry?.phone} | Course: {selectedEnquiry?.course_name || 'Not specified'}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Remarks History</h4>
                                  <div className="bg-muted/50 rounded-lg p-4 max-h-48 overflow-y-auto">
                                    {selectedEnquiry?.notes ? (
                                      <pre className="text-sm whitespace-pre-wrap">{selectedEnquiry.notes}</pre>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">No remarks yet.</p>
                                    )}
                                  </div>
                                </div>
                                <div className="grid gap-2">
                                  <Label>Add New Remark</Label>
                                  <Textarea
                                    placeholder="Enter your remark..."
                                    value={newRemark}
                                    onChange={(e) => setNewRemark(e.target.value)}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button onClick={handleAddRemark} disabled={updateEnquiry.isPending || !newRemark.trim()}>
                                  {updateEnquiry.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                  Add Remark
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CenterLayout>
  );
}
