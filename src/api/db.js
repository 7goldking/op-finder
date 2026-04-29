import { supabase } from './supabaseClient';

function parseSort(s) {
  if (!s) return { column: 'created_at', ascending: false };
  const desc = s.startsWith('-');
  let col = desc ? s.slice(1) : s;
  if (col === 'created_date') col = 'created_at';
  if (col === 'last_message_at') col = 'last_message_at';
  return { column: col, ascending: !desc };
}

function makeEntity(table) {
  return {
    async list(sort = '-created_at', limit = 1000) {
      const { column, ascending } = parseSort(sort);
      let q = supabase.from(table).select('*').order(column, { ascending });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    async filter(filters = {}, sort = '-created_at', limit = 1000) {
      const { column, ascending } = parseSort(sort);
      let q = supabase.from(table).select('*').order(column, { ascending });
      for (const [k, v] of Object.entries(filters)) {
        if (v == null) continue;
        if (typeof v === 'object' && v.$in) q = q.in(k, v.$in);
        else q = q.eq(k, v);
      }
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    async get(id) {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },
    async create(obj) {
      const { data, error } = await supabase.from(table).insert(obj).select().single();
      if (error) throw error;
      return data;
    },
    async update(id, obj) {
      const { data, error } = await supabase.from(table).update(obj).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    subscribe(callback) {
      const ch = supabase.channel(`rt:${table}:${Math.random()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
        .subscribe();
      return () => supabase.removeChannel(ch);
    },
  };
}

export const db = {
  Event: makeEntity('events'),
  Organization: makeEntity('organizations'),
  Application: makeEntity('applications'),
  Mentor: makeEntity('mentors'),
  MentorReview: makeEntity('mentor_reviews'),
  MentorshipRequest: makeEntity('mentorship_requests'),
  Article: makeEntity('articles'),
  Team: makeEntity('teams'),
  Project: makeEntity('projects'),
  Bookmark: makeEntity('bookmarks'),
  Review: makeEntity('reviews'),
  Conversation: makeEntity('conversations'),
  Message: makeEntity('messages'),
  GroupChat: makeEntity('group_chats'),
  GroupMessage: makeEntity('group_messages'),
  Notification: makeEntity('notifications'),
  ActivityFeed: makeEntity('activity_feed'),
  FriendRequest: makeEntity('friend_requests'),
  Referral: makeEntity('referrals'),
  User: makeEntity('profiles'),
};
