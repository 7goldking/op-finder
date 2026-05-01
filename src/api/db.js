import { supabase } from './supabaseClient';

function parseSort(s) {
  if (!s) return { column: 'created_at', ascending: false };
  const desc = s.startsWith('-');
  let col = desc ? s.slice(1) : s;
  if (col === 'created_date') col = 'created_at';
  if (col === 'last_message_at') col = 'last_message_at';
  return { column: col, ascending: !desc };
}

// Field aliases per table: frontend name → DB column. Mapped on both read and write.
const FIELD_ALIASES = {
  events: {
    application_deadline: 'deadline',
    event_start: 'start_date',
    event_end: 'end_date',
    cover_url: 'cover_image_url',
  },
};

function mapInput(table, obj) {
  const aliases = FIELD_ALIASES[table];
  if (!aliases || !obj) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[aliases[k] || k] = v;
  }
  return out;
}

function mapOutput(table, row) {
  const aliases = FIELD_ALIASES[table];
  if (!aliases || !row) return row;
  const reverse = Object.fromEntries(Object.entries(aliases).map(([k, v]) => [v, k]));
  const out = { ...row };
  for (const [dbCol, frontendKey] of Object.entries(reverse)) {
    if (dbCol in row) out[frontendKey] = row[dbCol];
  }
  return out;
}

function mapOutputList(table, rows) {
  if (!rows) return rows;
  return rows.map((r) => mapOutput(table, r));
}

// Schema cache: table -> Set<columnName>. Populated lazily from PGRST204 errors.
const SCHEMA_CACHE = {};

async function loadSchema(table) {
  if (SCHEMA_CACHE[table]) return SCHEMA_CACHE[table];
  const { data } = await supabase.from(table).select('*').limit(1);
  if (data && data[0]) {
    SCHEMA_CACHE[table] = new Set(Object.keys(data[0]));
  }
  return SCHEMA_CACHE[table];
}

function stripUnknown(table, obj) {
  const schema = SCHEMA_CACHE[table];
  if (!schema || !obj) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (schema.has(k)) out[k] = v;
  }
  return out;
}

async function runWithSchemaRetry(table, action) {
  try {
    return await action(null);
  } catch (err) {
    // PGRST204 = column not found in schema cache. Fetch schema and retry with known fields.
    if (err?.code === 'PGRST204' || err?.message?.includes('schema cache')) {
      await loadSchema(table);
      if (SCHEMA_CACHE[table]) return await action(SCHEMA_CACHE[table]);
    }
    throw err;
  }
}

function makeEntity(table) {
  return {
    async list(sort = '-created_at', limit = 1000) {
      const { column, ascending } = parseSort(sort);
      let q = supabase.from(table).select('*').order(column, { ascending });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return mapOutputList(table, data || []);
    },
    async filter(filters = {}, sort = '-created_at', limit = 1000) {
      const { column, ascending } = parseSort(sort);
      const mappedFilters = mapInput(table, filters) || {};
      let q = supabase.from(table).select('*').order(column, { ascending });
      for (const [k, v] of Object.entries(mappedFilters)) {
        if (v == null) continue;
        if (typeof v === 'object' && v.$in) q = q.in(k, v.$in);
        else q = q.eq(k, v);
      }
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return mapOutputList(table, data || []);
    },
    async get(id) {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
      if (error && error.code !== 'PGRST116') throw error;
      return mapOutput(table, data) || null;
    },
    async create(obj) {
      return runWithSchemaRetry(table, async (schema) => {
        const payload = schema ? stripUnknown(table, mapInput(table, obj)) : mapInput(table, obj);
        const { data, error } = await supabase.from(table).insert(payload).select().single();
        if (error) throw error;
        return mapOutput(table, data);
      });
    },
    async update(id, obj) {
      return runWithSchemaRetry(table, async (schema) => {
        const payload = schema ? stripUnknown(table, mapInput(table, obj)) : mapInput(table, obj);
        const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single();
        if (error) throw error;
        return mapOutput(table, data);
      });
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
