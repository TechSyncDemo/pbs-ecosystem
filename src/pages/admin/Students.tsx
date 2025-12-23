import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Users,
  GraduationCap,
  Phone,
  Mail,
  Calendar,
  Download,
  FileText,
  Award,
  Edit,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AdminLayout from '@/layouts/AdminLayout';
import { toast } from 'sonner';

// Mock students data
const mockStudents = [
  {
    id: 'STU-2024-001',
    name: 'Rahul Sharma',
    course: 'Advanced Computer Applications',
    center: 'PBS Delhi Center',
    mobile: '+91 98765 43210',
    email: 'rahul.s@email.com',
    admissionDate: '2024-01-15',
    status: 'Active',
    feesPaid: 12000,
    feesTotal: 15000,
    marks: null,
  },
  {
    id: 'STU-2024-002',
    name: 'Priya Gupta',
    course: 'Diploma in Digital Marketing',
    center: 'PBS Mumbai Center',
    mobile: '+91 87654 32109',
    email: 'priya.g@email.com',
    admissionDate: '2024-02-01',
    status: 'Active',
    feesPaid: 12000,
    feesTotal: 12000,
    marks: null,
  },
  {
    id: 'STU-2024-003',
    name: 'Amit Kumar',
    course: 'Certificate in Tally Prime',
    center: 'PBS Bangalore Center',
    mobile: '+91 76543 21098',
    email: 'amit.k@email.com',
    admissionDate: '2024-02-15',
    status: 'Exam Completed',
    feesPaid: 8000,
    feesTotal: 8000,
    marks: 78,
  },
  {
    id: 'STU-2024-004',
    name: 'Sneha Reddy',
    course: 'Web Development Fundamentals',
    center: 'PBS Chennai Center',
    mobile: '+91 65432 10987',
    email: 'sneha.r@email.com',
    admissionDate: '2024-03-01',
    status: 'Active',
    feesPaid: 15000,
    feesTotal: 18000,
    marks: null,
  },
  {
    id: 'STU-2024-005',
    name: 'Vikram Singh',
    course: 'Certificate in Python Programming',
    center: 'PBS Delhi Center',
    mobile: '+91 54321 09876',
    email: 'vikram.s@email.com',
    admissionDate: '2024-03-10',
    status: 'Certified',
    feesPaid: 14000,
    feesTotal: 14000,
    marks: 92,
  },
];

export default function AdminStudents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [centerFilter, setCenterFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  const filteredStudents = mockStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.course.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCenter = centerFilter === 'all' || student.center === centerFilter;
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    return matchesSearch && matchesCenter && matchesStatus;
  });

  const getExamStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge variant="secondary">Pending</Badge>;
      case 'Exam Completed':
      case 'Certified':
        return <Badge className="bg-success hover:bg-success/90">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleEditMarks = (studentId: string) => {
    // Navigate to the results page, potentially with a query to highlight the student
    navigate(`/admin/results?student=${studentId}`);
    toast.info(`Navigating to results for student ${studentId}...`);
  };

  const handleViewCertificate = (studentId: string) => {
    // Navigate to the results page, and switch to the printing tab
    navigate(`/admin/results?tab=printing&student=${studentId}`);
    toast.info(`Navigating to certificate queue for student ${studentId}...`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Student Records</h1>
            <p className="text-muted-foreground mt-1">View and manage all student records across centers</p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export to Excel
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mockStudents.length}</p>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mockStudents.filter(s => s.status === 'Active').length}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mockStudents.filter(s => s.status === 'Exam Completed').length}</p>
                  <p className="text-sm text-muted-foreground">Exam Done</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mockStudents.filter(s => s.status === 'Certified').length}</p>
                  <p className="text-sm text-muted-foreground">Certified</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <CardTitle className="font-heading">All Students</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={centerFilter} onValueChange={setCenterFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by center" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Centers</SelectItem>
                    <SelectItem value="PBS Delhi Center">PBS Delhi Center</SelectItem>
                    <SelectItem value="PBS Mumbai Center">PBS Mumbai Center</SelectItem>
                    <SelectItem value="PBS Bangalore Center">PBS Bangalore Center</SelectItem>
                    <SelectItem value="PBS Chennai Center">PBS Chennai Center</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Exam Completed">Exam Completed</SelectItem>
                    <SelectItem value="Certified">Certified</SelectItem>
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
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Center</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Exam Status</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Certificate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id} className="table-row-hover">
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{student.course}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(student.admissionDate).toLocaleDateString()}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.center}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm flex items-center gap-1">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            {student.mobile}
                          </p>
                          <p className="text-sm flex items-center gap-1 text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {student.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getExamStatusBadge(student.status)}
                      </TableCell>
                      <TableCell>
                        {student.marks !== null ? (
                          <Button variant="link" className="p-0 h-auto" onClick={() => handleEditMarks(student.id)}>
                            {student.marks}/100 <Edit className="w-3 h-3 ml-2" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.status === 'Certified' ? (
                          <Button variant="outline" size="sm" onClick={() => handleViewCertificate(student.id)}>
                            <Award className="w-4 h-4 mr-2" /> View
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
