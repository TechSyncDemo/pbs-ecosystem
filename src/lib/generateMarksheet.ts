import jsPDF from 'jspdf';
import marksheetTemplateSrc from '@/assets/marksheet-template.jpg';

export interface MarksheetData {
  studentName: string;
  enrollmentNo: string;
  centerName: string;
  centerCode?: string;
  centerCity?: string | null;
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
  certificateNo?: string | null;
  provisional?: boolean;
  subjects?: string[];
  plainBackground?: boolean;
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

function serialNo(data: MarksheetData) {
  // Same unique code used at exam sign-in and on the verify-certificate page.
  return (data.certificateNo || data.certificateId || '').toString().toUpperCase();
}

function rollNoFrom(data: MarksheetData) {
  // Roll No should be the candidate's PBS enrollment number.
  return data.enrollmentNo || serialNo(data);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const mon = d.toLocaleString('en-US', { month: 'short' });
  return `${day} ${mon} ${d.getFullYear()}`;
}

function numberToWords(n: number): string {
  if (!Number.isFinite(n)) return '';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const inWords = (num: number): string => {
    if (num === 0) return 'Zero';
    if (num < 20) return a[num];
    if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? ' ' + a[num % 10] : '');
    if (num < 1000) return a[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + inWords(num % 100) : '');
    if (num < 100000) return inWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + inWords(num % 1000) : '');
    return String(num);
  };
  return inWords(Math.floor(n));
}

function gradeOf(percent: number): string {
  if (percent >= 75) return 'A+';
  if (percent >= 60) return 'A';
  if (percent >= 50) return 'B';
  if (percent >= 40) return 'C';
  return 'F';
}

function drawProvisionalWatermark(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const anyDoc = doc as unknown as { GState?: new (o: { opacity: number }) => unknown; setGState?: (s: unknown) => void };
  if (anyDoc.GState && anyDoc.setGState) anyDoc.setGState(new anyDoc.GState({ opacity: 0.18 }));
  doc.setTextColor('#b00020');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(70);
  doc.text('PROVISIONAL COPY', w / 2, h / 2, { align: 'center', angle: 30 });
  if (anyDoc.GState && anyDoc.setGState) anyDoc.setGState(new anyDoc.GState({ opacity: 1 }));
  doc.setTextColor('#000000');
}

