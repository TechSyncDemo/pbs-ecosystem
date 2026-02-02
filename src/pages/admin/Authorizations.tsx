import { useState } from 'react';
import {
  PlusCircle,
  MoreHorizontal,
  Plus,
  Trash2,
  Search,
  Eye,
  Loader2,
  Download,
  Calendar,
  AlertTriangle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { format, differenceInDays, isPast, addDays } from 'date-fns';
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
import { AuthorizationForm } from '@/components/admin/AuthorizationForm';

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
  const [isCreateAuthOpen, setIsCreateAuthOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CenterCourseWithDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [newCourseData, setNewCourseData] = useState({
    courseId: '',
    kitValue: '',
    examValue: '',
    duration: '',
    commission: '',
    registrationAmount: '',
  });

  const [editCourseData, setEditCourseData] = useState({
    kitValue: '',
    examValue: '',
    duration: '',
    notes: '',
    commission: '',
    registrationAmount: '',
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

  // Check validity status
  const getValidityBadge = (validUntil: any) => {
    if (!validUntil) return null;
    const date = new Date(validUntil);
    const daysLeft = differenceInDays(date, new Date());

    if (isPast(date)) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> Expired</Badge>;
    } else if (daysLeft <= 30) {
      return <Badge variant="outline" className="text-warning border-warning gap-1"><Calendar className="w-3 h-3" /> {daysLeft}d left</Badge>;
    }
    return <Badge variant="outline" className="text-success border-success">{format(date, 'dd MMM yyyy')}</Badge>;
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
      registration_amount: Number(newCourseData.registrationAmount) || 0,
      valid_from: format(new Date(), 'yyyy-MM-dd'),
      valid_until: format(addDays(new Date(), 365), 'yyyy-MM-dd'),
      status: 'active',
    } as any);

    setNewCourseData({ courseId: '', kitValue: '', examValue: '', duration: '', commission: '', registrationAmount: '' });
    refetchCenterCourses();
  };

  const handleCreateAuthorization = async (data: any) => {
    await assignCourse.mutateAsync(data);
    setIsCreateAuthOpen(false);
  };

  const handleViewCourse = (course: any) => {
    setSelectedCourse(course);
    setEditCourseData({
      kitValue: String(course.kit_value || 0),
      examValue: String(course.exam_value || 0),
      duration: String(course.duration_override || ''),
      notes: course.notes || '',
      commission: String(course.commission_percent || 0),
      registrationAmount: String(course.registration_amount || 0),
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
      registration_amount: Number(editCourseData.registrationAmount) || 0,
    } as any);

    setIsCourseDetailsOpen(false);
    refetchCenterCourses();
  };

  const handleRemoveCourse = async () => {
    if (!selectedCourse) return;

    await removeCenterCourse.mutateAsync(selectedCourse.id);
    setIsCourseDetailsOpen(false);
    refetchCenterCourses();
  };

  const handleDownloadCertificate = (authorization: any) => {
    // Generate certificate number if not exists
    const certNo = authorization.certificate_no || `AUTH-${authorization.id.slice(0, 8).toUpperCase()}`;
    const centerName = authorization.center_name || 'Unknown Center';
    const courseName = authorization.course_name || 'Unknown Course';
    const validFrom = authorization.valid_from ? format(new Date(authorization.valid_from), 'dd MMM yyyy') : 'N/A';
    const validUntil = authorization.valid_until ? format(new Date(authorization.valid_until), 'dd MMM yyyy') : 'N/A';

    // Create simple text certificate (in production, use PDF library)
    const certContent = `
AUTHORIZATION CERTIFICATE
========================

Certificate No: ${certNo}

This is to certify that

CENTER: ${centerName}

is authorized to conduct the following course:

COURSE: ${courseName}

Authorization Period: ${validFrom} to ${validUntil}

Commission: ${authorization.commission_percent || 0}%
Registration Amount: ₹${authorization.registration_amount || 0}
Kit Value: ₹${authorization.kit_value || 0}
Exam Value: ₹${authorization.exam_value || 0}

---
Proactive Beauty School
Authorization Engine
    `.trim();

    const blob = new Blob([certContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Authorization-${certNo}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Certificate downloaded!');
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Authorization Engine</h1>
            <p className="text-muted-foreground mt-1">Manage center authorizations and course assignments.</p>
          </div>
          <Dialog open={isCreateAuthOpen} onOpenChange={setIsCreateAuthOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Authorization
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Authorization</DialogTitle>
                <DialogDescription>
                  Assign a course to a center with financial details and validity period.
                </DialogDescription>
              </DialogHeader>
              <AuthorizationForm
                centers={centers.map(c => ({ id: c.id, name: c.name, code: c.code }))}
                courses={courses.map(c => ({ id: c.id, name: c.name, code: c.code, fee: c.fee }))}
                onSubmit={handleCreateAuthorization}
                onCancel={() => setIsCreateAuthOpen(false)}
                isLoading={assignCourse.isPending}
              />
            </DialogContent>
          </Dialog>
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
        <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto">
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
                <div className="grid grid-cols-1 sm:grid-cols-7 items-end gap-3">
                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label>Course</Label>
                    <Select
                      value={newCourseData.courseId}
                      onValueChange={(value) => setNewCourseData(prev => ({ ...prev, courseId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCoursesForCenter.length === 0 ? (
                          <SelectItem value="none" disabled>All assigned</SelectItem>
                        ) : (
                          availableCoursesForCenter.map(course => (
                            <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Reg. Amt (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newCourseData.registrationAmount}
                      onChange={(e) => setNewCourseData(prev => ({ ...prev, registrationAmount: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Kit (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newCourseData.kitValue}
                      onChange={(e) => setNewCourseData(prev => ({ ...prev, kitValue: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Exam (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newCourseData.examValue}
                      onChange={(e) => setNewCourseData(prev => ({ ...prev, examValue: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Comm %</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newCourseData.commission}
                      onChange={(e) => setNewCourseData(prev => ({ ...prev, commission: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Button onClick={handleAddCourse} className="w-full" disabled={assignCourse.isPending}>
                      {assignCourse.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
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
                        <TableHead>Course</TableHead>
                        <TableHead>Kit / Exam</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Valid Until</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCenterCourses.map((course: any) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.course_name}</TableCell>
                          <TableCell>₹{Number(course.kit_value || 0).toLocaleString()} / ₹{Number(course.exam_value || 0).toLocaleString()}</TableCell>
                          <TableCell>{course.commission_percent || 0}%</TableCell>
                          <TableCell>{getValidityBadge(course.valid_until)}</TableCell>
                          <TableCell>
                            <Badge className={course.status === 'active' ? 'bg-success' : 'bg-muted-foreground'}>
                              {course.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleViewCourse(course)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDownloadCertificate(course)}>
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
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
                <Label>Registration Amount (₹)</Label>
                <Input
                  type="number"
                  value={editCourseData.registrationAmount}
                  onChange={(e) => setEditCourseData({ ...editCourseData, registrationAmount: e.target.value })}
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
              Remove
            </Button>
            <Button variant="outline" onClick={() => setIsCourseDetailsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCourse} disabled={updateCenterCourse.isPending}>
              {updateCenterCourse.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
