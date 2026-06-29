import jsPDF from 'jspdf';
import certificateTemplateSrc from '@/assets/cbitvt-certificate-template.jpg';

export interface CertificateData {
  studentName: string;
  enrollmentNo: string;
  centerName: string;
  centerCode?: string;
  centerCity?: string | null;
  courseName: string;
  courseDuration?: string;
  resultDate: string;
  grade: string;
  certificateId: string;
  certificateNo?: string | null;
  provisional?: boolean;
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

function serialNo(data: CertificateData) {
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

function toTitleCase(str: string): string {
  if (!str) return str;
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buffer]);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

let birthstoneFontPromise: Promise<string | null> | null = null;
let robotoFontPromise: Promise<string | null> | null = null;

async function loadBirthstoneFont(): Promise<string | null> {
  if (birthstoneFontPromise) return birthstoneFontPromise;

  birthstoneFontPromise = (async () => {
    try {
      const response = await fetch('/fonts/Birthstone-Regular.ttf');
      if (!response.ok) return null;
      const buffer = await response.arrayBuffer();
      return await arrayBufferToBase64(buffer);
    } catch {
      return null;
    }
  })();

  return birthstoneFontPromise;
}

async function loadRobotoFont(): Promise<string | null> {
  if (robotoFontPromise) return robotoFontPromise;

  robotoFontPromise = (async () => {
    try {
      const response = await fetch('/fonts/Roboto-Regular.ttf');
      if (!response.ok) return null;
      const buffer = await response.arrayBuffer();
      return await arrayBufferToBase64(buffer);
    } catch {
      return null;
    }
  })();

  return robotoFontPromise;
}

async function renderCertOnDoc(
  doc: jsPDF,
  data: CertificateData,
  templateData: string,
  fontBase64: string | null,
  robotoBase64: string | null
) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const cx = w / 2;

  if (!data.plainBackground) {
    doc.addImage(templateData, 'JPEG', 0, 0, w, h);
  }

  // Register custom Birthstone font if available
  const fontFamily = fontBase64 ? 'Birthstone' : 'times';
  if (fontBase64) {
    doc.addFileToVFS('Birthstone.ttf', fontBase64);
    doc.addFont('Birthstone.ttf', 'Birthstone', 'normal');
    doc.addFont('Birthstone.ttf', 'Birthstone', 'bold');
    doc.addFont('Birthstone.ttf', 'Birthstone', 'italic');
    doc.addFont('Birthstone.ttf', 'Birthstone', 'bolditalic');
  }

  // Register Roboto font for meta block
  const metaFontFamily = robotoBase64 ? 'Roboto' : 'helvetica';
  if (robotoBase64) {
    doc.addFileToVFS('Roboto.ttf', robotoBase64);
    doc.addFont('Roboto.ttf', 'Roboto', 'normal');
  }

  doc.setTextColor(0, 0, 0);

  const bodySize = 24;
  const nameSize = 36;
  const courseSize = 25;
  const gradeSize = 25;

  // Helper: render "bolder" text by overprinting with a tiny offset.
  // Birthstone only ships Regular, so jsPDF's bold style is synthetic;
  // overprinting gives a genuinely darker, heavier stroke.
  const drawBold = (
    text: string,
    x: number,
    y: number,
    opts?: { align?: 'left' | 'center' | 'right'; maxWidth?: number }
  ) => {
    doc.setTextColor(0, 0, 0);
    doc.text(text, x, y, opts);
    doc.text(text, x + 0.15, y, opts);
    doc.text(text, x, y + 0.15, opts);
    doc.text(text, x + 0.15, y + 0.15, opts);
  };

  const { month, year } = monthYear(data.resultDate);
  const gradeText = data.grade;
  const dateText = `${month}' ${year}`;
  const studentName = toTitleCase(data.studentName);

  const measure = (text: string, style: string, size: number) => {
    doc.setFont(fontFamily, style);
    doc.setFontSize(size);
    return doc.getTextWidth(text);
  };

