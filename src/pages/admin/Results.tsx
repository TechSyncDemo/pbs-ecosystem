import { useState } from 'react';
import {
  Award,
  FileText,
  Printer,
  Filter,
  Search,
  QrCode,
  Check,
  Mail,
  Building,
  Calendar,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// Mock Data
const mockPendingResults = [
  {
    id: 'STU-001',
    name: 'Amit Sharma',
    centerName: 'PBS Computer Education - City Center',
    courseName: 'Certificate in Tally Prime',
    examDate: '2024-05-15',
    marksObtained: 78,
    totalMarks: 100,
    status: 'Pending Declaration',
    graceMarks: 0,
  },
  {
    id: 'STU-002',
    name: 'Priya Gupta',
    centerName: 'Vocational Skills Institute - Suburb',
    courseName: 'Web Development Fundamentals',
    examDate: '2024-05-14',
    marksObtained: 88,
    totalMarks: 100,
    status: 'Pending Declaration',
    graceMarks: 0,
  },
  {
    id: 'STU-003',
    name: 'Rohan Mehra',
    centerName: 'PBS Computer Education - City Center',
    courseName: 'Certificate in Tally Prime',
    examDate: '2024-05-15',
    marksObtained: 65,
    totalMarks: 100,
    status: 'Pending Declaration',
    graceMarks: 0,
  },
];

const mockDeclaredResults = [
  { id: 'STU-004', name: 'Sunita Patil', centerName: 'Tech Learners Hub - North', courseName: 'Advanced Computer Applications', resultDate: '2024-05-10' },
  { id: 'STU-005', name: 'Vikram Singh', centerName: 'PBS Computer Education - City Center', courseName: 'Diploma in Digital Marketing', resultDate: '2024-05-12' },
];

const mockCenters = [
  { id: 'all', name: 'All Centers' },
  { id: 'C-001', name: 'PBS Computer Education - City Center' },
  { id: 'C-002', name: 'Vocational Skills Institute - Suburb' },
  { id: 'C-003', name: 'Tech Learners Hub - North' },
];

export default function AdminResults() {
  const [pendingResults, setPendingResults] = useState(mockPendingResults);
  const [selectedForDeclaration, setSelectedForDeclaration] = useState<string[]>([]);
  const [selectedForPrinting, setSelectedForPrinting] = useState<string[]>([]);
  const [declarationFilters, setDeclarationFilters] = useState({ center: 'all', startDate: '', endDate: '' });


  const handleGraceMarksChange = (studentId: string, marks: number) => {
    setPendingResults(prev =>
      prev.map(student =>
        student.id === studentId ? { ...student, graceMarks: marks } : student
      )
    );
  };

  const handleDeclareResult = (studentId: string) => {
    setPendingResults(prev =>
      prev.map(student =>
        student.id === studentId ? { ...student, status: 'Declared' } : student
      )
    );
    const student = pendingResults.find(s => s.id === studentId);
    toast.success(`Result declared for ${student?.name}`, {
      description: 'SMS/Email notification has been sent.',
    });
  };

  const handleDeclareSelected = () => {
    if (selectedForDeclaration.length === 0) {
      toast.error('No students selected for declaration.');
      return;
    }
    setPendingResults(prev =>
      prev.map(student =>
        selectedForDeclaration.includes(student.id) ? { ...student, status: 'Declared' } : student
      )
    );
    toast.success(`${selectedForDeclaration.length} results declared successfully!`);
    setSelectedForDeclaration([]);
  };

  const handlePrintMarksheets = () => {
    if (selectedForPrinting.length === 0) {
      toast.error('Please select at least one student to print marksheets.');
      return;
    }
    toast.info(`Generating bulk marksheet PDF for ${selectedForPrinting.length} students...`);
    // PDF generation logic would go here
  };

  const handlePrintCertificates = () => {
    if (selectedForPrinting.length === 0) {
      toast.error('Please select at least one student to print certificates.');
      return;
    }
    toast.info(`Generating bulk PDF for ${selectedForPrinting.length} certificates...`, {
      description: 'The download will begin shortly.',
    });
    // In a real app, you would trigger a PDF generation API here.
  };

  const togglePrintSelection = (studentId: string) => {
    setSelectedForPrinting(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleDeclareSelection = (studentId: string) => {
    setSelectedForDeclaration(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const filteredPendingResults = pendingResults.filter(student => {
    const centerMatch = declarationFilters.center === 'all' || student.centerName === mockCenters.find(c => c.id === declarationFilters.center)?.name;
    const startDateMatch = !declarationFilters.startDate || new Date(student.examDate) >= new Date(declarationFilters.startDate);
    const endDateMatch = !declarationFilters.endDate || new Date(student.examDate) <= new Date(declarationFilters.endDate);
    return centerMatch && startDateMatch && endDateMatch;
  });

  const handleDeclarationFilterChange = (filterName: 'center' | 'startDate' | 'endDate', value: string) => {
    setDeclarationFilters(prev => ({
      ...prev,
      [filterName]: value,
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Result & Certificate Management</h1>
          <p className="text-muted-foreground mt-1">Declare results and manage the certificate printing queue.</p>
        </div>

        <Tabs defaultValue="declaration">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="declaration"><Award className="w-4 h-4 mr-2" />Result Declaration</TabsTrigger>
            <TabsTrigger value="printing"><Printer className="w-4 h-4 mr-2" />Certificate Printing Queue</TabsTrigger>
          </TabsList>

          {/* Result Declaration Tab */}
          <TabsContent value="declaration" className="mt-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Pending Results</CardTitle>
                    <CardDescription>Review marks, add grace marks if necessary, and declare results.</CardDescription>
                  </div>
                  <Button onClick={handleDeclareSelected} disabled={selectedForDeclaration.length === 0}>
                    <Mail className="w-4 h-4 mr-2" />
                    Declare ({selectedForDeclaration.length}) Selected
                  </Button>
                </div>
                <div className="flex flex-wrap items-end gap-4 pt-4">
                  <div className="grid gap-2">
                    <Label>Center</Label>
                    <Select value={declarationFilters.center} onValueChange={(value) => handleDeclarationFilterChange('center', value)}>
                      <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {mockCenters.map(center => (
                          <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>From Date</Label>
                    <Input type="date" className="w-full sm:w-40" value={declarationFilters.startDate} onChange={(e) => handleDeclarationFilterChange('startDate', e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>To Date</Label>
                    <Input type="date" className="w-full sm:w-40" value={declarationFilters.endDate} onChange={(e) => handleDeclarationFilterChange('endDate', e.target.value)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedForDeclaration.length > 0 && selectedForDeclaration.length === filteredPendingResults.filter(s => s.status === 'Pending Declaration').length}
                            onCheckedChange={(checked) => {
                              const pendingIds = filteredPendingResults.filter(s => s.status === 'Pending Declaration').map(s => s.id);
                              setSelectedForDeclaration(checked ? pendingIds : []);
                            }}
                          />
                        </TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead>Grace Marks</TableHead>
                        <TableHead>Final Marks</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPendingResults.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            {student.status === 'Pending Declaration' && (
                              <Checkbox
                                checked={selectedForDeclaration.includes(student.id)}
                                onCheckedChange={() => toggleDeclareSelection(student.id)}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">{student.centerName}</p>
                          </TableCell>
                          <TableCell>{student.courseName}</TableCell>
                          <TableCell>{student.marksObtained} / {student.totalMarks}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              className="w-20 h-8"
                              value={student.graceMarks}
                              onChange={(e) => handleGraceMarksChange(student.id, parseInt(e.target.value) || 0)}
                              disabled={student.status === 'Declared'}
                            />
                          </TableCell>
                          <TableCell className="font-bold">{student.marksObtained + student.graceMarks}</TableCell>
                          <TableCell>
                            {student.status === 'Pending Declaration' ? (
                              <Button size="sm" onClick={() => handleDeclareResult(student.id)}>
                                <Mail className="w-4 h-4 mr-2" />Declare
                              </Button>
                            ) : (
                              <div className="flex items-center text-success font-medium">
                                <Check className="w-4 h-4 mr-2" /> Declared
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certificate Printing Queue Tab */}
          <TabsContent value="printing" className="mt-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Certificate Printing Queue</CardTitle>
                    <CardDescription>Generate bulk PDFs for students with declared results.</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <Select defaultValue="all">
                        <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {mockCenters.map(center => (
                            <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <Input type="date" className="w-full sm:w-40" />
                      <span className="mx-2">to</span>
                      <Input type="date" className="w-full sm:w-40" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end gap-2 mb-4">
                  <Button variant="outline" onClick={handlePrintMarksheets} disabled={selectedForPrinting.length === 0}>
                    <FileText className="w-4 h-4 mr-2" />
                    Print Marksheet ({selectedForPrinting.length})
                  </Button>
                  <Button onClick={handlePrintCertificates} disabled={selectedForPrinting.length === 0}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print Certificate ({selectedForPrinting.length})
                  </Button>
                </div>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-12">
                          <Checkbox
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedForPrinting(mockDeclaredResults.map(s => s.id));
                              } else {
                                setSelectedForPrinting([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Result Date</TableHead>
                        <TableHead>Verification</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockDeclaredResults.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedForPrinting.includes(student.id)}
                              onCheckedChange={() => togglePrintSelection(student.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">{student.centerName}</p>
                          </TableCell>
                          <TableCell>{student.courseName}</TableCell>
                          <TableCell>{new Date(student.resultDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <QrCode className="w-4 h-4" />
                              <span>Enabled</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}