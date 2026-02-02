import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { CenterCourseInsert, CenterCourseWithDetails } from "@/hooks/useCenterCourses";

const authorizationSchema = z.object({
  center_id: z.string().min(1, "Center is required"),
  course_id: z.string().min(1, "Course is required"),
  registration_amount: z.coerce.number().min(0).default(0),
  commission_percent: z.coerce.number().min(0).max(100).default(0),
  kit_value: z.coerce.number().min(0).default(0),
  exam_value: z.coerce.number().min(0).default(0),
  valid_from: z.date().default(() => new Date()),
  valid_until: z.date().default(() => addDays(new Date(), 365)),
  status: z.enum(["active", "inactive"]).default("active"),
  notes: z.string().optional(),
});

type AuthorizationFormValues = z.infer<typeof authorizationSchema>;

interface AuthorizationFormProps {
  authorization?: CenterCourseWithDetails;
  centers: { id: string; name: string; code: string }[];
  courses: { id: string; name: string; code: string; fee: number }[];
  onSubmit: (data: CenterCourseInsert) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AuthorizationForm({
  authorization,
  centers,
  courses,
  onSubmit,
  onCancel,
  isLoading,
}: AuthorizationFormProps) {
  const isEditing = !!authorization;

  const form = useForm<AuthorizationFormValues>({
    resolver: zodResolver(authorizationSchema),
    defaultValues: {
      center_id: authorization?.center_id || "",
      course_id: authorization?.course_id || "",
      registration_amount: (authorization as any)?.registration_amount || 0,
      commission_percent: authorization?.commission_percent || 0,
      kit_value: authorization?.kit_value || 0,
      exam_value: authorization?.exam_value || 0,
      valid_from: authorization?.valid_from ? new Date(authorization.valid_from as any) : new Date(),
      valid_until: authorization?.valid_until ? new Date(authorization.valid_until as any) : addDays(new Date(), 365),
      status: (authorization?.status as "active" | "inactive") || "active",
      notes: authorization?.notes || "",
    },
  });

  const handleSubmit = (values: AuthorizationFormValues) => {
    const submitData: CenterCourseInsert = {
      center_id: values.center_id,
      course_id: values.course_id,
      registration_amount: values.registration_amount,
      commission_percent: values.commission_percent,
      kit_value: values.kit_value,
      exam_value: values.exam_value,
      valid_from: format(values.valid_from, "yyyy-MM-dd"),
      valid_until: format(values.valid_until, "yyyy-MM-dd"),
      status: values.status,
      notes: values.notes || null,
    } as CenterCourseInsert;

    onSubmit(submitData);
  };

  const selectedCourse = courses.find(c => c.id === form.watch("course_id"));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Center & Course Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="center_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Center *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select center" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-60">
                    {centers.map((center) => (
                      <SelectItem key={center.id} value={center.id}>
                        {center.name} ({center.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="course_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-60">
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name} ({course.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {selectedCourse && (
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <span className="text-muted-foreground">Course Fee: </span>
            <span className="font-medium">₹{selectedCourse.fee.toLocaleString("en-IN")}</span>
          </div>
        )}

        {/* Financial Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="registration_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registration Amount (₹)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="commission_percent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commission (%)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" min={0} max={100} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="kit_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kit Value (₹)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="exam_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exam Value (₹)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Validity Period */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="valid_from"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Valid From</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="valid_until"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Valid Until (365 days default)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Status & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional notes..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : isEditing ? "Update Authorization" : "Create Authorization"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
