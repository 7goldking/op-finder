import { base44 } from '@/api/base44Client';

function sortPair(a, b) {
  return [a, b].sort();
}

export async function getOrCreateConversation(me, other) {
  if (!me?.email || !other?.email || me.email === other.email) return null;
  const [a, b] = sortPair(me.email, other.email);

  const existing = await base44.entities.Conversation.filter({ participant_a: a, participant_b: b }, '-created_date', 1);
  if (existing.length) return existing[0];

  return await base44.entities.Conversation.create({
    participant_a: a,
    participant_b: b,
    participants: [a, b],
    participant_names: {
      [me.email]: me.full_name || me.email,
      [other.email]: other.name || other.full_name || other.email,
    },
    participant_avatars: {
      [me.email]: me.avatar_url || '',
      [other.email]: other.avatar_url || '',
    },
    unread_for: [],
  });
}

export async function listMyConversations(myEmail) {
  if (!myEmail) return [];
  const [asA, asB] = await Promise.all([
    base44.entities.Conversation.filter({ participant_a: myEmail }, '-last_message_at', 100),
    base44.entities.Conversation.filter({ participant_b: myEmail }, '-last_message_at', 100),
  ]);
  const merged = [...asA, ...asB];
  merged.sort((x, y) => new Date(y.last_message_at || y.created_date || 0) - new Date(x.last_message_at || x.created_date || 0));
  return merged;
}

export function otherParticipant(convo, myEmail) {
  return convo.participant_a === myEmail ? convo.participant_b : convo.participant_a;
}

export async function sendMessage(conversation, me, text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const other = otherParticipant(conversation, me.email);
  await base44.entities.Message.create({
    conversation_id: conversation.id,
    sender_email: me.email,
    sender_name: me.full_name || me.email,
    text: trimmed,
  });
  const unread = Array.from(new Set([...(conversation.unread_for || []).filter(e => e !== me.email), other]));
  await base44.entities.Conversation.update(conversation.id, {
    last_message: trimmed.slice(0, 120),
    last_message_at: new Date().toISOString(),
    last_sender_email: me.email,
    unread_for: unread,
  });
}

export async function markRead(conversation, me) {
  if (!conversation.unread_for?.includes(me.email)) return;
  await base44.entities.Conversation.update(conversation.id, {
    unread_for: (conversation.unread_for || []).filter(e => e !== me.email),
  });
}