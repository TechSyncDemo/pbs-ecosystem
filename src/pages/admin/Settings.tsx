import { useState } from 'react';
import {
  Settings,
  Building,
  DollarSign,
  Bell,
  User,
  Save,
  Upload,
  IndianRupeeIcon,
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// Mock initial settings data
const mockSettings = {
  general: {
    appName: 'PBS Ecosystem',
    logoUrl: '/logo.png',
    adminEmail: 'admin@pbsecosystem.com',
    supportContact: '+91 12345 67890',
  },
  financial: {
    defaultCommission: 15,
    gstNumber: '27ABCDE1234F1Z5',
  },
  notifications: {
    newCenterRegistration: true,
    orderPaymentReceived: true,
    resultDeclared: true,
    newSupportTicket: true,
  },
};

export default function AdminSettings() {
  const [settings, setSettings] = useState(mockSettings);

  const handleSave = (section: string) => {
    toast.success(`${section} settings saved successfully!`);
    // In a real app, you would make an API call here to persist the settings.
  };

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
                  <Input defaultValue={settings.general.appName} />
                </div>
                <div className="grid gap-2">
                  <Label>Application Logo</Label>
                  <div className="flex items-center gap-4">
                    <img src={settings.general.logoUrl} alt="Logo" className="h-12 w-12 rounded-md bg-muted p-1" />
                    <Button variant="outline"><Upload className="w-4 h-4 mr-2" />Upload New Logo</Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <Label>Admin Email</Label>
                    <Input type="email" defaultValue={settings.general.adminEmail} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Support Contact</Label>
                    <Input defaultValue={settings.general.supportContact} />
                  </div>
                </div>
              </CardContent>
              <CardHeader className="border-t pt-6">
                <Button onClick={() => handleSave('General')}><Save className="w-4 h-4 mr-2" />Save General Settings</Button>
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
                    <Input type="number" defaultValue={settings.financial.defaultCommission} />
                  </div>
                  <div className="grid gap-2">
                    <Label>GST Number</Label>
                    <Input defaultValue={settings.financial.gstNumber} />
                  </div>
                </div>
              </CardContent>
              <CardHeader className="border-t pt-6">
                <Button onClick={() => handleSave('Financial')}><Save className="w-4 h-4 mr-2" />Save Financial Settings</Button>
              </CardHeader>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="mt-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Enable or disable automatic email/SMS notifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label>New Center Registration</Label>
                    <p className="text-xs text-muted-foreground">Notify when a new center signs up.</p>
                  </div>
                  <Switch defaultChecked={settings.notifications.newCenterRegistration} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label>Order Payment Received</Label>
                    <p className="text-xs text-muted-foreground">Notify when a center makes a payment for an order.</p>
                  </div>
                  <Switch defaultChecked={settings.notifications.orderPaymentReceived} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label>Result Declared</Label>
                    <p className="text-xs text-muted-foreground">Notify students when their results are declared.</p>
                  </div>
                  <Switch defaultChecked={settings.notifications.resultDeclared} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label>New Support Ticket</Label>
                    <p className="text-xs text-muted-foreground">Notify when a center raises a new support ticket.</p>
                  </div>
                  <Switch defaultChecked={settings.notifications.newSupportTicket} />
                </div>
              </CardContent>
              <CardHeader className="border-t pt-6">
                <Button onClick={() => handleSave('Notification')}><Save className="w-4 h-4 mr-2" />Save Notification Settings</Button>
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
                  <Input defaultValue="Super Admin" />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input type="email" defaultValue="superadmin@pbsecosystem.com" readOnly />
                </div>
                <h4 className="font-medium pt-4 border-t">Change Password</h4>
                <div className="grid gap-2">
                  <Label>Current Password</Label>
                  <Input type="password" />
                </div>
                <div className="grid gap-2">
                  <Label>New Password</Label>
                  <Input type="password" />
                </div>
                <div className="grid gap-2">
                  <Label>Confirm New Password</Label>
                  <Input type="password" />
                </div>
              </CardContent>
              <CardHeader className="border-t pt-6">
                <Button onClick={() => handleSave('Profile')}><Save className="w-4 h-4 mr-2" />Update Profile</Button>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}