import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface CertificateData {
  studentName: string;
  enrollmentNo: string;
  centerName: string;
  centerCode?: string;
  courseName: string;
  courseDuration?: string;
  resultDate: string;
  grade: string;
  certificateId: string;
}

const PRIMARY = '#0f4c81';
const ACCENT = '#c9a961';

function verificationUrl(id: string) {
  return `${window.location.origin}/verify/${id}`;
}

async function qrDataUrl(text: string) {
  return QRCode.toDataURL(text, { margin: 1, width: 256 });
}

async function renderCertOnDoc(doc: jsPDF, data: CertificateData) {
  const w = doc.internal.pageSize.getWidth(); // 297
  const h = doc.internal.pageSize.getHeight(); // 210
  const cx = w / 2;

  // Decorative borders
  doc.setDrawColor(PRIMARY);
  doc.setLineWidth(2);
  doc.rect(8, 8, w - 16, h - 16);
  doc.setDrawColor(ACCENT);
  doc.setLineWidth(0.8);
  doc.rect(12, 12, w - 24, h - 24);
  doc.setDrawColor(PRIMARY);
  doc.setLineWidth(0.3);
  doc.rect(15, 15, w - 30, h - 30);

  // Top accent
  doc.setFillColor(PRIMARY);
  doc.rect(15, 15, w - 30, 14, 'F');
  doc.setTextColor('#ffffff');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('PBS COMPUTER EDUCATION', cx, 25, { align: 'center' });

  // Title
  doc.setTextColor(PRIMARY);
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(36);
  doc.text('Certificate of Completion', cx, 50, { align: 'center' });

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor('#444444');
  doc.text('This certificate is proudly presented to', cx, 62, { align: 'center' });

  // Student name
  doc.setFont('times', 'bold');
  doc.setFontSize(30);
  doc.setTextColor('#000000');
  doc.text(data.studentName, cx, 80, { align: 'center' });

  // Underline under name
  doc.setDrawColor(ACCENT);
  doc.setLineWidth(0.6);
  const nameWidth = doc.getTextWidth(data.studentName);
  doc.line(cx - nameWidth / 2 - 10, 84, cx + nameWidth / 2 + 10, 84);

  // Body text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor('#222222');
  doc.text(`for successfully completing the course`, cx, 96, { align: 'center' });

  // Course name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(PRIMARY);
  doc.text(data.courseName, cx, 108, { align: 'center' });

  // Details line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor('#222222');
  const detailLine = `at ${data.centerName}${data.centerCode ? ` (${data.centerCode})` : ''}`;
  doc.text(detailLine, cx, 118, { align: 'center' });
  doc.text(
    `with grade ${data.grade} on ${new Date(data.resultDate).toLocaleDateString()}.`,
    cx,
    126,
    { align: 'center' }
  );

  // Bottom row: QR (left), Enrollment (center), Signature (right)
  try {
    const qr = await qrDataUrl(verificationUrl(data.certificateId));
    doc.addImage(qr, 'PNG', 25, h - 55, 28, 28);
  } catch { /* */ }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor('#555555');
  doc.text('Scan to verify', 39, h - 23, { align: 'center' });

  // Center info
  doc.setFontSize(10);
  doc.setTextColor('#000000');
  doc.setFont('helvetica', 'bold');
  doc.text('Enrollment No', cx, h - 45, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(data.enrollmentNo, cx, h - 38, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Certificate ID', cx, h - 30, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(data.certificateId, cx, h - 24, { align: 'center' });

  // Signature
  doc.setDrawColor('#000000');
  doc.setLineWidth(0.4);
  doc.line(w - 75, h - 35, w - 25, h - 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor('#000000');
  doc.text('Director', w - 50, h - 30, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor('#666666');
  doc.text('PBS Computer Education', w - 50, h - 25, { align: 'center' });
}

export async function generateCertificate(data: CertificateData) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  await renderCertOnDoc(doc, data);
  doc.save(`Certificate_${data.enrollmentNo}.pdf`);
}

export async function generateCertificatesBulk(items: CertificateData[]) {
  if (items.length === 0) return;
  if (items.length === 1) return generateCertificate(items[0]);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  for (let i = 0; i < items.length; i++) {
    if (i > 0) doc.addPage();
    await renderCertOnDoc(doc, items[i]);
  }
  doc.save(`Certificates_Bulk_${Date.now()}.pdf`);
}
