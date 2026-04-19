import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type VerifyRow = {
  certificate_id: string;
  student_name: string;
  enrollment_no: string;
  course_name: string;
  center_name: string | null;
  result_date: string | null;
  marks_obtained: number;
  total_marks: number;
  grace_marks: number;
  status: string;
};

export default function VerifyCertificate() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerifyRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!id) {
        setError('Missing certificate ID');
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.rpc('verify_certificate', { _cert_id: id });
      if (!active) return;
      if (error) {
        setError(error.message);
      } else if (!data || (Array.isArray(data) && data.length === 0)) {
        setError('Certificate not found or not yet declared.');
      } else {
        setData(Array.isArray(data) ? (data[0] as VerifyRow) : (data as VerifyRow));
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const finalMarks = data ? Number(data.marks_obtained) + Number(data.grace_marks) : 0;
  const percent = data && data.total_marks > 0 ? (finalMarks / Number(data.total_marks)) * 100 : 0;
  const grade =
    percent >= 75 ? 'Distinction' : percent >= 60 ? 'First Class' : percent >= 50 ? 'Second Class' : percent >= 40 ? 'Pass' : 'Fail';

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-xl w-full border-0 shadow-card">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <CardTitle>Certificate Verification</CardTitle>
          <CardDescription>PBS Computer Education</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Verifying…
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <XCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
              <p className="font-semibold">Verification failed</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          ) : data ? (
            <>
              <div className="flex items-center justify-center gap-2 text-success font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                <span>Authentic Certificate</span>
              </div>
              <div className="rounded-lg border divide-y">
                <Row label="Student" value={data.student_name} />
                <Row label="Enrollment No" value={data.enrollment_no} />
                <Row label="Course" value={data.course_name} />
                <Row label="Center" value={data.center_name ?? '-'} />
                <Row label="Result Date" value={data.result_date ? new Date(data.result_date).toLocaleDateString() : '-'} />
                <Row label="Marks" value={`${finalMarks} / ${data.total_marks} (${percent.toFixed(2)}%)`} />
                <Row label="Grade" value={grade} />
                <Row label="Certificate ID" value={data.certificate_id} mono />
              </div>
            </>
          ) : null}
          <div className="text-center pt-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
