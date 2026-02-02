import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  User,
  Users,
  BookOpen,
  Calendar,
  BadgeCheck,
} from "lucide-react";
import type { Center } from "@/hooks/useCenters";
import { useCenterAuthorizations } from "@/hooks/useCenterCourses";
import { useCoordinators } from "@/hooks/useCoordinators";

interface CenterWithDetails {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  email?: string | null;
  phone?: string | null;
  contact_person?: string | null;
  status?: string | null;
  created_at: string;
  studentCount?: number;
  coordinator_id?: string | null;
}

interface CenterProfileDialogProps {
  center: CenterWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CenterProfileDialog({ center, open, onOpenChange }: CenterProfileDialogProps) {
  const { data: authorizations, isLoading: authLoading } = useCenterAuthorizations(center?.id);
  const { data: coordinators = [] } = useCoordinators();

  if (!center) return null;

  const coordinator = coordinators.find(c => c.id === center.coordinator_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="block">{center.name}</span>
              <span className="text-sm font-normal text-muted-foreground">{center.code}</span>
            </div>
            <Badge className="ml-auto" variant={center.status === "active" ? "default" : "secondary"}>
              {center.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <Users className="w-5 h-5 mx-auto text-primary mb-1" />
                <p className="text-2xl font-bold">{center.studentCount || 0}</p>
                <p className="text-xs text-muted-foreground">Students</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <BookOpen className="w-5 h-5 mx-auto text-primary mb-1" />
                <p className="text-2xl font-bold">{authorizations?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Courses</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <Calendar className="w-5 h-5 mx-auto text-primary mb-1" />
                <p className="text-2xl font-bold">
                  {new Date(center.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                </p>
                <p className="text-xs text-muted-foreground">Since</p>
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div>
              <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                Contact Information
              </h4>
              <div className="space-y-3">
                {center.contact_person && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{center.contact_person}</span>
                  </div>
                )}
                {center.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${center.email}`} className="text-primary hover:underline">
                      {center.email}
                    </a>
                  </div>
                )}
                {center.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${center.phone}`} className="text-primary hover:underline">
                      {center.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Location */}
            <div>
              <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                Location
              </h4>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  {center.address && <p>{center.address}</p>}
                  <p>
                    {[center.city, center.state].filter(Boolean).join(", ")}
                    {center.pincode && ` - ${center.pincode}`}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Assigned Coordinator */}
            <div>
              <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                Assigned Coordinator
              </h4>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <BadgeCheck className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">{coordinator?.name || "Proactive HO"}</p>
                  <p className="text-sm text-muted-foreground">
                    {coordinator?.email || "Default Assignment"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Authorized Courses */}
            <div>
              <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                Authorized Courses
              </h4>
              {authLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : authorizations && authorizations.length > 0 ? (
                <div className="space-y-2">
                  {authorizations.map((auth: any) => (
                    <div
                      key={auth.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{auth.course_name}</p>
                        <p className="text-sm text-muted-foreground">{auth.course_code}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={auth.status === "active" ? "default" : "secondary"}>
                          {auth.status}
                        </Badge>
                        {auth.valid_until && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Valid until: {new Date(auth.valid_until).toLocaleDateString("en-IN")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                  No courses authorized yet
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
