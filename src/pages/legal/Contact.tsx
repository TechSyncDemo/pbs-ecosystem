import LegalLayout from './LegalLayout';

export default function Contact() {
  return (
    <LegalLayout title="Contact Us">
      <p>
        We're happy to help with any questions about our courses, orders, payments, or policies.
      </p>

      <h2>Proactive Business School</h2>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:proactive.ho@gmail.com">proactive.ho@gmail.com</a></li>
        <li><strong>Phone:</strong> <a href="tel:+918879808222">+91 88798 08222</a> / <a href="tel:+919763711344">+91 97637 11344</a></li>
        <li><strong>Support hours:</strong> Monday – Saturday, 10:00 AM – 6:30 PM IST</li>
      </ul>

      <h2>Grievance Officer</h2>
      <p>
        For any payment, refund, or data-protection grievance, please email <a href="mailto:proactive.ho@gmail.com">proactive.ho@gmail.com</a> with the subject line "Grievance" and your order/center details. We aim to respond within 3 working days.
      </p>
    </LegalLayout>
  );
}