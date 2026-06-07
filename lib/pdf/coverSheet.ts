import { jsPDF } from 'jspdf';

export interface CoverSheetClient {
  id: string;
  goal: string;
  status: string;
  approved_at: string;
  created_at: string;
  user: {
    full_name: string;
    email: string;
    phone: string;
  };
  documents: {
    id: string;
    document_type: string;
    file_name: string;
    status: string;
  }[];
}

const GOAL_LABELS: Record<string, string> = {
  retirement: 'Retirement Planning',
  investment: 'Investment Management',
  tax_planning: 'Tax Planning',
  estate_planning: 'Estate Planning',
  new_client: 'New Client Onboarding',
};

const DOC_LABELS: Record<string, string> = {
  id_copy: 'Photo ID',
  utility_bill: 'Utility Bill',
  pension_statement: 'Pension Statement',
  bank_statement: 'Bank Statement',
  tax_return: 'Tax Return',
  investment_portfolio: 'Investment Portfolio',
  proof_of_address: 'Proof of Address',
  marriage_certificate: 'Marriage Certificate',
  other: 'Other Document',
};

// Design tokens matching the app's tailwind.config.js
const NAVY  = [26, 35, 50]   as const;
const GOLD  = [201, 162, 39] as const;
const GREEN = [34, 197, 94]  as const;
const DARK  = [51, 51, 51]   as const;
const MUTED = [120, 120, 120] as const;
const RULE  = [220, 220, 220] as const;

