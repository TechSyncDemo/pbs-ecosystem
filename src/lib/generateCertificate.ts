import jsPDF from 'jspdf';
import certificateTemplateSrc from '@/assets/cbitvt-certificate-template.jpg';

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
  certificateNo?: string | null;
  provisional?: boolean;
}

async function loadImage(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Canvas not supported');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = reject;
    img.src = src;
  });
}

function serialNo(data: CertificateData) {
  // S/N matches the unique exam sign-in / certificate code used on the
  // verify-certificate page so the same value is verifiable end-to-end.
  return (data.certificateNo || data.certificateId || '').toString().toUpperCase();
}

function monthYear(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { month: '', year: '' };
  return {
    month: d.toLocaleString('en-US', { month: 'long' }),
    year: String(d.getFullYear()),
  };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const mon = d.toLocaleString('en-US', { month: 'short' });
  return `${day} ${mon} ${d.getFullYear()}`;
}

async function renderCertOnDoc(doc: jsPDF, data: CertificateData, templateData: string) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const cx = w / 2;

  doc.addImage(templateData, 'JPEG', 0, 0, w, h);

  doc.setTextColor(0, 0, 0);

  const bodySize = 14;
  const nameSize = 20;
  const courseSize = 16;

  const { month, year } = monthYear(data.resultDate);
  const gradeText = data.grade;
  const dateText = `${month}' ${year}`;

  // Helper to measure text width for positioning calculations
  const measure = (text: string, style: string, size: number) => {
    doc.setFont('times', style);
    doc.setFontSize(size);
    return doc.getTextWidth(text);
  };

  // Line 1: "This Certificate is awarded to"
  doc.setFont('times', 'italic');
  doc.setFontSize(bodySize);
  doc.text('This Certificate is awarded to', cx, 96, { align: 'center' });

  // Candidate name — bold italic, prominent
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(nameSize);
  doc.text(data.studentName, cx, 108, { align: 'center', maxWidth: w - 50 });

  // Line 3: "the within signed [BOX] upon successful completion of the"
  const segBeforeBox = 'the within signed ';
  const segAfterBox = ' upon successful completion of the';
  const boxW = 35;
  const boxH = 8;
  const wBefore = measure(segBeforeBox, 'italic', bodySize);
  const wAfter = measure(segAfterBox, 'italic', bodySize);
  const totalLine3 = wBefore + boxW + wAfter;
  const startX3 = (w - totalLine3) / 2;

  doc.setFont('times', 'italic');
  doc.setFontSize(bodySize);
  doc.text(segBeforeBox, startX3, 124);
  // Draw signature box
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(startX3 + wBefore, 124 - 6, boxW, boxH);
  doc.text(segAfterBox, startX3 + wBefore + boxW, 124);

  // Course / subject name — bold italic
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(courseSize);
  doc.text(data.courseName, cx, 138, { align: 'center', maxWidth: w - 60 });

  // Line 5: "having passed the examination with [GRADE] Grade on [MONTH YEAR]"
  const seg5a = 'having passed the examination with ';
  const seg5b = ' Grade on ';
  const w5a = measure(seg5a, 'italic', bodySize);
  const w5grade = measure(gradeText, 'bolditalic', bodySize);
  const w5b = measure(seg5b, 'italic', bodySize);
  const w5date = measure(dateText, 'bolditalic', bodySize);
  const totalLine5 = w5a + w5grade + w5b + w5date;
  const startX5 = (w - totalLine5) / 2;

  doc.setFont('times', 'italic');
  doc.setFontSize(bodySize);
  doc.text(seg5a, startX5, 154);
  let x5 = startX5 + w5a;
  doc.setFont('times', 'bolditalic');
  doc.text(gradeText, x5, 154);
  x5 += w5grade;
  doc.setFont('times', 'italic');
  doc.text(seg5b, x5, 154);
  x5 += w5b;
  doc.setFont('times', 'bolditalic');
  doc.text(dateText, x5, 154);

  // Line 6: "in witness whereof..."
  doc.setFont('times', 'italic');
  doc.setFontSize(bodySize);
  doc.text('in witness whereof is set the signature and seal of the Director, cbitvt.', cx, 168, { align: 'center', maxWidth: w - 40 });

  // Bottom-left meta block
  const sn = serialNo(data);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  const metaY = 230;
  doc.text(`S/N   : ${sn}`, 22, metaY);
  doc.text(`Date  : ${formatDate(new Date().toISOString())}`, 22, metaY + 7);
  doc.text(`Place : Mumbai`, 22, metaY + 14);

  if (data.provisional) {
    const anyDoc = doc as unknown as { GState?: new (o: { opacity: number }) => unknown; setGState?: (s: unknown) => void };
    if (anyDoc.GState && anyDoc.setGState) anyDoc.setGState(new anyDoc.GState({ opacity: 0.18 }));
    doc.setTextColor(176, 0, 32);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(90);
    doc.text('PROVISIONAL', cx, h / 2, { align: 'center', angle: 20 });
    if (anyDoc.GState && anyDoc.setGState) anyDoc.setGState(new anyDoc.GState({ opacity: 1 }));
  }
}

export async function generateCertificate(data: CertificateData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const templateData = await loadImage(certificateTemplateSrc);
  await renderCertOnDoc(doc, data, templateData);
  doc.save(`${data.provisional ? 'Provisional_' : ''}Certificate_${data.enrollmentNo}.pdf`);
}

export async function generateCertificatesBulk(items: CertificateData[]) {
  if (items.length === 0) return;
  if (items.length === 1) return generateCertificate(items[0]);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const templateData = await loadImage(certificateTemplateSrc);
  for (let i = 0; i < items.length; i++) {
    if (i > 0) doc.addPage();
    await renderCertOnDoc(doc, items[i], templateData);
  }
  doc.save(`${items[0].provisional ? 'Provisional_' : ''}Certificates_Bulk_${Date.now()}.pdf`);
}
