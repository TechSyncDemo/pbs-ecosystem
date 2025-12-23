import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  BookOpen,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  IndianRupee,
  Clock,
  Package,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AdminLayout from '@/layouts/AdminLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// Mock courses data
const mockCourses = [
  {
    id: 'course-001',
    name: 'Advanced Computer Applications',
    category: 'IT Division',
    duration: '6 months',
    fees: 15000,
    b2bPrice: 8000,
    isActive: true,
    isKit: true,
    enrolledStudents: 342,
  },
  {
    id: 'course-002',
    name: 'Diploma in Digital Marketing',
    category: 'IT Division',
    duration: '4 months',
    fees: 12000,
    b2bPrice: 6500,
    isActive: true,
    isKit: true,
    enrolledStudents: 256,
  },
  {
    id: 'course-003',
    name: 'Certificate in Tally Prime',
    category: 'Vocational',
    duration: '3 months',
    fees: 8000,
    b2bPrice: 4000,
    isActive: true,
    isKit: false,
    enrolledStudents: 198,
  },
  {
    id: 'course-004',
    name: 'Web Development Fundamentals',
    category: 'IT Division',
    duration: '5 months',
    fees: 18000,
    b2bPrice: 9500,
    isActive: true,
    isKit: true,
    enrolledStudents: 167,
  },
  {
    id: 'course-005',
    name: 'Spoken English Course',
    category: 'Language',
    duration: '3 months',
    fees: 6000,
    b2bPrice: 3000,
    isActive: false,
    isKit: false,
    enrolledStudents: 89,
  },
  {
    id: 'course-006',
    name: 'Certificate in Python Programming',
    category: 'IT Division',
    duration: '4 months',
    fees: 14000,
    b2bPrice: 7500,
    isActive: true,
    isKit: true,
    enrolledStudents: 145,
  },
];

type Course = typeof mockCourses[0];

export default function AdminCourses() {
  const [courses, setCourses] = useState(mockCourses);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: '',
    category: '',
    duration: '',
    fees: '',
    b2bPrice: '',
    syllabus: '',
    isKit: true,
  });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const moduleFromUrl = searchParams.get('module');
    if (moduleFromUrl) {
      setNewCourse(prev => ({ ...prev, category: moduleFromUrl }));
      setIsAddDialogOpen(true);
    }
  }, [searchParams]);


  const filteredCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCourse = () => {
    toast.success('Course created successfully!', {
      description: `${newCourse.name} has been added to the course catalog.`,
    });
    setIsAddDialogOpen(false);
    setNewCourse({
      name: '',
      category: '',
      duration: '',
      fees: '',
      b2bPrice: '',
      syllabus: '',
      isKit: true,
    });
  };

  const handleUpdateCourse = () => {
    if (!editingCourse) return;

    setCourses(prev =>
      prev.map(course =>
        course.id === editingCourse.id ? editingCourse : course
      )
    );

    toast.success('Course updated successfully!');
    setIsEditDialogOpen(false);
    setEditingCourse(null);
  };

  const handleEditInputChange = (field: keyof Course, value: string | number | boolean) => {
    if (editingCourse) setEditingCourse(prev => prev ? { ...prev, [field]: value } : null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Course Master</h1>
            <p className="text-muted-foreground mt-1">Manage all courses and their pricing</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>
                  Add a new course to the catalog.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Course Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Advanced Excel"
                      value={newCourse.name}
                      onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      placeholder="e.g., IT Division"
                      value={newCourse.category}
                      onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Input
                      id="duration"
                      placeholder="e.g., 3 months"
                      value={newCourse.duration}
                      onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fees">Course Fees (₹)</Label>
                    <Input
                      id="fees"
                      type="number"
                      placeholder="15000"
                      value={newCourse.fees}
                      onChange={(e) => setNewCourse({ ...newCourse, fees: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="b2bPrice">B2B Price (₹)</Label>
                    <Input
                      id="b2bPrice"
                      type="number"
                      placeholder="8000"
                      value={newCourse.b2bPrice}
                      onChange={(e) => setNewCourse({ ...newCourse, b2bPrice: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="syllabus">Syllabus</Label>
                  <Textarea
                    id="syllabus"
                    placeholder="Enter course syllabus..."
                    value={newCourse.syllabus}
                    onChange={(e) => setNewCourse({ ...newCourse, syllabus: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="isKit"
                    checked={newCourse.isKit}
                    onCheckedChange={(checked) => setNewCourse({ ...newCourse, isKit: checked })}
                  />
                  <Label htmlFor="isKit">Includes Material Kit</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCourse}>Create Course</Button>
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
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{courses.length}</p>
                  <p className="text-sm text-muted-foreground">Total Courses</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{courses.filter(c => c.isActive).length}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{courses.filter(c => c.isKit).length}</p>
                  <p className="text-sm text-muted-foreground">With Kit</p>
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
                  <p className="text-2xl font-bold">{courses.reduce((acc, c) => acc + c.enrolledStudents, 0)}</p>
                  <p className="text-sm text-muted-foreground">Enrollments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="font-heading">All Courses</CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Course</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Kit Value</TableHead>
                    <TableHead>Exam Only Value</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id} className="table-row-hover">
                      <TableCell>
                        <div>
                          <p className="font-medium">{course.name}</p>
                          <p className="text-sm text-muted-foreground">{course.enrolledStudents} enrolled</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{course.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {course.duration}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(course.fees)}
                      </TableCell>
                      <TableCell className="font-medium text-primary">
                        {formatCurrency(course.b2bPrice)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={course.isKit ? 'default' : 'secondary'}>
                          {course.isKit ? 'Kit' : 'Exam Only'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={course.isActive ? 'default' : 'secondary'}
                          className={course.isActive ? 'bg-success hover:bg-success/90' : ''}
                        >
                          {course.isActive ? 'Active' : 'Inactive'}
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
                            <DropdownMenuItem onClick={() => {
                              setEditingCourse({ ...course });
                              setIsEditDialogOpen(true);
                            }}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Course
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
