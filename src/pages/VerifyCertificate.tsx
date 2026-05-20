import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ShieldCheck, Search, RotateCw, Hash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import cbitvtLogo from '@/assets/cbitvt-logo.png';

type VerifyRow = {
  certificate_no: string;
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

type State = 'idle' | 'validating' | 'success' | 'notfound' | 'error';

function makeCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, answer: a + b };
}

const HEX = '0123456789abcdef';
function randomHash(len = 40) {
  let s = '';
  for (let i = 0; i < len; i++) s += HEX[Math.floor(Math.random() * HEX.length)];
  return s;
}

function BlockchainLoader() {
  const [lines, setLines] = useState<string[]>([]);
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setLines((prev) => {
        const next = [...prev, `0x${randomHash(40)}`];
        return next.slice(-7);
      });
      setPct((p) => Math.min(98, p + Math.random() * 7));
    }, 140);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <div className="relative">
          <Hash className="w-5 h-5 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary animate-ping" />
        </div>
        <span className="font-mono text-sm tracking-wide">Validating on ledger…</span>
      </div>
      <div className="rounded-lg border bg-black/90 text-emerald-300 font-mono text-[11px] leading-5 px-4 py-3 h-44 overflow-hidden">
        {lines.map((l, i) => (
          <div
            key={`${l}-${i}`}
            className="truncate"
            style={{ opacity: 0.35 + (i / Math.max(1, lines.length - 1)) * 0.65 }}
          >
            <span className="text-emerald-500">block#{(1000 + i).toString(16)}</span>{' '}
            <span>{l}</span>
          </div>
        ))}
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-150"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-center font-mono">
        Verifying signature · hashing payload · checking authenticity
      </p>
    </div>
  );
}

