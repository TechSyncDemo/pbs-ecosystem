import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BookOpen, Search, Plus, IndianRupee, Users, Download } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { CourseForm } from '@/components/admin/CourseForm';
import { CoursesTable } from '@/components/admin/CoursesTable';
import {
  useCourseStats,
  useCoursesWithStudentCount,
  useCreateCourse,
  useUpdateCourse,
  useToggleCourseStatus,
  type Course,
  type CourseInsert,
  type CourseUpdate,
  type CourseWithStudentCount,
} from '@/hooks/useCourses';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminCourses() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseWithStudentCount | null>(null);

  const { data: stats, isLoading: statsLoading } = useCourseStats();
  const { data: courses, isLoading: coursesLoading } = useCoursesWithStudentCount();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const toggleStatus = useToggleCourseStatus();

  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    return courses.filter(
      (course) =>
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    );
  }, [courses, searchQuery]);

  const handleCreateCourse = (data: CourseInsert) => {
    createCourse.mutate(data, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
      },
    });
  };

  const handleUpdateCourse = (data: CourseUpdate & { id: string }) => {
    updateCourse.mutate(data, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setEditingCourse(null);
      },
    });
  };

  const handleEditClick = (course: CourseWithStudentCount) => {
    setEditingCourse(course);
    setIsEditDialogOpen(true);
  };

  const handleToggleStatus = (id: string, newStatus: "active" | "inactive") => {
    toggleStatus.mutate({ id, status: newStatus });
  };

  const handleExport = () => {
    if (!courses) return;
    
    const headers = ['Name', 'Code', 'Duration (Months)', 'Exam Fee', 'Full Fee', 'Students', 'Status'];
    const csvData = courses.map(course => [
      course.name,
      course.code,
      course.duration_months,
      (course as any).exam_fee || 0,
      course.fee,
      course.studentCount,
      course.status,
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `courses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={!courses?.length}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Course
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Course</DialogTitle>
                  <DialogDescription>
                    Add a new course to the catalog.
                  </DialogDescription>
                </DialogHeader>
                <CourseForm
                  onSubmit={handleCreateCourse}
                  onCancel={() => setIsAddDialogOpen(false)}
                  isSubmitting={createCourse.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
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
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  )}
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
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.active || 0}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-info" />
                </div>
                <div>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.totalEnrollments || 0}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Enrollments</p>
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
                  {statsLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-2xl font-bold">{formatCurrency(stats?.avgFee || 0)}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Avg. Fee</p>
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
            {coursesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <CoursesTable
                courses={filteredCourses}
                onEdit={handleEditClick}
                onToggleStatus={handleToggleStatus}
                isUpdating={toggleStatus.isPending}
              />
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
              <DialogDescription>
                Update the course details below.
              </DialogDescription>
            </DialogHeader>
            {editingCourse && (
              <CourseForm
                course={editingCourse}
                onSubmit={(data) => handleUpdateCourse(data as CourseUpdate & { id: string })}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setEditingCourse(null);
                }}
                isSubmitting={updateCourse.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
