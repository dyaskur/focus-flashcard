import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { children } from '$lib/server/schema';
export const load = async ({ locals, cookies }) => ({
  user: locals.user,
  children: locals.user
    ? await db.select().from(children).where(eq(children.userId, locals.user.id))
    : [],
  activeChildId: cookies.get('child') ?? null
});