export function generateCoverSheet(client: CoverSheetClient): void {
  const pdf   = new jsPDF({ unit: 'mm', format: 'a4' });
  const W     = pdf.internal.pageSize.getWidth();
  const H     = pdf.internal.pageSize.getHeight();
  const ML    = 20; // margin left
  const MR    = W - 20; // margin right
  let y       = 0;

  // ── HEADER BAND ────────────────────────────────────────────────
  pdf.setFillColor(...NAVY);
  pdf.rect(0, 0, W, 42, 'F');

  pdf.setTextColor(...GOLD);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CONCIERGE', ML, 18);

  pdf.setTextColor(220, 220, 220);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Financial Advisory — Secure Client Onboarding', ML, 26);

  const today = new Date().toLocaleDateString('en-ZA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  pdf.setTextColor(180, 180, 180);
  pdf.setFontSize(8);
  pdf.text(today, MR, 18, { align: 'right' });
  pdf.text('CONFIDENTIAL', MR, 26, { align: 'right' });

  // ── REPORT TITLE ───────────────────────────────────────────────
  y = 54;
  pdf.setTextColor(...NAVY);
  pdf.setFontSize(15);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Client Profile  —  Silver Platter Brief', ML, y);

  pdf.setDrawColor(...GOLD);
  pdf.setLineWidth(0.7);
  pdf.line(ML, y + 3, MR, y + 3);

  // ── SECTION HELPER ─────────────────────────────────────────────
  function sectionHead(title: string) {
    y += 12;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...NAVY);
    pdf.text(title, ML, y);
    y += 4;
    pdf.setDrawColor(...RULE);
    pdf.setLineWidth(0.25);
    pdf.line(ML, y, MR, y);
    y += 7;
  }

  function infoRow(label: string, value: string) {
    pdf.setFontSize(9.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...MUTED);
    pdf.text(label, ML, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...DARK);
    pdf.text(value || 'N/A', ML + 42, y);
    y += 8;
  }

  // ── CLIENT INFORMATION ─────────────────────────────────────────
  sectionHead('CLIENT INFORMATION');
  infoRow('Full Name:', client.user.full_name);
  infoRow('Email:', client.user.email);
  infoRow('Phone:', client.user.phone || 'Not provided');
  infoRow('Service Goal:', GOAL_LABELS[client.goal] ?? client.goal);

  // ── ONBOARDING SUMMARY ─────────────────────────────────────────
  sectionHead('ONBOARDING SUMMARY');
  infoRow('Date Submitted:', new Date(client.created_at).toLocaleDateString('en-ZA'));
  infoRow('Date Approved:', new Date(client.approved_at).toLocaleDateString('en-ZA'));

  // Status pill
  pdf.setFontSize(9.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...MUTED);
  pdf.text('Status:', ML, y);
  pdf.setFillColor(...GREEN);
  pdf.roundedRect(ML + 42, y - 5.5, 26, 7.5, 2, 2, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.text('APPROVED', ML + 45, y);
  y += 12;

  // ── VERIFIED DOCUMENTS ─────────────────────────────────────────
  sectionHead('VERIFIED DOCUMENTS');

  if (client.documents.length === 0) {
    pdf.setFontSize(9.5);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(...MUTED);
    pdf.text('No documents on record.', ML, y);
    y += 8;
  } else {
    client.documents.forEach((item) => {
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...GREEN);
      pdf.text('✓', ML, y);
      pdf.setTextColor(...DARK);
      pdf.text(DOC_LABELS[item.document_type] ?? item.document_type, ML + 7, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...MUTED);
      // Truncate long filenames
      const fname = item.file_name.length > 40
        ? item.file_name.slice(0, 38) + '…'
        : item.file_name;
      pdf.text(fname, ML + 62, y);
      y += 8;
    });
  }

  // ── FICA COMPLIANCE ────────────────────────────────────────────
  sectionHead('FICA COMPLIANCE');

  const hasId      = client.documents.some(d => d.document_type === 'id_copy');
  const hasAddress = client.documents.some(d =>
    d.document_type === 'utility_bill' || d.document_type === 'proof_of_address'
  );
  const compliant  = hasId && hasAddress;

  const boxBg     = compliant ? [240, 253, 244] : [255, 247, 237];
  const boxBorder = compliant ? [34, 197, 94]  : [249, 115, 22];
  const boxText   = compliant ? [21, 128, 61]  : [154, 52, 18];

  pdf.setFillColor(boxBg[0], boxBg[1], boxBg[2]);
  pdf.setDrawColor(boxBorder[0], boxBorder[1], boxBorder[2]);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(ML, y - 3, MR - ML, 20, 3, 3, 'FD');

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(boxText[0], boxText[1], boxText[2]);
  pdf.text(compliant ? '✓  FICA COMPLIANT' : '⚠  FICA INCOMPLETE', ML + 6, y + 6);

  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'normal');
  const ficaNote = compliant
    ? 'Required identity and address documentation has been verified.'
    : 'Missing: ' + (!hasId ? 'Photo ID  ' : '') + (!hasAddress ? 'Proof of Address' : '');
  pdf.text(ficaNote, ML + 6, y + 14);
  y += 28;

  // ── ADVISOR NOTES ──────────────────────────────────────────────
  sectionHead('ADVISOR NOTES');
  for (let i = 0; i < 5; i++) {
    pdf.setDrawColor(...RULE);
    pdf.setLineWidth(0.2);
    pdf.line(ML, y, MR, y);
    y += 9;
  }

  // ── FOOTER BAND ────────────────────────────────────────────────
  const FY = H - 14;
  pdf.setFillColor(...NAVY);
  pdf.rect(0, FY - 6, W, 20, 'F');
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(150, 150, 150);
  pdf.text(
    'CONFIDENTIAL  —  For authorised advisor use only. Not for distribution.',
    W / 2, FY + 1, { align: 'center' }
  );
  pdf.text(
    `Generated: ${new Date().toLocaleString()}   |   Client Ref: ${client.id.slice(0, 8).toUpperCase()}`,
    W / 2, FY + 7, { align: 'center' }
  );

  // ── SAVE ───────────────────────────────────────────────────────
  const safeName = client.user.full_name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const dateStr  = new Date().toISOString().split('T')[0];
  pdf.save(`${safeName}_CoverSheet_${dateStr}.pdf`);
}
