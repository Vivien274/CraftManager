import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      clientEmail,
      clientName,
      orderNumber,
      totalAmount,
      items,
      organisationName,
      siret,
      vatMention,
    } = body;

    if (!clientEmail || !orderNumber) {
      return NextResponse.json(
        { error: 'Email du client et numéro de commande requis' },
        { status: 400 }
      );
    }

    const orgName = organisationName || "L'Atelier des Restanques";

    // Generate complete formatted HTML Email content
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px; color: #1e293b;">
        <h2 style="color: #4f46e5; margin-top: 0;">${orgName}</h2>
        <p style="font-size: 14px;">Bonjour <strong>${clientName || 'Client'}</strong>,</p>
        <p style="font-size: 14px;">Veuillez trouver ci-joint votre facture <strong>${orderNumber}</strong> d'un montant de <strong>${totalAmount} €</strong>.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; font-size: 14px; color: #334155;">Récapitulatif de votre commande :</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="border-bottom: 2px solid #cbd5e1; text-align: left;">
                <th style="padding: 8px 0;">Produit</th>
                <th style="padding: 8px 0; text-align: center;">Qté</th>
                <th style="padding: 8px 0; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${
                Array.isArray(items)
                  ? items
                      .map(
                        (i: any) => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 8px 0;">${i.product?.name || 'Produit'}</td>
                  <td style="padding: 8px 0; text-align: center;">${i.quantity}</td>
                  <td style="padding: 8px 0; text-align: right;">${(i.quantity * i.unit_price).toFixed(2)} €</td>
                </tr>
              `
                      )
                      .join('')
                  : ''
              }
            </tbody>
          </table>
          <p style="text-align: right; font-size: 16px; font-weight: bold; margin-top: 15px; color: #4f46e5;">
            Total Net TTC : ${totalAmount} €
          </p>
        </div>

        <p style="font-size: 11px; color: #64748b; font-style: italic;">
          ${vatMention || 'TVA non applicable, art. 293 B du CGI'}
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />

        <p style="font-size: 12px; color: #64748b; text-align: center;">
          Merci pour votre achat et votre soutien à l'artisanat !<br/>
          <strong>${orgName}</strong> ${siret ? `— SIRET : ${siret}` : ''}
        </p>
      </div>
    `;

    // 1. Try Resend API if API Key is configured
    if (process.env.RESEND_API_KEY) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: `${orgName} <facture@craftmanager.app>`,
            to: [clientEmail],
            subject: `Facture ${orderNumber} — ${orgName}`,
            html: htmlBody,
          }),
        });

        if (resendRes.ok) {
          return NextResponse.json({
            success: true,
            provider: 'resend',
            message: `Facture ${orderNumber} transmise par email à ${clientEmail} via le service direct.`,
            recipient: clientEmail,
          });
        }
      } catch (e) {
        console.error('[API send-invoice] Resend direct failed:', e);
      }
    }

    // 2. Default fallback response (simulated + mailto/download ready)
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      provider: 'mailto_fallback',
      message: `La facture ${orderNumber} (${totalAmount} €) a été préparée pour ${clientEmail}. Vous pouvez l'envoyer via votre logiciel de messagerie ou télécharger le fichier PDF / HTML.`,
      recipient: clientEmail,
      orderNumber,
      htmlBody,
    });
  } catch (error: any) {
    console.error('[API send-invoice] Error:', error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors de l'envoi de la facture" },
      { status: 500 }
    );
  }
}
