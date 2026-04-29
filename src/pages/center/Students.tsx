import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  Search,
  Plus,
  Phone,
  GraduationCap,
  IndianRupee,
  Loader2,
  Pencil,
  Eye,
  EyeOff,
  Lock,
  Copy,
  Download,
} from 'lucide-react';
import CenterLayout from '@/layouts/CenterLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useCenterStudents, useCreateStudent, useUpdateStudent, type StudentWithDetails } from '@/hooks/useStudents';
import { useCourses } from '@/hooks/useCourses';
import { useCenterAuthorizations } from '@/hooks/useCenterCourses';
import { useCenterStock } from '@/hooks/useStock';
import { format } from 'date-fns';
import { toast } from 'sonner';

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function CenterStudents() {
  const { user } = useAuth();
  const centerId = user?.centerId;

  const { data: students = [], isLoading } = useCenterStudents(centerId);
  const { data: courses = [] } = useCourses();
  const { data: authorizations = [] } = useCenterAuthorizations(centerId);
  const { data: stockData = [] } = useCenterStock(centerId);
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('course');
  const [editStudent, setEditStudent] = useState<StudentWithDetails | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    guardian_phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    fee_paid: '',
    status: '',
  });
  const [feeToAdd, setFeeToAdd] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [exportFromDate, setExportFromDate] = useState('');
  const [exportToDate, setExportToDate] = useState('');

  const [newStudent, setNewStudent] = useState({
    name: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    email: '',
    guardian_phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    course_id: '',
    fee_paid: '',
    fee_pending: '',
  });

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.enrollment_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.course_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const authorizedCourseIds = authorizations.map(a => a.course_id);
  const coursesWithStockIds = stockData
    .filter(s => s.quantity > 0 && s.stock_item?.course_id)
    .map(s => s.stock_item!.course_id!);
  const availableCourses = courses.filter(
    c => authorizedCourseIds.includes(c.id) && c.status === 'active' && coursesWithStockIds.includes(c.id)
  );
  const allAuthorizedCourses = courses.filter(c => authorizedCourseIds.includes(c.id) && c.status === 'active');

  const handleAddStudent = async () => {
    if (!centerId || !newStudent.course_id) return;

    const { data: enrollmentData, error: enrollError } = await supabase.rpc('generate_enrollment_no');
    if (enrollError || !enrollmentData) {
      toast.error('Failed to generate enrollment number');
      return;
    }

    const password = generatePassword();

    await createStudent.mutateAsync({
      center_id: centerId,
      course_id: newStudent.course_id,
      name: newStudent.name,
      phone: newStudent.phone,
      email: newStudent.email || null,
      date_of_birth: newStudent.date_of_birth || null,
      gender: newStudent.gender || null,
      guardian_phone: newStudent.guardian_phone || null,
      address: newStudent.address || null,
      city: newStudent.city || null,
      state: newStudent.state || null,
      pincode: newStudent.pincode || null,
      fee_paid: Number(newStudent.fee_paid) || 0,
      fee_pending: Number(newStudent.fee_pending) || 0,
      status: 'active',
      enrollment_no: enrollmentData,
      password,
    });

    setIsAddDialogOpen(false);
    setNewStudent({
      name: '', date_of_birth: '', gender: '', phone: '', email: '',
      guardian_phone: '', address: '', city: '', state: '', pincode: '',
      course_id: '', fee_paid: '', fee_pending: '',
    });
    setActiveTab('course');
  };

  const openEditDialog = (student: StudentWithDetails) => {
    setEditStudent(student);
    setEditForm({
      name: student.name,
      email: student.email || '',
      phone: student.phone || '',
      guardian_phone: student.guardian_phone || '',
      address: student.address || '',
      city: student.city || '',
      state: student.state || '',
      pincode: student.pincode || '',
      fee_paid: String(student.fee_paid || 0),
      status: student.status || 'active',
    });
    setFeeToAdd('');
    setIsEditDialogOpen(true);
  };

  const editCourseFee = (() => {
    if (!editStudent) return 0;
    const c = courses.find((c) => c.id === editStudent.course_id);
    return Number(c?.fee || 0);
  })();
  const editPending = Math.max(0, editCourseFee - (Number(editForm.fee_paid) || 0));

  const handleCollectFee = () => {
    const amount = Number(feeToAdd);
    if (!amount || amount <= 0) return;
    const currentPaid = Number(editForm.fee_paid) || 0;
    setEditForm({
      ...editForm,
      fee_paid: String(currentPaid + amount),
    });
    setFeeToAdd('');
    toast.success(`₹${amount} added to total collection`);
  };

  const handleSaveEdit = async () => {
    if (!editStudent) return;
    const totalCollected = Number(editForm.fee_paid) || 0;
    const pending = Math.max(0, editCourseFee - totalCollected);
    await updateStudent.mutateAsync({
      id: editStudent.id,
      name: editForm.name,
      email: editForm.email || null,
      phone: editForm.phone,
      guardian_phone: editForm.guardian_phone || null,
      address: editForm.address || null,
      city: editForm.city || null,
      state: editForm.state || null,
      pincode: editForm.pincode || null,
      fee_paid: totalCollected,
      fee_pending: pending,
      status: editForm.status,
    });
    setIsEditDialogOpen(false);
    setEditStudent(null);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleExportCSV = () => {
    let data = students;
    if (exportFromDate) {
      data = data.filter(s => s.admission_date >= exportFromDate);
    }
    if (exportToDate) {
      data = data.filter(s => s.admission_date <= exportToDate);
    }
    if (data.length === 0) {
      toast.error('No students found for the selected date range');
      return;
    }
    const headers = ['Enrollment No', 'Name', 'Phone', 'Course', 'Admission Date', 'Course Fee', 'Fees Pending', 'Password', 'Status'];
    const rows = data.map(s => [
      s.enrollment_no,
      s.name,
      s.phone,
      s.course_name || '',
      s.admission_date,
      String(s.fee_paid || 0),
      String(s.fee_pending || 0),
      (s as any).password || '',
      s.status || 'active',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${exportFromDate || 'all'}_to_${exportToDate || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${data.length} students`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success hover:bg-success/90';
      case 'completed': return 'bg-info hover:bg-info/90';
      case 'certified': return 'bg-warning hover:bg-warning/90';
      default: return '';
    }
  };

  const stats = {
    total: students.length,
    active: students.filter(s => s.status === 'active').length,
    completed: students.filter(s => s.status === 'completed').length,
    totalFees: students.reduce((sum, s) => sum + Number(s.fee_paid || 0), 0),
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
            <h1 className="text-3xl font-heading font-bold text-foreground">Student Management</h1>
            <p className="text-muted-foreground mt-1">Manage admissions and student records</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Admission
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Student Admission</DialogTitle>
                <DialogDescription>Complete the admission form for a new student.</DialogDescription>
              </DialogHeader>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="course">Course</TabsTrigger>
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                </TabsList>

                <TabsContent value="course" className="space-y-4 mt-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label>Select Course</Label>
                      {availableCourses.length === 0 && allAuthorizedCourses.length > 0 && (
                        <p className="text-sm text-destructive">
                          No stock available for your courses. Please place an order first.
                        </p>
                      )}
                      <Select
                        value={newStudent.course_id}
                        onValueChange={(value) => setNewStudent({ ...newStudent, course_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a course" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCourses.length === 0 ? (
                            <SelectItem value="none" disabled>No courses with stock available</SelectItem>
                          ) : (
                            availableCourses.map((course) => {
                              const stock = stockData.find(s => s.stock_item?.course_id === course.id);
                              return (
                                <SelectItem key={course.id} value={course.id}>
                                  {course.name} ({stock?.quantity || 0} in stock)
                                </SelectItem>
                              );
                            })
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="personal" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Course Fees (₹)</Label>
                      <Input type="number" placeholder="0" value={newStudent.fee_paid}
                        onChange={(e) => setNewStudent({ ...newStudent, fee_paid: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Advance Fees (₹)</Label>
                      <Input type="number" placeholder="0" value={newStudent.fee_pending}
                        onChange={(e) => setNewStudent({ ...newStudent, fee_pending: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label>Full Name *</Label>
                      <Input placeholder="Enter full name" value={newStudent.name}
                        onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label>Date of Birth</Label>
                        <Input type="date" value={newStudent.date_of_birth}
                          onChange={(e) => setNewStudent({ ...newStudent, date_of_birth: e.target.value })} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Gender</Label>
                        <Select value={newStudent.gender}
                          onValueChange={(value) => setNewStudent({ ...newStudent, gender: value })}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Phone *</Label>
                        <Input placeholder="+91 98765 43210" value={newStudent.phone}
                          onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Email</Label>
                        <Input type="email" placeholder="student@email.com" value={newStudent.email}
                          onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Guardian Phone</Label>
                        <Input placeholder="+91 98765 43210" value={newStudent.guardian_phone}
                          onChange={(e) => setNewStudent({ ...newStudent, guardian_phone: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Address</Label>
                      <Textarea placeholder="Enter complete address" value={newStudent.address}
                        onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label>City</Label>
                        <Input placeholder="City" value={newStudent.city}
                          onChange={(e) => setNewStudent({ ...newStudent, city: e.target.value })} />
                      </div>
                      <div className="grid gap-2">
                        <Label>State</Label>
                        <Input placeholder="State" value={newStudent.state}
                          onChange={(e) => setNewStudent({ ...newStudent, state: e.target.value })} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Pincode</Label>
                        <Input placeholder="400001" value={newStudent.pincode}
                          onChange={(e) => setNewStudent({ ...newStudent, pincode: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddStudent}
                  disabled={createStudent.isPending || !newStudent.name || !newStudent.phone || !newStudent.course_id}>
                  {createStudent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Admit Student
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
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
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
                  <p className="text-2xl font-bold">{stats.active}</p>
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
                  <p className="text-2xl font-bold">{stats.completed}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">₹{(stats.totalFees / 1000).toFixed(0)}K</p>
                  <p className="text-sm text-muted-foreground">Fees Collected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students Table */}
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="font-heading">All Students</CardTitle>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search students..." value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                </div>
                <div className="flex items-center gap-2">
                  <Input type="date" value={exportFromDate} onChange={(e) => setExportFromDate(e.target.value)}
                    className="w-36 text-xs" placeholder="From" />
                  <Input type="date" value={exportToDate} onChange={(e) => setExportToDate(e.target.value)}
                    className="w-36 text-xs" placeholder="To" />
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="w-4 h-4 mr-1" /> Export
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {students.length === 0 ? 'No students yet. Add your first admission!' : 'No students match your search.'}
              </div>
            ) : (
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Student</TableHead>
                      <TableHead>Enrollment No</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Password</TableHead>
                      <TableHead>Course Fee</TableHead>
                      <TableHead>Fees Pending</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Exam</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => {
                      const pwd = (student as any).password || '------';
                      const isVisible = visiblePasswords[student.id];
                      const examStatus = (student as any).exam_status || 'not_attempted';
                      const examLocked = (student as any).exam_locked === true;
                      const examBadgeClass =
                        examStatus === 'completed'
                          ? 'bg-success hover:bg-success/90'
                          : examStatus === 'in_progress'
                          ? 'bg-warning hover:bg-warning/90'
                          : 'bg-muted-foreground/20 text-foreground hover:bg-muted-foreground/20';
                      const examLabel =
                        examStatus === 'completed'
                          ? 'Completed'
                          : examStatus === 'in_progress'
                          ? 'In Progress'
                          : 'Not Attempted';
                      return (
                        <TableRow key={student.id} className="table-row-hover">
                          <TableCell>
                            <div>
                              <p className="font-medium">{student.name}</p>
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="w-3 h-3" />{student.phone}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{student.enrollment_no}</Badge>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{student.course_name || 'N/A'}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">
                                {isVisible ? pwd : '••••••'}
                              </code>
                              <Button variant="ghost" size="icon" className="h-6 w-6"
                                onClick={() => togglePasswordVisibility(student.id)}>
                                {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6"
                                onClick={() => copyToClipboard(pwd)}>
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-success font-medium">₹{Number(student.fee_paid || 0).toLocaleString()}</span>
                          </TableCell>
                          <TableCell>
                            {Number(student.fee_pending || 0) > 0 ? (
                              <span className="text-destructive font-medium">₹{Number(student.fee_pending).toLocaleString()}</span>
                            ) : (
                              <span className="text-muted-foreground">₹0</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={`capitalize ${getStatusColor(student.status || 'active')}`}>
                              {student.status || 'active'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={examBadgeClass}>
                              {examLocked && <Lock className="w-3 h-3 mr-1" />}
                              {examLabel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={examLocked}
                              title={examLocked ? 'Exam completed. Record locked.' : 'Edit student'}
                              onClick={() => openEditDialog(student)}
                            >
                              {examLocked ? <Lock className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Student Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
              <DialogDescription>
                Update student details and track fee collection.
              </DialogDescription>
            </DialogHeader>
            {editStudent && (
              <div className="space-y-4 mt-2">
                {(editStudent as any).exam_locked && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
                    <Lock className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>Exam completed. Student record is locked. Contact admin for changes.</span>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label>Full Name</Label>
                  <Input value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>

                <div className="grid gap-2">
                  <Label>Course</Label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{editStudent.course_name || 'N/A'}</span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Enrollment No</Label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-mono">{editStudent.enrollment_no}</span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={editForm.status}
                    onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="certified">Certified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <h4 className="font-medium flex items-center gap-2">
                    <IndianRupee className="w-4 h-4" /> Fee Tracking
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Total Collected</Label>
                      <p className="text-lg font-bold text-success">₹{Number(editForm.fee_paid).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Pending</Label>
                      <p className="text-lg font-bold text-destructive">₹{Number(editForm.fee_pending).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Amount to collect" value={feeToAdd}
                      onChange={(e) => setFeeToAdd(e.target.value)} />
                    <Button variant="outline" onClick={handleCollectFee} disabled={!feeToAdd || Number(feeToAdd) <= 0}>
                      Collect
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={updateStudent.isPending}>
                {updateStudent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CenterLayout>
  );
}
