import { useMemo, useState } from 'react';
import { Award, FileText, Printer, QrCode, Mail, Building, Calendar, Loader2, RefreshCw } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  usePendingResults,
  useDeclaredResults,
  useUpdateGrace,
  useDeclareResults,
  useMarkPrinted,
  type ResultRow,
} from '@/hooks/useResults';
import { useCenters } from '@/hooks/useCenters';
import { generateMarksheetsBulk, type MarksheetData } from '@/lib/generateMarksheet';
import { generateCertificatesBulk, type CertificateData } from '@/lib/generateCertificate';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

function gradeFor(percent: number) {
  if (percent >= 75) return 'A+';
  if (percent >= 60) return 'A';
  if (percent >= 50) return 'B';
  if (percent >= 40) return 'C';
  return 'F';
}

function totals(r: ResultRow) {
  const theoryFinal = Number(r.theory_marks) + Number(r.theory_grace);
  const practicalFinal = Number(r.practical_marks) + Number(r.practical_grace);
  const final = theoryFinal + practicalFinal;
  const total = Number(r.theory_total) + Number(r.practical_total);
  const percent = total > 0 ? (final / total) * 100 : 0;
  return { theoryFinal, practicalFinal, final, total, percent };
}

function toMarksheet(r: ResultRow): MarksheetData {
  const t = totals(r);
  return {
    studentName: r.students?.name ?? '-',
    enrollmentNo: r.students?.enrollment_no ?? '-',
    centerName: r.students?.centers?.name ?? '-',
    centerCode: r.students?.centers?.code,
    courseName: r.courses?.name ?? '-',
    courseCode: r.courses?.code,
    examDate: r.exam_date,
    resultDate: r.result_date ?? new Date().toISOString(),
    theoryMarks: Number(r.theory_marks),
    theoryTotal: Number(r.theory_total),
    theoryGrace: Number(r.theory_grace),
    practicalMarks: Number(r.practical_marks),
    practicalTotal: Number(r.practical_total),
    practicalGrace: Number(r.practical_grace),
    finalMarks: t.final,
    totalMarks: t.total,
    certificateId: r.id,
    certificateNo: r.certificate_no,
  };
}

function toCertificate(r: ResultRow): CertificateData {
  const t = totals(r);
  return {
    studentName: r.students?.name ?? '-',
    enrollmentNo: r.students?.enrollment_no ?? '-',
    centerName: r.students?.centers?.name ?? '-',
    centerCode: r.students?.centers?.code,
    courseName: r.courses?.name ?? '-',
    courseDuration: r.courses?.duration_months ? `${r.courses.duration_months} months` : undefined,
    resultDate: r.result_date ?? new Date().toISOString(),
    grade: gradeFor(t.percent),
    certificateId: r.id,
    certificateNo: r.certificate_no,
  };
}

