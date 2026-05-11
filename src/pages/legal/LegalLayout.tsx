import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Phone, Mail } from 'lucide-react';
import pbsLogo from '@/assets/pbs-logo.png';

interface Props {
  title: string;
  updated?: string;
  children: ReactNode;
}

export default function LegalLayout({ title, updated = '11 May 2026', children }: Props) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={pbsLogo} alt="Proactive Business School" className="h-10 w-auto object-contain" />
            <span className="font-heading font-semibold text-foreground hidden sm:inline">Proactive Business School</span>
          </Link>
          <Link to="/" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {updated}</p>
        <article className="prose prose-slate max-w-none text-foreground space-y-5 leading-relaxed [&_h2]:text-xl [&_h2]:font-heading [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_a]:text-primary [&_a:hover]:underline">
          {children}
        </article>
      </main>

      <footer className="border-t bg-muted/30">
        <div className="max-w-4xl mx-auto px-6 py-6 text-sm text-muted-foreground space-y-2">
          <div className="flex flex-wrap gap-4">
            <Link to="/terms" className="hover:text-primary">Terms &amp; Conditions</Link>
            <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
            <Link to="/refund-policy" className="hover:text-primary">Refund &amp; Returns Policy</Link>
            <Link to="/cancellation-policy" className="hover:text-primary">Cancellation Policy</Link>
            <Link to="/contact" className="hover:text-primary">Contact Us</Link>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> +91 88798 08222</span>
            <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> proactive.ho@gmail.com</span>
          </div>
          <p>© {new Date().getFullYear()} Proactive Business School. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}