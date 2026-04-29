import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap, Building2, Shield, Users, BookOpen, Award, ArrowRight, Phone, Mail } from 'lucide-react';
import pbsLogo from '@/assets/pbs-logo.png';

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden" style={{ background: 'var(--gradient-dark)' }}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="bg-white rounded-2xl p-5 shadow-2xl">
                <img src={pbsLogo} alt="Proactive Business School logo" className="h-20 md:h-24 w-auto object-contain" />
              </div>
            </div>

            <p className="text-warning italic text-lg md:text-xl mb-4">Crafting Successful Skilled Professionals</p>

            <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6">
              Proactive<br />
              <span className="text-white/80">Business School</span>
            </h1>

            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10">
              Skilling, upskilling and empowering the youth to be the best at their careers — through industry-aligned programs delivered across our network of partner centers.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-12 px-8 text-base" asChild>
                <Link to="/login">
                  Sign In to Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-heading font-bold mb-4">Platform Modules</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Three interconnected portals designed for autonomous operations and seamless management.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl border bg-card card-hover">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-heading font-semibold mb-3">Super Admin Portal</h3>
            <p className="text-muted-foreground mb-4">
              Full control over centers, courses, pricing, results declaration, and global reports from the Head Office.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Center Network Management</li>
              <li className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Course & Price Master</li>
              <li className="flex items-center gap-2"><Award className="w-4 h-4" /> Result & Certificate Management</li>
            </ul>
          </div>
          
          <div className="p-8 rounded-2xl border bg-card card-hover">
            <div className="w-14 h-14 rounded-xl bg-info/10 flex items-center justify-center mb-6">
              <Building2 className="w-7 h-7 text-info" />
            </div>
            <h3 className="text-xl font-heading font-semibold mb-3">Center Portal</h3>
            <p className="text-muted-foreground mb-4">
              Manage center operations including enquiries, stock purchases, admissions, and student lifecycle.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2"><Users className="w-4 h-4" /> Enquiry & CRM Management</li>
              <li className="flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Student Admissions</li>
              <li className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Stock & Order Management</li>
            </ul>
          </div>
          
          <div className="p-8 rounded-2xl border bg-card card-hover">
            <div className="w-14 h-14 rounded-xl bg-success/10 flex items-center justify-center mb-6">
              <GraduationCap className="w-7 h-7 text-success" />
            </div>
            <h3 className="text-xl font-heading font-semibold mb-3">Exam Portal (EMS)</h3>
            <p className="text-muted-foreground mb-4">
              Online examination system with question banks, timed tests, and instant results for students.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Question Bank Management</li>
              <li className="flex items-center gap-2"><Users className="w-4 h-4" /> Student Test Interface</li>
              <li className="flex items-center gap-2"><Award className="w-4 h-4" /> Digital Certificates</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={pbsLogo} alt="Proactive Business School logo" className="h-12 w-auto object-contain" />
            </div>
            <div className="text-sm text-muted-foreground text-center md:text-right space-y-1">
              <p className="flex items-center justify-center md:justify-end gap-2">
                <Phone className="w-3.5 h-3.5" />
                <a href="tel:+918879808222" className="hover:text-primary">+91 88798 08222</a>
                <span>·</span>
                <a href="tel:+919763711344" className="hover:text-primary">+91 97 63 711 344</a>
              </p>
              <p className="flex items-center justify-center md:justify-end gap-2">
                <Mail className="w-3.5 h-3.5" />
                <a href="mailto:proactive.ho@gmail.com" className="hover:text-primary">proactive.ho@gmail.com</a>
              </p>
              <p>© {new Date().getFullYear()} Proactive Business School. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
