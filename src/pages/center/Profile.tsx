import { useState } from 'react';
import { 
  Building,
  User,
  Users,
  Laptop,
  Presentation,
  MapPin,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  FileDown,
  Edit,
  BookOpen,
  Target,
  Plus,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CenterLayout from '@/layouts/CenterLayout';
import { toast } from 'sonner';

// Mock data for the center profile
const centerProfileData = {
  name: 'PBS Computer Education - City Center',
  address: '123, MG Road, Near Metro Station, Cityville, State, 400001',
  code: 'PBS-CC-01',
  owner: {
    name: 'Mr. Rajesh Kumar',
    contact: '+91 98765 43210',
    email: 'rajesh.k@pbscenter.com',
    photoUrl: 'https://i.pravatar.cc/150?u=rajeshkumar',
  },
  faculty: [
    { id: 1, name: 'Anjali Sharma', qualification: 'MCA', subjectExpertise: 'C, C++, Java' },
    { id: 2, name: 'Vikram Singh', qualification: 'B.Tech (CS)', subjectExpertise: 'Java, Python, Web Development' },
    { id: 3, name: 'Sunita Patil', qualification: 'B.Com', subjectExpertise: 'Tally, GST, Accounting' },
  ],
  infrastructure: [
    { id: 1, type: 'classroom', name: 'Classroom A', capacity: 25, pcs: 0, projectors: 1 },
    { id: 2, type: 'classroom', name: 'Classroom B', capacity: 25, pcs: 0, projectors: 1 },
    { id: 3, type: 'lab', name: 'Basic Lab', capacity: 20, pcs: 20, projectors: 1 },
    { id: 4, type: 'lab', name: 'Advanced Lab', capacity: 20, pcs: 20, projectors: 0 },
  ],
  // This part of the original data is now derived from the array above.
  // We'll keep it for the type definition but calculate it dynamically.
  infraSummary: {
    classrooms: 0, classroomCapacity: 0, labs: 0, pcs: 0, projectors: 0,
  },
  swot: {
    strengths: 'Experienced faculty, Prime location, Strong local reputation.',
    weaknesses: 'Limited marketing budget, Small classroom size.',
    opportunities: 'Growing demand for IT skills, Corporate training tie-ups.',
    threats: 'New competitors in the area, Online course platforms.',
  },
  authorizations: [
    { id: 1, name: 'IT Division', validity: '2025-12-31' },
    { id: 2, name: 'Vocational Division', validity: '2024-06-30' },
    { id: 3, name: 'Skill Development', validity: '2026-01-15' },
  ],
};

type InfraItem = typeof centerProfileData.infrastructure[0];

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | React.ReactNode }) => (
  <div className="flex items-start gap-3">
    <Icon className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  </div>
);

