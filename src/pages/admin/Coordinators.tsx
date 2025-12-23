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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';

// Mock Data
const mockCoordinators = [
  {
    id: 'COORD-01',
    name: 'Sanjay Verma',
    email: 'sanjay.v@pbs.com',
    contact: '+91 99887 76655',
    commissionRate: 5,
    assignedCenters: [
      { id: 'C-001', name: 'PBS Computer Education - City Center' },
      { id: 'C-003', name: 'Tech Learners Hub - North' },
    ],
    createdOn: '2023-02-10',
  },
  {
    id: 'COORD-02',
    name: 'Anita Desai',
    email: 'anita.d@pbs.com',
    contact: '+91 88776 65544',
    commissionRate: 7,
    assignedCenters: [
      { id: 'C-002', name: 'Vocational Skills Institute - Suburb' },
    ],
    createdOn: '2023-05-20',
  },
];

type Coordinator = typeof mockCoordinators[0];

export default function AdminCoordinators() {
  const [coordinators, setCoordinators] = useState(mockCoordinators);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCoordinator, setSelectedCoordinator] = useState<Coordinator | null>(null);
  const [newCoordinator, setNewCoordinator] = useState({
    name: '',
    email: '',
    contact: '',
    commissionRate: '',
  });
  const [editingCoordinator, setEditingCoordinator] = useState<Coordinator | null>(null);

  const handleCreateCoordinator = () => {
    // In a real app, you'd validate and send this to an API
    toast.success('Coordinator created successfully!');
    setIsCreateOpen(false);
    setNewCoordinator({ name: '', email: '', contact: '', commissionRate: '' });
  };

  const handleUpdateCoordinator = () => {
    if (!editingCoordinator) return;

    setCoordinators(prev =>
      prev.map(coord =>
        coord.id === editingCoordinator.id ? editingCoordinator : coord
      )
    );

    toast.success('Coordinator profile updated successfully!');
    setIsEditOpen(false);
    setEditingCoordinator(null);
  };

  const handleEditInputChange = (field: keyof Omit<Coordinator, 'id' | 'assignedCenters' | 'createdOn'>, value: string) => {
    if (editingCoordinator) {
      setEditingCoordinator({ ...editingCoordinator, [field]: value });
    }
  }

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
                  <Input placeholder="Enter full name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="email@example.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Contact Number</Label>
                    <Input placeholder="+91 98765 43210" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Commission Rate (%)</Label>
                  <Input type="number" placeholder="e.g., 5" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateCoordinator}>Save Profile</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle>All Coordinators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Coordinator</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Assigned Centers</TableHead>
                    <TableHead>Joined On</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coordinators.map((coord) => (
                    <TableRow key={coord.id}>
                      <TableCell>
                        <p className="font-medium">{coord.name}</p>
                        <p className="text-sm text-muted-foreground">{coord.email}</p>
                      </TableCell>
                      <TableCell className="font-medium">{coord.commissionRate}%</TableCell>
                      <TableCell>{coord.assignedCenters.length}</TableCell>
                      <TableCell>{new Date(coord.createdOn).toLocaleDateString()}</TableCell>
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
                  ))}
                </TableBody>
              </Table>
            </div>
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
              <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground" /><span>{selectedCoordinator?.contact}</span></div>
              <div className="flex items-center gap-2 text-sm"><BadgePercent className="w-4 h-4 text-muted-foreground" /><span>{selectedCoordinator?.commissionRate}% Commission Rate</span></div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Assigned Centers ({selectedCoordinator?.assignedCenters.length})</h4>
              <div className="space-y-2 rounded-md border p-2 max-h-60 overflow-y-auto">
                {selectedCoordinator?.assignedCenters.map(center => (
                  <div key={center.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{center.name}</span>
                  </div>
                ))}
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
                onChange={(e) => handleEditInputChange('name', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingCoordinator?.email || ''}
                  onChange={(e) => handleEditInputChange('email', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Contact Number</Label>
                <Input
                  value={editingCoordinator?.contact || ''}
                  onChange={(e) => handleEditInputChange('contact', e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Commission Rate (%)</Label>
              <Input type="number" value={editingCoordinator?.commissionRate || ''} onChange={(e) => handleEditInputChange('commissionRate', e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateCoordinator}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}