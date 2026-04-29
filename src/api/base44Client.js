// Полная замена @base44/sdk — использует Supabase
import { db } from './db';
import { auth } from './auth';
import { integrations, functions } from './integrations';

export const base44 = {
  entities: db,
  auth,
  integrations,
  functions,
};
