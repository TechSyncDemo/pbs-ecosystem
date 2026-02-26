import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Search, Plus, MoreHorizontal, Edit, Power, PowerOff, UserCheck, BookOpen,
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import {
  useAuthorizationsWithCourseCount,
  useCreateAuthorization,
  useUpdateAuthorization,
  useToggleAuthorizationStatus,
  type AuthorizationWithCourseCount,
  type AuthorizationInsert,
} from '@/hooks/useAuthorizations';

export default function AdminAuthorizations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAuth, setEditingAuth] = useState<AuthorizationWithCourseCount | null>(null);
  const [toggleAuth, setToggleAuth] = useState<AuthorizationWithCourseCount | null>(null);

  // Form state
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });

  const { data: authorizations, isLoading } = useAuthorizationsWithCourseCount();
  const createAuth = useCreateAuthorization();
  const updateAuth = useUpdateAuthorization();
  const toggleStatus = useToggleAuthorizationStatus();

  const filtered = useMemo(() => {
    if (!authorizations) return [];
    return authorizations.filter(
      a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           a.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [authorizations, searchQuery]);

  const stats = useMemo(() => {
    if (!authorizations) return { total: 0, active: 0, totalCourses: 0 };
    return {
      total: authorizations.length,
      active: authorizations.filter(a => a.status === 'active').length,
      totalCourses: authorizations.reduce((sum, a) => sum + a.courseCount, 0),
    };
  }, [authorizations]);

  const resetForm = () => setFormData({ name: '', code: '', description: '' });

  const handleCreate = () => {
    if (!formData.name || !formData.code) return;
    createAuth.mutate(
      { name: formData.name, code: formData.code.toUpperCase(), description: formData.description || null },
      { onSuccess: () => { setIsAddOpen(false); resetForm(); } }
    );
  };

  const handleEditClick = (auth: AuthorizationWithCourseCount) => {
    setEditingAuth(auth);
    setFormData({ name: auth.name, code: auth.code, description: auth.description || '' });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingAuth || !formData.name || !formData.code) return;
    updateAuth.mutate(
      { id: editingAuth.id, name: formData.name, code: formData.code.toUpperCase(), description: formData.description || null },
      { onSuccess: () => { setIsEditOpen(false); setEditingAuth(null); resetForm(); } }
    );
  };

  const handleToggleConfirm = () => {
    if (!toggleAuth) return;
    const newStatus = toggleAuth.status === 'active' ? 'inactive' : 'active';
    toggleStatus.mutate({ id: toggleAuth.id, status: newStatus as 'active' | 'inactive' });
    setToggleAuth(null);
  };

  const AuthForm = ({ isEdit }: { isEdit: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input placeholder="e.g., Beauty & Wellness" value={formData.name}
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Code *</Label>
          <Input placeholder="e.g., BW" value={formData.code}
            onChange={e => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description (Optional)</Label>
        <Textarea placeholder="Describe this authorization category..." rows={3}
          value={formData.description}
          onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => { isEdit ? setIsEditOpen(false) : setIsAddOpen(false); resetForm(); }}>
          Cancel
        </Button>
        <Button onClick={isEdit ? handleUpdate : handleCreate}
          disabled={isEdit ? updateAuth.isPending : createAuth.isPending}>
          {(isEdit ? updateAuth.isPending : createAuth.isPending) ? 'Saving...' : isEdit ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Authorizations</h1>
            <p className="text-muted-foreground mt-1">Manage specialization categories. Courses are created under these.</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={v => { setIsAddOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Add Authorization</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Authorization</DialogTitle>
                <DialogDescription>Add a new specialization category.</DialogDescription>
              </DialogHeader>
              <AuthForm isEdit={false} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  {isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">{stats.total}</p>}
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-success" />
                </div>
                <div>
                  {isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">{stats.active}</p>}
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-info" />
                </div>
                <div>
                  {isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">{stats.totalCourses}</p>}
                  <p className="text-sm text-muted-foreground">Total Courses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="font-heading">All Authorizations</CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search authorizations..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No authorizations found. Add your first one to get started.
              </div>
            ) : (
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Courses</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(auth => (
                      <TableRow key={auth.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{auth.name}</p>
                            {auth.description && <p className="text-sm text-muted-foreground line-clamp-1">{auth.description}</p>}
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{auth.code}</Badge></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{auth.courseCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={auth.status === 'active' ? 'default' : 'secondary'}
                            className={auth.status === 'active' ? 'bg-success hover:bg-success/90' : ''}>
                            {auth.status === 'active' ? 'Active' : 'Inactive'}
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
                              <DropdownMenuItem onClick={() => handleEditClick(auth)}>
                                <Edit className="w-4 h-4 mr-2" />Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setToggleAuth(auth)}
                                className={auth.status === 'active' ? 'text-destructive' : 'text-success'}>
                                {auth.status === 'active' ? <><PowerOff className="w-4 h-4 mr-2" />Set Inactive</> : <><Power className="w-4 h-4 mr-2" />Set Active</>}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={v => { setIsEditOpen(v); if (!v) { setEditingAuth(null); resetForm(); } }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Authorization</DialogTitle>
              <DialogDescription>Update the authorization details.</DialogDescription>
            </DialogHeader>
            <AuthForm isEdit />
          </DialogContent>
        </Dialog>

        {/* Toggle Status Dialog */}
        <AlertDialog open={!!toggleAuth} onOpenChange={v => { if (!v) setToggleAuth(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{toggleAuth?.status === 'active' ? 'Deactivate' : 'Activate'} Authorization</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to {toggleAuth?.status === 'active' ? 'deactivate' : 'activate'} "{toggleAuth?.name}"?
                {toggleAuth?.status === 'active' && toggleAuth.courseCount > 0 && (
                  <p className="mt-2">This authorization has {toggleAuth.courseCount} course(s) under it.</p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleToggleConfirm}
                className={toggleAuth?.status === 'active' ? 'bg-destructive hover:bg-destructive/90' : 'bg-success hover:bg-success/90'}>
                {toggleAuth?.status === 'active' ? 'Deactivate' : 'Activate'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
