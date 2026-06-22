import { useMemo, useState, useEffect } from 'react';
import CenterLayout from '@/layouts/CenterLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, FileText, Award, Send, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useCenterResults, useSubmitPractical } from '@/hooks/useCenterResults';
import type { ResultRow } from '@/hooks/useResults';
import { generateMarksheet } from '@/lib/generateMarksheet';
import { generateCertificate } from '@/lib/generateCertificate';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function grade(percent: number) {
  if (percent >= 75) return 'A+';
  if (percent >= 60) return 'A';
  if (percent >= 50) return 'B';
  if (percent >= 40) return 'C';
  return 'F';
}

export default function CenterResults() {
  const { data: results = [], isLoading, refetch } = useCenterResults();
  const submit = useSubmitPractical();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Record<string, { marks: number; total: number }>>({});
  const [confirmOpen, setConfirmOpen] = useState<ResultRow | null>(null);
  const [refreshKey, setRefreshKey] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const MAX_REFRESH_PER_DAY = 3;

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? 'anon';
      const key = `center_results_refresh:${uid}:${new Date().toISOString().slice(0, 10)}`;
      setRefreshKey(key);
      setRefreshCount(parseInt(localStorage.getItem(key) ?? '0', 10) || 0);
    })();
  }, []);

  const handleRefresh = async () => {
    if (refreshCount >= MAX_REFRESH_PER_DAY) {
      toast.error(`Daily refresh limit reached (${MAX_REFRESH_PER_DAY}/day). Try again tomorrow.`);
      return;
    }
    setRefreshing(true);
    try {
      // Pull latest completed exam attempts from the exam portal for this center
      const { data: pullData, error: pullErr } = await supabase.functions.invoke('pull-exam-results');
      if (pullErr) throw pullErr;
      const imported = (pullData as { imported?: number } | null)?.imported ?? 0;
      await refetch();
      await qc.invalidateQueries({ queryKey: ['center_results'] });
      const next = refreshCount + 1;
      setRefreshCount(next);
      if (refreshKey) localStorage.setItem(refreshKey, String(next));
      toast.success(
        imported > 0
          ? `${imported} new result${imported === 1 ? '' : 's'} fetched (${next}/${MAX_REFRESH_PER_DAY} today)`
          : `No new results yet (${next}/${MAX_REFRESH_PER_DAY} today)`
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRefreshing(false);
    }
  };

  const awaiting = useMemo(() => results.filter((r) => r.status === 'awaiting_practical'), [results]);
  const submitted = useMemo(() => results.filter((r) => r.status === 'pending'), [results]);
  const declared = useMemo(() => results.filter((r) => r.status === 'declared'), [results]);

  const downloadProvisionalMarksheet = async (r: ResultRow) => {
    const final = Math.round(Number(r.theory_marks) + Number(r.theory_grace) + Number(r.practical_marks) + Number(r.practical_grace));
    const total = Math.round(Number(r.theory_total) + Number(r.practical_total));
    const subjects = (r.courses?.course_topics ?? [])
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((t) => t.topic_name)
      .filter(Boolean);
    await generateMarksheet({
      studentName: r.students?.name ?? '-',
      enrollmentNo: r.students?.enrollment_no ?? '-',
      centerName: r.students?.centers?.name ?? '-',
      centerCode: r.students?.centers?.code,
      centerCity: r.students?.centers?.city ?? null,
      courseName: r.courses?.name ?? '-',
      courseCode: r.courses?.code,
      examDate: r.exam_date,
      resultDate: r.result_date ?? new Date().toISOString(),
      theoryMarks: Math.round(Number(r.theory_marks)),
      theoryTotal: Math.round(Number(r.theory_total)),
      theoryGrace: Math.round(Number(r.theory_grace)),
      practicalMarks: Math.round(Number(r.practical_marks)),
      practicalTotal: Math.round(Number(r.practical_total)),
      practicalGrace: Math.round(Number(r.practical_grace)),
      finalMarks: final,
      totalMarks: total,
      certificateId: r.id,
      certificateNo: (r as unknown as { certificate_no?: string | null }).certificate_no,
      subjects: subjects.length > 0 ? subjects : undefined,
      provisional: true,
    });
  };

  const downloadProvisionalCertificate = async (r: ResultRow) => {
    const final = Math.round(Number(r.theory_marks) + Number(r.theory_grace) + Number(r.practical_marks) + Number(r.practical_grace));
    const total = Math.round(Number(r.theory_total) + Number(r.practical_total));
    const pct = total > 0 ? Math.round((final / total) * 100) : 0;
    await generateCertificate({
      studentName: r.students?.name ?? '-',
      enrollmentNo: r.students?.enrollment_no ?? '-',
      centerName: r.students?.centers?.name ?? '-',
      centerCode: r.students?.centers?.code,
      centerCity: r.students?.centers?.city ?? null,
      courseName: r.courses?.name ?? '-',
      courseDuration: r.courses?.duration_months ? `${r.courses.duration_months} months` : undefined,
      resultDate: r.result_date ?? new Date().toISOString(),
      grade: grade(pct),
      certificateId: r.id,
      certificateNo: (r as unknown as { certificate_no?: string | null }).certificate_no,
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
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Exam Results</h1>
            <p className="text-muted-foreground mt-1">Theory marks are fetched automatically from the exam portal and are read-only. You may only submit practical marks.</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Button
              onClick={handleRefresh}
              disabled={refreshing || refreshCount >= MAX_REFRESH_PER_DAY}
              variant="outline"
            >
              {refreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Refresh Results
            </Button>
            <span className="text-xs text-muted-foreground">
              {Math.max(0, MAX_REFRESH_PER_DAY - refreshCount)} of {MAX_REFRESH_PER_DAY} refreshes left today
            </span>
          </div>
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
                        const tF = Math.round(Number(r.theory_marks) + Number(r.theory_grace));
                        const pF = Math.round(Number(r.practical_marks) + Number(r.practical_grace));
                        const final = tF + pF;
                        const total = Math.round(Number(r.theory_total) + Number(r.practical_total));
                        const pct = total > 0 ? Math.round((final / total) * 100) : 0;
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