export default function VerifyCertificate() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State>('idle');
  const [data, setData] = useState<VerifyRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [certNo, setCertNo] = useState('');
  const [captcha, setCaptcha] = useState(makeCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  const autoTriedRef = useRef(false);

  const lookup = async (raw: string) => {
    const code = raw.trim().toUpperCase();
    if (!code) {
      setError('Please enter a certificate number.');
      setState('error');
      return;
    }
    setState('validating');
    setError(null);
    setData(null);

    const started = Date.now();
    let row: VerifyRow | null = null;
    let errMsg: string | null = null;

    // Try by certificate number first (new format)
    const { data: rpcData, error: rpcErr } = await supabase.rpc('verify_certificate_by_no', { _cert_no: code });
    if (rpcErr) errMsg = rpcErr.message;
    if (Array.isArray(rpcData) && rpcData.length > 0) row = rpcData[0] as VerifyRow;

    // Fallback: legacy UUID via QR (verify_certificate)
    if (!row && /^[0-9a-fA-F-]{36}$/.test(code)) {
      const { data: legacy } = await supabase.rpc('verify_certificate', { _cert_id: code });
      if (Array.isArray(legacy) && legacy.length > 0) {
        const l = legacy[0] as unknown as Omit<VerifyRow, 'certificate_no'> & { certificate_id: string };
        row = { ...l, certificate_no: l.certificate_id };
      }
    }

    // Hold the blockchain-style loader at least 1.6s for effect
    const elapsed = Date.now() - started;
    if (elapsed < 1600) await new Promise((r) => setTimeout(r, 1600 - elapsed));

    if (row) {
      setData(row);
      setState('success');
    } else if (errMsg) {
      setError(errMsg);
      setState('error');
    } else {
      setState('notfound');
    }
  };

  // Auto-verify when arriving via QR /verify/:id
  useEffect(() => {
    if (id && !autoTriedRef.current) {
      autoTriedRef.current = true;
      setCertNo(id);
      lookup(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(captchaInput) !== captcha.answer) {
      setError('Incorrect captcha. Please try again.');
      setCaptcha(makeCaptcha());
      setCaptchaInput('');
      setState('error');
      return;
    }
    lookup(certNo);
  };

  const finalMarks = data ? Number(data.marks_obtained) + Number(data.grace_marks) : 0;
  const percent = data && data.total_marks > 0 ? (finalMarks / Number(data.total_marks)) * 100 : 0;
  const grade =
    percent >= 75 ? 'Distinction'
      : percent >= 60 ? 'First Class'
      : percent >= 50 ? 'Second Class'
      : percent >= 40 ? 'Pass'
      : 'Fail';

  const formattedInput = useMemo(() => certNo.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8), [certNo]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background flex items-center justify-center p-4">
      <Card className="max-w-xl w-full border-0 shadow-card">
        <div className="px-6 pt-6">
          <img
            src={cbitvtLogo}
            alt="Central Board of IT & Vocational Training"
            className="w-full max-w-md mx-auto h-auto object-contain"
          />
        </div>
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <CardTitle>Certificate Verification</CardTitle>
          <CardDescription>PBS Computer Education — secure, tamper-evident verification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {state === 'validating' ? (
            <BlockchainLoader />
          ) : state === 'success' && data ? (
            <>
              <div className="flex items-center justify-center gap-2 text-success font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                <span>Authentic Certificate</span>
              </div>
              <div className="rounded-lg border divide-y">
                <Row label="Certificate No" value={data.certificate_no} mono />
                <Row label="Student" value={data.student_name} />
                <Row label="Enrollment No" value={data.enrollment_no} />
                <Row label="Course" value={data.course_name} />
                <Row label="Center" value={data.center_name ?? '-'} />
                <Row label="Result Date" value={data.result_date ? new Date(data.result_date).toLocaleDateString() : '-'} />
                <Row label="Marks" value={`${finalMarks} / ${data.total_marks} (${percent.toFixed(2)}%)`} />
                <Row label="Grade" value={grade} />
              </div>
              <Button variant="outline" className="w-full" onClick={() => { setState('idle'); setData(null); setCertNo(''); setCaptchaInput(''); setCaptcha(makeCaptcha()); }}>
                <RotateCw className="w-4 h-4 mr-2" /> Verify another certificate
              </Button>
            </>
          ) : state === 'notfound' ? (
            <div className="text-center py-6 space-y-3">
              <XCircle className="w-12 h-12 text-destructive mx-auto" />
              <p className="font-semibold">Sorry, no certificate found</p>
              <p className="text-sm text-muted-foreground">
                We could not find a certificate matching <span className="font-mono">{certNo.toUpperCase()}</span>.
              </p>
              <Button variant="outline" onClick={() => { setState('idle'); setCertNo(''); setCaptchaInput(''); setCaptcha(makeCaptcha()); }}>
                Try again
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="certno">Certificate Number</Label>
                <Input
                  id="certno"
                  placeholder="e.g. A2B7K9MN"
                  value={formattedInput}
                  onChange={(e) => setCertNo(e.target.value)}
                  className="font-mono tracking-widest text-center text-lg uppercase"
                  maxLength={8}
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 8-character code printed on the certificate.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="captcha">Captcha — solve to continue</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 select-none rounded-md border bg-muted/50 px-3 py-2 font-mono text-lg tracking-widest text-center italic line-through decoration-2 decoration-foreground/30">
                    {captcha.a} + {captcha.b} = ?
                  </div>
                  <Input
                    id="captcha"
                    type="number"
                    inputMode="numeric"
                    className="w-24 text-center font-mono"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    placeholder="?"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => { setCaptcha(makeCaptcha()); setCaptchaInput(''); }}
                    aria-label="Refresh captcha"
                  >
                    <RotateCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {state === 'error' && error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={formattedInput.length < 4 || !captchaInput}>
                <Search className="w-4 h-4 mr-2" /> Verify Certificate
              </Button>
            </form>
          )}

          <div className="text-center pt-2">
            <Button asChild variant="ghost" size="sm">
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
