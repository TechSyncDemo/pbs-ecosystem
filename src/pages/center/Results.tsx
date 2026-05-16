import { useMemo, useState } from 'react';
import CenterLayout from '@/layouts/CenterLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, FileText, Award, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useCenterResults, useSubmitPractical } from '@/hooks/useCenterResults';
import type { ResultRow } from '@/hooks/useResults';
import { generateMarksheet } from '@/lib/generateMarksheet';
import { generateCertificate } from '@/lib/generateCertificate';

function grade(percent: number) {
  if (percent >= 75) return 'Distinction';
  if (percent >= 60) return 'First Class';
  if (percent >= 50) return 'Second Class';
  if (percent >= 40) return 'Pass';
  return 'Fail';
}

export default function CenterResults() {
  const { data: results = [], isLoading } = useCenterResults();
  const submit = useSubmitPractical();
  const [draft, setDraft] = useState<Record<string, { marks: number; total: number }>>({});
  const [confirmOpen, setConfirmOpen] = useState<ResultRow | null>(null);

  const awaiting = useMemo(() => results.filter((r) => r.status === 'awaiting_practical'), [results]);
  const submitted = useMemo(() => results.filter((r) => r.status === 'pending'), [results]);
  const declared = useMemo(() => results.filter((r) => r.status === 'declared'), [results]);

  const downloadProvisionalMarksheet = async (r: ResultRow) => {
    const final = Number(r.theory_marks) + Number(r.theory_grace) + Number(r.practical_marks) + Number(r.practical_grace);
    const total = Number(r.theory_total) + Number(r.practical_total);
    await generateMarksheet({
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
      finalMarks: final,
      totalMarks: total,
      certificateId: r.id,
      provisional: true,
    });
  };

  const downloadProvisionalCertificate = async (r: ResultRow) => {
    const final = Number(r.theory_marks) + Number(r.theory_grace) + Number(r.practical_marks) + Number(r.practical_grace);
    const total = Number(r.theory_total) + Number(r.practical_total);
    const pct = total > 0 ? (final / total) * 100 : 0;
    await generateCertificate({
      studentName: r.students?.name ?? '-',
      enrollmentNo: r.students?.enrollment_no ?? '-',
      centerName: r.students?.centers?.name ?? '-',
      centerCode: r.students?.centers?.code,
      courseName: r.courses?.name ?? '-',
      courseDuration: r.courses?.duration_months ? `${r.courses.duration_months} months` : undefined,
      resultDate: r.result_date ?? new Date().toISOString(),
      grade: grade(pct),
      certificateId: r.id,
      provisional: true,
    });
  };

  const handleSubmit = (r: ResultRow) => {
    const d = draft[r.id] ?? { marks: 0, total: Number(r.practical_total) || 100 };
    if (d.marks < 0 || d.marks > d.total) return toast.error('Practical marks must be between 0 and total.');
    submit.mutate(
      { id: r.id, practical_marks: d.marks, practical_total: d.total },
      { onSuccess: () => setConfirmOpen(null) }
    );
  };

  return (
    <CenterLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Exam Results</h1>
          <p className="text-muted-foreground mt-1">Submit practical marks after a student completes the theory exam. Once submitted, marks cannot be edited.</p>
        </div>

        <Tabs defaultValue="awaiting">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="awaiting">Awaiting Practical ({awaiting.length})</TabsTrigger>
            <TabsTrigger value="submitted">Submitted ({submitted.length})</TabsTrigger>
            <TabsTrigger value="declared">Declared ({declared.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="awaiting" className="mt-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle>Awaiting Practical Submission</CardTitle>
                <CardDescription>Theory marks are auto-fetched once the student finishes the online exam. Enter practical marks and submit.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Theory (read-only)</TableHead>
                        <TableHead>Practical Marks</TableHead>
                        <TableHead>Practical Total</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin inline" /></TableCell></TableRow>
                      ) : awaiting.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No students awaiting practical entry.</TableCell></TableRow>
                      ) : awaiting.map((r) => {
                        const d = draft[r.id] ?? { marks: 0, total: Number(r.practical_total) || 100 };
                        return (
                          <TableRow key={r.id}>
                            <TableCell>
                              <p className="font-medium">{r.students?.name}</p>
                              <p className="text-sm text-muted-foreground">{r.students?.enrollment_no}</p>
                            </TableCell>
                            <TableCell>{r.courses?.name}</TableCell>
                            <TableCell><Badge variant="secondary">{Number(r.theory_marks)} / {Number(r.theory_total)}</Badge></TableCell>
                            <TableCell>
                              <Input type="number" className="w-24 h-9" value={d.marks}
                                onChange={(e) => setDraft((p) => ({ ...p, [r.id]: { ...d, marks: parseFloat(e.target.value) || 0 } }))} />
                            </TableCell>
                            <TableCell>
                              <Input type="number" className="w-24 h-9" value={d.total}
                                onChange={(e) => setDraft((p) => ({ ...p, [r.id]: { ...d, total: parseFloat(e.target.value) || 0 } }))} />
                            </TableCell>
                            <TableCell>
                              <Button size="sm" onClick={() => setConfirmOpen(r)} disabled={submit.isPending}>
                                <Send className="w-4 h-4 mr-2" />Submit
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

          <TabsContent value="submitted" className="mt-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle>Awaiting Admin Declaration</CardTitle>
                <CardDescription>You have submitted practical marks. Marks are locked and waiting for super admin to declare results.</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleRows rows={submitted} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="declared" className="mt-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle>Declared Results</CardTitle>
                <CardDescription>Once the super admin prints the certificate, you can download provisional documents below.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Theory</TableHead>
                        <TableHead>Practical</TableHead>
                        <TableHead>Final</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Provisional Documents</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {declared.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No declared results yet.</TableCell></TableRow>
                      ) : declared.map((r) => {
                        const tF = Number(r.theory_marks) + Number(r.theory_grace);
                        const pF = Number(r.practical_marks) + Number(r.practical_grace);
                        const final = tF + pF;
                        const total = Number(r.theory_total) + Number(r.practical_total);
                        const pct = total > 0 ? (final / total) * 100 : 0;
                        const ready = !!r.certificate_printed_at;
                        return (
                          <TableRow key={r.id}>
                            <TableCell>
                              <p className="font-medium">{r.students?.name}</p>
                              <p className="text-sm text-muted-foreground">{r.students?.enrollment_no}</p>
                            </TableCell>
                            <TableCell>{r.courses?.name}</TableCell>
                            <TableCell>{tF} / {Number(r.theory_total)}</TableCell>
                            <TableCell>{pF} / {Number(r.practical_total)}</TableCell>
                            <TableCell className="font-bold">{final} / {total} ({pct.toFixed(1)}%)</TableCell>
                            <TableCell><Badge>{grade(pct)}</Badge></TableCell>
                            <TableCell>
                              {ready ? (
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => downloadProvisionalMarksheet(r)}>
                                    <FileText className="w-4 h-4 mr-1" />Marksheet
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => downloadProvisionalCertificate(r)}>
                                    <Award className="w-4 h-4 mr-1" />Certificate
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">Awaiting admin to release</span>
                              )}
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
        </Tabs>
      </div>

      <Dialog open={!!confirmOpen} onOpenChange={(o) => !o && setConfirmOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm practical submission</DialogTitle>
            <DialogDescription>
              Once submitted, practical marks for <b>{confirmOpen?.students?.name}</b> cannot be edited. Please verify carefully.
            </DialogDescription>
          </DialogHeader>
          {confirmOpen && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><Label>Theory</Label><span>{Number(confirmOpen.theory_marks)} / {Number(confirmOpen.theory_total)}</span></div>
              <div className="flex justify-between"><Label>Practical</Label><span>{draft[confirmOpen.id]?.marks ?? 0} / {draft[confirmOpen.id]?.total ?? Number(confirmOpen.practical_total)}</span></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(null)}>Cancel</Button>
            <Button onClick={() => confirmOpen && handleSubmit(confirmOpen)} disabled={submit.isPending}>
              {submit.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CenterLayout>
  );
}

function SimpleRows({ rows }: { rows: ResultRow[] }) {
  return (
    <div className="rounded-lg border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Student</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Theory</TableHead>
            <TableHead>Practical</TableHead>
            <TableHead>Submitted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No rows.</TableCell></TableRow>
          ) : rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <p className="font-medium">{r.students?.name}</p>
                <p className="text-sm text-muted-foreground">{r.students?.enrollment_no}</p>
              </TableCell>
              <TableCell>{r.courses?.name}</TableCell>
              <TableCell>{Number(r.theory_marks)} / {Number(r.theory_total)}</TableCell>
              <TableCell>{Number(r.practical_marks)} / {Number(r.practical_total)}</TableCell>
              <TableCell>{r.practical_submitted_at ? new Date(r.practical_submitted_at).toLocaleDateString() : '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
