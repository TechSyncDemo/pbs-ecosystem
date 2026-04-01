import { useState } from 'react';
import {
  Building,
  User,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Loader2,
  ChevronDown,
  ChevronRight,
  Star,
  Lock,
  FileDown,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import CenterLayout from '@/layouts/CenterLayout';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateCenter } from '@/hooks/useCenters';
import { useCenterAuthorizations } from '@/hooks/useCenterCourses';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateAuthorityCertificate } from '@/lib/generateAuthorityCertificate';
import { format, differenceInDays, parseISO } from 'date-fns';

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

  const { data: allCenters = [], isLoading: centersLoading } = useQuery({
    queryKey: ['my-center', centerId],
    queryFn: async () => {
      if (!centerId) return [];
      const { data, error } = await supabase
        .from('centers')
        .select('*')
        .eq('id', centerId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!centerId,
  });
  const center = allCenters[0];

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

  const { data: authorizations = [] } = useCenterAuthorizations(centerId);

  // Group authorizations by their parent authorization category
  const { data: groupedAuthorizations = [], isLoading: groupedLoading } = useQuery({
    queryKey: ['center-authorizations-grouped', centerId],
    queryFn: async () => {
      if (!centerId) return [];
      
      // Fetch center_courses with course + authorization info
      const { data, error } = await supabase
        .from('center_courses')
        .select(`
          *,
          courses(name, code, fee, duration_months, loyalty_points, authorization_id, authorizations(id, name, code))
        `)
        .eq('center_id', centerId);

      if (error) throw error;

      // Group by authorization
      const groupMap: Record<string, { authName: string; authCode: string; courses: any[] }> = {};
      
      for (const cc of (data || [])) {
        const course = cc.courses as any;
        const auth = course?.authorizations;
        const authId = auth?.id || 'uncategorized';
        const authName = auth?.name || 'Other';
        const authCode = auth?.code || '';

        if (!groupMap[authId]) {
          groupMap[authId] = { authName, authCode, courses: [] };
        }
        groupMap[authId].courses.push({
          ...cc,
          course_name: course?.name,
          course_code: course?.code,
          course_fee: course?.fee,
          course_duration: course?.duration_months,
          loyalty_points: course?.loyalty_points,
        });
      }

      return Object.entries(groupMap).map(([id, group]) => ({
        id,
        ...group,
      }));
    },
    enabled: !!centerId,
  });

  const updateCenter = useUpdateCenter();

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
    address: '',
    city: '',
    state: '',
    pincode: '',
    contactPerson: '',
    phone: '',
    profileName: '',
    profilePhone: '',
  });

  const handleOpenEdit = () => {
    setEditableData({
      address: center?.address || '',
      city: center?.city || '',
      state: center?.state || '',
      pincode: center?.pincode || '',
      contactPerson: center?.contact_person || '',
      phone: center?.phone || '',
      profileName: profile?.full_name || '',
      profilePhone: profile?.phone || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveChanges = async () => {
    if (centerId) {
      await updateCenter.mutateAsync({
        id: centerId,
        address: editableData.address,
        city: editableData.city,
        state: editableData.state,
        pincode: editableData.pincode,
        contact_person: editableData.contactPerson,
        phone: editableData.phone,
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
              <InfoItem icon={Star} label="Loyalty Points" value={
                <span className="text-amber-500 font-bold">{center.loyalty_points || 0} pts</span>
              } />
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

        {/* Authorizations */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Authorizations
            </CardTitle>
            <CardDescription>
              Your authorized specializations, validity and earned points.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {groupedAuthorizations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No authorizations assigned yet. Contact admin for authorization.
              </div>
            ) : (
              <div className="space-y-3">
                {groupedAuthorizations.map((group) => {
                  // Calculate validity from first course in group
                  const firstCourse = group.courses[0];
                  const validFrom = firstCourse?.valid_from;
                  const validUntil = firstCourse?.valid_until;
                  const daysLeft = validUntil ? differenceInDays(parseISO(validUntil), new Date()) : null;
                  const totalPoints = group.courses.reduce((sum: number, c: any) => sum + (c.loyalty_points || 0), 0);

                  return (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <ShieldCheck className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{group.authName}</p>
                          <p className="text-sm text-muted-foreground">{group.authCode}</p>
                          {validFrom && validUntil && (
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {format(parseISO(validFrom), 'dd MMM yyyy')} — {format(parseISO(validUntil), 'dd MMM yyyy')}
                              </span>
                              {daysLeft !== null && (
                                daysLeft < 0
                                  ? <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Expired</Badge>
                                  : daysLeft <= 30
                                    ? <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-warning text-warning"><AlertTriangle className="w-2.5 h-2.5 mr-0.5" />{daysLeft}d left</Badge>
                                    : <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-success text-success">{daysLeft}d left</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {totalPoints > 0 && (
                          <Badge variant="outline" className="border-amber-500/30 text-amber-500">
                            <Star className="w-3 h-3 mr-1" />
                            {totalPoints} pts
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => {
                            generateAuthorityCertificate({
                              authorizationName: group.authName,
                              authorizationCode: group.authCode,
                              centerName: center?.name || '',
                              centerCode: center?.code || '',
                              centerAddress: [center?.address, center?.city, center?.state, center?.pincode].filter(Boolean).join(', '),
                              courseName: group.authName,
                              courseCode: group.authCode,
                              validFrom: validFrom ? format(parseISO(validFrom), 'dd MMM yyyy') : 'N/A',
                              validUntil: validUntil ? format(parseISO(validUntil), 'dd MMM yyyy') : 'N/A',
                              certificateNo: firstCourse?.certificate_no || group.id.slice(0, 8).toUpperCase(),
                            });
                          }}
                        >
                          <FileDown className="w-3.5 h-3.5 mr-1" />
                          Certificate
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog — name & email are read-only */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Update your center and personal profile details. Name and email cannot be changed.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div>
                <h4 className="font-medium mb-4">Center Details</h4>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-1">
                      Center Name
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    </Label>
                    <Input value={center?.name || ''} disabled className="bg-muted" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-1">
                      Email
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    </Label>
                    <Input value={center?.email || ''} disabled className="bg-muted" />
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