const StatCard = ({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) => (
  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
    <div className={`w-12 h-12 rounded-lg ${color}/10 flex items-center justify-center`}>
      <Icon className={`w-6 h-6 text-${color}`} />
    </div>
    <div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  </div>
);

export default function CenterProfile() {
  const [profileData, setProfileData] = useState(centerProfileData);
  const { owner, faculty, swot } = profileData;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  type ObjectSections = 'owner' | 'swot';

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    section?: ObjectSections,
    field?: string
  ) => {
    const { name, value } = e.target;
    if (section && field) {
      const sectionValue = editableProfile[section];
      if (typeof sectionValue === 'object' && sectionValue !== null && !Array.isArray(sectionValue)) {
        setEditableProfile(prev => ({ ...prev, [section]: { ...sectionValue, [field]: value } }));
      }
    } else {
      setEditableProfile(prev => ({ ...prev, [name]: value }));
    }
  };

  // Initialize editableProfile from the main profileData state
  // This ensures the dialog always opens with the latest data
  const [editableProfile, setEditableProfile] = useState(profileData);

  const handleFacultyChange = (index: number, field: 'name' | 'qualification' | 'subjectExpertise', value: string) => {
    const updatedFaculty = [...editableProfile.faculty];
    updatedFaculty[index] = { ...updatedFaculty[index], [field]: value };
    setEditableProfile(prev => ({ ...prev, faculty: updatedFaculty }));
  };

  const handleAddFaculty = () => {
    const newFaculty = { id: Date.now(), name: '', qualification: '', subjectExpertise: '' };
    setEditableProfile(prev => ({ ...prev, faculty: [...prev.faculty, newFaculty] }));
  };

  const handleRemoveFaculty = (id: number) => {
    setEditableProfile(prev => ({
      ...prev,
      faculty: prev.faculty.filter(member => member.id !== id)
    }));
  };

  const handleAddInfra = (type: 'classroom' | 'lab') => {
    const newItem: InfraItem = { id: Date.now(), type, name: '', capacity: 0, pcs: 0, projectors: 0 };
    setEditableProfile(prev => ({ ...prev, infrastructure: [...prev.infrastructure, newItem] }));
  };

  const handleRemoveInfra = (id: number) => {
    setEditableProfile(prev => ({
      ...prev,
      infrastructure: prev.infrastructure.filter(item => item.id !== id)
    }));
  };

  const handleInfraChange = (index: number, field: keyof Omit<InfraItem, 'id' | 'type'>, value: string) => {
    const updatedInfra = [...editableProfile.infrastructure];
    const numValue = value === '' ? 0 : parseInt(value, 10);
    const isNumberField = field !== 'name';
    updatedInfra[index] = { ...updatedInfra[index], [field]: isNumberField ? (isNaN(numValue) ? 0 : numValue) : value };
    setEditableProfile(prev => ({ ...prev, infrastructure: updatedInfra }));
  };

  const handleSaveChanges = () => {
    setProfileData(editableProfile); // Update the main view with the edited data
    toast.success('Profile updated successfully!');
    setIsEditDialogOpen(false);
  };

  const handleDownloadCertificate = (auth: { name: string; validity: string }) => {
    toast.info(`Generating certificate for ${auth.name}...`);

    // Safely escape user data to prevent XSS
    const escapeHtml = (text: string) => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    const safeCenterName = escapeHtml(profileData.name);
    const safeAuthName = escapeHtml(auth.name);
    const formattedDate = new Date(auth.validity).toLocaleDateString('en-GB', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authorization Certificate - ${safeAuthName}</title>
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          .certificate { border: 10px solid #003366; padding: 50px; text-align: center; background-color: #f0f8ff; min-height: 80vh; box-sizing: border-box; }
          h1 { color: #003366; font-size: 36px; margin-bottom: 20px; }
          .center-name { color: #d16002; font-size: 28px; margin: 20px 0; }
          .auth-name { color: #003366; font-size: 24px; margin: 20px 0; }
          p { font-size: 16px; margin: 10px 0; }
          .validity { font-size: 20px; font-weight: bold; margin-top: 10px; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="certificate">
          <h1>Certificate of Authorization</h1>
          <p>This is to certify that</p>
          <h2 class="center-name">${safeCenterName}</h2>
          <p>is an authorized center for</p>
          <h3 class="auth-name">${safeAuthName}</h3>
          <p>This authorization is valid until:</p>
          <p class="validity">${formattedDate}</p>
        </div>
      </body>
      </html>
    `;

    // Open print dialog in new window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } else {
      toast.error('Unable to open print dialog. Please allow popups for this site.');
    }
  };

  // Calculate infrastructure summary
  const infraSummary = profileData.infrastructure.reduce((acc, item) => {
    acc.pcs += item.pcs;
    acc.projectors += item.projectors;
    if (item.type === 'classroom') acc.classrooms += 1;
    if (item.type === 'lab') acc.labs += 1;
 return acc;
  }, { classrooms: 0, labs: 0, pcs: 0, projectors: 0, classroomCapacity: 25 }); // Assuming static capacity for now

  const isAnyAuthActive = profileData.authorizations.some(auth => new Date(auth.validity) > new Date());


  return (
    <CenterLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Center Profile & Infrastructure</h1>
            <p className="text-muted-foreground mt-1">View and manage your center's profile and infrastructure details.</p>
          </div>
          <div className="flex gap-3">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild onClick={() => setEditableProfile(profileData)}>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Center Profile</DialogTitle>
                  <DialogDescription>
                    Update the details for your center. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="center" className="mt-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="center">Center & Owner</TabsTrigger>
                    <TabsTrigger value="faculty">Faculty</TabsTrigger>
                    <TabsTrigger value="infra">Infrastructure</TabsTrigger>
                    <TabsTrigger value="swot">SWOT</TabsTrigger>
                  </TabsList>
                  <TabsContent value="center" className="space-y-4 mt-4">
                    <h3 className="font-semibold text-lg">Center Details</h3>
                    <div className="grid gap-2">
                      <Label>Center Name</Label>
                      <Input name="name" value={editableProfile.name} onChange={handleProfileChange} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Address</Label>
                      <Textarea name="address" value={editableProfile.address} onChange={handleProfileChange} />
                    </div>
                    <h3 className="font-semibold text-lg mt-6">Owner Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Owner Name</Label>
                        <Input name="name" value={editableProfile.owner.name} onChange={(e) => handleProfileChange(e, 'owner', 'name')} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Contact</Label>
                        <Input name="contact" value={editableProfile.owner.contact} onChange={(e) => handleProfileChange(e, 'owner', 'contact')} />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Email</Label>
                      <Input type="email" name="email" value={editableProfile.owner.email} onChange={(e) => handleProfileChange(e, 'owner', 'email')} />
                    </div>
                  </TabsContent>
                  <TabsContent value="faculty" className="space-y-4 mt-4">
                    {/* In a real app, this would be more dynamic */}
                    {editableProfile.faculty.map((member, index) => (
                      <div key={member.id} className="p-3 border rounded-lg space-y-2 relative">
                        <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => handleRemoveFaculty(member.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                        <div className="grid grid-cols-3 gap-2 pt-2">
                          <div className="grid gap-1">
                            <Label className="text-xs">Trainer Name</Label>
                            <Input value={member.name} onChange={(e) => handleFacultyChange(index, 'name', e.target.value)} />
                          </div>
                          <div className="grid gap-1">
                            <Label className="text-xs">Qualification</Label>
                            <Input value={member.qualification} onChange={(e) => handleFacultyChange(index, 'qualification', e.target.value)} />
                          </div>
                          <div className="grid gap-1">
                            <Label className="text-xs">Subject Expertise</Label>
                            <Input value={member.subjectExpertise} onChange={(e) => handleFacultyChange(index, 'subjectExpertise', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full" onClick={handleAddFaculty}><Plus className="w-4 h-4 mr-2" />Add New Faculty</Button>
                  </TabsContent>
                  <TabsContent value="infra" className="space-y-4 mt-4">
                    {editableProfile.infrastructure.map((item, index) => (
                      <div key={item.id} className="p-3 border rounded-lg space-y-2 relative">
                        <Badge variant="secondary" className="capitalize absolute -top-2.5 left-2">{item.type}</Badge>
                        <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => handleRemoveInfra(item.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                        <div className="grid grid-cols-4 gap-2 pt-2">
                          <div className="grid gap-1 col-span-2">
                            <Label className="text-xs">Name</Label>
                            <Input placeholder={`${item.type} name`} value={item.name} onChange={(e) => handleInfraChange(index, 'name', e.target.value)} />
                          </div>
                          <div className="grid gap-1">
                            <Label className="text-xs">Capacity</Label>
                            <Input type="number" placeholder="0" value={item.capacity || ''} onChange={(e) => handleInfraChange(index, 'capacity', e.target.value)} />
                          </div>
                          <div className="grid gap-1">
                            <Label className="text-xs">PCs</Label>
                            <Input type="number" placeholder="0" value={item.pcs || ''} onChange={(e) => handleInfraChange(index, 'pcs', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Infra
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-56">
                          <DropdownMenuItem onClick={() => handleAddInfra('classroom')}>Add Classroom</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAddInfra('lab')}>Add Lab</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TabsContent>
                  <TabsContent value="swot" className="space-y-4 mt-4">
                    <div className="grid gap-2">
                      <Label className="text-success">Strengths</Label>
                      <Textarea name="strengths" value={editableProfile.swot.strengths} onChange={(e) => handleProfileChange(e, 'swot', 'strengths')} />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-destructive">Weaknesses</Label>
                      <Textarea name="weaknesses" value={editableProfile.swot.weaknesses} onChange={(e) => handleProfileChange(e, 'swot', 'weaknesses')} />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-info">Opportunities</Label>
                      <Textarea name="opportunities" value={editableProfile.swot.opportunities} onChange={(e) => handleProfileChange(e, 'swot', 'opportunities')} />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-warning">Threats</Label>
                      <Textarea name="threats" value={editableProfile.swot.threats} onChange={(e) => handleProfileChange(e, 'swot', 'threats')} />
                    </div>
                  </TabsContent>
                </Tabs>
                <DialogFooter className="mt-6">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveChanges}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column: Center & Owner Profile */}
          <div className="lg:col-span-1 space-y-8">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading">
                  <Building className="w-5 h-5 text-primary" />
                  Center Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h2 className="text-xl font-semibold">{profileData.name}</h2>
                <InfoItem icon={MapPin} label="Address" value={profileData.address} />
                <InfoItem icon={ShieldCheck} label="Center Code" value={profileData.code} />
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Authorizations</p>
                      <div className="space-y-2 mt-2">
                        {profileData.authorizations.map(auth => (
                          <div key={auth.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                            <div>
                              <p className="font-medium">{auth.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Valid until: {new Date(auth.validity).toLocaleDateString()}
                              </p>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => handleDownloadCertificate(auth)}>
                              <FileDown className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading">
                  <User className="w-5 h-5 text-primary" />
                  Owner Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={owner.photoUrl} alt={owner.name} />
                    <AvatarFallback>{owner.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold">{owner.name}</h2>
                </div>
                <InfoItem icon={Phone} label="Contact" value={owner.contact} />
                <InfoItem icon={Mail} label="Email" value={owner.email} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Faculty, Infra, SWOT */}
          <div className="xl:col-span-2 space-y-8">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading">
                  <Users className="w-5 h-5 text-primary" />
                  Faculty / Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Trainer Name</TableHead>
                        <TableHead>Qualification</TableHead>
                        <TableHead>Subject Expertise</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {faculty.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">{member.name}</TableCell>
                          <TableCell>{member.qualification}</TableCell>
                          <TableCell>{member.subjectExpertise}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading">
                  <Laptop className="w-5 h-5 text-primary" />
                  Infrastructure
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={BookOpen} label="Classrooms" value={infraSummary.classrooms} color="primary" />
                <StatCard icon={Users} label="Labs" value={infraSummary.labs} color="info" />
                <StatCard icon={Laptop} label="Total PCs" value={infraSummary.pcs} color="success" />
                <StatCard icon={Presentation} label="Projectors" value={infraSummary.projectors} color="warning" />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading">
                  <Target className="w-5 h-5 text-primary" />
                  SWOT Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-success">Strengths</Label>
                  <Textarea readOnly value={swot.strengths} className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-destructive">Weaknesses</Label>
                  <Textarea readOnly value={swot.weaknesses} className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-info">Opportunities</Label>
                  <Textarea readOnly value={swot.opportunities} className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-warning">Threats</Label>
                  <Textarea readOnly value={swot.threats} className="bg-muted/50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CenterLayout>
  );
}
