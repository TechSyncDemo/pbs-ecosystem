import LegalLayout from './LegalLayout';

export default function CancellationPolicy() {
  return (
    <LegalLayout title="Cancellation Policy">
      <p>
        This Cancellation Policy describes the conditions under which orders and enrollments placed through the Proactive Business School ("PBS") portal may be cancelled.
      </p>

      <h2>1. Order Cancellation by Customer</h2>
      <ul>
        <li><strong>Before dispatch / before exam allotment:</strong> Orders may be cancelled free of charge as long as the course kit has not been dispatched and the exam has not been allotted to a student.</li>
        <li><strong>After dispatch:</strong> Cancellation is not permitted once the kit has been shipped; you may instead initiate a return as per our <a href="/refund-policy">Refund &amp; Returns Policy</a>.</li>
        <li><strong>After exam allotment / attempt:</strong> Exam fees are non-cancellable once the exam has been allotted, scheduled, or attempted by the registered student.</li>
      </ul>

      <h2>2. How to Cancel</h2>
      <p>
        To cancel an eligible order, raise a request from the Support section of your portal or email <a href="mailto:proactive.ho@gmail.com">proactive.ho@gmail.com</a> with your order number and registered center details.
      </p>

      <h2>3. Cancellation by PBS</h2>
      <p>
        We reserve the right to cancel any order in the following circumstances:
      </p>
      <ul>
        <li>Stock unavailability for the ordered course kit.</li>
        <li>Failure of payment verification or suspected fraudulent activity.</li>
        <li>Center status changed to "Inactive" or authorization withdrawn.</li>
        <li>Inaccurate or incomplete information provided during order placement.</li>
      </ul>
      <p>In such cases, any amount paid will be refunded in full to the original payment method via Razorpay within 5–7 working days.</p>

      <h2>4. Refund on Cancellation</h2>
      <p>
        Refunds arising out of approved cancellations are processed under our <a href="/refund-policy">Refund &amp; Returns Policy</a> and timelines stated therein.
      </p>

      <h2>5. Contact</h2>
      <p>
        For cancellation assistance, contact us at <a href="mailto:proactive.ho@gmail.com">proactive.ho@gmail.com</a> or +91 88798 08222.
      </p>
    </LegalLayout>
  );
}