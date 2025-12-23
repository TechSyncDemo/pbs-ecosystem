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
  Mail,
  Calendar,
  MessageSquare,
  MoreHorizontal,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CenterLayout from '@/layouts/CenterLayout';
import { toast } from 'sonner';

// Mock enquiries data
const mockEnquiries = [
  {
    id: 'ENQ-001',
    name: 'Arun Kumar',
    mobile: '+91 98765 43210',
    email: 'arun.k@email.com',
    course: 'Diploma in Digital Marketing',
    source: 'Walk-in',
    status: 'New',
    date: '2024-03-20',
    remarks: [
      { text: 'Initial enquiry about course details', timestamp: '2024-03-20 10:30', user: 'Staff1' },
    ],
  },
  {
    id: 'ENQ-002',
    name: 'Meera Joshi',
    mobile: '+91 87654 32109',
    email: 'meera.j@email.com',
    course: 'Web Development Fundamentals',
    source: 'Online',
    status: 'Callback',
    date: '2024-03-19',
    remarks: [
      { text: 'Called but no response', timestamp: '2024-03-19 14:00', user: 'Staff2' },
      { text: 'Will call back tomorrow', timestamp: '2024-03-19 14:05', user: 'Staff2' },
    ],
  },
  {
    id: 'ENQ-003',
    name: 'Rakesh Singh',
    mobile: '+91 76543 21098',
    email: 'rakesh.s@email.com',
    course: 'Certificate in Tally Prime',
    source: 'Referral',
    status: 'New',
    date: '2024-03-20',
    remarks: [
      { text: 'Referred by Priya Gupta', timestamp: '2024-03-20 09:00', user: 'Staff1' },
    ],
  },
  {
    id: 'ENQ-004',
    name: 'Sunita Devi',
    mobile: '+91 65432 10987',
    email: 'sunita.d@email.com',
    course: 'Advanced Computer Applications',
    source: 'Walk-in',
    status: 'Enrolled',
    date: '2024-03-18',
    remarks: [
      { text: 'Very interested, will join this week', timestamp: '2024-03-18 11:00', user: 'Staff1' },
      { text: 'Enrolled successfully', timestamp: '2024-03-19 10:00', user: 'Staff1' },
    ],
  },
  {
    id: 'ENQ-005',
    name: 'Vinod Patel',
    mobile: '+91 54321 09876',
    email: 'vinod.p@email.com',
    course: 'Certificate in Python Programming',
    source: 'Social Media',
    status: 'Not Interested',
    date: '2024-03-17',
    remarks: [
      { text: 'Looking for shorter course', timestamp: '2024-03-17 15:00', user: 'Staff2' },
      { text: 'Decided not to pursue', timestamp: '2024-03-18 12:00', user: 'Staff2' },
    ],
  },
];

const courses = [
  'Advanced Computer Applications',
  'Diploma in Digital Marketing',
  'Certificate in Tally Prime',
  'Web Development Fundamentals',
  'Certificate in Python Programming',
  'Spoken English Course',
];

export default function CenterEnquiries() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<typeof mockEnquiries[0] | null>(null);
  const [newRemark, setNewRemark] = useState('');
  const [newEnquiry, setNewEnquiry] = useState({
    name: '',
    mobile: '',
    email: '',
    course: '',
    source: '',
  });

  const filteredEnquiries = mockEnquiries.filter((enquiry) => {
    const matchesSearch =
      enquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enquiry.mobile.includes(searchQuery) ||
      enquiry.course.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || enquiry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddEnquiry = () => {
    toast.success('Enquiry added successfully!', {
      description: `${newEnquiry.name} has been added to the enquiry list.`,
    });
    setIsAddDialogOpen(false);
    setNewEnquiry({ name: '', mobile: '', email: '', course: '', source: '' });
  };

  const handleAddRemark = () => {
    if (newRemark.trim()) {
      toast.success('Remark added!');
      setNewRemark('');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'New':
        return <Clock className="w-3 h-3" />;
      case 'Callback':
        return <Phone className="w-3 h-3" />;
      case 'Enrolled':
        return <CheckCircle className="w-3 h-3" />;
      case 'Not Interested':
        return <XCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-info hover:bg-info/90';
      case 'Callback':
        return 'bg-warning hover:bg-warning/90';
      case 'Enrolled':
        return 'bg-success hover:bg-success/90';
      case 'Not Interested':
        return 'bg-muted-foreground/50';
      default:
        return '';
    }
  };

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
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <Input
                      id="mobile"
                      placeholder="+91 98765 43210"
                      value={newEnquiry.mobile}
                      onChange={(e) => setNewEnquiry({ ...newEnquiry, mobile: e.target.value })}
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
                    value={newEnquiry.course}
                    onValueChange={(value) => setNewEnquiry({ ...newEnquiry, course: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course} value={course}>
                          {course}
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
                      <SelectItem value="Walk-in">Walk-in</SelectItem>
                      <SelectItem value="Online">Online</SelectItem>
                      <SelectItem value="Referral">Referral</SelectItem>
                      <SelectItem value="Social Media">Social Media</SelectItem>
                      <SelectItem value="Newspaper">Newspaper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddEnquiry}>Add Enquiry</Button>
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
                  <p className="text-2xl font-bold">{mockEnquiries.length}</p>
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
                  <p className="text-2xl font-bold">{mockEnquiries.filter(e => e.status === 'New').length}</p>
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
                  <p className="text-2xl font-bold">{mockEnquiries.filter(e => e.status === 'Callback').length}</p>
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
                  <p className="text-2xl font-bold">{mockEnquiries.filter(e => e.status === 'Enrolled').length}</p>
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
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Callback">Callback</SelectItem>
                    <SelectItem value="Enrolled">Enrolled</SelectItem>
                    <SelectItem value="Not Interested">Not Interested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
                              {enquiry.mobile}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{enquiry.course}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{enquiry.source}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(enquiry.date).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(enquiry.status)}>
                          {getStatusIcon(enquiry.status)}
                          <span className="ml-1">{enquiry.status}</span>
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
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                              <DialogTitle>Enquiry Details - {selectedEnquiry?.name}</DialogTitle>
                              <DialogDescription>
                                View history and add follow-up remarks
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Course</p>
                                    <p className="font-medium">{selectedEnquiry?.course}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Status</p>
                                    <Badge className={getStatusColor(selectedEnquiry?.status || '')}>
                                      {selectedEnquiry?.status}
                                    </Badge>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Mobile</p>
                                    <p className="font-medium">{selectedEnquiry?.mobile}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Email</p>
                                    <p className="font-medium">{selectedEnquiry?.email}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <h4 className="font-medium">Follow-up History</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {selectedEnquiry?.remarks.map((remark, index) => (
                                    <div key={index} className="p-3 bg-muted/30 rounded-lg text-sm">
                                      <p>{remark.text}</p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {remark.timestamp} by {remark.user}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="mt-4">
                                <Label>Add Remark</Label>
                                <div className="flex gap-2 mt-2">
                                  <Textarea
                                    placeholder="Enter follow-up notes..."
                                    value={newRemark}
                                    onChange={(e) => setNewRemark(e.target.value)}
                                    rows={2}
                                  />
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button onClick={handleAddRemark}>Add Remark</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </CenterLayout>
  );
}
