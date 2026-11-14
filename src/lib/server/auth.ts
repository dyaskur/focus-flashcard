import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { error } from '@sveltejs/kit';
import { and, eq, gt, sql } from 'drizzle-orm';
import { db } from './db';
import { authSessions, rateLimits, users } from './schema';
import type { Cookies } from '@sveltejs/kit';
const scrypt = promisify(scryptCallback);
const hash = (value: string) => createHash('sha256').update(value).digest('hex');

export async function passwordHash(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${((await scrypt(password, salt, 64)) as Buffer).toString('hex')}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [salt, key] = stored.split(':');
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(key, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export async function createAuthSession(userId: string, cookies: Cookies, secure: boolean) {
  const token = randomBytes(32).toString('hex');
  await db
    .insert(authSessions)
    .values({ userId, tokenHash: hash(token), expiresAt: new Date(Date.now() + 30 * 86400000) });
  cookies.set('session', token, {
    path: '/',
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 30 * 86400
  });
}
export async function readAuthSession(token: string | undefined) {
  if (!token) return null;
  const [row] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(authSessions)
    .innerJoin(users, eq(users.id, authSessions.userId))
    .where(and(eq(authSessions.tokenHash, hash(token)), gt(authSessions.expiresAt, new Date())));
  return row ?? null;
}
export async function removeAuthSession(cookies: Cookies) {
  const token = cookies.get('session');
  if (token) await db.delete(authSessions).where(eq(authSessions.tokenHash, hash(token)));
  cookies.delete('session', { path: '/' });
}
export function requireUser(locals: App.Locals) {
  if (!locals.user) error(401, 'Silakan masuk sebagai orang tua terlebih dahulu.');
  return locals.user;
}
export async function rateLimit(key: string, limit: number, windowMs: number) {
  const now = new Date();
  const [row] = await db
    .insert(rateLimits)
    .values({ key: hash(key), count: 1, resetAt: new Date(+now + windowMs) })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${rateLimits.resetAt} <= ${now.toISOString()}::timestamptz then 1 else ${rateLimits.count} + 1 end`,
        resetAt: sql`case when ${rateLimits.resetAt} <= ${now.toISOString()}::timestamptz then ${new Date(+now + windowMs).toISOString()}::timestamptz else ${rateLimits.resetAt} end`
      }
    })
    .returning();
  if (row.count > limit) error(429, 'Terlalu banyak percobaan. Tunggu beberapa menit, ya.');
}
