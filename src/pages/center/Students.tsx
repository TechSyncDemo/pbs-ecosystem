import { useState } from 'react';
import html2pdf from 'html2pdf.js';
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
  Mail,
  Calendar,
  GraduationCap,
  IndianRupee,
  MoreHorizontal,
  Edit,
  FileText,
  Key,
  Award,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CenterLayout from '@/layouts/CenterLayout';
import { toast } from 'sonner';

// Mock students data
const mockStudents = [
  {
    id: 'STU-001',
    name: 'Rahul Sharma',
    course: 'Advanced Computer Applications',
    mobile: '+91 98765 43210',
    email: 'rahul.s@email.com',
    admissionDate: '2024-01-15',
    status: 'Active',
    feesPaid: 12000,
    feesTotal: 15000,
    username: 'rahul.s',
    password: 'aBcDeFgH',
    marks: null,
  },
  {
    id: 'STU-002',
    name: 'Priya Gupta',
    course: 'Diploma in Digital Marketing',
    mobile: '+91 87654 32109',
    email: 'priya.g@email.com',
    admissionDate: '2024-02-01',
    status: 'Active',
    feesPaid: 12000,
    feesTotal: 12000,
    username: 'priya.g',
    password: 'iJkLmNoP',
    marks: null,
    examStatus: 'Pending', // Added examStatus
  },
  {
    id: 'STU-003',
    name: 'Amit Kumar',
    course: 'Certificate in Tally Prime',
    mobile: '+91 76543 21098',
    email: 'amit.k@email.com',
    admissionDate: '2024-02-15',
    status: 'Certified',
    feesPaid: 8000,
    feesTotal: 8000,
    username: 'amit.k',
    password: 'qRsTuVwX',
    marks: 85,
    examStatus: 'Completed', // Added examStatus
  },
];

const courses = [
  { name: 'Advanced Computer Applications', stock: 25 },
  { name: 'Diploma in Digital Marketing', stock: 18 },
  { name: 'Certificate in Tally Prime', stock: 5 },
  { name: 'Web Development Fundamentals', stock: 12 },
  { name: 'Certificate in Python Programming', stock: 3 },
];

