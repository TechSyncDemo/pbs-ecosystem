import jsPDF from 'jspdf';
import certificateTemplateSrc from '@/assets/certificate-template.jpg';

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
    // If image fails, draw a simple border fallback
    doc.setDrawColor(0, 102, 153);
    doc.setLineWidth(2);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
  }

  // --- Overlay dynamic text on top of the template ---
  // The template has fixed text like "Hereby confirms that", "situated at", etc.
  // We place dynamic values in the blank spaces

  // Center Name - after "Hereby confirms that" (~line at y≈108mm from top)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(data.centerName, centerX, 108, { align: 'center' });

  // Center Address - after "situated at" (~y≈130mm)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text(data.centerAddress, centerX, 133, { align: 'center' });

  // Authorization Name - after "to conduct ... certified Courses in" (~y≈178mm)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(data.authorizationName, centerX + 30, 178, { align: 'left' });

  // Center Code - after "vide PLC code:" (~y≈214mm)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(data.centerCode, centerX + 15, 214, { align: 'left' });

  // Validity dates - "The validity of this authorisation is from ___ to ___" (~y≈232mm)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  // "from" date positioned after the word "from"
  doc.text(data.validFrom, centerX + 25, 232, { align: 'center' });
  // "to" date positioned after "to"
  doc.text(data.validUntil, centerX + 60, 232, { align: 'center' });

  doc.save(`Authorization_Certificate_${data.certificateNo}.pdf`);
}
