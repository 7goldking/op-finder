import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { code } = body;
    if (!code) return Response.json({ ok: false, reason: 'no code' });

    const sr = base44.asServiceRole;

    // Already tracked for this user?
    const existing = await sr.entities.Referral.filter({ referred_email: user.email });
    if (existing.length > 0) return Response.json({ ok: false, reason: 'already tracked' });

    // Find referrer
    const referrers = await sr.entities.User.filter({ referral_code: code });
    const referrer = referrers[0];
    if (!referrer) return Response.json({ ok: false, reason: 'invalid code' });
    if (referrer.email === user.email) return Response.json({ ok: false, reason: 'self-referral' });

    // Create referral record
    await sr.entities.Referral.create({
      referrer_email: referrer.email,
      referred_email: user.email,
      code,
      status: user.onboarded ? 'onboarded' : 'signed_up',
    });

    // Increment referrer's count & award badges
    const newCount = (referrer.referral_count || 0) + 1;
    const thresholds = [
      { at: 1, badge: 'first_friend' },
      { at: 3, badge: 'ambassador' },
      { at: 5, badge: 'star' },
      { at: 10, badge: 'legend' },
    ];
    const earned = thresholds.filter(t => newCount >= t.at).map(t => t.badge);
    const existingBadges = referrer.badges || [];
    const mergedBadges = [...new Set([...existingBadges, ...earned])];

    await sr.entities.User.update(referrer.id, {
      referral_count: newCount,
      badges: mergedBadges,
    });

    return Response.json({ ok: true, referrer: referrer.email, count: newCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});