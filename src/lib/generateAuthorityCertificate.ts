import jsPDF from 'jspdf';

interface CertificateData {
  authorizationName: string;
  authorizationCode: string;
  centerName: string;
  centerCode: string;
  courseName: string;
  courseCode: string;
  validFrom: string;
  validUntil: string;
  certificateNo: string;
}

export function generateAuthorityCertificate(data: CertificateData) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Border
  doc.setDrawColor(0, 102, 153);
  doc.setLineWidth(2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
  doc.setLineWidth(0.5);
  doc.rect(14, 14, pageWidth - 28, pageHeight - 28);

  // Header
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text('PROACTIVE BUSINESS SCHOOL', pageWidth / 2, 30, { align: 'center' });

  doc.setFontSize(28);
  doc.setTextColor(0, 80, 130);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICATE OF AUTHORIZATION', pageWidth / 2, 45, { align: 'center' });

  // Decorative line
  doc.setDrawColor(0, 102, 153);
  doc.setLineWidth(1);
  doc.line(60, 50, pageWidth - 60, 50);

  // Body
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  doc.text('This is to certify that', pageWidth / 2, 65, { align: 'center' });

  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(data.centerName, pageWidth / 2, 78, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(`(Center Code: ${data.centerCode})`, pageWidth / 2, 86, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text('has been authorized under the specialization', pageWidth / 2, 98, { align: 'center' });

  doc.setFontSize(18);
  doc.setTextColor(0, 80, 130);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.authorizationName} (${data.authorizationCode})`, pageWidth / 2, 110, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(`for the course: ${data.courseName} (${data.courseCode})`, pageWidth / 2, 122, { align: 'center' });

  // Validity
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(`Valid From: ${data.validFrom}`, pageWidth / 2 - 40, 140, { align: 'center' });
  doc.text(`Valid Until: ${data.validUntil}`, pageWidth / 2 + 40, 140, { align: 'center' });

  // Certificate number
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`Certificate No: ${data.certificateNo}`, pageWidth / 2, 155, { align: 'center' });

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('Authorized Signatory', pageWidth - 60, pageHeight - 30, { align: 'center' });
  doc.line(pageWidth - 90, pageHeight - 33, pageWidth - 30, pageHeight - 33);

  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 40, pageHeight - 30, { align: 'center' });

  doc.save(`Authorization_Certificate_${data.certificateNo}.pdf`);
}
