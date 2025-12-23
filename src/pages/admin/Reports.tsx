import { useState } from 'react';
import {
  FileText,
  Download,
  Filter,
  Building,
  BookOpen,
  Calendar,
  Search,
  DollarSign,
  ClipboardList,
  CheckCircle,
  XCircle,
  IndianRupeeIcon,
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// Mock Data
const mockCenters = [
  { id: 'all', name: 'All Centers' },
  { id: 'C-001', name: 'PBS Computer Education - City Center' },
  { id: 'C-002', name: 'Vocational Skills Institute - Suburb' },
  { id: 'C-003', name: 'Tech Learners Hub - North' },
];

const mockCourses = [
  { id: 'all', name: 'All Courses' },
  { id: 'CRS-001', name: 'Diploma in Digital Marketing' },
  { id: 'CRS-002', name: 'Certificate in Tally Prime' },
  { id: 'CRS-003', name: 'Web Development Fundamentals' },
  { id: 'CRS-004', name: 'Certificate in Python Programming' },
];

const mockEnquiries = [
  { id: 'ENQ-001', studentName: 'Arun Kumar', mobile: '9876543210', course: 'Diploma in Digital Marketing', center: 'PBS Computer Education - City Center', source: 'Walk-in', status: 'New', date: '2024-03-20' },
  { id: 'ENQ-002', studentName: 'Meera Joshi', mobile: '8765432109', course: 'Web Development Fundamentals', center: 'Vocational Skills Institute - Suburb', source: 'Online', status: 'Callback', date: '2024-03-19' },
  { id: 'ENQ-003', studentName: 'Rakesh Singh', mobile: '7654321098', course: 'Certificate in Tally Prime', center: 'PBS Computer Education - City Center', source: 'Referral', status: 'Enrolled', date: '2024-03-20' },
];

const mockStudents = [
  { id: 'STU-001', name: 'Priya Sharma', center: 'PBS Computer Education - City Center', course: 'Diploma in Digital Marketing', admissionDate: '2024-04-01', status: 'Active' },
  { id: 'STU-002', name: 'Rahul Verma', center: 'Vocational Skills Institute - Suburb', course: 'Certificate in Tally Prime', admissionDate: '2024-04-05', status: 'Active' },
  { id: 'STU-003', name: 'Sneha Patel', center: 'PBS Computer Education - City Center', course: 'Web Development Fundamentals', admissionDate: '2024-04-10', status: 'Completed' },
];

const mockDueList = [
  { studentId: 'STU-001', name: 'Priya Sharma', center: 'PBS Computer Education - City Center', course: 'Diploma in Digital Marketing', totalFees: 25000, paid: 15000, dueAmount: 10000, dueDate: '2024-06-01' },
  { studentId: 'STU-002', name: 'Rahul Verma', center: 'Vocational Skills Institute - Suburb', course: 'Certificate in Tally Prime', totalFees: 12000, paid: 6000, dueAmount: 6000, dueDate: '2024-05-25' },
  { studentId: 'STU-004', name: 'Karan Singh', center: 'Tech Learners Hub - North', course: 'Advanced Computer Applications', totalFees: 30000, paid: 0, dueAmount: 30000, dueDate: '2024-05-30' },
];

const mockExams = {
  pending: [
    { studentId: 'STU-006', name: 'Deepak Kumar', center: 'PBS Computer Education - City Center', course: 'Python Programming', examDate: '2024-06-05', status: 'Scheduled' },
    { studentId: 'STU-007', name: 'Pooja Devi', center: 'Vocational Skills Institute - Suburb', course: 'Digital Marketing', examDate: '2024-06-10', status: 'Scheduled' },
  ],
  completed: [
    { studentId: 'STU-003', name: 'Sneha Patel', center: 'PBS Computer Education - City Center', course: 'Web Development Fundamentals', examDate: '2024-05-10', marks: 85, result: 'Pass' },
    { studentId: 'STU-005', name: 'Vikram Singh', center: 'Tech Learners Hub - North', course: 'Tally Prime', examDate: '2024-05-12', marks: 72, result: 'Pass' },
  ],
};

const mockInventory = [
  { center: 'PBS Computer Education - City Center', item: 'Tally Prime Kit', opening: 10, added: 5, used: 3, closing: 12 },
  { center: 'PBS Computer Education - City Center', item: 'Digital Marketing Kit', opening: 5, added: 2, used: 1, closing: 6 },
  { center: 'Vocational Skills Institute - Suburb', item: 'Spoken English Book', opening: 20, added: 0, used: 2, closing: 18 },
];

export default function AdminReports() {
  const [enquiryFilters, setEnquiryFilters] = useState({ center: 'all', course: 'all', startDate: '', endDate: '' });
  const [studentFilters, setStudentFilters] = useState({ center: 'all', course: 'all', admissionStartDate: '', admissionEndDate: '' });
  const [dueListFilters, setDueListFilters] = useState({ center: 'all' });
  const [examFilters, setExamFilters] = useState({ center: 'all', course: 'all', startDate: '', endDate: '' });
  const [inventoryFilters, setInventoryFilters] = useState({ center: 'all', item: 'all' });

  const handleExport = (reportName: string) => {
    toast.info(`Exporting ${reportName} to Excel...`, {
      description: 'Your download will begin shortly.',
    });
    // In a real application, this would trigger an API call to generate and download the Excel file.
  };

  // --- Filtered Data (Mock Implementation) ---
  const filteredEnquiries = mockEnquiries.filter(enquiry => {
    const matchesCenter = enquiryFilters.center === 'all' || enquiry.center === mockCenters.find(c => c.id === enquiryFilters.center)?.name;
    const matchesCourse = enquiryFilters.course === 'all' || enquiry.course === mockCourses.find(c => c.id === enquiryFilters.course)?.name;
    const matchesStartDate = !enquiryFilters.startDate || new Date(enquiry.date) >= new Date(enquiryFilters.startDate);
    const matchesEndDate = !enquiryFilters.endDate || new Date(enquiry.date) <= new Date(enquiryFilters.endDate);
    return matchesCenter && matchesCourse && matchesStartDate && matchesEndDate;
  });

  const filteredStudents = mockStudents.filter(student => {
    const matchesCenter = studentFilters.center === 'all' || student.center === mockCenters.find(c => c.id === studentFilters.center)?.name;
    const matchesCourse = studentFilters.course === 'all' || student.course === mockCourses.find(c => c.id === studentFilters.course)?.name;
    const matchesAdmissionStartDate = !studentFilters.admissionStartDate || new Date(student.admissionDate) >= new Date(studentFilters.admissionStartDate);
    const matchesAdmissionEndDate = !studentFilters.admissionEndDate || new Date(student.admissionDate) <= new Date(studentFilters.admissionEndDate);
    return matchesCenter && matchesCourse && matchesAdmissionStartDate && matchesAdmissionEndDate;
  });

  const filteredDueList = mockDueList.filter(due => {
    const matchesCenter = dueListFilters.center === 'all' || due.center === mockCenters.find(c => c.id === dueListFilters.center)?.name;
    return matchesCenter;
  });

  const filteredPendingExams = mockExams.pending.filter(exam => {
    const matchesCenter = examFilters.center === 'all' || exam.center === mockCenters.find(c => c.id === examFilters.center)?.name;
    const matchesCourse = examFilters.course === 'all' || exam.course === mockCourses.find(c => c.id === examFilters.course)?.name;
    const matchesStartDate = !examFilters.startDate || new Date(exam.examDate) >= new Date(examFilters.startDate);
    const matchesEndDate = !examFilters.endDate || new Date(exam.examDate) <= new Date(examFilters.endDate);
    return matchesCenter && matchesCourse && matchesStartDate && matchesEndDate;
  });

  const filteredCompletedExams = mockExams.completed.filter(exam => {
    const matchesCenter = examFilters.center === 'all' || exam.center === mockCenters.find(c => c.id === examFilters.center)?.name;
    const matchesCourse = examFilters.course === 'all' || exam.course === mockCourses.find(c => c.id === examFilters.course)?.name;
    const matchesStartDate = !examFilters.startDate || new Date(exam.examDate) >= new Date(examFilters.startDate);
    const matchesEndDate = !examFilters.endDate || new Date(exam.examDate) <= new Date(examFilters.endDate);
    return matchesCenter && matchesCourse && matchesStartDate && matchesEndDate;
  });

  const filteredInventory = mockInventory.filter(item => {
    const matchesCenter = inventoryFilters.center === 'all' || item.center === mockCenters.find(c => c.id === inventoryFilters.center)?.name;
    const matchesItem = inventoryFilters.item === 'all' || item.item.toLowerCase().includes(inventoryFilters.item.toLowerCase()); // Simple text search for item
    return matchesCenter && matchesItem;
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Reports Module</h1>
          <p className="text-muted-foreground mt-1">Generate and export various reports for analysis and auditing.</p>
        </div>

        <Tabs defaultValue="enquiry">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="enquiry"><FileText className="w-4 h-4 mr-2" />Enquiry</TabsTrigger>
            <TabsTrigger value="student"><BookOpen className="w-4 h-4 mr-2" />Student</TabsTrigger>
            <TabsTrigger value="due-list"><IndianRupeeIcon className="w-4 h-4 mr-2" />Due List</TabsTrigger>
            <TabsTrigger value="exams"><ClipboardList className="w-4 h-4 mr-2" />Exams</TabsTrigger>
            <TabsTrigger value="inventory"><Search className="w-4 h-4 mr-2" />Inventory</TabsTrigger>
          </TabsList>

          {/* Enquiry Report Tab */}
          <TabsContent value="enquiry" className="mt-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Enquiry Report</CardTitle>
                    <CardDescription>Detailed list of all enquiries with filtering options.</CardDescription>
                  </div>
                  <Button onClick={() => handleExport('Enquiry Report')}><Download className="w-4 h-4 mr-2" />Export to Excel</Button>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <Select value={enquiryFilters.center} onValueChange={(value) => setEnquiryFilters(prev => ({ ...prev, center: value }))}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Select Center" /></SelectTrigger>
                      <SelectContent>
                        {mockCenters.map(center => <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <Select value={enquiryFilters.course} onValueChange={(value) => setEnquiryFilters(prev => ({ ...prev, course: value }))}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Select Course" /></SelectTrigger>
                      <SelectContent>
                        {mockCourses.map(course => <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <Input type="date" className="w-40" value={enquiryFilters.startDate} onChange={(e) => setEnquiryFilters(prev => ({ ...prev, startDate: e.target.value }))} />
                    <span>to</span>
                    <Input type="date" className="w-40" value={enquiryFilters.endDate} onChange={(e) => setEnquiryFilters(prev => ({ ...prev, endDate: e.target.value }))} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>ID</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Center</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEnquiries.map(enquiry => (
                        <TableRow key={enquiry.id}>
                          <TableCell>{enquiry.id}</TableCell>
                          <TableCell>{enquiry.studentName}</TableCell>
                          <TableCell>{enquiry.course}</TableCell>
                          <TableCell>{enquiry.center}</TableCell>
                          <TableCell><Badge variant="outline">{enquiry.status}</Badge></TableCell>
                          <TableCell>{new Date(enquiry.date).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Student Report Tab */}
          <TabsContent value="student" className="mt-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Student Report</CardTitle>
                    <CardDescription>List of all admitted students with their details.</CardDescription>
                  </div>
                  <Button onClick={() => handleExport('Student Report')}><Download className="w-4 h-4 mr-2" />Export to Excel</Button>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <Select value={studentFilters.center} onValueChange={(value) => setStudentFilters(prev => ({ ...prev, center: value }))}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Select Center" /></SelectTrigger>
                      <SelectContent>
                        {mockCenters.map(center => <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <Select value={studentFilters.course} onValueChange={(value) => setStudentFilters(prev => ({ ...prev, course: value }))}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Select Course" /></SelectTrigger>
                      <SelectContent>
                        {mockCourses.map(course => <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <Input type="date" className="w-40" value={studentFilters.admissionStartDate} onChange={(e) => setStudentFilters(prev => ({ ...prev, admissionStartDate: e.target.value }))} />
                    <span>to</span>
                    <Input type="date" className="w-40" value={studentFilters.admissionEndDate} onChange={(e) => setStudentFilters(prev => ({ ...prev, admissionEndDate: e.target.value }))} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Center</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Admission Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map(student => (
                        <TableRow key={student.id}>
                          <TableCell>{student.id}</TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>{student.center}</TableCell>
                          <TableCell>{student.course}</TableCell>
                          <TableCell>{new Date(student.admissionDate).toLocaleDateString()}</TableCell>
                          <TableCell><Badge variant="outline">{student.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Due List Report Tab */}
          <TabsContent value="due-list" className="mt-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Due List Report</CardTitle>
                    <CardDescription>Global view of pending fees across all centers.</CardDescription>
                  </div>
                  <Button onClick={() => handleExport('Due List Report')}><Download className="w-4 h-4 mr-2" />Export to Excel</Button>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <Select value={dueListFilters.center} onValueChange={(value) => setDueListFilters(prev => ({ ...prev, center: value }))}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Select Center" /></SelectTrigger>
                      <SelectContent>
                        {mockCenters.map(center => <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>)}
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
                        <TableHead>Student ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Center</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Total Fees</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Due Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDueList.map(due => (
                        <TableRow key={due.studentId}>
                          <TableCell>{due.studentId}</TableCell>
                          <TableCell>{due.name}</TableCell>
                          <TableCell>{due.center}</TableCell>
                          <TableCell>{due.course}</TableCell>
                          <TableCell>₹{due.totalFees.toLocaleString()}</TableCell>
                          <TableCell>₹{due.paid.toLocaleString()}</TableCell>
                          <TableCell className="text-destructive font-medium">₹{due.dueAmount.toLocaleString()}</TableCell>
                          <TableCell>{new Date(due.dueDate).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exam Reports Tab */}
          <TabsContent value="exams" className="mt-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Exam Reports</CardTitle>
                    <CardDescription>Overview of pending and completed exams.</CardDescription>
                  </div>
                  <Button onClick={() => handleExport('Exam Report')}><Download className="w-4 h-4 mr-2" />Export to Excel</Button>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <Select value={examFilters.center} onValueChange={(value) => setExamFilters(prev => ({ ...prev, center: value }))}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Select Center" /></SelectTrigger>
                      <SelectContent>
                        {mockCenters.map(center => <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <Select value={examFilters.course} onValueChange={(value) => setExamFilters(prev => ({ ...prev, course: value }))}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Select Course" /></SelectTrigger>
                      <SelectContent>
                        {mockCourses.map(course => <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <Input type="date" className="w-40" value={examFilters.startDate} onChange={(e) => setExamFilters(prev => ({ ...prev, startDate: e.target.value }))} />
                    <span>to</span>
                    <Input type="date" className="w-40" value={examFilters.endDate} onChange={(e) => setExamFilters(prev => ({ ...prev, endDate: e.target.value }))} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold text-lg mb-3">Pending Exams</h3>
                <div className="rounded-lg border overflow-hidden mb-6">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Student</TableHead>
                        <TableHead>Center</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Exam Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPendingExams.map(exam => (
                        <TableRow key={exam.studentId}>
                          <TableCell>{exam.name}</TableCell>
                          <TableCell>{exam.center}</TableCell>
                          <TableCell>{exam.course}</TableCell>
                          <TableCell>{new Date(exam.examDate).toLocaleDateString()}</TableCell>
                          <TableCell><Badge className="bg-warning hover:bg-warning/90">{exam.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <h3 className="font-semibold text-lg mb-3">Completed Exams</h3>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Student</TableHead>
                        <TableHead>Center</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Exam Date</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead>Result</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompletedExams.map(exam => (
                        <TableRow key={exam.studentId}>
                          <TableCell>{exam.name}</TableCell>
                          <TableCell>{exam.center}</TableCell>
                          <TableCell>{exam.course}</TableCell>
                          <TableCell>{new Date(exam.examDate).toLocaleDateString()}</TableCell>
                          <TableCell>{exam.marks}</TableCell>
                          <TableCell><Badge className={exam.result === 'Pass' ? 'bg-success' : 'bg-destructive'}>{exam.result}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Report Tab */}
          <TabsContent value="inventory" className="mt-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Inventory Report</CardTitle>
                    <CardDescription>Summary of stock movement course-wise across centers.</CardDescription>
                  </div>
                  <Button onClick={() => handleExport('Inventory Report')}><Download className="w-4 h-4 mr-2" />Export to Excel</Button>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <Select value={inventoryFilters.center} onValueChange={(value) => setInventoryFilters(prev => ({ ...prev, center: value }))}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Select Center" /></SelectTrigger>
                      <SelectContent>
                        {mockCenters.map(center => <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search Item..."
                      className="w-48"
                      value={inventoryFilters.item === 'all' ? '' : inventoryFilters.item}
                      onChange={(e) => setInventoryFilters(prev => ({ ...prev, item: e.target.value || 'all' }))}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Center</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Opening Qty</TableHead>
                        <TableHead>Added Qty</TableHead>
                        <TableHead>Used Qty</TableHead>
                        <TableHead>Closing Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.center}</TableCell>
                          <TableCell>{item.item}</TableCell>
                          <TableCell>{item.opening}</TableCell>
                          <TableCell className="text-success font-medium">{item.added}</TableCell>
                          <TableCell className="text-destructive font-medium">{item.used}</TableCell>
                          <TableCell className="font-bold">{item.closing}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}