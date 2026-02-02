import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, User, Building2 } from "lucide-react";
import { indianStates } from "@/lib/constants/indianStates";
import { getCitiesByState } from "@/lib/constants/indianCities";
import { useCoordinators } from "@/hooks/useCoordinators";
import { supabase } from "@/integrations/supabase/client";
import type { CenterInsert, Center } from "@/hooks/useCenters";

const centerFormSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  contact_person: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  coordinator_id: z.string().optional(),
  // User creation fields (only for new centers)
  login_email: z.string().email("Invalid email address").optional().or(z.literal("")),
  login_password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  confirm_password: z.string().optional(),
}).refine((data) => {
  if (data.login_password && data.confirm_password) {
    return data.login_password === data.confirm_password;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type CenterFormValues = z.infer<typeof centerFormSchema>;

interface CenterFormProps {
  center?: Center;
  onSubmit: (data: CenterInsert, userCredentials?: { email: string; password: string; fullName: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isCreatingUser?: boolean;
}

export function CenterForm({ center, onSubmit, onCancel, isLoading, isCreatingUser }: CenterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>(center?.state || "");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  
  const { data: coordinators = [] } = useCoordinators();
  const isEditing = !!center;

  const form = useForm<CenterFormValues>({
    resolver: zodResolver(centerFormSchema),
    defaultValues: {
      code: center?.code || "",
      name: center?.name || "",
      address: center?.address || "",
      city: center?.city || "",
      state: center?.state || "",
      pincode: center?.pincode || "",
      email: center?.email || "",
      phone: center?.phone || "",
      contact_person: center?.contact_person || "",
      status: (center?.status as "active" | "inactive") || "active",
      coordinator_id: (center as any)?.coordinator_id || "",
      login_email: "",
      login_password: "",
      confirm_password: "",
    },
  });

  // Generate center code on mount for new centers
  useEffect(() => {
    const generateCode = async () => {
      if (!isEditing) {
        const { data, error } = await supabase.rpc("generate_center_code");
        if (!error && data) {
          setGeneratedCode(data);
          form.setValue("code", data);
        }
      }
    };
    generateCode();
  }, [isEditing, form]);

  // Update available cities when state changes
  useEffect(() => {
    if (selectedState) {
      const cities = getCitiesByState(selectedState);
      setAvailableCities(cities);
    } else {
      setAvailableCities([]);
    }
  }, [selectedState]);

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    form.setValue("state", value);
    form.setValue("city", ""); // Reset city when state changes
  };

  const handleSubmit = (values: CenterFormValues) => {
    const { login_email, login_password, confirm_password, coordinator_id, ...centerData } = values;
    
    // If creating a new center with user credentials
    const userCredentials = !isEditing && login_email && login_password
      ? { email: login_email, password: login_password, fullName: values.contact_person || values.name }
      : undefined;

    const submitData: CenterInsert = {
      ...centerData,
      code: centerData.code || generatedCode,
      coordinator_id: coordinator_id === "none" ? null : coordinator_id || null,
    } as CenterInsert;

    onSubmit(submitData, userCredentials);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Center Code */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Building2 className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Center Code</p>
            <p className="text-lg font-bold text-primary">
              {isEditing ? center.code : generatedCode || "Generating..."}
            </p>
          </div>
          {!isEditing && <Badge variant="secondary" className="ml-auto">Auto-generated</Badge>}
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Center Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter center name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact_person"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Person</FormLabel>
                <FormControl>
                  <Input placeholder="Owner/Manager name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <Select onValueChange={handleStateChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-60">
                    {indianStates.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
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
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedState}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedState ? "Select city" : "Select state first"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-60">
                    {availableCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
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
            name="pincode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pincode</FormLabel>
                <FormControl>
                  <Input placeholder="Enter pincode" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Full address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="center@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+91 98765 43210" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Coordinator Assignment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="coordinator_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign Coordinator</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select coordinator" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Proactive HO (Default)</SelectItem>
                    {coordinators.map((coord) => (
                      <SelectItem key={coord.id} value={coord.id}>
                        {coord.name} {coord.region && `(${coord.region})`}
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

        {/* User Credentials - Only for New Centers */}
        {!isEditing && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Center Login Credentials</h3>
                <Badge variant="outline">Optional</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Create login credentials for the center admin. They will use these to access the Center Portal.
              </p>
              
              <FormField
                control={form.control}
                name="login_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Login Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@center.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="login_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Min 6 characters"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Re-enter password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || isCreatingUser}>
            {isLoading || isCreatingUser ? "Saving..." : isEditing ? "Update Center" : "Create Center"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
