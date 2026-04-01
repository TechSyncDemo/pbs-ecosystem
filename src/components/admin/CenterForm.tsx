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
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, User, Building2, ShieldCheck } from "lucide-react";
import { indianStates } from "@/lib/constants/indianStates";
import { getCitiesByState } from "@/lib/constants/indianCities";
import { useCoordinators } from "@/hooks/useCoordinators";
import { useAuthorizations } from "@/hooks/useAuthorizations";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CenterInsert, Center } from "@/hooks/useCenters";

// State name to code mapping
const stateCodeMap: Record<string, string> = {
  "Jammu and Kashmir": "01",
  "Himachal Pradesh": "02",
  "Punjab": "03",
  "Chandigarh": "04",
  "Uttarakhand": "05",
  "Haryana": "06",
  "Delhi": "07",
  "Rajasthan": "08",
  "Uttar Pradesh": "09",
  "Bihar": "10",
  "Sikkim": "11",
  "Arunachal Pradesh": "12",
  "Nagaland": "13",
  "Manipur": "14",
  "Mizoram": "15",
  "Tripura": "16",
  "Meghalaya": "17",
  "Assam": "18",
  "West Bengal": "19",
  "Jharkhand": "20",
  "Odisha": "21",
  "Chhattisgarh": "22",
  "Madhya Pradesh": "23",
  "Gujarat": "24",
  "Maharashtra": "27",
  "Andhra Pradesh": "37",
  "Karnataka": "29",
  "Goa": "30",
  "Lakshadweep": "31",
  "Kerala": "32",
  "Tamil Nadu": "33",
  "Puducherry": "34",
  "Andaman and Nicobar Islands": "35",
  "Telangana": "36",
  "Dadra and Nagar Haveli and Daman and Diu": "25",
};