export default function AdminResults() {
  const { data: pendingResults = [], isLoading: pendingLoading } = usePendingResults();
  const { data: declaredResults = [], isLoading: declaredLoading } = useDeclaredResults();
  const { data: centers = [] } = useCenters();
  const updateGrace = useUpdateGrace();
  const declareResults = useDeclareResults();
  const markPrinted = useMarkPrinted();
  const qc = useQueryClient();
  const [pulling, setPulling] = useState(false);

  const handlePullResults = async () => {
    setPulling(true);
    try {
      const { data, error } = await supabase.functions.invoke('pull-exam-results');
      if (error) throw error;
      const d = data as { ok?: boolean; fallback?: boolean; error?: string; upstream_status?: number; fetched?: number; imported?: number; skipped?: number; failed?: number };
      if (d?.fallback) {
        toast.error(
          d.error === 'EXAM_PORTAL_UNAVAILABLE'
            ? `Exam portal is temporarily unavailable${d.upstream_status ? ` (HTTP ${d.upstream_status})` : ''}. Please try again later.`
            : `Could not pull results: ${d.error ?? 'unknown error'}`
        );
      } else {
        toast.success(`Pulled ${d.fetched ?? 0} attempts — imported ${d.imported ?? 0}, skipped ${d.skipped ?? 0}${d.failed ? `, failed ${d.failed}` : ''}`);
      }
      qc.invalidateQueries({ queryKey: ['pending_results'] });
      qc.invalidateQueries({ queryKey: ['declared_results'] });
      qc.invalidateQueries({ queryKey: ['center_results'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to pull exam results');
    } finally {
      setPulling(false);
    }
  };

  const [selectedForDeclaration, setSelectedForDeclaration] = useState<string[]>([]);
  const [selectedForPrinting, setSelectedForPrinting] = useState<string[]>([]);
  const [declarationFilters, setDeclarationFilters] = useState({ center: 'all', startDate: '', endDate: '' });
  const [printingFilters, setPrintingFilters] = useState({ center: 'all', startDate: '', endDate: '' });
  const [graceDraft, setGraceDraft] = useState<Record<string, { theory?: number; practical?: number }>>({});

  const setGrace = (id: string, field: 'theory' | 'practical', value: number) =>
    setGraceDraft((p) => ({ ...p, [id]: { ...p[id], [field]: value } }));

  const commitGrace = (id: string, field: 'theory' | 'practical', original: number) => {
    const v = graceDraft[id]?.[field];
    if (v === undefined || v === original) return;
    updateGrace.mutate({ id, field: field === 'theory' ? 'theory_grace' : 'practical_grace', value: v });
  };

  const handleDeclareSelected = () => {
    if (selectedForDeclaration.length === 0) return toast.error('No students selected for declaration.');
    declareResults.mutate(selectedForDeclaration, { onSuccess: () => setSelectedForDeclaration([]) });
  };

  const handleDeclareOne = (id: string) => declareResults.mutate([id]);

  const handlePrintMarksheets = async () => {
    if (selectedForPrinting.length === 0) return toast.error('Please select at least one student.');
    const items = filteredDeclaredResults.filter((r) => selectedForPrinting.includes(r.id)).map(toMarksheet);
    toast.info(`Generating marksheet PDF for ${items.length} student(s)...`);
    try {
      await generateMarksheetsBulk(items);
      await markPrinted.mutateAsync(selectedForPrinting);
      toast.success('Marksheet PDF generated');
    } catch {
      toast.error('Failed to generate marksheet PDF');
    }
  };

  const handlePrintCertificates = async () => {
    if (selectedForPrinting.length === 0) return toast.error('Please select at least one student.');
    const items = filteredDeclaredResults.filter((r) => selectedForPrinting.includes(r.id)).map(toCertificate);
    toast.info(`Generating certificate PDF for ${items.length} student(s)...`);
    try {
      await generateCertificatesBulk(items);
      await markPrinted.mutateAsync(selectedForPrinting);
      toast.success('Certificate PDF generated');
    } catch {
      toast.error('Failed to generate certificate PDF');
    }
  };

  const togglePrintSelection = (id: string) =>
    setSelectedForPrinting((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleDeclareSelection = (id: string) =>
    setSelectedForDeclaration((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const filteredPendingResults = useMemo(() => {
    return pendingResults.filter((r) => {
      const centerMatch = declarationFilters.center === 'all' || r.students?.center_id === declarationFilters.center;
      const startMatch = !declarationFilters.startDate || new Date(r.exam_date) >= new Date(declarationFilters.startDate);
      const endMatch = !declarationFilters.endDate || new Date(r.exam_date) <= new Date(declarationFilters.endDate);
      return centerMatch && startMatch && endMatch;
    });
  }, [pendingResults, declarationFilters]);

  const filteredDeclaredResults = useMemo(() => {
    return declaredResults.filter((r) => {
      const centerMatch = printingFilters.center === 'all' || r.students?.center_id === printingFilters.center;
      const date = r.result_date ? new Date(r.result_date) : null;
      const startMatch = !printingFilters.startDate || (date && date >= new Date(printingFilters.startDate));
      const endMatch = !printingFilters.endDate || (date && date <= new Date(printingFilters.endDate));
      return centerMatch && startMatch && endMatch;
    });
  }, [declaredResults, printingFilters]);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Result &amp; Certificate Management</h1>
            <p className="text-muted-foreground mt-1">Review center-submitted practical marks, adjust grace, declare results and print documents.</p>
          </div>
          <Button onClick={handlePullResults} disabled={pulling} variant="outline">
            {pulling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Pull Exam Results
          </Button>
        </div>

        <Tabs defaultValue="declaration">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="declaration"><Award className="w-4 h-4 mr-2" />Result Declaration</TabsTrigger>
            <TabsTrigger value="printing"><Printer className="w-4 h-4 mr-2" />Certificate Printing Queue</TabsTrigger>
          </TabsList>

          <TabsContent value="declaration" className="mt-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Pending Results</CardTitle>
                    <CardDescription>Only students whose centers have submitted practical marks appear here. Adjust grace (±) on theory and practical, then declare.</CardDescription>
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
                        {centers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
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
                            onCheckedChange={(c) => setSelectedForDeclaration(c ? filteredPendingResults.map((r) => r.id) : [])}
                          />
                        </TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Theory</TableHead>
                        <TableHead>Theory ±</TableHead>
                        <TableHead>Practical</TableHead>
                        <TableHead>Practical ±</TableHead>
                        <TableHead>Final</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingLoading ? (
                        <TableRow><TableCell colSpan={9} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin inline" /></TableCell></TableRow>
                      ) : filteredPendingResults.length === 0 ? (
                        <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No pending results. Centers must submit practical marks first.</TableCell></TableRow>
                      ) : filteredPendingResults.map((r) => {
                        const tg = graceDraft[r.id]?.theory ?? Number(r.theory_grace);
                        const pg = graceDraft[r.id]?.practical ?? Number(r.practical_grace);
                        const final = Number(r.theory_marks) + tg + Number(r.practical_marks) + pg;
                        const practicalPending = r.status === 'awaiting_practical' || !r.practical_submitted_at;
                        return (
                          <TableRow key={r.id}>
                            <TableCell>
                              <Checkbox checked={selectedForDeclaration.includes(r.id)} onCheckedChange={() => toggleDeclareSelection(r.id)} disabled={practicalPending} />
                            </TableCell>
                            <TableCell>
                              <p className="font-medium">{r.students?.name}</p>
                              <p className="text-sm text-muted-foreground">{r.students?.centers?.name}</p>
                            </TableCell>
                            <TableCell>{r.courses?.name}</TableCell>
                            <TableCell>{Number(r.theory_marks)} / {Number(r.theory_total)}</TableCell>
                            <TableCell>
                              <Input type="number" className="w-20 h-8" value={tg}
                                onChange={(e) => setGrace(r.id, 'theory', parseFloat(e.target.value) || 0)}
                                onBlur={() => commitGrace(r.id, 'theory', Number(r.theory_grace))} />
                            </TableCell>
                            <TableCell>
                              {practicalPending
                                ? <Badge variant="outline">Awaiting center</Badge>
                                : <>{Number(r.practical_marks)} / {Number(r.practical_total)}</>}
                            </TableCell>
                            <TableCell>
                              <Input type="number" className="w-20 h-8" value={pg}
                                onChange={(e) => setGrace(r.id, 'practical', parseFloat(e.target.value) || 0)}
                                onBlur={() => commitGrace(r.id, 'practical', Number(r.practical_grace))}
                                disabled={practicalPending} />
                            </TableCell>
                            <TableCell className="font-bold">{final} / {Number(r.theory_total) + Number(r.practical_total)}</TableCell>
                            <TableCell>
                              <Button size="sm" onClick={() => handleDeclareOne(r.id)} disabled={declareResults.isPending || practicalPending}>
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

          <TabsContent value="printing" className="mt-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Certificate Printing Queue</CardTitle>
                    <CardDescription>Generate bulk PDFs for declared results. Printing also releases provisional documents to the center.</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <Select value={printingFilters.center} onValueChange={(v) => setPrintingFilters((p) => ({ ...p, center: v }))}>
                        <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Centers</SelectItem>
                          {centers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
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
                    <FileText className="w-4 h-4 mr-2" />Print Marksheet ({selectedForPrinting.length})
                  </Button>
                  <Button onClick={handlePrintCertificates} disabled={selectedForPrinting.length === 0}>
                    <Printer className="w-4 h-4 mr-2" />Print Certificate ({selectedForPrinting.length})
                  </Button>
                </div>
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedForPrinting.length > 0 && selectedForPrinting.length === filteredDeclaredResults.length}
                            onCheckedChange={(c) => setSelectedForPrinting(c ? filteredDeclaredResults.map((r) => r.id) : [])}
                          />
                        </TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Result Date</TableHead>
                        <TableHead>Printed</TableHead>
                        <TableHead>Verification</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {declaredLoading ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin inline" /></TableCell></TableRow>
                      ) : filteredDeclaredResults.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No declared results yet.</TableCell></TableRow>
                      ) : filteredDeclaredResults.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <Checkbox checked={selectedForPrinting.includes(r.id)} onCheckedChange={() => togglePrintSelection(r.id)} />
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{r.students?.name}</p>
                            <p className="text-sm text-muted-foreground">{r.students?.centers?.name}</p>
                          </TableCell>
                          <TableCell>{r.courses?.name}</TableCell>
                          <TableCell>{r.result_date ? new Date(r.result_date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>
                            {r.certificate_printed_at
                              ? <Badge variant="secondary">{new Date(r.certificate_printed_at).toLocaleDateString()}</Badge>
                              : <span className="text-muted-foreground text-sm">Not yet</span>}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <QrCode className="w-4 h-4" /><span>Enabled</span>
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

