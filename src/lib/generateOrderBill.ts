import jsPDF from 'jspdf';
import logoUrl from '@/assets/pbs-logo.jpeg';

export interface OrderBillItem {
  name: string;
  qty: number;
  unit_price: number;
}

export interface OrderBillData {
  orderNo: string;
  orderDate: string;
  centerName: string;
  centerCode?: string;
  centerAddress?: string;
  centerPhone?: string;
  centerEmail?: string;
  items: OrderBillItem[];
  subtotal: number;
  discount?: number;
  couponCode?: string | null;
  convenienceFee?: number;
  total: number;
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
}

const PRIMARY = '#0f4c81';

const money = (n: number) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(logoUrl);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch { return null; }
}

export async function generateOrderBill(data: OrderBillData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  let y = 15;

  // Header band
  doc.setFillColor(PRIMARY);
  doc.rect(0, 0, W, 30, 'F');

  const logo = await loadLogoDataUrl();
  if (logo) {
    try { doc.addImage(logo, 'JPEG', 10, 5, 22, 20); } catch {}
  }

  doc.setTextColor('#ffffff');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('PROACTIVE TECHNOLOGY', 36, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Tax Invoice / Payment Receipt', 36, 20);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PAID', W - 12, 14, { align: 'right' });

  y = 40;
  doc.setTextColor('#111111');

  // Invoice meta
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice No:', 12, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.orderNo, 38, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', W - 60, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.orderDate, W - 48, y);
  y += 6;

  if (data.razorpayPaymentId) {
    doc.setFont('helvetica', 'bold');
    doc.text('Payment ID:', 12, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.razorpayPaymentId, 38, y);
    y += 6;
  }

  // Bill to
  y += 4;
  doc.setDrawColor(220);
  doc.line(12, y, W - 12, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('BILL TO', 12, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(data.centerName + (data.centerCode ? ` (${data.centerCode})` : ''), 12, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (data.centerAddress) { doc.text(data.centerAddress, 12, y); y += 4; }
  const contactLine = [data.centerPhone, data.centerEmail].filter(Boolean).join('  •  ');
  if (contactLine) { doc.text(contactLine, 12, y); y += 4; }

  // Items table
  y += 6;
  doc.setFillColor(PRIMARY);
  doc.rect(12, y, W - 24, 8, 'F');
  doc.setTextColor('#ffffff');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('#', 14, y + 5.5);
  doc.text('Item', 22, y + 5.5);
  doc.text('Qty', W - 78, y + 5.5, { align: 'right' });
  doc.text('Unit Price', W - 50, y + 5.5, { align: 'right' });
  doc.text('Total', W - 14, y + 5.5, { align: 'right' });
  y += 8;

  doc.setTextColor('#111111');
  doc.setFont('helvetica', 'normal');
  data.items.forEach((it, idx) => {
    if (y > 250) { doc.addPage(); y = 20; }
    const rowH = 8;
    if (idx % 2 === 0) {
      doc.setFillColor(247, 250, 255);
      doc.rect(12, y, W - 24, rowH, 'F');
    }
    doc.text(String(idx + 1), 14, y + 5.5);
    doc.text(it.name.length > 60 ? it.name.slice(0, 57) + '…' : it.name, 22, y + 5.5);
    doc.text(String(it.qty), W - 78, y + 5.5, { align: 'right' });
    doc.text(money(it.unit_price), W - 50, y + 5.5, { align: 'right' });
    doc.text(money(it.qty * it.unit_price), W - 14, y + 5.5, { align: 'right' });
    y += rowH;
  });

  // Totals
  y += 4;
  doc.setDrawColor(220);
  doc.line(W / 2, y, W - 12, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal', W / 2 + 5, y);
  doc.text(money(data.subtotal), W - 14, y, { align: 'right' });
  y += 5;

  if (data.discount && data.discount > 0) {
    doc.setTextColor('#0a7a3b');
    doc.text(`Discount${data.couponCode ? ' (' + data.couponCode + ')' : ''}`, W / 2 + 5, y);
    doc.text('- ' + money(data.discount), W - 14, y, { align: 'right' });
    doc.setTextColor('#111111');
    y += 5;
  }

  if (data.convenienceFee && data.convenienceFee > 0) {
    doc.text('Convenience Fee (3%)', W / 2 + 5, y);
    doc.text(money(data.convenienceFee), W - 14, y, { align: 'right' });
    y += 5;
  }

  doc.setDrawColor(180);
  doc.line(W / 2, y, W - 12, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Grand Total', W / 2 + 5, y);
  doc.text(money(data.total), W - 14, y, { align: 'right' });
  y += 12;

  // Payment footer
  doc.setDrawColor(220);
  doc.line(12, y, W - 12, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(PRIMARY);
  doc.text('Paid via Razorpay', 12, y);
  doc.setTextColor('#111111');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += 5;
  if (data.razorpayPaymentId) { doc.text(`Payment ID: ${data.razorpayPaymentId}`, 12, y); y += 4; }
  if (data.razorpayOrderId) { doc.text(`Razorpay Order ID: ${data.razorpayOrderId}`, 12, y); y += 4; }

  y += 8;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor('#666666');
  doc.text('Thank you for your business.', 12, y);
  doc.text('This is a computer-generated receipt; no signature required.', 12, y + 4);

  // Bottom footer — inclusive of GST notice
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(PRIMARY);
  doc.text('This bill is inclusive of GST and convenience fees.', W / 2, H - 12, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#888888');
  doc.setFontSize(8);
  doc.text('Proactive Technology', W / 2, H - 7, { align: 'center' });
  doc.setFontSize(8);
  doc.text('This bill is inclusive of all taxes.', W / 2, H - 3, { align: 'center' });

  doc.save(`bill-${data.orderNo}.pdf`);
}