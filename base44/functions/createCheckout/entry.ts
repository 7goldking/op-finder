import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { priceId, successUrl, cancelUrl, userEmail } = await req.json();

    if (!priceId) {
      return Response.json({ error: 'priceId is required' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${req.headers.get('origin')}/pricing?success=true`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/pricing?canceled=true`,
      customer_email: userEmail || undefined,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_email: userEmail || '',
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});