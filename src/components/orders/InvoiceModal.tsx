import { useState, useEffect } from 'react';
import { X, Mail, Printer, CheckCircle2, AlertCircle, Loader2, FileText, Send, ExternalLink } from 'lucide-react';
import { Order, Client, Organisation } from '@/lib/types/craft';
import { formatCurrency } from '@/lib/utils/calculator';

interface InvoiceModalProps {
  order: Order;
  client?: Client;
  organisation: Organisation;
  isOpen: boolean;
  onClose: () => void;
  onEmailUpdated?: (newEmail: string) => void;
  autoSend?: boolean;
  initialEmail?: string;
}

export function InvoiceModal({
  order,
  client,
  organisation,
  isOpen,
  onClose,
  onEmailUpdated,
  autoSend = false,
  initialEmail,
}: InvoiceModalProps) {
  const [email, setEmail] = useState(initialEmail || client?.email || '');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [hasAutoSent, setHasAutoSent] = useState(false);

  useEffect(() => {
    const targetEmail = initialEmail || client?.email || '';
    if (targetEmail) {
      setEmail(targetEmail);
    }
  }, [initialEmail, client]);

  const vatMode = organisation.vat_mode || 'exempt';
  const vatRate = vatMode === '20' ? 20 : vatMode === '10' ? 10 : vatMode === '5.5' ? 5.5 : 0;
  const isVatExempt = vatMode === 'exempt' || vatRate === 0;

  const totalTTC = order.total_amount;
  const totalHT = isVatExempt ? totalTTC : totalTTC / (1 + vatRate / 100);
  const totalVAT = isVatExempt ? 0 : totalTTC - totalHT;

  const vatMention =
    organisation.vat_custom_mention ||
    (isVatExempt
      ? 'TVA non applicable, art. 293 B du CGI'
      : `TVA appliquée au taux de ${vatRate}%`);

  const performSendEmail = async (targetEmail: string) => {
    setSendError(null);
    setSendSuccess(null);

    if (!targetEmail.trim() || !targetEmail.includes('@')) {
      setSendError("Veuillez saisir une adresse email valide pour le client.");
      return;
    }

    setSending(true);

    try {
      const res = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEmail: targetEmail,
          clientName: client?.name || 'Client',
          orderNumber: order.order_number,
          totalAmount: order.total_amount,
          items: order.items,
          organisationName: organisation.name,
          siret: organisation.siret,
          vatMention: vatMention,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi de la facture");
      }

      setSendSuccess(data.message || `Facture ${order.order_number} préparée et envoyée à ${targetEmail} !`);
      if (onEmailUpdated && targetEmail !== client?.email) {
        onEmailUpdated(targetEmail);
      }
    } catch (err: any) {
      setSendError(err.message || 'Impossible d’envoyer la facture par email.');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (isOpen && autoSend && !hasAutoSent) {
      const targetEmail = email || initialEmail || client?.email || '';
      setHasAutoSent(true);
      if (targetEmail) {
        performSendEmail(targetEmail);
      } else {
        setSendError("Aucune adresse email renseignée pour ce client. Saisissez l'email ci-dessous et cliquez sur Envoyer.");
      }
    }
  }, [isOpen, autoSend, hasAutoSent, email, initialEmail, client]);

  if (!isOpen) return null;

  const invoiceDate = new Date(order.created_at || Date.now()).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    performSendEmail(email);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <title>Facture ${order.order_number} - ${organisation.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; background: #fff; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; }
          .details { margin-top: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border-bottom: 1px solid #e2e8f0; padding: 10px; text-align: left; }
          th { background: #f1f5f9; text-transform: uppercase; font-size: 11px; }
          .totals { text-align: right; margin-top: 20px; }
          .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 11px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${organisation.name}</div>
            <p>${organisation.craft_type} Artisanale</p>
            ${organisation.siret ? `<p>SIRET : ${organisation.siret}</p>` : ''}
            ${organisation.address ? `<p>${organisation.address}</p>` : ''}
            ${organisation.phone ? `<p>Tél : ${organisation.phone}</p>` : ''}
            ${organisation.email ? `<p>Email : ${organisation.email}</p>` : ''}
          </div>
          <div style="text-align: right;">
            <h2>FACTURE</h2>
            <p><strong>N° ${order.order_number}</strong></p>
            <p>Date : ${invoiceDate}</p>
          </div>
        </div>
        <div class="details">
          <p><strong>Facturé à :</strong> ${client?.name || 'Client Passager'}</p>
          ${client?.address ? `<p>${client.address}</p>` : ''}
          ${email ? `<p>Email : ${email}</p>` : ''}
        </div>
        <table>
          <thead>
            <tr>
              <th>Désignation</th>
              <th style="text-align: center;">Quantité</th>
              <th style="text-align: right;">Prix Unitaire</th>
              <th style="text-align: right;">Total TTC</th>
            </tr>
          </thead>
          <tbody>
            ${order.items
              .map(
                (i) => `
              <tr>
                <td>${i.product?.name || 'Produit'}</td>
                <td style="text-align: center;">${i.quantity}</td>
                <td style="text-align: right;">${formatCurrency(i.unit_price)}</td>
                <td style="text-align: right;">${formatCurrency(i.quantity * i.unit_price)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        <div class="totals">
          ${!isVatExempt ? `<p>Total HT : ${formatCurrency(totalHT)}</p><p>TVA (${vatRate}%) : ${formatCurrency(totalVAT)}</p>` : ''}
          <h3 style="color: #4f46e5;">Total Net TTC : ${formatCurrency(totalTTC)}</h3>
          <p style="font-size: 11px; font-style: italic;">${vatMention}</p>
        </div>
        <div class="footer">
          <p>Merci pour votre confiance ! — ${organisation.name}</p>
          <p>${vatMention}</p>
        </div>
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Facture_${order.order_number}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const mailtoSubject = encodeURIComponent(`Facture N° ${order.order_number} - ${organisation.name}`);
  const mailtoBody = encodeURIComponent(
    `Bonjour ${client?.name || ''},\n\nVeuillez trouver ci-joint votre facture n° ${order.order_number} d'un montant de ${formatCurrency(order.total_amount)}.\n\n` +
      (organisation.siret ? `Emetteur : ${organisation.name} (SIRET : ${organisation.siret})\n` : '') +
      `Détails des articles :\n` +
      order.items.map((i) => `- ${i.product?.name || 'Produit'} x ${i.quantity} : ${formatCurrency(i.quantity * i.unit_price)}`).join('\n') +
      `\n\nTotal Net à payer TTC : ${formatCurrency(order.total_amount)}\n` +
      `Mention TVA : ${vatMention}\n\n` +
      `Cordialement,\n${organisation.name}\n${organisation.phone || ''}`
  );
  const mailtoUrl = `mailto:${email}?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header - Screen only */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-sm">Facture Client - {order.order_number}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadHtml}
              className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition border border-slate-700"
            >
              📥 Fichier HTML
            </button>
            <button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimer / PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Email Sending Control Bar - Screen only */}
        <div className="p-4 bg-indigo-50/80 border-b border-indigo-100 shrink-0 print:hidden space-y-2">
          <form onSubmit={handleSendEmail} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <Mail className="w-4 h-4 text-indigo-500 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email du client (ex: client@domaine.fr)..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-indigo-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={sending}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shrink-0 shadow-sm transition"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Préparation...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Envoyer par Email
                  </>
                )}
              </button>

              {email && (
                <a
                  href={mailtoUrl}
                  title="Ouvrir directement dans votre application mail (Apple Mail, Outlook, etc.)"
                  className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-600" /> Ouvrir App Mail
                </a>
              )}
            </div>
          </form>

          {sendSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{sendSuccess}</span>
            </div>
          )}

          {sendError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{sendError}</span>
            </div>
          )}
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-8 overflow-y-auto flex-1 bg-white text-slate-800 space-y-6 print:p-0 print:overflow-visible">
          {/* Header row */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{organisation.name}</h1>
              <p className="text-xs text-slate-500 capitalize">{organisation.craft_type} Artisanale</p>
              {organisation.siret && (
                <p className="text-xs text-slate-600 font-mono mt-1">SIRET : {organisation.siret}</p>
              )}
              {organisation.vat_number && (
                <p className="text-xs text-slate-500 font-mono">TVA Intracom. : {organisation.vat_number}</p>
              )}
              {organisation.address && (
                <p className="text-xs text-slate-500 mt-0.5">{organisation.address}</p>
              )}
              <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-1 font-medium">
                {organisation.phone && <span>📞 {organisation.phone}</span>}
                {organisation.email && <span>📧 {organisation.email}</span>}
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-900 font-extrabold text-xs rounded-lg uppercase tracking-wider mb-2">
                FACTURE
              </span>
              <p className="text-sm font-mono font-bold text-slate-900">{order.order_number}</p>
              <p className="text-xs text-slate-500 mt-0.5">Date : {invoiceDate}</p>
              <p className="text-xs font-bold mt-1">
                Statut :{' '}
                <span className={order.payment_status === 'paid' ? 'text-emerald-600' : 'text-rose-600'}>
                  {order.payment_status === 'paid' ? 'PAYÉE 🟢' : 'NON PAYÉE (À payer) 🔴'}
                </span>
              </p>
            </div>
          </div>

          {/* Client & Shipping info */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
            <div>
              <p className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">
                Facturé à :
              </p>
              <p className="font-bold text-slate-900 text-sm">{client?.name || 'Client Passager'}</p>
              {client?.company_name && (
                <p className="text-slate-600 font-medium">{client.company_name}</p>
              )}
              {client?.address && <p className="text-slate-500 mt-1">{client.address}</p>}
              {email && <p className="text-indigo-600 font-mono mt-1">📧 {email}</p>}
              {client?.phone && <p className="text-slate-500">📞 {client.phone}</p>}
            </div>

            <div className="text-right">
              <p className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">
                Détails Livraison :
              </p>
              {order.target_delivery_date ? (
                <p className="font-semibold text-slate-700">
                  Date de livraison : {order.target_delivery_date}
                </p>
              ) : (
                <p className="text-slate-500 italic">Livraison standard</p>
              )}
              {order.notes && (
                <div className="mt-2 text-left bg-white p-2 rounded border border-slate-200 italic text-[11px] text-slate-600">
                  "{order.notes}"
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-900 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-2">Désignation Produit</th>
                  <th className="py-2.5 px-2 text-center">Quantité</th>
                  <th className="py-2.5 px-2 text-right">Prix Unitaire</th>
                  <th className="py-2.5 px-2 text-right">Total TTC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-2 font-medium text-slate-900">
                      {item.product?.name || `Produit #${idx + 1}`}
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-slate-700">{item.quantity}</td>
                    <td className="py-3 px-2 text-right font-mono text-slate-600">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary & VAT Breakdown */}
          <div className="border-t border-slate-200 pt-4 flex justify-end">
            <div className="w-72 space-y-2 text-xs">
              {!isVatExempt && (
                <>
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Montant Total HT :</span>
                    <span className="font-mono">{formatCurrency(totalHT)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>TVA ({vatRate}%) :</span>
                    <span className="font-mono">{formatCurrency(totalVAT)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center text-sm font-black text-slate-900 border-t border-slate-900 pt-2">
                <span>Total Net à Payer TTC :</span>
                <span className="text-indigo-600 text-base font-mono">
                  {formatCurrency(totalTTC)}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 text-right italic font-medium pt-1">
                {vatMention}
              </p>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-6 border-t border-slate-200 text-[10px] text-slate-400 text-center space-y-1">
            <p>Merci pour votre confiance ! Pour toute question, contactez votre artisan.</p>
            <p>
              {organisation.name}
              {organisation.siret ? ` — SIRET : ${organisation.siret}` : ''}
              {organisation.address ? ` — ${organisation.address}` : ''}
            </p>
            <p className="italic text-slate-500 font-semibold">{vatMention}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
