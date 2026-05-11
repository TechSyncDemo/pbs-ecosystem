import LegalLayout from './LegalLayout';

export default function RefundPolicy() {
  return (
    <LegalLayout title="Refund & Returns Policy">
      <p>
        This Refund &amp; Returns Policy explains the conditions under which refunds and returns are processed for orders placed through the Proactive Business School ("PBS") portal. By placing an order or making a payment, you agree to this policy.
      </p>

      <h2>1. Nature of Products</h2>
      <ul>
        <li><strong>Course kits (Book + Exam):</strong> physical study material bundled with an examination entitlement.</li>
        <li><strong>Exam-only enrollments:</strong> digital examination entitlement allotted to a registered student.</li>
        <li><strong>Certificates &amp; mark-sheets:</strong> issued digitally upon successful completion.</li>
      </ul>

      <h2>2. Eligibility for Refund</h2>
      <ul>
        <li>Duplicate payment for the same order due to a technical/payment-gateway error.</li>
        <li>Order not delivered (course kit) within 21 working days of dispatch confirmation.</li>
        <li>Damaged or defective course kit reported within 7 days of receipt with photographic evidence.</li>
        <li>Exam allotment failure that cannot be resolved by our support team.</li>
      </ul>

      <h2>3. Non-Refundable Items</h2>
      <ul>
        <li>Exam fees once the exam has been attempted, started, or auto-allotted to the student account.</li>
        <li>Course kits once they have been opened, used, or marked for student admission (stock decrement).</li>
        <li>Certificates and mark-sheets that have already been generated/downloaded.</li>
        <li>Charges related to bank fees, payment gateway fees, or currency conversion levied by third parties.</li>
      </ul>

      <h2>4. Returns Process (Course Kits)</h2>
      <ul>
        <li>Raise a return request from the Support section within 7 days of receipt.</li>
        <li>Include order number, photos, and a brief description of the issue.</li>
        <li>Once approved, ship the item back to the address provided by our support team. Return shipping cost is borne by the customer unless the item is defective or wrongly shipped.</li>
        <li>After inspection, an eligible refund or replacement will be initiated.</li>
      </ul>

      <h2>5. Refund Timelines</h2>
      <ul>
        <li>Approved refunds are initiated within <strong>5–7 working days</strong> of approval.</li>
        <li>Refunds are processed back to the original payment method via Razorpay.</li>
        <li>Depending on your bank/UPI/card issuer, the amount may take an additional <strong>5–10 working days</strong> to reflect.</li>
      </ul>

      <h2>6. How to Request a Refund</h2>
      <p>
        Email <a href="mailto:proactive.ho@gmail.com">proactive.ho@gmail.com</a> or raise a ticket from the Support section of your center portal with:
      </p>
      <ul>
        <li>Order number / payment reference (Razorpay transaction ID)</li>
        <li>Registered center name and contact number</li>
        <li>Reason for refund along with supporting evidence (where applicable)</li>
      </ul>

      <h2>7. Contact</h2>
      <p>
        For any refund or return queries, contact us at <a href="mailto:proactive.ho@gmail.com">proactive.ho@gmail.com</a> or +91 88798 08222.
      </p>
    </LegalLayout>
  );
}