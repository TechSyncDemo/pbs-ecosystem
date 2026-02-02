import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import type { Course, CourseInsert, CourseUpdate } from "@/hooks/useCourses";

const courseFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Course name must be at least 2 characters")
    .max(100, "Course name must be less than 100 characters"),
  code: z
    .string()
    .trim()
    .min(2, "Course code must be at least 2 characters")
    .max(20, "Course code must be less than 20 characters")
    .regex(/^[A-Z0-9-]+$/, "Code must be uppercase letters, numbers, and hyphens only"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  duration_months: z.coerce
    .number()
    .min(1, "Duration must be at least 1 month")
    .max(48, "Duration must be at most 48 months"),
  exam_fee: z.coerce
    .number()
    .min(0, "Exam fee must be a positive number")
    .max(100000, "Exam fee must be less than 1,00,000"),
  fee: z.coerce
    .number()
    .min(0, "Fee must be a positive number")
    .max(1000000, "Fee must be less than 10,00,000"),
  exam_portal_id: z.string().optional(),
  status: z.enum(["active", "inactive"]),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

interface CourseFormProps {
  course?: Course;
  onSubmit: (data: CourseInsert | CourseUpdate) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  onManageSyllabus?: (courseId: string) => void;
}

export function CourseForm({ course, onSubmit, onCancel, isSubmitting, onManageSyllabus }: CourseFormProps) {
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      name: course?.name || "",
      code: course?.code || "",
      description: course?.description || "",
      duration_months: course?.duration_months || 6,
      exam_fee: Number((course as any)?.exam_fee) || 0,
      fee: Number(course?.fee) || 0,
      exam_portal_id: (course as any)?.exam_portal_id || "",
      status: (course?.status as "active" | "inactive") || "active",
    },
  });

  const handleSubmit = (values: CourseFormValues) => {
    const data = {
      name: values.name,
      code: values.code.toUpperCase(),
      description: values.description || null,
      duration_months: values.duration_months,
      exam_fee: values.exam_fee,
      fee: values.fee,
      exam_portal_id: values.exam_portal_id || null,
      status: values.status,
    };

    if (course) {
      onSubmit({ ...data, id: course.id } as CourseUpdate & { id: string });
    } else {
      onSubmit(data as CourseInsert);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Advanced Beauty Therapy" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Code *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., ABT-101" 
                    {...field} 
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter course description..."
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="duration_months"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (Months)</FormLabel>
                <FormControl>
                  <Input type="number" min={1} max={48} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Fee Structure */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">Fee Structure</h3>
            <Badge variant="outline">Course Fees</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="exam_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exam Only Fee (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} placeholder="0" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">For exam-only registrations</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Fee - Exam + Kit (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} placeholder="15000" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">For full course with materials</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Exam Portal Integration */}
        <FormField
          control={form.control}
          name="exam_portal_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exam Portal ID (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Link to external exam portal" {...field} />
              </FormControl>
              <FormDescription className="text-xs">
                Used for integration with the online exam system
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Syllabus Management - Only for existing courses */}
        {course && onManageSyllabus && (
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Course Syllabus / Topics</p>
                <p className="text-sm text-muted-foreground">Manage topics for marksheet printing</p>
              </div>
            </div>
            <Button type="button" variant="outline" onClick={() => onManageSyllabus(course.id)}>
              Manage Syllabus
            </Button>
          </div>
        )}

        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : course ? "Update Course" : "Create Course"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
