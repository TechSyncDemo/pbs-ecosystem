import { useState } from 'react';
import {
  BadgePercent,
  Plus,
  MoreHorizontal,
  Edit,
  Eye,
  Building2,
  Phone,
  Mail,
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  useCoordinators,
  useCreateCoordinator,
  useUpdateCoordinator,
  type Coordinator,
} from '@/hooks/useCoordinators';
import { useCenters } from '@/hooks/useCenters';

export default function AdminCoordinators() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCoordinator, setSelectedCoordinator] = useState<Coordinator | null>(null);
  const [newCoordinator, setNewCoordinator] = useState({
    name: '',
    email: '',
    phone: '',
    region: '',
  });
  const [editingCoordinator, setEditingCoordinator] = useState<Coordinator | null>(null);

  const { data: coordinators = [], isLoading } = useCoordinators();
  const { data: centers = [] } = useCenters();
  const createCoordinator = useCreateCoordinator();
  const updateCoordinator = useUpdateCoordinator();

  const handleCreateCoordinator = () => {
    createCoordinator.mutate(newCoordinator, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewCoordinator({ name: '', email: '', phone: '', region: '' });
      },
    });
  };

  const handleUpdateCoordinator = () => {
    if (!editingCoordinator) return;

    updateCoordinator.mutate({
      id: editingCoordinator.id,
      name: editingCoordinator.name,
      email: editingCoordinator.email,
      phone: editingCoordinator.phone,
      region: editingCoordinator.region,
    }, {
      onSuccess: () => {
        setIsEditOpen(false);
        setEditingCoordinator(null);
      },
    });
  };

  const getAssignedCentersCount = (assignedCenters: string[] | null) => {
    if (!assignedCenters) return 0;
    return assignedCenters.length;
  };

  const getAssignedCenterNames = (assignedCenters: string[] | null) => {
    if (!assignedCenters || assignedCenters.length === 0) return [];
    return centers.filter(c => assignedCenters.includes(c.id)).map(c => ({ id: c.id, name: c.name }));
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Coordinator Management</h1>
            <p className="text-muted-foreground mt-1">Create profiles and track coordinator performance.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Create Coordinator</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Coordinator</DialogTitle>
                <DialogDescription>Fill in the details to create a new coordinator profile.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Full Name</Label>
                  <Input 
                    placeholder="Enter full name" 
                    value={newCoordinator.name}
                    onChange={(e) => setNewCoordinator({ ...newCoordinator, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input 
                      type="email" 
                      placeholder="email@example.com"
                      value={newCoordinator.email}
                      onChange={(e) => setNewCoordinator({ ...newCoordinator, email: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Contact Number</Label>
                    <Input 
                      placeholder="+91 98765 43210"
                      value={newCoordinator.phone}
                      onChange={(e) => setNewCoordinator({ ...newCoordinator, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Region</Label>
                  <Input 
                    placeholder="e.g., North India"
                    value={newCoordinator.region}
                    onChange={(e) => setNewCoordinator({ ...newCoordinator, region: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateCoordinator} disabled={createCoordinator.isPending}>
                  {createCoordinator.isPending ? 'Saving...' : 'Save Profile'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle>All Coordinators</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Coordinator</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Assigned Centers</TableHead>
                      <TableHead>Joined On</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coordinators.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No coordinators found
                        </TableCell>
                      </TableRow>
                    ) : (
                      coordinators.map((coord) => (
                        <TableRow key={coord.id}>
                          <TableCell>
                            <p className="font-medium">{coord.name}</p>
                            <p className="text-sm text-muted-foreground">{coord.email}</p>
                          </TableCell>
                          <TableCell>{coord.region || '-'}</TableCell>
                          <TableCell>{getAssignedCentersCount(coord.assigned_centers)}</TableCell>
                          <TableCell>{new Date(coord.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setSelectedCoordinator(coord); setIsViewOpen(true); }}>
                                  <Eye className="w-4 h-4 mr-2" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setEditingCoordinator({ ...coord }); setIsEditOpen(true); }}>
                                  <Edit className="w-4 h-4 mr-2" /> Edit Profile
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Coordinator Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCoordinator?.name}</DialogTitle>
            <DialogDescription>Coordinator Details & Assigned Centers</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-muted-foreground" /><span>{selectedCoordinator?.email}</span></div>
              <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground" /><span>{selectedCoordinator?.phone || '-'}</span></div>
              <div className="flex items-center gap-2 text-sm"><BadgePercent className="w-4 h-4 text-muted-foreground" /><span>Region: {selectedCoordinator?.region || '-'}</span></div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Assigned Centers ({getAssignedCentersCount(selectedCoordinator?.assigned_centers || null)})</h4>
              <div className="space-y-2 rounded-md border p-2 max-h-60 overflow-y-auto">
                {getAssignedCenterNames(selectedCoordinator?.assigned_centers || null).length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">No centers assigned</p>
                ) : (
                  getAssignedCenterNames(selectedCoordinator?.assigned_centers || null).map(center => (
                    <div key={center.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{center.name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Coordinator Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Coordinator Profile</DialogTitle>
            <DialogDescription>Update the details for {editingCoordinator?.name}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Full Name</Label>
              <Input
                value={editingCoordinator?.name || ''}
                onChange={(e) => setEditingCoordinator(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingCoordinator?.email || ''}
                  onChange={(e) => setEditingCoordinator(prev => prev ? { ...prev, email: e.target.value } : null)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Contact Number</Label>
                <Input
                  value={editingCoordinator?.phone || ''}
                  onChange={(e) => setEditingCoordinator(prev => prev ? { ...prev, phone: e.target.value } : null)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Region</Label>
              <Input 
                value={editingCoordinator?.region || ''} 
                onChange={(e) => setEditingCoordinator(prev => prev ? { ...prev, region: e.target.value } : null)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateCoordinator} disabled={updateCoordinator.isPending}>
              {updateCoordinator.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