  // Vertical baselines — extra breathing room around the course name for
  // easier reading.
  const yL1 = 98;
  const yName = 118;
  const yL3 = 138;
  const yCourse = 160;     // more space above course title
  const yL5 = 188;          // more space below course title
  const yL6 = 206;

  // Subtle character spacing — wide enough to aid legibility but tight
  // enough to prevent glyph overlap with the calligraphic font.
  const bodyCharSpace = 0.2;
  const nameCharSpace = 0.4;
  const courseCharSpace = 0.3;
  doc.setCharSpace?.(bodyCharSpace);

  // Line 1: "This Certificate is awarded to"
  doc.setFont(fontFamily, 'italic');
  doc.setFontSize(bodySize);
  doc.text('This Certificate is awarded to', cx, yL1, { align: 'center' });

  // Candidate name — bold italic, prominent, Title Case (overprinted for weight)
  // Auto-shrink + wrap if the name is too long to fit cleanly on one line.
  {
    const maxW = w - 60;
    let size = nameSize;
    let cs = nameCharSpace;
    doc.setFont(fontFamily, 'bolditalic');
    doc.setCharSpace?.(cs);
    doc.setFontSize(size);
    while (size > 20 && doc.getTextWidth(studentName) > maxW) {
      size -= 1;
      doc.setFontSize(size);
    }
    if (doc.getTextWidth(studentName) > maxW && cs > 0) {
      cs = 0;
      doc.setCharSpace?.(cs);
    }
    const lines = doc.splitTextToSize(studentName, maxW) as string[];
    const lineH = size * 0.45;
    const startY = yName - ((lines.length - 1) * lineH) / 2;
    lines.forEach((ln, i) => {
      drawBold(ln, cx, startY + i * lineH, { align: 'center' });
    });
    doc.setCharSpace?.(bodyCharSpace);
  }

  // Line 3: "the within signed [BOX] upon successful completion of the"
  const segBeforeBox = 'the within signed   ';
  const segAfterBox = '  upon successful completion of the';
  const boxW = 40;
  const boxH = 10;
  const wBefore = measure(segBeforeBox, 'italic', bodySize);
  const wAfter = measure(segAfterBox, 'italic', bodySize);
  const totalLine3 = wBefore + boxW + wAfter;
  const startX3 = (w - totalLine3) / 2;

  doc.setFont(fontFamily, 'italic');
  doc.setFontSize(bodySize);
  doc.text(segBeforeBox, startX3, yL3);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(startX3 + wBefore, yL3 - 7, boxW, boxH);
  doc.text(segAfterBox, startX3 + wBefore + boxW, yL3);

  // Course / subject name — bold italic (overprinted for weight)
  // Auto-shrink + wrap to avoid running into the surrounding lines.
  {
    const maxW = w - 60;
    let size = courseSize;
    let cs = courseCharSpace;
    doc.setFont(fontFamily, 'bolditalic');
    doc.setCharSpace?.(cs);
    doc.setFontSize(size);
    while (size > 14 && doc.getTextWidth(data.courseName) > maxW) {
      size -= 1;
      doc.setFontSize(size);
    }
    if (doc.getTextWidth(data.courseName) > maxW && cs > 0) {
      cs = 0;
      doc.setCharSpace?.(cs);
    }
    const lines = doc.splitTextToSize(data.courseName, maxW) as string[];
    const lineH = size * 0.5;
    const startY = yCourse - ((lines.length - 1) * lineH) / 2;
    lines.forEach((ln, i) => {
      drawBold(ln, cx, startY + i * lineH, { align: 'center' });
    });
    doc.setCharSpace?.(bodyCharSpace);
  }

