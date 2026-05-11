import LegalLayout from './LegalLayout';

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>
        Proactive Business School ("PBS", "we", "us") respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy explains what we collect, how we use it, and the choices you have.
      </p>

      <h2>1. Information We Collect</h2>
      <ul>
        <li><strong>Account data:</strong> name, email, mobile number, center details, address, role.</li>
        <li><strong>Student data:</strong> name, contact information, course enrollment, exam results, certificates.</li>
        <li><strong>Payment data:</strong> order amounts, invoices, and transaction references. Card / UPI / net-banking details are handled directly by our payment processor (Razorpay) and are never stored on our servers.</li>
        <li><strong>Usage data:</strong> log files, device info, IP address, and basic analytics required to operate the portal.</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To create and manage center and student accounts.</li>
        <li>To process orders, payments, exams, results, and certificates.</li>
        <li>To send transactional communications (order confirmations, exam allotments, support replies).</li>
        <li>To comply with legal, tax, and accounting obligations.</li>
        <li>To detect fraud, abuse, and to secure the platform.</li>
      </ul>

      <h2>3. Sharing &amp; Disclosure</h2>
      <ul>
        <li><strong>Payment processor:</strong> Razorpay, for processing transactions securely under their privacy and PCI-DSS compliant infrastructure.</li>
        <li><strong>Service providers:</strong> hosting, database, email, and exam portal partners, bound by confidentiality obligations.</li>
        <li><strong>Legal requirements:</strong> when required by law, court order, or to protect our rights.</li>
      </ul>
      <p>We do not sell your personal information to third parties.</p>

      <h2>4. Data Security</h2>
      <p>
        We use industry-standard safeguards including encryption in transit (HTTPS), role-based access control, and row-level security at the database layer. However, no online system is 100% secure; please use strong passwords and keep your credentials private.
      </p>

      <h2>5. Data Retention</h2>
      <p>
        We retain academic records (student enrollments, exam results, certificates) for the duration required to support verification of credentials. Transactional records are retained as required under applicable Indian tax and accounting law.
      </p>

      <h2>6. Your Rights</h2>
      <ul>
        <li>Access, correct, or update your personal information from your account.</li>
        <li>Request deletion of your account, subject to academic/legal retention obligations.</li>
        <li>Opt out of non-essential communications.</li>
      </ul>
      <p>To exercise these rights, contact <a href="mailto:proactive.ho@gmail.com">proactive.ho@gmail.com</a>.</p>

      <h2>7. Cookies</h2>
      <p>
        We use only essential cookies and local storage required for authentication and session management. No third-party advertising cookies are used.
      </p>

      <h2>8. Children's Privacy</h2>
      <p>
        Student enrollments for minors are made by authorized centers/guardians. We do not knowingly collect personal information directly from children without such authorization.
      </p>

      <h2>9. Changes to this Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. The "Last updated" date at the top reflects the latest revision.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions or concerns? Email <a href="mailto:proactive.ho@gmail.com">proactive.ho@gmail.com</a> or call +91 88798 08222.
      </p>
    </LegalLayout>
  );
}