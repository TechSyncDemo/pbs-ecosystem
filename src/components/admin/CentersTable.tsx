import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontal, Pencil, Mail, Users, Eye, Power, PowerOff, KeyRound } from "lucide-react";
import type { Center } from "@/hooks/useCenters";
import { CenterProfileDialog } from "./CenterProfileDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CenterWithCount {
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
  updated_at: string;
  studentCount: number;
  coordinator_id?: string | null;
}

interface CentersTableProps {
  centers: CenterWithCount[];
  onEdit: (center: CenterWithCount) => void;
  onToggleStatus: (id: string, newStatus: "active" | "inactive") => void;
  isUpdating?: boolean;
}

export function CentersTable({ centers, onEdit, onToggleStatus, isUpdating }: CentersTableProps) {
  const [toggleStatusId, setToggleStatusId] = useState<{ id: string; currentStatus: string } | null>(null);
  const [profileCenter, setProfileCenter] = useState<CenterWithCount | null>(null);
  const [resetPasswordCenter, setResetPasswordCenter] = useState<CenterWithCount | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const handleResetPassword = async () => {
    if (!resetPasswordCenter || !newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setIsResetting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke("reset-center-password", {
        body: { centerId: resetPasswordCenter.id, newPassword },
        headers: { Authorization: `Bearer ${session.session?.access_token}` },
      });
      if (response.error) {
        toast.error(response.error.message || "Failed to reset password");
      } else {
        toast.success("Password updated successfully");
        setResetPasswordCenter(null);
        setNewPassword("");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setIsResetting(false);
    }
  };
  const handleToggleStatus = () => {
    if (toggleStatusId) {
      const newStatus = toggleStatusId.currentStatus === "active" ? "inactive" : "active";
      onToggleStatus(toggleStatusId.id, newStatus);
      setToggleStatusId(null);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Center Name / Code</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {centers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No centers found
                </TableCell>
              </TableRow>
            ) : (
              centers.map((center) => (
                <TableRow key={center.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{center.name}</div>
                      <div className="text-sm text-muted-foreground">{center.code}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{center.city || "-"}</div>
                      <div className="text-sm text-muted-foreground">{center.state}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{center.contact_person || "-"}</div>
                      <div className="text-sm text-muted-foreground">{center.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{center.studentCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={center.status === "active" ? "default" : "secondary"}>
                      {center.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setProfileCenter(center)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(center)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => center.email && window.open(`mailto:${center.email}`)}
                          disabled={!center.email}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setResetPasswordCenter(center); setNewPassword(""); }}>
                          <KeyRound className="mr-2 h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setToggleStatusId({ id: center.id, currentStatus: center.status || "active" })}
                          className={center.status === "active" ? "text-destructive focus:text-destructive" : "text-success focus:text-success"}
                        >
                          {center.status === "active" ? (
                            <>
                              <PowerOff className="mr-2 h-4 w-4" />
                              Set Inactive
                            </>
                          ) : (
                            <>
                              <Power className="mr-2 h-4 w-4" />
                              Set Active
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Toggle Status Confirmation Dialog */}
      <AlertDialog open={!!toggleStatusId} onOpenChange={() => setToggleStatusId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleStatusId?.currentStatus === "active" ? "Deactivate Center" : "Activate Center"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleStatusId?.currentStatus === "active"
                ? "Are you sure you want to set this center to inactive? The center will no longer be able to access the portal."
                : "Are you sure you want to activate this center? The center will regain access to the portal."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              disabled={isUpdating}
              className={toggleStatusId?.currentStatus === "active" 
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-success text-white hover:bg-success/90"}
            >
              {isUpdating ? "Updating..." : toggleStatusId?.currentStatus === "active" ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Center Profile Dialog */}
      <CenterProfileDialog
        center={profileCenter}
        open={!!profileCenter}
        onOpenChange={(open) => !open && setProfileCenter(null)}
      />

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPasswordCenter} onOpenChange={(open) => { if (!open) { setResetPasswordCenter(null); setNewPassword(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Center Password</DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{resetPasswordCenter?.name}</strong> ({resetPasswordCenter?.email || "no email"})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetPasswordCenter(null); setNewPassword(""); }}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={isResetting || newPassword.length < 6}>
              {isResetting ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
