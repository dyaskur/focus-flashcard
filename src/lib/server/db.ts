import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
// No user-specific state is kept in module scope; each query checks ownership.
export const sqlClient = postgres(process.env.DATABASE_URL || 'postgres://localhost/fokus', {
  max: 10
});
export const db = drizzle(sqlClient, { schema });
