import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

// Map priceId -> plan info
const PRICE_TO_PLAN = {
  'price_1TPHLR2cAQAWOVyeflJ2MjA6': { plan: 'pro', billing: 'month' },
  'price_1TPHLR2cAQAWOVyeP1NCNy3B': { plan: 'pro', billing: 'year' },
  'price_1TPHLR2cAQAWOVyedJ6eJzD5': { plan: 'business', billing: 'month' },
  'price_1TPHLR2cAQAWOVyeD80xYCP4': { plan: 'business', billing: 'year' },
};

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  let event;
  try {
    if (webhookSecret && sig) {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body);
    }
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const customerEmail = session.customer_email || session.metadata?.user_email;
      
      if (!customerEmail) {
        console.log('No customer email found in session');
        return Response.json({ received: true });
      }

      // Get subscription details
      const subscriptionId = session.subscription;
      let planName = 'pro';
      let billingPeriod = 'month';

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id;
        const planInfo = PRICE_TO_PLAN[priceId];
        if (planInfo) {
          planName = planInfo.plan;
          billingPeriod = planInfo.billing;
        }
      }

      // Find user and update subscription
      const users = await base44.asServiceRole.entities.User.filter({ email: customerEmail });
      if (users.length > 0) {
        const userId = users[0].id;
        await base44.asServiceRole.entities.User.update(userId, {
          subscription_plan: planName,
          subscription_billing: billingPeriod,
          subscription_active: true,
          subscription_id: subscriptionId || null,
          subscription_started_at: new Date().toISOString(),
        });
        console.log(`Subscription ${planName} activated for ${customerEmail}`);
      } else {
        console.log(`User not found: ${customerEmail}`);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customer = await stripe.customers.retrieve(subscription.customer);
      const customerEmail = customer.email;

      if (customerEmail) {
        const users = await base44.asServiceRole.entities.User.filter({ email: customerEmail });
        if (users.length > 0) {
          await base44.asServiceRole.entities.User.update(users[0].id, {
            subscription_plan: 'basic',
            subscription_active: false,
            subscription_id: null,
          });
          console.log(`Subscription cancelled for ${customerEmail}`);
        }
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const customerEmail = invoice.customer_email;
      
      if (customerEmail) {
        const users = await base44.asServiceRole.entities.User.filter({ email: customerEmail });
        if (users.length > 0) {
          await base44.asServiceRole.entities.User.update(users[0].id, {
            subscription_active: false,
          });
          console.log(`Payment failed for ${customerEmail}`);
        }
      }
    }

  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  return Response.json({ received: true });
});