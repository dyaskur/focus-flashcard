import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, sqlClient } from '../src/lib/server/db';
try {
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations applied.');
} finally {
  await sqlClient.end();
}