export default function CenterStudents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [newStudent, setNewStudent] = useState({
    name: '',
    dob: '',
    gender: '',
    category: '',
    mobile: '',
    email: '',
    parentMobile: '',
    address: '',
    qualification: '',
    course: '',
    feesTotal: '',
    feesPaid: '',
    remarks: '',
  });

  const filteredStudents = mockStudents.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.course.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddStudent = () => {
    // Generate username and password
    const username = newStudent.name.toLowerCase().split(' ')[0] + '.' + newStudent.name.split(' ').slice(-1)[0].charAt(0).toLowerCase();
    const password = Math.random().toString(36).slice(-8);

    console.log('New Student Data:', {
      ...newStudent,
      username,
      password,
    });
    toast.success('Student admitted successfully!', {
      description: `${newStudent.name} has been enrolled in ${newStudent.course}.`,
    });
    setIsAddDialogOpen(false);
    setNewStudent({
      name: '',
      dob: '',
      gender: '',
      category: '',
      mobile: '',
      email: '',
      parentMobile: '',
      address: '',
      qualification: '',
      course: '',
      feesTotal: '',
      feesPaid: '',
      remarks: '',
    });
    setActiveTab('personal');
  };

  const handleGenerateExamCredentials = (studentName: string) => {
    toast.success('Exam credentials generated!', {
      description: `Login credentials for ${studentName} have been created and sent via SMS/Email.`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-success hover:bg-success/90';
      case 'Exam Completed':
        return 'bg-info hover:bg-info/90';
      case 'Certified':
        return 'bg-warning hover:bg-warning/90';
      default:
        return '';
    }
  };

  const handleDownloadDocument = (student: typeof mockStudents[0], type: 'marksheet' | 'certificate') => {
    const docTitle = type === 'marksheet' ? 'Marksheet' : 'Certificate of Completion';
    const filename = `${docTitle.replace(/\s+/g, '_')}_${student.id}.pdf`;

    toast.info(`Generating ${type} for ${student.name}...`);

    const element = document.createElement('div');
    element.innerHTML = `
      <div style="border: 10px solid #003366; padding: 50px; text-align: center; font-family: sans-serif; background-color: #f0f8ff;">
        <h1 style="color: #003366; font-size: 48px;">${docTitle}</h1>
        <p style="font-size: 20px; margin-top: 30px;">This is to certify that</p>
        <h2 style="color: #d16002; font-size: 36px; margin: 20px 0;">${student.name}</h2>
        <p style="font-size: 20px;">has successfully completed the course</p>
        <h3 style="color: #003366; font-size: 32px; margin: 20px 0;">${student.course}</h3>
        ${type === 'marksheet' ?
        `<p style="font-size: 18px;">with a final score of:</p>
         <p style="font-size: 24px; font-weight: bold; margin-top: 10px;">${student.marks} / 100</p>`
        :
        `<p style="font-size: 18px;">on ${new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>`
        }
      </div>
    `;

    const opt = {
      margin: 0.5,
      filename: filename,
      image: { type: 'jpeg' as 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: {
        unit: 'in',
        format: 'letter',
        orientation: 'landscape' as 'landscape',
      },
    };

    html2pdf().from(element).set(opt).save();
  };

  const selectedCourse = courses.find(c => c.name === newStudent.course);

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
                <DialogDescription>
                  Complete the admission form for a new student.
                </DialogDescription>
              </DialogHeader>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="course">Course</TabsTrigger>
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="academic">Academic</TabsTrigger>
                  <TabsTrigger value="fees">Fees</TabsTrigger>
                </TabsList>
                
                <TabsContent value="course" className="space-y-4 mt-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label>Select Course</Label>
                      <Select
                        value={newStudent.course}
                        onValueChange={(value) => {
                          const course = courses.find(c => c.name === value);
                          setNewStudent({ ...newStudent, course: value });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a course" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course.name} value={course.name} disabled={course.stock === 0}>
                              <div className="flex items-center justify-between w-full">
                                <span>{course.name}</span>
                                <Badge variant={course.stock > 5 ? 'default' : 'destructive'} className="ml-2">
                                  Stock: {course.stock}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedCourse && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Available Stock</p>
                        <p className="text-2xl font-bold">{selectedCourse.stock} units</p>
                      </div>
                    )}
                    <div className="grid gap-2">
                      <Label>Admission Date</Label>
                      <Input
                        type="date"
                        defaultValue={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="personal" className="space-y-4 mt-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label>Full Name</Label>
                      <Input
                        placeholder="Enter full name"
                        value={newStudent.name}
                        onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label>Date of Birth</Label>
                        <Input
                          type="date"
                          value={newStudent.dob}
                          onChange={(e) => setNewStudent({ ...newStudent, dob: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Gender</Label>
                        <Select
                          value={newStudent.gender}
                          onValueChange={(value) => setNewStudent({ ...newStudent, gender: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Category</Label>
                        <Select
                          value={newStudent.category}
                          onValueChange={(value) => setNewStudent({ ...newStudent, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="sc">SC</SelectItem>
                            <SelectItem value="st">ST</SelectItem>
                            <SelectItem value="obc">OBC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Mobile Number</Label>
                        <Input
                          placeholder="+91 98765 43210"
                          value={newStudent.mobile}
                          onChange={(e) => setNewStudent({ ...newStudent, mobile: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Parent's Mobile</Label>
                        <Input
                          placeholder="+91 98765 43210"
                          value={newStudent.parentMobile}
                          onChange={(e) => setNewStudent({ ...newStudent, parentMobile: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="student@email.com"
                        value={newStudent.email}
                        onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Address</Label>
                      <Textarea
                        placeholder="Enter complete address"
                        value={newStudent.address}
                        onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="academic" className="space-y-4 mt-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label>Highest Qualification</Label>
                      <Select
                        value={newStudent.qualification}
                        onValueChange={(value) => setNewStudent({ ...newStudent, qualification: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select qualification" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10th">10th Pass</SelectItem>
                          <SelectItem value="12th">12th Pass</SelectItem>
                          <SelectItem value="graduate">Graduate</SelectItem>
                          <SelectItem value="postgraduate">Post Graduate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Remarks (Optional)</Label>
                      <Textarea
                        placeholder="Any additional notes about the student..."
                        value={newStudent.remarks}
                        onChange={(e) => setNewStudent({ ...newStudent, remarks: e.target.value })}
                        rows={4}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="fees" className="space-y-4 mt-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Total Fees (₹)</Label>
                        <Input
                          type="number"
                          placeholder="15000"
                          value={newStudent.feesTotal}
                          onChange={(e) => setNewStudent({ ...newStudent, feesTotal: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Amount Paid (₹)</Label>
                        <Input
                          type="number"
                          placeholder="10000"
                          value={newStudent.feesPaid}
                          onChange={(e) => setNewStudent({ ...newStudent, feesPaid: e.target.value })}
                        />
                      </div>
                    </div>
                    {newStudent.feesTotal && newStudent.feesPaid && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Balance Due</p>
                        <p className="text-2xl font-bold text-destructive">
                          ₹{(parseInt(newStudent.feesTotal) - parseInt(newStudent.feesPaid)).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddStudent}>Complete Admission</Button>
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
                  <p className="text-2xl font-bold">{mockStudents.length}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
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
                  <p className="text-2xl font-bold">{mockStudents.filter(s => s.examStatus === 'Completed').length}</p>
                  <p className="text-sm text-muted-foreground">Exam Done</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    ₹{mockStudents.reduce((acc, s) => acc + (s.feesTotal - s.feesPaid), 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Dues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="font-heading">All Students</CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Credentials</TableHead>
                    <TableHead>Certificates</TableHead>
                    {/* <TableHead>Fees</TableHead>
                    <TableHead>Exam</TableHead> */}
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
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
                        <div className="text-sm">
                          <p>ID: <span className="font-mono">{student.username}</span></p>
                          <p>Pass: <span className="font-mono">{student.password}</span></p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.status === 'Certified' ? (
                          <div className="flex flex-col gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleDownloadDocument(student, 'marksheet')}>
                              <FileText className="w-3 h-3 mr-1.5" /> Marksheet
                            </Button>
                            <Button size="sm" onClick={() => handleDownloadDocument(student, 'certificate')}>
                              <Award className="w-3 h-3 mr-1.5" /> Certificate
                            </Button>
                          </div>
                        ) : (<span className="text-muted-foreground text-sm">Not available</span>)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(student.status)}>
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleGenerateExamCredentials(student.name)}>
                              <Key className="w-4 h-4 mr-2" />
                              Generate Exam ID
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="w-4 h-4 mr-2" />
                              View Certificate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
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
                        <p className="text-sm text-muted-foreground">{student.id}</p>
                      </div>
                      <Badge className={getStatusColor(student.status)}>
                        {student.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium">{student.course}</p>
                      <p className="text-muted-foreground">Adm: {new Date(student.admissionDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p>ID: <span className="font-mono">{student.username}</span></p>
                      <p>Pass: <span className="font-mono">{student.password}</span></p>
                    </div>
                    {student.status === 'Certified' ? (
                      <div className="flex items-center gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => handleDownloadDocument(student, 'marksheet')}>
                          <FileText className="w-3 h-3 mr-1.5" /> Marksheet
                        </Button>
                        <Button size="sm" onClick={() => handleDownloadDocument(student, 'certificate')}>
                          <Award className="w-3 h-3 mr-1.5" /> Certificate
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm pt-2">Certificate: Not available</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </CenterLayout>
  );
}
