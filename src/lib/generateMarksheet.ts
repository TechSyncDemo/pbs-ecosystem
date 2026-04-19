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
  marksObtained: number;
  totalMarks: number;
  graceMarks: number;
  certificateId: string; // for QR verification
}

const PRIMARY = '#0f4c81';
const ACCENT = '#c9a961';

function verificationUrl(id: string) {
  // Public verification endpoint (placeholder route)
  return `${window.location.origin}/verify/${id}`;
}

async function qrDataUrl(text: string) {
  return QRCode.toDataURL(text, { margin: 1, width: 256, color: { dark: '#000000', light: '#ffffff' } });
}

export async function generateMarksheet(data: MarksheetData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const cx = w / 2;

  // Outer border
  doc.setDrawColor(PRIMARY);
  doc.setLineWidth(1.2);
  doc.rect(8, 8, w - 16, h - 16);
  doc.setLineWidth(0.3);
  doc.rect(11, 11, w - 22, h - 22);

  // Header band
  doc.setFillColor(PRIMARY);
  doc.rect(11, 11, w - 22, 22, 'F');
  doc.setTextColor('#ffffff');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('PBS COMPUTER EDUCATION', cx, 22, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Statement of Marks', cx, 29, { align: 'center' });

  // Title strip
  doc.setFillColor(ACCENT);
  doc.rect(11, 33, w - 22, 8, 'F');
  doc.setTextColor('#ffffff');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('MARKSHEET', cx, 39, { align: 'center' });

  // Student details block
  doc.setTextColor('#000000');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  let y = 54;
  const labelX = 20;
  const valueX = 70;
  const rightLabelX = 115;
  const rightValueX = 160;

  const row = (l1: string, v1: string, l2?: string, v2?: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(l1, labelX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(v1, valueX, y);
    if (l2) {
      doc.setFont('helvetica', 'bold');
      doc.text(l2, rightLabelX, y);
      doc.setFont('helvetica', 'normal');
      doc.text(v2 ?? '', rightValueX, y);
    }
    y += 8;
  };

  row('Student Name', data.studentName, 'Enrollment No', data.enrollmentNo);
  row('Course', data.courseName, 'Course Code', data.courseCode ?? '-');
  row('Center', data.centerName, 'Center Code', data.centerCode ?? '-');
  row('Exam Date', new Date(data.examDate).toLocaleDateString(), 'Result Date', new Date(data.resultDate).toLocaleDateString());

  // Marks table
  y += 6;
  doc.setFillColor(PRIMARY);
  doc.rect(20, y, w - 40, 9, 'F');
  doc.setTextColor('#ffffff');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Particulars', 25, y + 6);
  doc.text('Marks', w - 25, y + 6, { align: 'right' });
  y += 9;

  const finalMarks = Number(data.marksObtained) + Number(data.graceMarks);
  const percent = data.totalMarks > 0 ? (finalMarks / data.totalMarks) * 100 : 0;
  const grade =
    percent >= 75 ? 'Distinction' : percent >= 60 ? 'First Class' : percent >= 50 ? 'Second Class' : percent >= 40 ? 'Pass' : 'Fail';

  doc.setTextColor('#000000');
  doc.setFont('helvetica', 'normal');
  const tableRow = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.rect(20, y, w - 40, 9);
    doc.text(label, 25, y + 6);
    doc.text(value, w - 25, y + 6, { align: 'right' });
    y += 9;
  };
  tableRow('Marks Obtained', `${data.marksObtained}`);
  tableRow('Grace Marks', `${data.graceMarks}`);
  tableRow('Total Marks', `${data.totalMarks}`);
  tableRow('Final Marks', `${finalMarks}`, true);
  tableRow('Percentage', `${percent.toFixed(2)}%`, true);
  tableRow('Grade', grade, true);
  tableRow('Result', percent >= 40 ? 'PASS' : 'FAIL', true);

  // QR + verification
  y += 10;
  try {
    const qr = await qrDataUrl(verificationUrl(data.certificateId));
    doc.addImage(qr, 'PNG', 20, y, 30, 30);
  } catch {
    /* ignore */
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor('#444444');
  doc.text('Scan QR to verify authenticity', 55, y + 8);
  doc.text(`Certificate ID: ${data.certificateId}`, 55, y + 14);
  doc.text(`Verify at: ${verificationUrl(data.certificateId)}`, 55, y + 20);

  // Signature
  doc.setDrawColor('#000000');
  doc.setLineWidth(0.3);
  doc.line(w - 70, h - 35, w - 20, h - 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor('#000000');
  doc.text('Authorized Signatory', w - 45, h - 30, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor('#666666');
  doc.text('This is a computer-generated document.', cx, h - 14, { align: 'center' });

  doc.save(`Marksheet_${data.enrollmentNo}.pdf`);
}

export async function generateMarksheetsBulk(items: MarksheetData[]) {
  if (items.length === 0) return;
  if (items.length === 1) return generateMarksheet(items[0]);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  for (let i = 0; i < items.length; i++) {
    if (i > 0) doc.addPage();
    await renderMarksheetOnDoc(doc, items[i]);
  }
  doc.save(`Marksheets_Bulk_${Date.now()}.pdf`);
}

async function renderMarksheetOnDoc(doc: jsPDF, data: MarksheetData) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const cx = w / 2;

  doc.setDrawColor(PRIMARY);
  doc.setLineWidth(1.2);
  doc.rect(8, 8, w - 16, h - 16);
  doc.setLineWidth(0.3);
  doc.rect(11, 11, w - 22, h - 22);

  doc.setFillColor(PRIMARY);
  doc.rect(11, 11, w - 22, 22, 'F');
  doc.setTextColor('#ffffff');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('PBS COMPUTER EDUCATION', cx, 22, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Statement of Marks', cx, 29, { align: 'center' });

  doc.setFillColor(ACCENT);
  doc.rect(11, 33, w - 22, 8, 'F');
  doc.setTextColor('#ffffff');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('MARKSHEET', cx, 39, { align: 'center' });

  doc.setTextColor('#000000');
  doc.setFontSize(11);
  let y = 54;
  const row = (l1: string, v1: string, l2?: string, v2?: string) => {
    doc.setFont('helvetica', 'bold'); doc.text(l1, 20, y);
    doc.setFont('helvetica', 'normal'); doc.text(v1, 70, y);
    if (l2) {
      doc.setFont('helvetica', 'bold'); doc.text(l2, 115, y);
      doc.setFont('helvetica', 'normal'); doc.text(v2 ?? '', 160, y);
    }
    y += 8;
  };
  row('Student Name', data.studentName, 'Enrollment No', data.enrollmentNo);
  row('Course', data.courseName, 'Course Code', data.courseCode ?? '-');
  row('Center', data.centerName, 'Center Code', data.centerCode ?? '-');
  row('Exam Date', new Date(data.examDate).toLocaleDateString(), 'Result Date', new Date(data.resultDate).toLocaleDateString());

  y += 6;
  doc.setFillColor(PRIMARY); doc.rect(20, y, w - 40, 9, 'F');
  doc.setTextColor('#ffffff'); doc.setFont('helvetica', 'bold');
  doc.text('Particulars', 25, y + 6);
  doc.text('Marks', w - 25, y + 6, { align: 'right' });
  y += 9;

  const finalMarks = Number(data.marksObtained) + Number(data.graceMarks);
  const percent = data.totalMarks > 0 ? (finalMarks / data.totalMarks) * 100 : 0;
  const grade = percent >= 75 ? 'Distinction' : percent >= 60 ? 'First Class' : percent >= 50 ? 'Second Class' : percent >= 40 ? 'Pass' : 'Fail';

  doc.setTextColor('#000000');
  const tr = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.rect(20, y, w - 40, 9);
    doc.text(label, 25, y + 6);
    doc.text(value, w - 25, y + 6, { align: 'right' });
    y += 9;
  };
  tr('Marks Obtained', `${data.marksObtained}`);
  tr('Grace Marks', `${data.graceMarks}`);
  tr('Total Marks', `${data.totalMarks}`);
  tr('Final Marks', `${finalMarks}`, true);
  tr('Percentage', `${percent.toFixed(2)}%`, true);
  tr('Grade', grade, true);
  tr('Result', percent >= 40 ? 'PASS' : 'FAIL', true);

  y += 10;
  try {
    const qr = await qrDataUrl(verificationUrl(data.certificateId));
    doc.addImage(qr, 'PNG', 20, y, 30, 30);
  } catch { /* */ }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor('#444444');
  doc.text('Scan QR to verify authenticity', 55, y + 8);
  doc.text(`Certificate ID: ${data.certificateId}`, 55, y + 14);
  doc.text(`Verify at: ${verificationUrl(data.certificateId)}`, 55, y + 20);

  doc.setDrawColor('#000000'); doc.setLineWidth(0.3);
  doc.line(w - 70, h - 35, w - 20, h - 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor('#000000');
  doc.text('Authorized Signatory', w - 45, h - 30, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor('#666666');
  doc.text('This is a computer-generated document.', cx, h - 14, { align: 'center' });
}
