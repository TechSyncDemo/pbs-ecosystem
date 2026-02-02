import { useState, useMemo } from "react";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Building2, CheckCircle, XCircle, Users, Download } from "lucide-react";
import { CenterForm } from "@/components/admin/CenterForm";
import { CentersTable } from "@/components/admin/CentersTable";
import {
  useCenterWithStudentCount,
  useCenterStats,
  useCreateCenter,
  useUpdateCenter,
  useToggleCenterStatus,
  type CenterInsert,
} from "@/hooks/useCenters";
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

export default function AdminCenters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<CenterWithCount | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const { data: centers, isLoading: centersLoading } = useCenterWithStudentCount();
  const { data: stats, isLoading: statsLoading } = useCenterStats();

  const createCenter = useCreateCenter();
  const updateCenter = useUpdateCenter();
  const toggleStatus = useToggleCenterStatus();

  const filteredCenters = useMemo(() => {
    if (!centers) return [];
    if (!searchQuery) return centers;

    const query = searchQuery.toLowerCase();
    return centers.filter(
      (center: any) =>
        center.name.toLowerCase().includes(query) ||
        center.code.toLowerCase().includes(query) ||
        center.city?.toLowerCase().includes(query) ||
        center.contact_person?.toLowerCase().includes(query)
    );
  }, [centers, searchQuery]);

  const handleAddCenter = async (
    data: CenterInsert,
    userCredentials?: { email: string; password: string; fullName: string }
  ) => {
    createCenter.mutate(data, {
      onSuccess: async (newCenter) => {
        // If user credentials provided, create the center admin user
        if (userCredentials && newCenter) {
          setIsCreatingUser(true);
          try {
            const { data: session } = await supabase.auth.getSession();
            const response = await supabase.functions.invoke("create-center-admin", {
              body: {
                email: userCredentials.email,
                password: userCredentials.password,
                fullName: userCredentials.fullName,
                centerId: newCenter.id,
                phone: data.phone,
              },
              headers: {
                Authorization: `Bearer ${session.session?.access_token}`,
              },
            });

            if (response.error) {
              toast.error(`Center created, but failed to create user: ${response.error.message}`);
            } else {
              toast.success("Center and admin user created successfully!");
            }
          } catch (err: any) {
            toast.error(`Center created, but failed to create user: ${err.message}`);
          } finally {
            setIsCreatingUser(false);
          }
        }
        setIsAddDialogOpen(false);
      },
    });
  };

  const handleUpdateCenter = (data: CenterInsert) => {
    if (!editingCenter) return;
    updateCenter.mutate(
      { id: editingCenter.id, ...data },
      {
        onSuccess: () => setEditingCenter(null),
      }
    );
  };

  const handleToggleStatus = (id: string, newStatus: "active" | "inactive") => {
    toggleStatus.mutate({ id, status: newStatus });
  };

  const handleExport = () => {
    if (!centers) return;
    const csv = [
      ["Name", "Code", "City", "State", "Contact", "Email", "Status", "Students"],
      ...centers.map((c: any) => [
        c.name,
        c.code,
        c.city || "",
        c.state || "",
        c.contact_person || "",
        c.email || "",
        c.status || "",
        c.studentCount,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "centers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Center Network</h1>
            <p className="text-muted-foreground mt-1">Manage all franchise centers in your network</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleExport} disabled={!centers?.length}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Center
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Center</DialogTitle>
                  <DialogDescription>
                    Add a new franchise center to your network.
                  </DialogDescription>
                </DialogHeader>
                <CenterForm
                  onSubmit={handleAddCenter}
                  onCancel={() => setIsAddDialogOpen(false)}
                  isLoading={createCenter.isPending}
                  isCreatingUser={isCreatingUser}
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
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Total Centers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-success" />
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
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.inactive || 0}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Inactive</p>
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
                    <p className="text-2xl font-bold">{stats?.totalStudents || 0}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="font-heading">All Centers</CardTitle>
              <div className="relative w-full sm:w-72">
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
            {centersLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <CentersTable
                centers={filteredCenters}
                onEdit={setEditingCenter}
                onToggleStatus={handleToggleStatus}
                isUpdating={toggleStatus.isPending}
              />
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingCenter} onOpenChange={() => setEditingCenter(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Center</DialogTitle>
              <DialogDescription>Update the center details below.</DialogDescription>
            </DialogHeader>
            {editingCenter && (
              <CenterForm
                center={editingCenter as any}
                onSubmit={handleUpdateCenter}
                onCancel={() => setEditingCenter(null)}
                isLoading={updateCenter.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
