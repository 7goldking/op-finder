import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, plan } = await req.json();

    const users = await base44.asServiceRole.entities.User.filter({ email });
    if (!users || users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = users[0];
    await base44.asServiceRole.entities.User.update(targetUser.id, {
      subscription_plan: plan,
      subscription_active: true,
      subscription_billing_cycle: 'year',
    });

    return Response.json({ success: true, message: `Plan ${plan} activated for ${email}` });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});