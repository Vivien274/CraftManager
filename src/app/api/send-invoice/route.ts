import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientEmail, clientName, orderNumber, totalAmount, items, organisationName } = body;

    if (!clientEmail || !orderNumber) {
      return NextResponse.json(
        { error: 'Email du client et numéro de commande requis' },
        { status: 400 }
      );
    }

    // Simulate sending email (or integration with Resend / Nodemailer / SMTP)
    console.log(`[API send-invoice] Sending invoice ${orderNumber} to ${clientEmail}...`);

    // Simulated delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    return NextResponse.json({
      success: true,
      message: `La facture ${orderNumber} d'un montant de ${totalAmount} € a été envoyée avec succès à ${clientEmail}.`,
      sentAt: new Date().toISOString(),
      recipient: clientEmail,
      orderNumber,
    });
  } catch (error: any) {
    console.error('[API send-invoice] Error:', error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors de l'envoi de la facture" },
      { status: 500 }
    );
  }
}
