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
  fee: z.coerce
    .number()
    .min(0, "Fee must be a positive number")
    .max(1000000, "Fee must be less than 10,00,000"),
  status: z.enum(["active", "inactive"]),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

interface CourseFormProps {
  course?: Course;
  onSubmit: (data: CourseInsert | CourseUpdate) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function CourseForm({ course, onSubmit, onCancel, isSubmitting }: CourseFormProps) {
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      name: course?.name || "",
      code: course?.code || "",
      description: course?.description || "",
      duration_months: course?.duration_months || 6,
      fee: Number(course?.fee) || 0,
      status: (course?.status as "active" | "inactive") || "active",
    },
  });

  const handleSubmit = (values: CourseFormValues) => {
    const data = {
      name: values.name,
      code: values.code.toUpperCase(),
      description: values.description || null,
      duration_months: values.duration_months,
      fee: values.fee,
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
                <FormLabel>Course Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Advanced Computer Applications" {...field} />
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
                <FormLabel>Course Code</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., ACA-101" 
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
                  placeholder="Enter course description and syllabus..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
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
            name="fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Fee (₹)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} placeholder="15000" {...field} />
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
