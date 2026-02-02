import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Edit, Clock, Users, Power, PowerOff, BookOpen } from "lucide-react";
import type { CourseWithStudentCount } from "@/hooks/useCourses";

interface CoursesTableProps {
  courses: CourseWithStudentCount[];
  onEdit: (course: CourseWithStudentCount) => void;
  onToggleStatus: (id: string, newStatus: "active" | "inactive") => void;
  onManageSyllabus?: (courseId: string) => void;
  isUpdating?: boolean;
}

export function CoursesTable({ courses, onEdit, onToggleStatus, onManageSyllabus, isUpdating }: CoursesTableProps) {
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [courseToToggle, setCourseToToggle] = useState<CourseWithStudentCount | null>(null);

  const handleToggleClick = (course: CourseWithStudentCount) => {
    setCourseToToggle(course);
    setToggleDialogOpen(true);
  };

  const handleToggleConfirm = () => {
    if (courseToToggle) {
      const newStatus = courseToToggle.status === "active" ? "inactive" : "active";
      onToggleStatus(courseToToggle.id, newStatus);
      setToggleDialogOpen(false);
      setCourseToToggle(null);
    }
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatDuration = (months: number) => {
    if (months === 1) return "1 month";
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) {
      return years === 1 ? "1 year" : `${years} years`;
    }
    return `${years}y ${remainingMonths}m`;
  };

  if (courses.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No courses found. Add your first course to get started.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Course</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Exam Fee</TableHead>
              <TableHead>Full Fee</TableHead>
              <TableHead>Enrolled</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id} className="table-row-hover">
                <TableCell>
                  <div>
                    <p className="font-medium">{course.name}</p>
                    {course.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {course.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{course.code}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(course.duration_months)}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatCurrency((course as any).exam_fee || 0)}
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(course.fee)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{course.studentCount}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={course.status === "active" ? "default" : "secondary"}
                    className={course.status === "active" ? "bg-success hover:bg-success/90" : ""}
                  >
                    {course.status === "active" ? "Active" : "Inactive"}
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
                      <DropdownMenuItem onClick={() => onEdit(course)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Course
                      </DropdownMenuItem>
                      {onManageSyllabus && (
                        <DropdownMenuItem onClick={() => onManageSyllabus(course.id)}>
                          <BookOpen className="w-4 h-4 mr-2" />
                          Manage Syllabus
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleToggleClick(course)}
                        className={course.status === "active" ? "text-destructive" : "text-success"}
                      >
                        {course.status === "active" ? (
                          <>
                            <PowerOff className="w-4 h-4 mr-2" />
                            Set Inactive
                          </>
                        ) : (
                          <>
                            <Power className="w-4 h-4 mr-2" />
                            Set Active
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={toggleDialogOpen} onOpenChange={setToggleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {courseToToggle?.status === "active" ? "Deactivate Course" : "Activate Course"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {courseToToggle?.status === "active" ? (
                <>
                  Are you sure you want to deactivate "{courseToToggle?.name}"?
                  <p className="mt-2">
                    Inactive courses won't be available for new enrollments but existing students will remain enrolled.
                  </p>
                </>
              ) : (
                <>
                  Are you sure you want to activate "{courseToToggle?.name}"?
                  <p className="mt-2">
                    This course will become available for new enrollments.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleConfirm}
              disabled={isUpdating}
              className={courseToToggle?.status === "active" 
                ? "bg-destructive hover:bg-destructive/90" 
                : "bg-success hover:bg-success/90"}
            >
              {isUpdating ? "Updating..." : courseToToggle?.status === "active" ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
