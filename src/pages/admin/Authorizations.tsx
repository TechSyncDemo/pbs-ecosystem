import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  PlusCircle,
  MoreHorizontal,
  Plus,
  Trash2,
  Search,
  BookOpen,
  Building2,
  Edit,
  Eye,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const mockCenters = [
  {
    id: 'C-001',
    name: 'PBS Computer Education - City Center',
    feesPaid: 50000,
    validity: '2025-03-31',
    commissionRate: 15,
    createdOn: '2023-04-01',
    description: 'Premier IT training center in the heart of the city.',
    authorizationType: 'Information Technology',
    status: 'Active',
  },
  {
    id: 'C-002',
    name: 'Vocational Skills Institute - Suburb',
    feesPaid: 35000,
    validity: '2024-12-31',
    commissionRate: 20,
    createdOn: '2023-08-15',
    description: 'Focus on job-oriented vocational courses.',
    authorizationType: 'Vocational Division',
    status: 'Active',
  },
  {
    id: 'C-003',
    name: 'Tech Learners Hub - North',
    feesPaid: 50000,
    validity: '2025-06-30',
    commissionRate: 15,
    createdOn: '2024-01-10',
    description: 'New center with modern infrastructure.',
    authorizationType: 'IT Division',
    status: 'Inactive',
    assignedCourses: [],
  },
];

const mockCoursesMaster = [
  { id: 'CRS-001', name: 'Diploma in Digital Marketing' },
  { id: 'CRS-002', name: 'Certificate in Tally Prime' },
  { id: 'CRS-003', name: 'Web Development Fundamentals' },
  { id: 'CRS-004', name: 'Certificate in Python Programming' },
  { id: 'CRS-005', name: 'Advanced Computer Applications' },
];

