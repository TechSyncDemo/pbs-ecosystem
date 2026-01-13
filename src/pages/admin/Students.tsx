import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Search,
  Users,
  GraduationCap,
  Phone,
  Mail,
  Calendar,
  Download,
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
import { useAllStudents, useStudentStats } from '@/hooks/useStudents';
import { useCenters } from '@/hooks/useCenters';

export default function AdminStudents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [centerFilter, setCenterFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  const { data: students = [], isLoading: studentsLoading } = useAllStudents();
  const { data: stats, isLoading: statsLoading } = useStudentStats();
  const { data: centers = [] } = useCenters();

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.enrollment_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.course_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCenter = centerFilter === 'all' || student.center_id === centerFilter;
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
      return matchesSearch && matchesCenter && matchesStatus;
    });
  }, [students, searchQuery, centerFilter, statusFilter]);

  const getExamStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary">Pending</Badge>;
      case 'completed':
      case 'certified':
        return <Badge className="bg-success hover:bg-success/90">Completed</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  const handleEditMarks = (studentId: string) => {
    navigate(`/admin/results?student=${studentId}`);
    toast.info(`Navigating to results for student...`);
  };

  const handleViewCertificate = (studentId: string) => {
    navigate(`/admin/results?tab=printing&student=${studentId}`);
    toast.info(`Navigating to certificate queue...`);
  };

  const handleExport = () => {
    const csvContent = [
      ['Enrollment No', 'Name', 'Course', 'Center', 'Phone', 'Email', 'Status', 'Admission Date'].join(','),
      ...students.map(s => [
        s.enrollment_no,
        s.name,
        s.course_name || '',
        s.center_name || '',
        s.phone,
        s.email || '',
        s.status || '',
        s.admission_date
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
    toast.success('Students exported to CSV!');
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
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export to Excel
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {statsLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="border-0 shadow-card">
                  <CardContent className="p-4">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card className="border-0 shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.total || 0}</p>
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
                      <p className="text-2xl font-bold">{stats?.active || 0}</p>
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
                      <p className="text-2xl font-bold">{stats?.completed || 0}</p>
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
                      <p className="text-2xl font-bold">{stats?.certified || 0}</p>
                      <p className="text-sm text-muted-foreground">Certified</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
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
                    {centers.map(center => (
                      <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="certified">Certified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <>
                <div className="rounded-lg border overflow-hidden hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Center</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Exam Status</TableHead>
                        <TableHead>Certificate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No students found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredStudents.map((student) => (
                          <TableRow key={student.id} className="table-row-hover">
                            <TableCell>
                              <div>
                                <p className="font-medium">{student.name}</p>
                                <p className="text-sm text-muted-foreground">{student.enrollment_no}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="font-medium">{student.course_name}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(student.admission_date).toLocaleDateString()}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{student.center_name}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-sm flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-muted-foreground" />
                                  {student.phone}
                                </p>
                                {student.email && (
                                  <p className="text-sm flex items-center gap-1 text-muted-foreground">
                                    <Mail className="w-3 h-3" />
                                    {student.email}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getExamStatusBadge(student.status)}
                            </TableCell>
                            <TableCell>
                              {student.status === 'certified' ? (
                                <Button variant="outline" size="sm" onClick={() => handleViewCertificate(student.id)}>
                                  <Award className="w-4 h-4 mr-2" /> View
                                </Button>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {/* Mobile Card View */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {filteredStudents.map((student) => (
                    <Card key={student.id} className="w-full">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold">{student.name}</p>
                            <p className="text-sm text-muted-foreground">{student.enrollment_no}</p>
                          </div>
                          {getExamStatusBadge(student.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div>
                          <p className="font-medium">{student.course_name}</p>
                          <p className="text-muted-foreground">{student.center_name}</p>
                        </div>
                        <div>
                          <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {student.phone}</p>
                          {student.email && (
                            <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {student.email}</p>
                          )}
                        </div>
                        <div className="flex justify-end pt-2">
                          {student.status === 'certified' && (
                            <Button variant="outline" size="sm" onClick={() => handleViewCertificate(student.id)}>
                              <Award className="w-4 h-4 mr-2" /> View Cert
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
