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

function shortSN(id: string) {
  const digits = (id || '').replace(/\D/g, '');
  const tail = digits ? digits.slice(-5).padStart(5, '0') : Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `A${tail}`;
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

  // Body text — italic serif, centered, matches sample wording
  doc.setTextColor(0, 0, 0);

  // "This Certificate is awarded to" is already printed on the template.
  // Student name
  doc.setFont('times', 'italic');
  doc.setFontSize(22);
  doc.text(data.studentName, cx, 108, { align: 'center' });

  // "the within signed [box] upon successful" — printed; nothing inside the box.
  // "completion of the" — printed.

  // Course name
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(16);
  doc.text(data.courseName, cx, 145, { align: 'center', maxWidth: w - 60 });

  // "having passed the examination with" — printed.
  // Grade + month/year line
  const { month, year } = monthYear(data.resultDate);
  doc.setFont('times', 'italic');
  doc.setFontSize(15);
  doc.text(`'${data.grade}' Grade on ${month}' ${year} in witness whereof is`, cx, 173, { align: 'center' });

  // "set the signature and seal of the Director, CBITVT." — printed.

  // Bottom-left meta block
  const sn = shortSN(data.certificateNo || data.certificateId);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  const metaY = 230;
  doc.text(`S/N : ${sn}`, 22, metaY);
  doc.text(`Date : ${formatDate(data.resultDate)}`, 22, metaY + 7);
  doc.text(`Place : MUMBAI`, 22, metaY + 14);

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
