import { useState } from 'react';
import {
  Building,
  User,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CenterLayout from '@/layouts/CenterLayout';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCenters, useUpdateCenter } from '@/hooks/useCenters';
import { useCenterAuthorizations } from '@/hooks/useCenterCourses';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | React.ReactNode }) => (
  <div className="flex items-start gap-3">
    <Icon className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value || 'Not specified'}</p>
    </div>
  </div>
);

export default function CenterProfile() {
  const { user } = useAuth();
  const centerId = user?.centerId;
  const queryClient = useQueryClient();

  // Fetch center data
  const { data: centers = [], isLoading: centersLoading } = useCenters();
  const center = centers.find(c => c.id === centerId);

  // Fetch profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch authorized courses
  const { data: authorizations = [] } = useCenterAuthorizations(centerId);

  const updateCenter = useUpdateCenter();

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (updates: { full_name?: string; phone?: string }) => {
      if (!user?.id) throw new Error('No user');
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Profile updated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + error.message);
    },
  });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editableData, setEditableData] = useState({
    centerName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    contactPerson: '',
    phone: '',
    email: '',
    profileName: '',
    profilePhone: '',
  });

  const handleOpenEdit = () => {
    setEditableData({
      centerName: center?.name || '',
      address: center?.address || '',
      city: center?.city || '',
      state: center?.state || '',
      pincode: center?.pincode || '',
      contactPerson: center?.contact_person || '',
      phone: center?.phone || '',
      email: center?.email || '',
      profileName: profile?.full_name || '',
      profilePhone: profile?.phone || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveChanges = async () => {
    if (centerId) {
      await updateCenter.mutateAsync({
        id: centerId,
        name: editableData.centerName,
        address: editableData.address,
        city: editableData.city,
        state: editableData.state,
        pincode: editableData.pincode,
        contact_person: editableData.contactPerson,
        phone: editableData.phone,
        email: editableData.email,
      });
    }

    if (user?.id) {
      await updateProfile.mutateAsync({
        full_name: editableData.profileName,
        phone: editableData.profilePhone,
      });
    }

    setIsEditDialogOpen(false);
  };

  const isLoading = centersLoading || profileLoading;

  if (isLoading) {
    return (
      <CenterLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </CenterLayout>
    );
  }

  if (!center) {
    return (
      <CenterLayout>
        <div className="text-center py-12 text-muted-foreground">
          Center not found. Please contact support.
        </div>
      </CenterLayout>
    );
  }

  const fullAddress = [center.address, center.city, center.state, center.pincode].filter(Boolean).join(', ');

  return (
    <CenterLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Center Profile</h1>
            <p className="text-muted-foreground mt-1">View and manage your center's profile details.</p>
          </div>
          <Button onClick={handleOpenEdit}>
            Edit Profile
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Center Information */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Center Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoItem icon={Building} label="Center Name" value={center.name} />
              <InfoItem icon={Building} label="Center Code" value={center.code} />
              <InfoItem icon={MapPin} label="Address" value={fullAddress} />
              <InfoItem icon={Phone} label="Phone" value={center.phone || ''} />
              <InfoItem icon={Mail} label="Email" value={center.email || ''} />
              <InfoItem icon={User} label="Contact Person" value={center.contact_person || ''} />
              <div className="pt-2">
                <Badge className={center.status === 'active' ? 'bg-success' : 'bg-muted-foreground'}>
                  {center.status || 'active'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* User Profile */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoItem icon={User} label="Full Name" value={profile?.full_name || user?.name || ''} />
              <InfoItem icon={Mail} label="Email" value={profile?.email || user?.email || ''} />
              <InfoItem icon={Phone} label="Phone" value={profile?.phone || ''} />
            </CardContent>
          </Card>
        </div>

        {/* Authorized Courses */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Authorized Courses
            </CardTitle>
            <CardDescription>
              Courses you are authorized to offer at this center.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authorizations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No courses authorized yet. Contact admin for authorization.
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Course</TableHead>
                      <TableHead>Kit Value</TableHead>
                      <TableHead>Exam Value</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {authorizations.map((auth: any) => (
                      <TableRow key={auth.id}>
                        <TableCell className="font-medium">{auth.course_name}</TableCell>
                        <TableCell>₹{Number(auth.kit_value || 0).toLocaleString()}</TableCell>
                        <TableCell>₹{Number(auth.exam_value || 0).toLocaleString()}</TableCell>
                        <TableCell>{auth.commission_percent || 0}%</TableCell>
                        <TableCell>
                          <Badge className={auth.status === 'active' ? 'bg-success' : 'bg-muted-foreground'}>
                            {auth.status}
                          </Badge>
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
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Update your center and personal profile details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div>
                <h4 className="font-medium mb-4">Center Details</h4>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Center Name</Label>
                    <Input
                      value={editableData.centerName}
                      onChange={(e) => setEditableData({ ...editableData, centerName: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Address</Label>
                    <Textarea
                      value={editableData.address}
                      onChange={(e) => setEditableData({ ...editableData, address: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label>City</Label>
                      <Input
                        value={editableData.city}
                        onChange={(e) => setEditableData({ ...editableData, city: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>State</Label>
                      <Input
                        value={editableData.state}
                        onChange={(e) => setEditableData({ ...editableData, state: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Pincode</Label>
                      <Input
                        value={editableData.pincode}
                        onChange={(e) => setEditableData({ ...editableData, pincode: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Contact Person</Label>
                      <Input
                        value={editableData.contactPerson}
                        onChange={(e) => setEditableData({ ...editableData, contactPerson: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Phone</Label>
                      <Input
                        value={editableData.phone}
                        onChange={(e) => setEditableData({ ...editableData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={editableData.email}
                      onChange={(e) => setEditableData({ ...editableData, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Your Profile</h4>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Full Name</Label>
                    <Input
                      value={editableData.profileName}
                      onChange={(e) => setEditableData({ ...editableData, profileName: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Phone</Label>
                    <Input
                      value={editableData.profilePhone}
                      onChange={(e) => setEditableData({ ...editableData, profilePhone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveChanges} disabled={updateCenter.isPending || updateProfile.isPending}>
                {(updateCenter.isPending || updateProfile.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CenterLayout>
  );
}