async function renderMarksheetOnDoc(doc: jsPDF, data: MarksheetData, templateData: string) {
  const w = doc.internal.pageSize.getWidth(); // ~215.9 (letter mm)
  const h = doc.internal.pageSize.getHeight(); // ~279.4

  if (!data.plainBackground) {
    doc.addImage(templateData, 'JPEG', 0, 0, w, h);
  }

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  // Header info block (Roll No / Candidate Name / Center / Course)
  const leftX = 20;
  let y = 78;
  const label = (k: string, v: string, maxWidth?: number) => {
    doc.setFont('helvetica', 'normal');
    doc.text(`${k} : `, leftX, y);
    const kw = doc.getTextWidth(`${k} : `);
    doc.setFont('helvetica', 'bold');
    doc.text(v, leftX + kw, y, { maxWidth: maxWidth ?? (w - leftX - kw - 15) });
    const lines = doc.splitTextToSize(v, maxWidth ?? (w - leftX - kw - 15)).length;
    y += 6 * lines + 1;
  };
  label('Roll No', rollNoFrom(data));
  label('Candidate Name', data.studentName);
  label('Center', `${data.centerName}${data.centerCity ? ', ' + data.centerCity : ''}`);
  label('Course', data.courseName);

  // Marks table
  const tableX = leftX;
  const tableW = w - leftX * 2;
  const col1W = tableW * 0.55; // Subject
  const col2W = tableW * 0.16; // Maximum Marks
  const col3W = tableW * 0.16; // Marks Obtained
  const col4W = tableW - col1W - col2W - col3W; // Remark

  let ty = y + 4;
  // Header row
  doc.setFillColor(245, 245, 245);
  doc.rect(tableX, ty, tableW, 9, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(tableX, ty, col1W, 9);
  doc.rect(tableX + col1W, ty, col2W, 9);
  doc.rect(tableX + col1W + col2W, ty, col3W, 9);
  doc.rect(tableX + col1W + col2W + col3W, ty, col4W, 9);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Subject', tableX + col1W / 2, ty + 6, { align: 'center' });
  doc.text('Maximum\nMarks', tableX + col1W + col2W / 2, ty + 4, { align: 'center' });
  doc.text('Marks\nObtained', tableX + col1W + col2W + col3W / 2, ty + 4, { align: 'center' });
  doc.text('Remark', tableX + col1W + col2W + col3W + col4W / 2, ty + 6, { align: 'center' });
  ty += 9;

  // Theory row — bulleted subjects
  const subjects = data.subjects && data.subjects.length > 0
    ? data.subjects
    : [data.courseName];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const bulletLineH = 5.5;
  const theoryRowH = Math.max(28, subjects.length * bulletLineH + 6);
  doc.rect(tableX, ty, col1W, theoryRowH);
  doc.rect(tableX + col1W, ty, col2W, theoryRowH);
  doc.rect(tableX + col1W + col2W, ty, col3W, theoryRowH);
  doc.rect(tableX + col1W + col2W + col3W, ty, col4W, theoryRowH);
  let sy = ty + 5;
  for (const sub of subjects) {
    const wrapped = doc.splitTextToSize(`• ${sub}`, col1W - 6);
    doc.text(wrapped, tableX + 3, sy);
    sy += wrapped.length * bulletLineH;
  }
  doc.text(String(data.theoryTotal), tableX + col1W + col2W / 2, ty + theoryRowH / 2 + 1, { align: 'center' });
  doc.text(String(data.theoryMarks), tableX + col1W + col2W + col3W / 2, ty + theoryRowH / 2 + 1, { align: 'center' });
  doc.text('-', tableX + col1W + col2W + col3W + col4W / 2, ty + theoryRowH / 2 + 1, { align: 'center' });
  ty += theoryRowH;

  // Practical / Project row
  const rowH = 9;
  doc.rect(tableX, ty, col1W, rowH);
  doc.rect(tableX + col1W, ty, col2W, rowH);
  doc.rect(tableX + col1W + col2W, ty, col3W, rowH);
  doc.rect(tableX + col1W + col2W + col3W, ty, col4W, rowH);
  doc.text('Practical / Project', tableX + 3, ty + 6);
  doc.text(String(data.practicalTotal), tableX + col1W + col2W / 2, ty + 6, { align: 'center' });
  doc.text(String(data.practicalMarks), tableX + col1W + col2W + col3W / 2, ty + 6, { align: 'center' });
  doc.text('-', tableX + col1W + col2W + col3W + col4W / 2, ty + 6, { align: 'center' });
  ty += rowH;

  // Total row
  const percent = data.totalMarks > 0 ? (data.finalMarks / data.totalMarks) * 100 : 0;
  const grade = gradeOf(percent);
  const result = percent >= 40 ? 'PASS' : 'FAIL';
  doc.setFont('helvetica', 'bold');
  doc.rect(tableX, ty, col1W, rowH);
  doc.rect(tableX + col1W, ty, col2W, rowH);
  doc.rect(tableX + col1W + col2W, ty, col3W, rowH);
  doc.rect(tableX + col1W + col2W + col3W, ty, col4W, rowH);
  doc.text('Total', tableX + 3, ty + 6);
  doc.text(String(data.totalMarks), tableX + col1W + col2W / 2, ty + 6, { align: 'center' });
  doc.text(String(data.finalMarks), tableX + col1W + col2W + col3W / 2, ty + 6, { align: 'center' });
  doc.text(result, tableX + col1W + col2W + col3W + col4W / 2, ty + 6, { align: 'center' });
  ty += rowH;

  // Result row — percentage (rounded) converted to grade
  doc.setFont('helvetica', 'bold');
  doc.rect(tableX, ty, col1W, rowH);
  doc.rect(tableX + col1W, ty, col2W + col3W, rowH);
  doc.rect(tableX + col1W + col2W + col3W, ty, col4W, rowH);
  doc.text('Result (Percentage / Grade)', tableX + 3, ty + 6);
  doc.text(`${Math.round(percent)} %`, tableX + col1W + (col2W + col3W) / 2, ty + 6, { align: 'center' });
  doc.text(grade, tableX + col1W + col2W + col3W + col4W / 2, ty + 6, { align: 'center' });
  ty += rowH;

  // Marks in words
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Marks In Word : ${numberToWords(data.finalMarks)}`, leftX, ty + 8);

  // S/N, Date (result declaration date), Place at bottom-left
  const sn = serialNo(data);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const metaY = 230;
  doc.text(`S/N   : ${sn}`, 22, metaY);
  doc.text(`Date  : ${formatDate(data.resultDate)}`, 22, metaY + 7);
  doc.text(`Place : Mumbai`, 22, metaY + 14);

  if (data.provisional) drawProvisionalWatermark(doc);
}

export async function generateMarksheet(data: MarksheetData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const templateData = await loadImage(marksheetTemplateSrc);
  await renderMarksheetOnDoc(doc, data, templateData);
  doc.save(`${data.provisional ? 'Provisional_' : ''}Marksheet_${data.enrollmentNo}.pdf`);
}

export async function generateMarksheetsBulk(items: MarksheetData[]) {
  if (items.length === 0) return;
  if (items.length === 1) return generateMarksheet(items[0]);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const templateData = await loadImage(marksheetTemplateSrc);
  for (let i = 0; i < items.length; i++) {
    if (i > 0) doc.addPage();
    await renderMarksheetOnDoc(doc, items[i], templateData);
  }
  doc.save(`${items[0].provisional ? 'Provisional_' : ''}Marksheets_Bulk_${Date.now()}.pdf`);
}