  // Line 5: "having passed the examination with [GRADE] Grade on [MONTH YEAR]"
  const seg5a = 'having passed the examination with    ';
  const seg5b = 'Grade on ';
  const w5a = measure(seg5a, 'italic', bodySize);
  const w5grade = measure(gradeText, 'bolditalic', gradeSize);
  const w5b = measure(seg5b, 'italic', bodySize);
  const w5date = measure(dateText, 'bolditalic', bodySize);
  const totalLine5 = w5a + w5grade + w5b + w5date;
  const startX5 = (w - totalLine5) / 2; // Center the whole line

  doc.setFont(fontFamily, 'italic');
  doc.setFontSize(bodySize);
  doc.text(seg5a, startX5, yL5);
  let x5 = startX5 + w5a;
  doc.setFont(fontFamily, 'bolditalic');
  doc.setFontSize(gradeSize);
  drawBold(gradeText, x5, yL5);
  x5 += w5grade;
  doc.setFont(fontFamily, 'italic');
  doc.setFontSize(bodySize);
  doc.text(seg5b, x5, yL5);
  x5 += w5b;
  doc.setFont(fontFamily, 'bolditalic');
  doc.text(dateText, x5, yL5);

  // Line 6: "in witness whereof..." with bold "Director, CBITVT" at the end
  const seg6a = 'in witness whereof is set the signature and seal of the  ';
  const seg6b = ' Director, CBITVT.';
  const w6a = measure(seg6a, 'italic', bodySize);
  const w6b = measure(seg6b, 'bolditalic', bodySize);
  const totalLine6 = w6a + w6b;
  const startX6 = (w - totalLine6) / 2;
  doc.setFont(fontFamily, 'italic');
  doc.setFontSize(bodySize);
  doc.text(seg6a, startX6, yL6);
  doc.setFont(fontFamily, 'bolditalic');
  drawBold(seg6b, startX6 + w6a, yL6);

  // Bottom-left meta block
  const sn = serialNo(data);
  doc.setFont(metaFontFamily, 'normal');
  doc.setFontSize(10);
  doc.setCharSpace?.(0);
  doc.setTextColor(40, 40, 40);
  const metaY = 230;
  doc.text(`S/N   : ${sn}`, 22, metaY);
  doc.text(`Date  : ${formatDate(data.resultDate)}`, 22, metaY + 7);
  doc.text(`Place : Mumbai`, 22, metaY + 14);

  if (data.provisional) {
    const anyDoc = doc as unknown as { GState?: new (o: { opacity: number }) => unknown; setGState?: (s: unknown) => void };
    if (anyDoc.GState && anyDoc.setGState) anyDoc.setGState(new anyDoc.GState({ opacity: 0.18 }));
    doc.setTextColor(176, 0, 32);
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(70);
    doc.text('PROVISIONAL COPY', cx, h / 2, { align: 'center', angle: 20 });
    if (anyDoc.GState && anyDoc.setGState) anyDoc.setGState(new anyDoc.GState({ opacity: 1 }));
  }
}

export async function generateCertificate(data: CertificateData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const [templateData, fontBase64, robotoBase64] = await Promise.all([
    loadImage(certificateTemplateSrc),
    loadBirthstoneFont(),
    loadRobotoFont(),
  ]);
  await renderCertOnDoc(doc, data, templateData, fontBase64, robotoBase64);
  doc.save(`${data.provisional ? 'Provisional_' : ''}Certificate_${data.enrollmentNo}.pdf`);
}

export async function generateCertificatesBulk(items: CertificateData[]) {
  if (items.length === 0) return;
  if (items.length === 1) return generateCertificate(items[0]);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const [templateData, fontBase64, robotoBase64] = await Promise.all([
    loadImage(certificateTemplateSrc),
    loadBirthstoneFont(),
    loadRobotoFont(),
  ]);
  for (let i = 0; i < items.length; i++) {
    if (i > 0) doc.addPage();
    await renderCertOnDoc(doc, items[i], templateData, fontBase64, robotoBase64);
  }
  doc.save(`${items[0].provisional ? 'Provisional_' : ''}Certificates_Bulk_${Date.now()}.pdf`);
}
