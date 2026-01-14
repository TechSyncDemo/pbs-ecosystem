import { useState, useEffect } from 'react';
import {
  Building,
  Bell,
  User,
  Save,
  IndianRupeeIcon,
  Loader2,
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppSettings, useBatchUpdateSettings } from '@/hooks/useAppSettings';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function AdminSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settingsData, isLoading: settingsLoading } = useAppSettings();
  const batchUpdateSettings = useBatchUpdateSettings();

  // Fetch admin profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['admin-profile', user?.id],
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
      queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
      toast.success('Profile updated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + error.message);
    },
  });

  const [generalSettings, setGeneralSettings] = useState({
    appName: 'PBS Ecosystem',
    adminEmail: '',
    supportContact: '',
  });

  const [financialSettings, setFinancialSettings] = useState({
    defaultCommission: 15,
    gstNumber: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    newCenterRegistration: true,
    orderPaymentReceived: true,
    resultDeclared: true,
    newSupportTicket: true,
  });

  const [profileSettings, setProfileSettings] = useState({
    fullName: '',
    email: '',
  });

  // Load settings from database
  useEffect(() => {
    if (settingsData?.grouped) {
      const s = settingsData.grouped;
      setGeneralSettings({
        appName: (s.app_name as string) || 'PBS Ecosystem',
        adminEmail: (s.admin_email as string) || '',
        supportContact: (s.support_contact as string) || '',
      });
      setFinancialSettings({
        defaultCommission: (s.default_commission as number) || 15,
        gstNumber: (s.gst_number as string) || '',
      });
      setNotificationSettings({
        newCenterRegistration: s.notify_new_center !== false,
        orderPaymentReceived: s.notify_order_payment !== false,
        resultDeclared: s.notify_result !== false,
        newSupportTicket: s.notify_support_ticket !== false,
      });
    }
  }, [settingsData]);

  useEffect(() => {
    if (profile) {
      setProfileSettings({
        fullName: profile.full_name || '',
        email: profile.email || '',
      });
    }
  }, [profile]);

  const handleSaveGeneral = async () => {
    await batchUpdateSettings.mutateAsync([
      { key: 'app_name', value: generalSettings.appName, category: 'general' },
      { key: 'admin_email', value: generalSettings.adminEmail, category: 'general' },
      { key: 'support_contact', value: generalSettings.supportContact, category: 'general' },
    ]);
  };

  const handleSaveFinancial = async () => {
    await batchUpdateSettings.mutateAsync([
      { key: 'default_commission', value: financialSettings.defaultCommission, category: 'financial' },
      { key: 'gst_number', value: financialSettings.gstNumber, category: 'financial' },
    ]);
  };

  const handleSaveNotifications = async () => {
    await batchUpdateSettings.mutateAsync([
      { key: 'notify_new_center', value: notificationSettings.newCenterRegistration, category: 'notifications' },
      { key: 'notify_order_payment', value: notificationSettings.orderPaymentReceived, category: 'notifications' },
      { key: 'notify_result', value: notificationSettings.resultDeclared, category: 'notifications' },
      { key: 'notify_support_ticket', value: notificationSettings.newSupportTicket, category: 'notifications' },
    ]);
  };

  const handleSaveProfile = async () => {
    await updateProfile.mutateAsync({
      full_name: profileSettings.fullName,
    });
  };

  const isLoading = settingsLoading || profileLoading;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your application's configuration and preferences.</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general"><Building className="w-4 h-4 mr-2" />General</TabsTrigger>
            <TabsTrigger value="financial"><IndianRupeeIcon className="w-4 h-4 mr-2" />Financial</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-2" />Notifications</TabsTrigger>
            <TabsTrigger value="profile"><User className="w-4 h-4 mr-2" />Profile</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="mt-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Update your application's basic information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-2">
                  <Label>Application Name</Label>
                  <Input
                    value={generalSettings.appName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, appName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <Label>Admin Email</Label>
                    <Input
                      type="email"
                      value={generalSettings.adminEmail}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, adminEmail: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Support Contact</Label>
                    <Input
                      value={generalSettings.supportContact}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, supportContact: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
              <CardHeader className="border-t pt-6">
                <Button onClick={handleSaveGeneral} disabled={batchUpdateSettings.isPending}>
                  {batchUpdateSettings.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  Save General Settings
                </Button>
              </CardHeader>
            </Card>
          </TabsContent>

          {/* Financial Settings */}
          <TabsContent value="financial" className="mt-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle>Financial Settings</CardTitle>
                <CardDescription>Configure default financial parameters.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <Label>Default Commission Rate (%)</Label>
                    <Input
                      type="number"
                      value={financialSettings.defaultCommission}
                      onChange={(e) => setFinancialSettings({ ...financialSettings, defaultCommission: Number(e.target.value) })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>GST Number</Label>
                    <Input
                      value={financialSettings.gstNumber}
                      onChange={(e) => setFinancialSettings({ ...financialSettings, gstNumber: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
              <CardHeader className="border-t pt-6">
                <Button onClick={handleSaveFinancial} disabled={batchUpdateSettings.isPending}>
                  {batchUpdateSettings.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  Save Financial Settings
                </Button>
              </CardHeader>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="mt-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Enable or disable automatic notifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label>New Center Registration</Label>
                    <p className="text-xs text-muted-foreground">Notify when a new center signs up.</p>
                  </div>
                  <Switch
                    checked={notificationSettings.newCenterRegistration}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, newCenterRegistration: checked })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label>Order Payment Received</Label>
                    <p className="text-xs text-muted-foreground">Notify when a center makes a payment for an order.</p>
                  </div>
                  <Switch
                    checked={notificationSettings.orderPaymentReceived}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, orderPaymentReceived: checked })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label>Result Declared</Label>
                    <p className="text-xs text-muted-foreground">Notify students when their results are declared.</p>
                  </div>
                  <Switch
                    checked={notificationSettings.resultDeclared}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, resultDeclared: checked })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label>New Support Ticket</Label>
                    <p className="text-xs text-muted-foreground">Notify when a center raises a new support ticket.</p>
                  </div>
                  <Switch
                    checked={notificationSettings.newSupportTicket}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, newSupportTicket: checked })}
                  />
                </div>
              </CardContent>
              <CardHeader className="border-t pt-6">
                <Button onClick={handleSaveNotifications} disabled={batchUpdateSettings.isPending}>
                  {batchUpdateSettings.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  Save Notification Settings
                </Button>
              </CardHeader>
            </Card>
          </TabsContent>

          {/* Profile Settings */}
          <TabsContent value="profile" className="mt-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your personal admin account details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-2">
                  <Label>Full Name</Label>
                  <Input
                    value={profileSettings.fullName}
                    onChange={(e) => setProfileSettings({ ...profileSettings, fullName: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input type="email" value={profileSettings.email} readOnly className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                </div>
              </CardContent>
              <CardHeader className="border-t pt-6">
                <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                  {updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  Update Profile
                </Button>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
