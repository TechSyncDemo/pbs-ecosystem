import { useState } from 'react';
import {
  PlusCircle,
  MoreHorizontal,
  Plus,
  Trash2,
  Search,
  Edit,
  Eye,
  Loader2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useCenters, type Center } from '@/hooks/useCenters';
import { useCourses } from '@/hooks/useCourses';
import {
  useAllCenterCourses,
  useCenterAuthorizations,
  useAssignCourseToCenter,
  useUpdateCenterCourse,
  useRemoveCenterCourse,
  type CenterCourseWithDetails,
} from '@/hooks/useCenterCourses';

export default function AdminAuthorizations() {
  const { data: centers = [], isLoading: centersLoading } = useCenters();
  const { data: courses = [] } = useCourses();
  const { data: allCenterCourses = [] } = useAllCenterCourses();
  const assignCourse = useAssignCourseToCenter();
  const updateCenterCourse = useUpdateCenterCourse();
  const removeCenterCourse = useRemoveCenterCourse();

  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [isAddCoursesOpen, setIsAddCoursesOpen] = useState(false);
  const [isCourseDetailsOpen, setIsCourseDetailsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CenterCourseWithDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [newCourseData, setNewCourseData] = useState({
    courseId: '',
    kitValue: '',
    examValue: '',
    duration: '',
    commission: '',
  });

  const [editCourseData, setEditCourseData] = useState({
    kitValue: '',
    examValue: '',
    duration: '',
    notes: '',
    commission: '',
  });

  // Get center courses for selected center
  const { data: selectedCenterCourses = [], refetch: refetchCenterCourses } = useCenterAuthorizations(selectedCenter?.id);

  const filteredCenters = centers.filter(center =>
    center.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get count of assigned courses per center
  const getCenterCourseCount = (centerId: string) => {
    return allCenterCourses.filter(cc => cc.center_id === centerId).length;
  };

  const handleOpenAddCourses = (center: Center) => {
    setSelectedCenter(center);
    setIsAddCoursesOpen(true);
  };

  const handleAddCourse = async () => {
    if (!selectedCenter || !newCourseData.courseId) {
      toast.error('Please select a course to add.');
      return;
    }

    await assignCourse.mutateAsync({
      center_id: selectedCenter.id,
      course_id: newCourseData.courseId,
      kit_value: Number(newCourseData.kitValue) || 0,
      exam_value: Number(newCourseData.examValue) || 0,
      duration_override: newCourseData.duration ? parseInt(newCourseData.duration) : null,
      commission_percent: Number(newCourseData.commission) || 0,
      status: 'active',
    });

    setNewCourseData({ courseId: '', kitValue: '', examValue: '', duration: '', commission: '' });
    refetchCenterCourses();
  };

  const handleViewCourse = (course: any) => {
    setSelectedCourse(course);
    setEditCourseData({
      kitValue: String(course.kit_value || 0),
      examValue: String(course.exam_value || 0),
      duration: String(course.duration_override || ''),
      notes: course.notes || '',
      commission: String(course.commission_percent || 0),
    });
    setIsCourseDetailsOpen(true);
  };

  const handleUpdateCourse = async () => {
    if (!selectedCourse) return;

    await updateCenterCourse.mutateAsync({
      id: selectedCourse.id,
      kit_value: Number(editCourseData.kitValue) || 0,
      exam_value: Number(editCourseData.examValue) || 0,
      duration_override: editCourseData.duration ? parseInt(editCourseData.duration) : null,
      notes: editCourseData.notes || null,
      commission_percent: Number(editCourseData.commission) || 0,
    });

    setIsCourseDetailsOpen(false);
    refetchCenterCourses();
  };

  const handleRemoveCourse = async () => {
    if (!selectedCourse) return;

    await removeCenterCourse.mutateAsync(selectedCourse.id);
    setIsCourseDetailsOpen(false);
    refetchCenterCourses();
  };

  // Get courses not yet assigned to selected center
  const availableCoursesForCenter = courses.filter(
    course => !selectedCenterCourses.some((cc: any) => cc.course_id === course.id)
  );

  if (centersLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

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
                <CardTitle>Centers & Course Assignments</CardTitle>
                <CardDescription>Assign courses to centers and manage authorization details.</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search centers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredCenters.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No centers found. Create centers first to manage authorizations.
              </div>
            ) : (
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Center</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Courses</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCenters.map((center) => (
                      <TableRow key={center.id}>
                        <TableCell>
                          <p className="font-medium">{center.name}</p>
                          <p className="text-sm text-muted-foreground">{center.contact_person || 'No contact'}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{center.code}</Badge>
                        </TableCell>
                        <TableCell>
                          {center.city || 'N/A'}, {center.state || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge>{getCenterCourseCount(center.id)} courses</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={center.status === 'active' ? 'bg-success' : 'bg-destructive'}>
                            {center.status || 'active'}
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
                              <DropdownMenuItem onClick={() => handleOpenAddCourses(center)}>
                                <PlusCircle className="w-4 h-4 mr-2" /> Manage Courses
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Add/View Courses Dialog */}
      <Dialog open={isAddCoursesOpen} onOpenChange={setIsAddCoursesOpen}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
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
                    <Label>Select a Course</Label>
                    <Select
                      value={newCourseData.courseId}
                      onValueChange={(value) => setNewCourseData(prev => ({ ...prev, courseId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a course..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCoursesForCenter.length === 0 ? (
                          <SelectItem value="none" disabled>All courses assigned</SelectItem>
                        ) : (
                          availableCoursesForCenter.map(course => (
                            <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Kit Value (₹)</Label>
                    <Input
                      type="number"
                      placeholder="5000"
                      value={newCourseData.kitValue}
                      onChange={(e) => setNewCourseData(prev => ({ ...prev, kitValue: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Exam Value (₹)</Label>
                    <Input
                      type="number"
                      placeholder="1500"
                      value={newCourseData.examValue}
                      onChange={(e) => setNewCourseData(prev => ({ ...prev, examValue: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Commission %</Label>
                    <Input
                      type="number"
                      placeholder="10"
                      value={newCourseData.commission}
                      onChange={(e) => setNewCourseData(prev => ({ ...prev, commission: e.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Button onClick={handleAddCourse} className="w-full" disabled={assignCourse.isPending}>
                      {assignCourse.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assigned Courses</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedCenterCourses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No courses assigned yet.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course Name</TableHead>
                        <TableHead>Kit Value</TableHead>
                        <TableHead>Exam Value</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCenterCourses.map((course: any) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.course_name}</TableCell>
                          <TableCell>₹{Number(course.kit_value || 0).toLocaleString()}</TableCell>
                          <TableCell>₹{Number(course.exam_value || 0).toLocaleString()}</TableCell>
                          <TableCell>{course.commission_percent || 0}%</TableCell>
                          <TableCell>
                            <Badge className={course.status === 'active' ? 'bg-success' : 'bg-muted-foreground'}>
                              {course.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleViewCourse(course)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* View/Edit Course Details Dialog */}
      <Dialog open={isCourseDetailsOpen} onOpenChange={setIsCourseDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Course: {selectedCourse?.course_name}</DialogTitle>
            <DialogDescription>Modify course parameters for this center.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Kit Value (₹)</Label>
                <Input
                  type="number"
                  value={editCourseData.kitValue}
                  onChange={(e) => setEditCourseData({ ...editCourseData, kitValue: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Exam Value (₹)</Label>
                <Input
                  type="number"
                  value={editCourseData.examValue}
                  onChange={(e) => setEditCourseData({ ...editCourseData, examValue: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Duration Override (months)</Label>
                <Input
                  type="number"
                  placeholder="Leave empty for default"
                  value={editCourseData.duration}
                  onChange={(e) => setEditCourseData({ ...editCourseData, duration: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Commission %</Label>
                <Input
                  type="number"
                  value={editCourseData.commission}
                  onChange={(e) => setEditCourseData({ ...editCourseData, commission: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                value={editCourseData.notes}
                onChange={(e) => setEditCourseData({ ...editCourseData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              className="mr-auto"
              onClick={handleRemoveCourse}
              disabled={removeCenterCourse.isPending}
            >
              {removeCenterCourse.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Course
            </Button>
            <Button variant="outline" onClick={() => setIsCourseDetailsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCourse} disabled={updateCenterCourse.isPending}>
              {updateCenterCourse.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
