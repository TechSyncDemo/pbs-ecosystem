import { useMemo, useState } from 'react';
import {
  Award,
  FileText,
  Printer,
  QrCode,
  Check,
  Mail,
  Building,
  Calendar,
  Plus,
  Loader2,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  usePendingResults,
  useDeclaredResults,
  useUpdateGraceMarks,
  useDeclareResults,
  useAddResult,
  useStudentsForResults,
} from '@/hooks/useResults';
import { useCenters } from '@/hooks/useCenters';

export default function AdminResults() {
  const { data: pendingResults = [], isLoading: pendingLoading } = usePendingResults();
  const { data: declaredResults = [], isLoading: declaredLoading } = useDeclaredResults();
  const { data: centers = [] } = useCenters();
  const updateGrace = useUpdateGraceMarks();
  const declareResults = useDeclareResults();
  const addResult = useAddResult();

  const [selectedForDeclaration, setSelectedForDeclaration] = useState<string[]>([]);
  const [selectedForPrinting, setSelectedForPrinting] = useState<string[]>([]);
  const [declarationFilters, setDeclarationFilters] = useState({ center: 'all', startDate: '', endDate: '' });
  const [printingFilters, setPrintingFilters] = useState({ center: 'all', startDate: '', endDate: '' });
  const [graceDraft, setGraceDraft] = useState<Record<string, number>>({});
  const [addOpen, setAddOpen] = useState(false);

  const handleGraceMarksChange = (id: string, marks: number) => {
    setGraceDraft((prev) => ({ ...prev, [id]: marks }));
  };

  const commitGrace = (id: string, original: number) => {
    const next = graceDraft[id];
    if (next === undefined || next === original) return;
    updateGrace.mutate({ id, grace_marks: next });
  };

  const handleDeclareSelected = () => {
    if (selectedForDeclaration.length === 0) {
      toast.error('No students selected for declaration.');
      return;
    }
    declareResults.mutate(selectedForDeclaration, {
      onSuccess: () => setSelectedForDeclaration([]),
    });
  };

  const handleDeclareOne = (id: string) => {
    declareResults.mutate([id]);
  };

  const handlePrintMarksheets = () => {
    if (selectedForPrinting.length === 0) {
      toast.error('Please select at least one student to print marksheets.');
      return;
    }
    toast.info(`Generating bulk marksheet PDF for ${selectedForPrinting.length} students...`);
  };

  const handlePrintCertificates = () => {
    if (selectedForPrinting.length === 0) {
      toast.error('Please select at least one student to print certificates.');
      return;
    }
    toast.info(`Generating bulk PDF for ${selectedForPrinting.length} certificates...`);
  };

  const togglePrintSelection = (id: string) => {
    setSelectedForPrinting((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleDeclareSelection = (id: string) => {
    setSelectedForDeclaration((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filteredPendingResults = useMemo(() => {
    return pendingResults.filter((r) => {
      const centerMatch =
        declarationFilters.center === 'all' || r.students?.center_id === declarationFilters.center;
      const startMatch =
        !declarationFilters.startDate || new Date(r.exam_date) >= new Date(declarationFilters.startDate);
      const endMatch =
        !declarationFilters.endDate || new Date(r.exam_date) <= new Date(declarationFilters.endDate);
      return centerMatch && startMatch && endMatch;
    });
  }, [pendingResults, declarationFilters]);

  const filteredDeclaredResults = useMemo(() => {
    return declaredResults.filter((r) => {
      const centerMatch =
        printingFilters.center === 'all' || r.students?.center_id === printingFilters.center;
      const date = r.result_date ? new Date(r.result_date) : null;
      const startMatch =
        !printingFilters.startDate || (date && date >= new Date(printingFilters.startDate));
      const endMatch =
        !printingFilters.endDate || (date && date <= new Date(printingFilters.endDate));
      return centerMatch && startMatch && endMatch;
    });
  }, [declaredResults, printingFilters]);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Result & Certificate Management</h1>
            <p className="text-muted-foreground mt-1">Declare results and manage the certificate printing queue.</p>
          </div>
          <AddResultDialog open={addOpen} onOpenChange={setAddOpen} onSubmit={(payload) => addResult.mutate(payload, { onSuccess: () => setAddOpen(false) })} submitting={addResult.isPending} />
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
                  <Button onClick={handleDeclareSelected} disabled={selectedForDeclaration.length === 0 || declareResults.isPending}>
                    {declareResults.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                    Declare ({selectedForDeclaration.length}) Selected
                  </Button>
                </div>
                <div className="flex flex-wrap items-end gap-4 pt-4">
                  <div className="grid gap-2">
                    <Label>Center</Label>
                    <Select value={declarationFilters.center} onValueChange={(v) => setDeclarationFilters((p) => ({ ...p, center: v }))}>
                      <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Centers</SelectItem>
                        {centers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>From Date</Label>
                    <Input type="date" className="w-full sm:w-40" value={declarationFilters.startDate} onChange={(e) => setDeclarationFilters((p) => ({ ...p, startDate: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>To Date</Label>
                    <Input type="date" className="w-full sm:w-40" value={declarationFilters.endDate} onChange={(e) => setDeclarationFilters((p) => ({ ...p, endDate: e.target.value }))} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedForDeclaration.length > 0 && selectedForDeclaration.length === filteredPendingResults.length}
                            onCheckedChange={(checked) => {
                              setSelectedForDeclaration(checked ? filteredPendingResults.map((r) => r.id) : []);
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
                      {pendingLoading ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin inline" /></TableCell></TableRow>
                      ) : filteredPendingResults.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No pending results. Use "Add Result" to record exam marks.</TableCell></TableRow>
                      ) : filteredPendingResults.map((r) => {
                        const grace = graceDraft[r.id] ?? r.grace_marks;
                        return (
                          <TableRow key={r.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedForDeclaration.includes(r.id)}
                                onCheckedChange={() => toggleDeclareSelection(r.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <p className="font-medium">{r.students?.name}</p>
                              <p className="text-sm text-muted-foreground">{r.students?.centers?.name}</p>
                            </TableCell>
                            <TableCell>{r.courses?.name}</TableCell>
                            <TableCell>{r.marks_obtained} / {r.total_marks}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                className="w-20 h-8"
                                value={grace}
                                onChange={(e) => handleGraceMarksChange(r.id, parseInt(e.target.value) || 0)}
                                onBlur={() => commitGrace(r.id, r.grace_marks)}
                              />
                            </TableCell>
                            <TableCell className="font-bold">{Number(r.marks_obtained) + Number(grace)}</TableCell>
                            <TableCell>
                              <Button size="sm" onClick={() => handleDeclareOne(r.id)} disabled={declareResults.isPending}>
                                <Mail className="w-4 h-4 mr-2" />Declare
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
                      <Select value={printingFilters.center} onValueChange={(v) => setPrintingFilters((p) => ({ ...p, center: v }))}>
                        <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Centers</SelectItem>
                          {centers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <Input type="date" className="w-full sm:w-40" value={printingFilters.startDate} onChange={(e) => setPrintingFilters((p) => ({ ...p, startDate: e.target.value }))} />
                      <span className="mx-2">to</span>
                      <Input type="date" className="w-full sm:w-40" value={printingFilters.endDate} onChange={(e) => setPrintingFilters((p) => ({ ...p, endDate: e.target.value }))} />
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
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedForPrinting.length > 0 && selectedForPrinting.length === filteredDeclaredResults.length}
                            onCheckedChange={(checked) => {
                              setSelectedForPrinting(checked ? filteredDeclaredResults.map((r) => r.id) : []);
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
                      {declaredLoading ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin inline" /></TableCell></TableRow>
                      ) : filteredDeclaredResults.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No declared results yet.</TableCell></TableRow>
                      ) : filteredDeclaredResults.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedForPrinting.includes(r.id)}
                              onCheckedChange={() => togglePrintSelection(r.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{r.students?.name}</p>
                            <p className="text-sm text-muted-foreground">{r.students?.centers?.name}</p>
                          </TableCell>
                          <TableCell>{r.courses?.name}</TableCell>
                          <TableCell>{r.result_date ? new Date(r.result_date).toLocaleDateString() : '-'}</TableCell>
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

function AddResultDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (p: { student_id: string; course_id: string; exam_date: string; marks_obtained: number; total_marks: number }) => void;
  submitting: boolean;
}) {
  const { data: students = [], isLoading } = useStudentsForResults();
  const [studentId, setStudentId] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState<number>(0);
  const [totalMarks, setTotalMarks] = useState<number>(100);

  const selected = students.find((s: any) => s.id === studentId);

  const handleSelect = (id: string) => {
    setStudentId(id);
    const s: any = students.find((x: any) => x.id === id);
    if (s?.courses?.max_marks) setTotalMarks(s.courses.max_marks);
  };

  const handleSubmit = () => {
    if (!studentId || !selected) {
      toast.error('Please select a student');
      return;
    }
    onSubmit({
      student_id: studentId,
      course_id: (selected as any).course_id,
      exam_date: examDate,
      marks_obtained: Number(marks),
      total_marks: Number(totalMarks),
    });
    setStudentId('');
    setMarks(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 mr-2" />Add Result</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Exam Result</DialogTitle>
          <DialogDescription>Record exam marks for a student. Result will be saved as Pending until declared.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Student</Label>
            <Select value={studentId} onValueChange={handleSelect} disabled={isLoading}>
              <SelectTrigger><SelectValue placeholder={isLoading ? 'Loading...' : 'Select a student'} /></SelectTrigger>
              <SelectContent>
                {students.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} — {s.enrollment_no} ({s.courses?.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Exam Date</Label>
            <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Marks Obtained</Label>
              <Input type="number" value={marks} onChange={(e) => setMarks(parseInt(e.target.value) || 0)} />
            </div>
            <div className="grid gap-2">
              <Label>Total Marks</Label>
              <Input type="number" value={totalMarks} onChange={(e) => setTotalMarks(parseInt(e.target.value) || 0)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
