'use client';

import { useState } from 'react';
import { X, Mail, Printer, CheckCircle2, AlertCircle, Loader2, FileText, Send } from 'lucide-react';
import { Order, Client, Organisation } from '@/lib/types/craft';
import { formatCurrency } from '@/lib/utils/calculator';

interface InvoiceModalProps {
  order: Order;
  client?: Client;
  organisation: Organisation;
  isOpen: boolean;
  onClose: () => void;
  onEmailUpdated?: (newEmail: string) => void;
}

export function InvoiceModal({
  order,
  client,
  organisation,
  isOpen,
  onClose,
  onEmailUpdated,
}: InvoiceModalProps) {
  const [email, setEmail] = useState(client?.email || '');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  if (!isOpen) return null;

  const invoiceDate = new Date(order.created_at || Date.now()).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(null);
    setSendSuccess(null);

    if (!email.trim() || !email.includes('@')) {
      setSendError('Veuillez saisir une adresse email valide.');
      return;
    }

    setSending(true);

    try {
      const res = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEmail: email,
          clientName: client?.name || 'Client',
          orderNumber: order.order_number,
          totalAmount: order.total_amount,
          items: order.items,
          organisationName: organisation.name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi de la facture");
      }

      setSendSuccess(data.message || `Facture envoyée avec succès à ${email} !`);
      if (onEmailUpdated && email !== client?.email) {
        onEmailUpdated(email);
      }
    } catch (err: any) {
      setSendError(err.message || 'Impossible d’envoyer la facture par email.');
    } finally {
      setSending(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

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
        <div className="p-4 bg-indigo-50/80 border-b border-indigo-100 shrink-0 print:hidden">
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
            <button
              type="submit"
              disabled={sending}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shrink-0 shadow-sm transition"
            >
              {sending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Envoyer la Facture par Email
                </>
              )}
            </button>
          </form>

          {sendSuccess && (
            <div className="mt-2.5 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{sendSuccess}</span>
            </div>
          )}

          {sendError && (
            <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
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
              <p className="text-xs text-slate-400 mt-1">SIRET : 892 341 590 00012</p>
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
                  <th className="py-2.5 px-2 text-right">Prix Unitaire TTC</th>
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

          {/* Totals Summary */}
          <div className="border-t border-slate-200 pt-4 flex justify-end">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Total Sous-Total :</span>
                <span className="font-mono">{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>TVA (TVA non applicable, art. 293 B du CGI) :</span>
                <span className="font-mono">0,00 €</span>
              </div>
              <div className="flex justify-between items-center text-sm font-black text-slate-900 border-t border-slate-900 pt-2">
                <span>Total Net à Payer TTC :</span>
                <span className="text-indigo-600 text-base font-mono">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-6 border-t border-slate-200 text-[10px] text-slate-400 text-center space-y-1">
            <p>Merci pour votre confiance ! Pour toute question, contactez votre artisan savonnier.</p>
            <p>{organisation.name} — Règlement à réception de facture.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
