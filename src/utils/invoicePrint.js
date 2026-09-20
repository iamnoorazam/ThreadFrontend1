import api from '../api/client';
import { formatINR, formatDate } from './format';

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const money = (n) => esc(formatINR(n));

// Builds the printable page for an issued invoice. Everything printed comes from the
// invoice snapshot, so it always matches what was issued.
const invoiceHtml = (inv) => {
  const tax = inv.type === 'tax_invoice';
  const title = tax ? 'Tax Invoice' : 'Bill of Supply';
  const taxHeads = inv.intraState
    ? '<th class="r">CGST</th><th class="r">SGST</th>'
    : '<th class="r">IGST</th>';

  const rows = inv.lines
    .map(
      (l) => `
      <tr>
        <td>${esc(l.title)}${l.hsnCode ? `<div class="m">HSN ${esc(l.hsnCode)}</div>` : ''}</td>
        <td class="c">${esc(l.quantity)}</td>
        <td class="r">${money(l.unitPrice)}</td>
        <td class="r">${l.discount ? '−' + money(l.discount) : '—'}</td>
        <td class="r">${money(l.taxable)}</td>
        ${
          tax
            ? inv.intraState
              ? `<td class="r">${money(l.cgst)}<div class="m">${esc(l.gstRate / 2)}%</div></td><td class="r">${money(l.sgst)}<div class="m">${esc(l.gstRate / 2)}%</div></td>`
              : `<td class="r">${money(l.igst)}<div class="m">${esc(l.gstRate)}%</div></td>`
            : ''
        }
        <td class="r"><strong>${money(l.total)}</strong></td>
      </tr>`
    )
    .join('');

  const t = inv.totals;
  return `<!DOCTYPE html>
<html>
<head><title>${esc(title)} ${esc(inv.number)}</title>
<style>
  body { font-family: Arial, sans-serif; color: #1c1917; margin: 40px; font-size: 13px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .m { color: #78716c; font-size: 11px; }
  .row { display: flex; justify-content: space-between; gap: 32px; margin-top: 20px; }
  table { width: 100%; border-collapse: collapse; margin-top: 24px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; color: #78716c; border-bottom: 2px solid #1c1917; padding: 8px 6px; }
  td { padding: 8px 6px; border-bottom: 1px solid #e5e5e5; vertical-align: top; }
  .r { text-align: right; } .c { text-align: center; }
  .totals { margin-top: 16px; margin-left: auto; width: 280px; }
  .totals div { display: flex; justify-content: space-between; padding: 3px 0; }
  .grand { font-size: 16px; font-weight: bold; border-top: 2px solid #1c1917; margin-top: 4px; padding-top: 6px !important; }
  .foot { margin-top: 36px; font-size: 11px; color: #78716c; }
</style></head>
<body onload="window.print()">
  <h1>${esc(title)}</h1>
  <p class="m">${tax ? 'Original for recipient' : 'Issued by a supplier not registered under GST'}</p>
  <div class="row">
    <div>
      <strong>${esc(inv.seller.legalName)}</strong><br>
      ${esc(inv.seller.address)}<br>
      ${inv.seller.gstin ? `GSTIN: ${esc(inv.seller.gstin)}` : ''}
    </div>
    <div style="text-align:right">
      Invoice no: <strong>${esc(inv.number)}</strong><br>
      Date: ${esc(formatDate(inv.issuedAt))}<br>
      Order: #${esc(String(inv.orderId).slice(-8).toUpperCase())}
    </div>
  </div>
  <div class="row">
    <div>
      <div class="m">Billed and shipped to</div>
      <strong>${esc(inv.buyer.name)}</strong><br>
      ${esc(inv.buyer.address)}<br>
      ${inv.buyer.phone ? `Phone: ${esc(inv.buyer.phone)}` : ''}
    </div>
    <div style="text-align:right">
      <div class="m">Place of supply</div>
      ${esc(inv.placeOfSupply || '—')}
    </div>
  </div>
  <table>
    <thead><tr>
      <th>Item</th><th class="c">Qty</th><th class="r">Price (incl. tax)</th><th class="r">Discount</th><th class="r">${tax ? 'Taxable value' : 'Amount'}</th>
      ${tax ? taxHeads : ''}<th class="r">Total</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    ${tax ? `<div><span>Taxable value</span><span>${money(t.taxable)}</span></div>` : ''}
    ${tax && inv.intraState ? `<div><span>CGST</span><span>${money(t.cgst)}</span></div><div><span>SGST</span><span>${money(t.sgst)}</span></div>` : ''}
    ${tax && !inv.intraState ? `<div><span>IGST</span><span>${money(t.igst)}</span></div>` : ''}
    <div class="grand"><span>Total</span><span>${money(t.total)}</span></div>
  </div>
  <p class="foot">All amounts in INR. Prices include GST where applicable. Shipping, if charged, is billed separately by the marketplace. This is a computer-generated invoice and needs no signature.</p>
</body></html>`;
};

// Opens the invoice for printing. The window is opened straight away (before the
// request) so the browser's pop-up blocker doesn't stop it.
export async function printInvoice(subOrderId) {
  const win = window.open('', '_blank', 'width=900,height=1000');
  if (!win) throw new Error('Please allow pop-ups to view the invoice.');
  try {
    const res = await api.get(`/invoices/${subOrderId}`);
    win.document.write(invoiceHtml(res.data.invoice));
    win.document.close();
  } catch (err) {
    win.close();
    throw err;
  }
}

export const INVOICE_READY = ['shipped', 'out_for_delivery', 'delivered'];
