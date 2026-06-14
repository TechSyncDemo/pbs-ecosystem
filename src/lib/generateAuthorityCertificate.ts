import jsPDF from 'jspdf';
import certificateTemplateSrc from '@/assets/authorization-certificate-template.jpg';

interface CertificateData {
  authorizationName: string;
  authorizationCode: string;
  centerName: string;
  centerCode: string;
  centerAddress: string;
  courseName: string;
  courseCode: string;
  validFrom: string;
  validUntil: string;
  certificateNo: string;
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

export async function generateAuthorityCertificate(data: CertificateData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297
  const centerX = pageWidth / 2;

  // Load and add background template image
  try {
    const imgData = await loadImage(certificateTemplateSrc);
    doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
  } catch {
    doc.setDrawColor(0, 102, 153);
    doc.setLineWidth(2);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
  }

  // --- Overlay dynamic text on top of the template ---
  // Template (A4 portrait 210x297mm). Coordinates calibrated against the
  // sample certificate so each dynamic value sits in the blank space provided.

  // 1) Center Name — large red, centered, between "Hereby confirms that" and "situated at"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(200, 30, 30);
  doc.text(data.centerName, centerX, 100, { align: 'center' });

  // 2) Center Address — same line as the printed "situated at" label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(data.centerAddress, 55, 119, { align: 'left', maxWidth: 135 });

  // 4) Center / PLC Code — same line as "vide PLC code:"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(0, 0, 0);
  doc.text(data.centerCode, 107, 188, { align: 'left' });

  // 5) Validity dates — same line as "The validity of this authorisation is from ___ to ___"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text(data.validFrom, 118, 204, { align: 'left' });
  doc.text(data.validUntil, 163, 204, { align: 'left' });

  doc.save(`Authorization_Certificate_${data.certificateNo}.pdf`);
}
