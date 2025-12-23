import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import {
  Building2,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Key,
  Mail,
  MapPin,
  Calendar,
  Download,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AdminLayout from '@/layouts/AdminLayout';
import { toast } from 'sonner';

// Mock centers data
const mockCenters = [
  {
    id: 'center-001',
    name: 'PBS Delhi Center',
    code: 'PBS-DEL-001',
    owner: 'Rajesh Kumar',
    email: 'delhi@pbs-edu.com',
    location: 'New Delhi, India',
    validFrom: '2024-01-01',
    validTo: '2025-12-31',
    status: 'active',
    students: 245,
    coordinator: 'Amit Sharma',
  },
  {
    id: 'center-002',
    name: 'PBS Mumbai Center',
    code: 'PBS-MUM-001',
    owner: 'Priya Patel',
    email: 'mumbai@pbs-edu.com',
    location: 'Mumbai, India',
    validFrom: '2024-02-15',
    validTo: '2025-12-31',
    status: 'active',
    students: 198,
    coordinator: 'Neha Singh',
  },
  {
    id: 'center-003',
    name: 'PBS Bangalore Center',
    code: 'PBS-BLR-001',
    owner: 'Suresh Reddy',
    email: 'bangalore@pbs-edu.com',
    location: 'Bangalore, India',
    validFrom: '2024-03-01',
    validTo: '2025-06-30',
    status: 'active',
    students: 176,
    coordinator: 'Amit Sharma',
  },
  {
    id: 'center-004',
    name: 'PBS Chennai Center',
    code: 'PBS-CHE-001',
    owner: 'Lakshmi Iyer',
    email: 'chennai@pbs-edu.com',
    location: 'Chennai, India',
    validFrom: '2023-06-01',
    validTo: '2024-05-31',
    status: 'expired',
    students: 154,
    coordinator: 'Neha Singh',
  },
  {
    id: 'center-005',
    name: 'PBS Hyderabad Center',
    code: 'PBS-HYD-001',
    owner: 'Venkat Rao',
    email: 'hyderabad@pbs-edu.com',
    location: 'Hyderabad, India',
    validFrom: '2024-04-01',
    validTo: '2025-12-31',
    status: 'active',
    students: 132,
    coordinator: 'Amit Sharma',
  },
];

export default function AdminCenters() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCenter, setNewCenter] = useState({
    name: '',
    owner: '',
    email: '',
    location: '',
  });

  const filteredCenters = mockCenters.filter(
    (center) =>
      center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      center.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      center.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCenter = () => {
    toast.success('Center created successfully!', {
      description: `${newCenter.name} has been added to the network.`,
    });
    setIsAddDialogOpen(false);
    setNewCenter({ name: '', owner: '', email: '', location: '' });
  };

  const handleResetPassword = (centerName: string) => {
    toast.success('Password reset link sent!', {
      description: `Reset link has been sent to ${centerName}'s email.`,
    });
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
            <Button variant="outline">
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
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Center</DialogTitle>
                  <DialogDescription>
                    Add a new franchise center to your network.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Center Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., PBS Pune Center"
                      value={newCenter.name}
                      onChange={(e) => setNewCenter({ ...newCenter, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="owner">Owner Name</Label>
                    <Input
                      id="owner"
                      placeholder="Full name of center owner"
                      value={newCenter.owner}
                      onChange={(e) => setNewCenter({ ...newCenter, owner: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="center@pbs-edu.com"
                      value={newCenter.email}
                      onChange={(e) => setNewCenter({ ...newCenter, email: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="City, State"
                      value={newCenter.location}
                      onChange={(e) => setNewCenter({ ...newCenter, location: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCenter}>Create Center</Button>
                </DialogFooter>
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
                  <p className="text-2xl font-bold">{mockCenters.length}</p>
                  <p className="text-sm text-muted-foreground">Total Centers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mockCenters.filter(c => c.status === 'active').length}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mockCenters.filter(c => c.status === 'expired').length}</p>
                  <p className="text-sm text-muted-foreground">Expired</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mockCenters.reduce((acc, c) => acc + c.students, 0)}</p>
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
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Center</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCenters.map((center) => (
                    <TableRow key={center.id} className="table-row-hover">
                      <TableCell>
                        <div>
                          <p className="font-medium">{center.name}</p>
                          <p className="text-sm text-muted-foreground">{center.code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          {center.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{center.owner}</p>
                          <p className="text-sm text-muted-foreground">{center.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(center.validFrom).toLocaleDateString()}</p>
                          <p className="text-muted-foreground">to {new Date(center.validTo).toLocaleDateString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{center.students}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={center.status === 'active' ? 'default' : 'destructive'}
                          className={center.status === 'active' ? 'bg-success hover:bg-success/90' : ''}
                        >
                          {center.status === 'active' ? 'Active' : 'Expired'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(center.name)}>
                              <Key className="w-4 h-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="w-4 h-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
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
    </AdminLayout>
  );
}