function getStateCode(stateName: string): string {
  if (stateCodeMap[stateName]) return stateCodeMap[stateName];
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return chars.charAt(Math.floor(Math.random() * chars.length)) + chars.charAt(Math.floor(Math.random() * chars.length));
}

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
  const [selectedAuthIds, setSelectedAuthIds] = useState<Set<string>>(new Set());
  const [isSavingAuths, setIsSavingAuths] = useState(false);
  
  const { data: coordinators = [] } = useCoordinators();
  const { data: allAuthorizations = [] } = useAuthorizations();
  const queryClient = useQueryClient();
  const isEditing = !!center;

  // Fetch currently assigned authorization IDs for this center
  const { data: assignedAuthIds = [] } = useQuery({
    queryKey: ['center-assigned-auths', center?.id],
    queryFn: async () => {
      if (!center?.id) return [];
      // Get all courses assigned to this center, then find unique authorization_ids
      const { data, error } = await supabase
        .from('center_courses')
        .select('course_id, courses(authorization_id)')
        .eq('center_id', center.id);
      if (error) throw error;
      const authIds = new Set<string>();
      (data || []).forEach((cc: any) => {
        if (cc.courses?.authorization_id) authIds.add(cc.courses.authorization_id);
      });
      return Array.from(authIds);
    },
    enabled: !!center?.id,
  });

  // Initialize selected auths from DB
  useEffect(() => {
    if (assignedAuthIds.length > 0) {
      setSelectedAuthIds(new Set(assignedAuthIds));
    }
  }, [assignedAuthIds]);

  const activeAuthorizations = allAuthorizations.filter(a => a.status === 'active');

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

  const generateCenterCode = async (stateName: string) => {
    if (isEditing) return;
    const sc = getStateCode(stateName);
    const { data, error } = await supabase.rpc("generate_center_code", { state_code: sc });
    if (!error && data) {
      setGeneratedCode(data);
      form.setValue("code", data);
    }
  };

  useEffect(() => {
    if (selectedState) {
      setAvailableCities(getCitiesByState(selectedState));
    } else {
      setAvailableCities([]);
    }
  }, [selectedState]);

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    form.setValue("state", value);
    form.setValue("city", "");
    generateCenterCode(value);
  };

  const toggleAuth = (authId: string) => {
    setSelectedAuthIds(prev => {
      const next = new Set(prev);
      if (next.has(authId)) next.delete(authId);
      else next.add(authId);
      return next;
    });
  };

  // Sync authorization assignments (add/remove courses)
  const syncAuthorizations = async (centerId: string) => {
    const originalIds = new Set(assignedAuthIds);
    const currentIds = selectedAuthIds;

    // Find added and removed auth IDs
    const addedAuths = [...currentIds].filter(id => !originalIds.has(id));
    const removedAuths = [...originalIds].filter(id => !currentIds.has(id));

    if (addedAuths.length === 0 && removedAuths.length === 0) return;

    // For added auths: fetch courses and insert center_courses
    if (addedAuths.length > 0) {
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .in('authorization_id', addedAuths)
        .eq('status', 'active');
      
      if (courses && courses.length > 0) {
        // Check existing
        const { data: existing } = await supabase
          .from('center_courses')
          .select('course_id')
          .eq('center_id', centerId)
          .in('course_id', courses.map(c => c.id));
        const existingSet = new Set((existing || []).map(e => e.course_id));
        const toInsert = courses.filter(c => !existingSet.has(c.id)).map(c => ({
          center_id: centerId,
          course_id: c.id,
          status: 'active',
        }));
        if (toInsert.length > 0) {
          await supabase.from('center_courses').insert(toInsert);
        }
      }
    }

    // For removed auths: remove center_courses for those courses
    if (removedAuths.length > 0) {
      const { data: coursesToRemove } = await supabase
        .from('courses')
        .select('id')
        .in('authorization_id', removedAuths);
      
      if (coursesToRemove && coursesToRemove.length > 0) {
        await supabase
          .from('center_courses')
          .delete()
          .eq('center_id', centerId)
          .in('course_id', coursesToRemove.map(c => c.id));
      }
    }

    queryClient.invalidateQueries({ queryKey: ['all-center-courses'] });
    queryClient.invalidateQueries({ queryKey: ['center-authorizations'] });
    queryClient.invalidateQueries({ queryKey: ['center-assigned-auths'] });
  };

  const handleSubmit = async (values: CenterFormValues) => {
    const { login_email, login_password, confirm_password, coordinator_id, ...centerData } = values;
    
    // Duplicate checks
    if (centerData.email) {
      const { data: existingEmail } = await supabase
        .from('centers')
        .select('id')
        .eq('email', centerData.email)
        .neq('id', center?.id || '')
        .maybeSingle();
      if (existingEmail) {
        form.setError('email', { message: 'This email is already registered with another center' });
        return;
      }
    }
    if (centerData.phone) {
      const { data: existingPhone } = await supabase
        .from('centers')
        .select('id')
        .eq('phone', centerData.phone)
        .neq('id', center?.id || '')
        .maybeSingle();
      if (existingPhone) {
        form.setError('phone', { message: 'This phone number is already registered with another center' });
        return;
      }
    }

    const userCredentials = !isEditing && login_email && login_password
      ? { email: login_email, password: login_password, fullName: values.contact_person || values.name }
      : undefined;

    const submitData: CenterInsert = {
      ...centerData,
      code: centerData.code || generatedCode,
      coordinator_id: coordinator_id === "none" ? null : coordinator_id || null,
    } as CenterInsert;

    // For editing, sync authorizations
    if (isEditing && center?.id) {
      setIsSavingAuths(true);
      try {
        await syncAuthorizations(center.id);
      } catch (err: any) {
        toast.error('Failed to sync authorizations: ' + err.message);
      } finally {
        setIsSavingAuths(false);
      }
    }

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
              {isEditing ? center.code : generatedCode || "Select state to generate"}
            </p>
          </div>
          {!isEditing && <Badge variant="secondary" className="ml-auto">Auto-generated</Badge>}
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Center Name *</FormLabel>
                <FormControl><Input placeholder="Enter center name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="contact_person"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Person</FormLabel>
                <FormControl><Input placeholder="Owner/Manager name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField control={form.control} name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <Select onValueChange={handleStateChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger></FormControl>
                  <SelectContent className="max-h-60">
                    {indianStates.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedState}>
                  <FormControl><SelectTrigger><SelectValue placeholder={selectedState ? "Select city" : "Select state first"} /></SelectTrigger></FormControl>
                  <SelectContent className="max-h-60">
                    {availableCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="pincode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pincode</FormLabel>
                <FormControl><Input placeholder="Enter pincode" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField control={form.control} name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl><Input placeholder="Full address" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" placeholder="center@example.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl><Input placeholder="+91 98765 43210" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Coordinator & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="coordinator_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign Coordinator</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select coordinator" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">Proactive HO (Default)</SelectItem>
                    {coordinators.map(coord => (
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
          <FormField control={form.control} name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
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

        {/* Authorizations Assignment */}
        {isEditing && activeAuthorizations.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h3 className="font-medium">Assigned Authorizations</h3>
                <Badge variant="outline">{selectedAuthIds.size} selected</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Toggle authorizations to assign or remove all courses under them for this center.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {activeAuthorizations.map(auth => (
                  <label key={auth.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer">
                    <Checkbox
                      checked={selectedAuthIds.has(auth.id)}
                      onCheckedChange={() => toggleAuth(auth.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{auth.name}</p>
                      <p className="text-xs text-muted-foreground">{auth.code}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

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
                Create login credentials for the center admin.
              </p>
              <FormField control={form.control} name="login_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Login Email</FormLabel>
                    <FormControl><Input type="email" placeholder="admin@center.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="login_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showPassword ? "text" : "password"} placeholder="Min 6 characters" {...field} />
                          <Button type="button" variant="ghost" size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type={showPassword ? "text" : "password"} placeholder="Re-enter password" {...field} />
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
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isLoading || isCreatingUser || isSavingAuths}>
            {(isLoading || isCreatingUser || isSavingAuths) ? "Saving..." : isEditing ? "Update Center" : "Create Center"}
          </Button>
        </div>
      </form>
    </Form>
  );
}