export default function AdminAuthorizations() {
  const [centers, setCenters] = useState(mockCenters);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [editableCenter, setEditableCenter] = useState(null);
  const [isEditCenterOpen, setIsEditCenterOpen] = useState(false);
  const [isAddCoursesOpen, setIsAddCoursesOpen] = useState(false);
  const [isCourseDetailsOpen, setIsCourseDetailsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCourseData, setNewCourseData] = useState({
    courseId: '',
    kitValue: '',
    examValue: '',
    duration: '',
  });

  // Add assignedCourses to mock data if it doesn't exist, to prevent errors
  const initializedCenters = centers.map(center => ({
    ...center, assignedCourses: center.assignedCourses || []
  }));

  const handleSaveChanges = () => {
    if (!editableCenter) return;

    const updatedCenters = centers.map(center =>
      center.id === editableCenter.id ? editableCenter : center
    );
    setCenters(updatedCenters);

    toast.success('Center details updated successfully!');
    setIsEditCenterOpen(false);
    setEditableCenter(null);
  };

  const handleEditCenterChange = (field, value) => {
    if (!editableCenter) return;
    setEditableCenter(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCourse = () => {
    if (!newCourseData.courseId) {
      toast.error('Please select a course to add.');
      return;
    }

    const courseMaster = mockCoursesMaster.find(c => c.id === newCourseData.courseId);
    if (!courseMaster) return;

    const newAssignedCourse = {
      courseId: courseMaster.id,
      name: courseMaster.name,
      kitValue: Number(newCourseData.kitValue) || 0,
      onlyExamValue: Number(newCourseData.examValue) || 0,
      duration: newCourseData.duration || 'N/A',
      note: '', // Default value
    };

    // This is a mock update. In a real app, you'd send this to an API.
    const updatedCenters = centers.map(center => {
      if (center.id === selectedCenter?.id) {
        return { ...center, assignedCourses: [...center.assignedCourses, newAssignedCourse] };
      }
      return center;
    });
    setCenters(updatedCenters);
    setSelectedCenter(prev => ({ ...prev, assignedCourses: [...prev.assignedCourses, newAssignedCourse] }));
    setNewCourseData({ courseId: '', kitValue: '', examValue: '', duration: '' });
    toast.success('Course added to center!');
  };

  const filteredCenters = initializedCenters.filter(center =>
    center.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Authorization Engine</h1>
          <p className="text-muted-foreground mt-1">Manage center authorizations and course assignments.</p>
        </div>

        <Card className="border-0 shadow-card">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Authorized Centers</CardTitle>
                <CardDescription>View and manage all authorized training centers.</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search centers by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
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
                    <TableHead>Fees Paid</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCenters.map((center) => (
                    <TableRow key={center.id}>
                      <TableCell>
                        <p className="font-medium">{center.name}</p>
                        <p className="text-sm text-muted-foreground">{center.authorizationType}</p>
                      </TableCell>
                      <TableCell>₹{center.feesPaid.toLocaleString('en-IN')}</TableCell>
                      <TableCell>{center.commissionRate}%</TableCell>
                      <TableCell>{new Date(center.validity).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={center.status === 'Active' ? 'bg-success' : 'bg-destructive'}>{center.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedCenter(center); setEditableCenter({ ...center }); setIsEditCenterOpen(true); }}>
                              <Edit className="w-4 h-4 mr-2" /> Edit Authorization
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedCenter(center); setIsAddCoursesOpen(true); }}>
                              <PlusCircle className="w-4 h-4 mr-2" /> Add/View Courses
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

      {/* Edit Center Dialog */}
      <Dialog open={isEditCenterOpen} onOpenChange={setIsEditCenterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Authorization for {editableCenter?.name}</DialogTitle>
            <DialogDescription>Modify commission, description, and status.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="commission" className="text-right">Commission (%)</Label>
              <Input id="commission" type="number" value={editableCenter?.commissionRate || ''} onChange={(e) => handleEditCenterChange('commissionRate', Number(e.target.value))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">Description</Label>
              <Textarea id="description" value={editableCenter?.description || ''} onChange={(e) => handleEditCenterChange('description', e.target.value)} className="col-span-3" />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="status-mode" checked={editableCenter?.status === 'Active'} onCheckedChange={(checked) => handleEditCenterChange('status', checked ? 'Active' : 'Inactive')} />
              <Label htmlFor="status-mode">Set Authorization as Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCenterOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/View Courses Dialog */}
      <Dialog open={isAddCoursesOpen} onOpenChange={setIsAddCoursesOpen}>
        <DialogContent className="sm:max-w-[750px]">
          <DialogHeader>
            <DialogTitle>Manage Courses for {selectedCenter?.name}</DialogTitle>
            <DialogDescription>Assign new courses and manage existing ones for this center.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add New Course</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-6 items-end gap-4">
                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label htmlFor="course-select">Select a Course</Label>
                    <Select value={newCourseData.courseId} onValueChange={(value) => setNewCourseData(prev => ({ ...prev, courseId: value }))}>
                      <SelectTrigger id="course-select">
                        <SelectValue placeholder="Choose a course..." />
                      </SelectTrigger>
                      <SelectContent>
                        {mockCoursesMaster
                          .filter(mc => !selectedCenter?.assignedCourses.some(ac => ac.courseId === mc.id))
                          .map(course => (
                            <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Kit Value (₹)</Label>
                    <Input type="number" placeholder="e.g., 5000" value={newCourseData.kitValue} onChange={(e) => setNewCourseData(prev => ({ ...prev, kitValue: e.target.value }))} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Exam Value (₹)</Label>
                    <Input type="number" placeholder="e.g., 1500" value={newCourseData.examValue} onChange={(e) => setNewCourseData(prev => ({ ...prev, examValue: e.target.value }))} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Duration</Label>
                    <Input placeholder="e.g., 6 Months" value={newCourseData.duration} onChange={(e) => setNewCourseData(prev => ({ ...prev, duration: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-1">
                    <Button onClick={handleAddCourse} className="w-full"><Plus className="w-4 h-4 mr-2" />Add</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assigned Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Name</TableHead>
                      <TableHead>Kit Value</TableHead>
                      <TableHead>Exam Value</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCenter?.assignedCourses.map(course => (
                      <TableRow key={course.courseId}>
                        <TableCell className="font-medium">{course.name}</TableCell>
                        <TableCell>₹{course.kitValue}</TableCell>
                        <TableCell>₹{course.onlyExamValue}</TableCell>
                        <TableCell>{course.duration}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedCourse(course); setIsCourseDetailsOpen(true); }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* View/Edit Course Details Dialog */}
      <Dialog open={isCourseDetailsOpen} onOpenChange={setIsCourseDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Course Details: {selectedCourse?.name}</DialogTitle>
            <DialogDescription>Modify course parameters for this center only.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Kit Value (₹)</Label>
                <Input type="number" defaultValue={selectedCourse?.kitValue} />
              </div>
              <div className="grid gap-2">
                <Label>Only Exam Value (₹)</Label>
                <Input type="number" defaultValue={selectedCourse?.onlyExamValue} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Duration</Label>
              <Input defaultValue={selectedCourse?.duration} />
            </div>
            <div className="grid gap-2">
              <Label>Note</Label>
              <Textarea defaultValue={selectedCourse?.note} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="destructive" className="mr-auto"><Trash2 className="w-4 h-4 mr-2" />Remove Course</Button>
            <Button variant="outline" onClick={() => setIsCourseDetailsOpen(false)}>Cancel</Button>
            <Button onClick={() => { toast.success("Course details updated!"); setIsCourseDetailsOpen(false); }}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}