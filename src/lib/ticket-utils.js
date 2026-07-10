import prisma from '@/lib/prisma';

// Generate ticket number: BU + DDMMYYYY + Running 5 digits
export async function generateTicketNo(buCode, buId) {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const dateKey = `${dd}${mm}${yyyy}`;

  // Atomic upsert to prevent race condition
  const counter = await prisma.jobCounter.upsert({
    where: {
      bu_code_date_key: { bu_code: buCode, date_key: dateKey }
    },
    update: { last_number: { increment: 1 } },
    create: { bu_code: buCode, bu_id: buId, date_key: dateKey, last_number: 1 }
  });

  const running = String(counter.last_number).padStart(5, '0');
  return `${buCode}${dateKey}${running}`;
}
// Normalize ticket number by padding running sequence to 5 digits if needed
export function normalizeTicketNo(ticketNo) {
  if (!ticketNo) return ticketNo;
  const match = ticketNo.trim().match(/^([A-Z0-9]+?)(\d{4}(?:20|25)\d{2})(\d{4,6})$/i);
  if (match) {
    const prefix = match[1].toUpperCase();
    const dateStr = match[2];
    const seqStr = match[3].padStart(5, '0');
    return `${prefix}${dateStr}${seqStr}`;
  }
  return ticketNo.trim();
}

// Format date for display
export function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Calculate time difference in human-readable format
export function timeDiff(start, end) {
  if (!start || !end) return '-';
  const diff = new Date(end) - new Date(start);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
