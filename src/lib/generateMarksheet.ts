import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface MarksheetData {
  studentName: string;
  enrollmentNo: string;
  centerName: string;
  centerCode?: string;
  courseName: string;
  courseCode?: string;
  examDate: string;
  resultDate: string;
  theoryMarks: number;
  theoryTotal: number;
  theoryGrace: number;
  practicalMarks: number;
  practicalTotal: number;
  practicalGrace: number;
  finalMarks: number;
  totalMarks: number;
  certificateId: string;
  provisional?: boolean;
}

const PRIMARY = '#0f4c81';
const ACCENT = '#c9a961';

function verificationUrl(id: string) {
  return `${window.location.origin}/verify/${id}`;
}

async function qrDataUrl(text: string) {
  return QRCode.toDataURL(text, { margin: 1, width: 256, color: { dark: '#000000', light: '#ffffff' } });
}

function drawProvisionalWatermark(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const anyDoc = doc as unknown as { GState?: new (o: { opacity: number }) => unknown; setGState?: (s: unknown) => void };
  if (anyDoc.GState && anyDoc.setGState) anyDoc.setGState(new anyDoc.GState({ opacity: 0.18 }));
  doc.setTextColor('#b00020');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(80);
  doc.text('PROVISIONAL', w / 2, h / 2, { align: 'center', angle: 30 });
  if (anyDoc.GState && anyDoc.setGState) anyDoc.setGState(new anyDoc.GState({ opacity: 1 }));
  doc.setTextColor('#000000');
}

async function renderMarksheetOnDoc(doc: jsPDF, data: MarksheetData) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const cx = w / 2;

  doc.setDrawColor(PRIMARY); doc.setLineWidth(1.2); doc.rect(8, 8, w - 16, h - 16);
  doc.setLineWidth(0.3); doc.rect(11, 11, w - 22, h - 22);

  doc.setFillColor(PRIMARY); doc.rect(11, 11, w - 22, 22, 'F');
  doc.setTextColor('#ffffff'); doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
  doc.text('PBS COMPUTER EDUCATION', cx, 22, { align: 'center' });
  doc.setFontSize(11); doc.setFont('helvetica', 'normal');
  doc.text('Statement of Marks', cx, 29, { align: 'center' });

  doc.setFillColor(ACCENT); doc.rect(11, 33, w - 22, 8, 'F');
  doc.setTextColor('#ffffff'); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text(data.provisional ? 'PROVISIONAL MARKSHEET' : 'MARKSHEET', cx, 39, { align: 'center' });

  doc.setTextColor('#000000'); doc.setFontSize(11);
  let y = 54;
  const row = (l1: string, v1: string, l2?: string, v2?: string) => {
    doc.setFont('helvetica', 'bold'); doc.text(l1, 20, y);
    doc.setFont('helvetica', 'normal'); doc.text(v1, 70, y);
    if (l2) { doc.setFont('helvetica', 'bold'); doc.text(l2, 115, y);
      doc.setFont('helvetica', 'normal'); doc.text(v2 ?? '', 160, y); }
    y += 8;
  };
  row('Student Name', data.studentName, 'Enrollment No', data.enrollmentNo);
  row('Course', data.courseName, 'Course Code', data.courseCode ?? '-');
  row('Center', data.centerName, 'Center Code', data.centerCode ?? '-');
  row('Exam Date', new Date(data.examDate).toLocaleDateString(), 'Result Date', new Date(data.resultDate).toLocaleDateString());

  y += 6;
  doc.setFillColor(PRIMARY); doc.rect(20, y, w - 40, 9, 'F');
  doc.setTextColor('#ffffff'); doc.setFont('helvetica', 'bold');
  doc.text('Subject', 25, y + 6);
  doc.text('Obtained', w - 90, y + 6);
  doc.text('Grace', w - 60, y + 6);
  doc.text('Max', w - 25, y + 6, { align: 'right' });
  y += 9;

  doc.setTextColor('#000000');
  const r4 = (sub: string, m: number, g: number, max: number, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.rect(20, y, w - 40, 9);
    doc.text(sub, 25, y + 6);
    doc.text(String(m), w - 90, y + 6);
    doc.text(String(g), w - 60, y + 6);
    doc.text(String(max), w - 25, y + 6, { align: 'right' });
    y += 9;
  };
  r4('Theory', data.theoryMarks, data.theoryGrace, data.theoryTotal);
  r4('Practical', data.practicalMarks, data.practicalGrace, data.practicalTotal);
  r4('Total', data.finalMarks, data.theoryGrace + data.practicalGrace, data.totalMarks, true);

  const percent = data.totalMarks > 0 ? (data.finalMarks / data.totalMarks) * 100 : 0;
  const grade = percent >= 75 ? 'Distinction' : percent >= 60 ? 'First Class' : percent >= 50 ? 'Second Class' : percent >= 40 ? 'Pass' : 'Fail';
  y += 4;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text(`Percentage: ${percent.toFixed(2)}%`, 20, y); y += 7;
  doc.text(`Grade: ${grade}`, 20, y); y += 7;
  doc.text(`Result: ${percent >= 40 ? 'PASS' : 'FAIL'}`, 20, y); y += 10;

  try { const qr = await qrDataUrl(verificationUrl(data.certificateId)); doc.addImage(qr, 'PNG', 20, y, 30, 30); } catch { /* */ }
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor('#444444');
  doc.text('Scan QR to verify authenticity', 55, y + 8);
  doc.text(`Certificate ID: ${data.certificateId}`, 55, y + 14);
  doc.text(`Verify at: ${verificationUrl(data.certificateId)}`, 55, y + 20);

  doc.setDrawColor('#000000'); doc.setLineWidth(0.3);
  doc.line(w - 70, h - 35, w - 20, h - 35);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor('#000000');
  doc.text('Authorized Signatory', w - 45, h - 30, { align: 'center' });
  doc.setFontSize(8); doc.setTextColor('#666666');
  doc.text(data.provisional
    ? 'This is a provisional document — final marksheet will be issued in due course.'
    : 'This is a computer-generated document.', cx, h - 14, { align: 'center' });

  if (data.provisional) drawProvisionalWatermark(doc);
}

export async function generateMarksheet(data: MarksheetData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  await renderMarksheetOnDoc(doc, data);
  doc.save(`${data.provisional ? 'Provisional_' : ''}Marksheet_${data.enrollmentNo}.pdf`);
}

export async function generateMarksheetsBulk(items: MarksheetData[]) {
  if (items.length === 0) return;
  if (items.length === 1) return generateMarksheet(items[0]);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  for (let i = 0; i < items.length; i++) {
    if (i > 0) doc.addPage();
    await renderMarksheetOnDoc(doc, items[i]);
  }
  doc.save(`${items[0].provisional ? 'Provisional_' : ''}Marksheets_Bulk_${Date.now()}.pdf`);
}
