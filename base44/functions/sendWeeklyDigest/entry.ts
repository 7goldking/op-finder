import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();

    // Admin-only or scheduled (when called from automation, caller may be null - allow via service role)
    if (caller && caller.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sr = base44.asServiceRole;

    // Get students with digest enabled
    const users = await sr.entities.User.filter({ account_type: 'student', email_digest_enabled: true }, '-created_date', 500);

    // Get recent published events (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const allEvents = await sr.entities.Event.filter({ status: 'published' }, '-created_date', 200);
    const recentEvents = allEvents.filter(e => e.created_date >= weekAgo);

    if (recentEvents.length === 0) {
      return Response.json({ sent: 0, reason: 'No new events this week' });
    }

    let sent = 0;
    const errors = [];

    for (const user of users) {
      try {
        // Match by interests / education level
        const interests = user.interests || [];
        const matched = recentEvents.filter(e => {
          const tagMatch = interests.length === 0 || (e.tags || []).some(t => interests.includes(t)) || interests.includes(e.category);
          const levelMatch = !user.education_level || (e.level || []).length === 0 || (e.level || []).includes(user.education_level) || (e.level || []).includes('any');
          return tagMatch && levelMatch;
        }).slice(0, 5);

        if (matched.length === 0) continue;

        const eventsHtml = matched.map(e => `
          <div style="padding:16px;border:1px solid #eee;border-radius:12px;margin-bottom:12px">
            <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">${e.category}</div>
            <div style="font-weight:600;font-size:16px;margin-bottom:6px">${e.title}</div>
            <div style="font-size:14px;color:#555">${e.short_description || ''}</div>
            ${e.application_deadline ? `<div style="font-size:12px;color:#d97706;margin-top:8px">Дедлайн: ${new Date(e.application_deadline).toLocaleDateString('ru-RU')}</div>` : ''}
          </div>
        `).join('');

        const body = `
          <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
            <h1 style="font-size:24px;margin:0 0 8px">Привет, ${user.full_name?.split(' ')[0] || 'друг'} 👋</h1>
            <p style="color:#666;margin:0 0 24px">Подобрали для тебя ${matched.length} новых возможностей на этой неделе</p>
            ${eventsHtml}
            <div style="margin-top:24px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#888">
              <a href="${Deno.env.get('APP_URL') || '#'}/dashboard" style="color:#111">Открыть Opfinder →</a>
              <br><br>
              Не хотите получать дайджест? Отключите в настройках профиля.
            </div>
          </div>
        `;

        await sr.integrations.Core.SendEmail({
          from_name: 'Opfinder',
          to: user.email,
          subject: `${matched.length} новых возможностей для тебя на этой неделе`,
          body,
        });

        await sr.entities.User.update(user.id, { email_digest_last_sent: new Date().toISOString() });
        sent++;
      } catch (err) {
        errors.push({ email: user.email, error: err.message });
      }
    }

    return Response.json({ sent, total_users: users.length, recent_events: recentEvents.length, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});