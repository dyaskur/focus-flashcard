import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { users } from '$lib/server/schema';
import { passwordHash, verifyPassword, createAuthSession, rateLimit } from '$lib/server/auth';
const schema = z.object({
  email: z
    .email()
    .max(254)
    .transform((s) => s.toLowerCase()),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(2).max(60).optional(),
  consent: z.literal('on').optional(),
  mode: z.enum(['login', 'register'])
});
export const load = ({ locals }) => {
  if (locals.user) redirect(303, '/beranda');
};
export const actions = {
  default: async ({ request, cookies, url, getClientAddress }) => {
    await rateLimit(`auth:${getClientAddress()}`, 20, 15 * 60000);
    const result = schema.safeParse(Object.fromEntries(await request.formData()));
    if (!result.success)
      return fail(400, { message: 'Periksa email dan kata sandi (minimal 8 karakter).' });
    const data = result.data;
    let [user] = await db.select().from(users).where(eq(users.email, data.email));
    if (data.mode === 'register') {
      if (!data.name || !data.consent)
        return fail(400, { message: 'Isi nama dan persetujuan orang tua untuk melanjutkan.' });
      if (user)
        return fail(400, {
          message: 'Pendaftaran tidak dapat diproses. Coba masuk atau gunakan email lain.'
        });
      const [created] = await db
        .insert(users)
        .values({
          email: data.email,
          name: data.name,
          passwordHash: await passwordHash(data.password)
        })
        .onConflictDoNothing()
        .returning();
      if (!created) return fail(400, { message: 'Pendaftaran tidak dapat diproses.' });
      user = created;
    } else if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
      return fail(400, { message: 'Email atau kata sandi belum tepat.' });
    }
    await createAuthSession(user.id, cookies, url.protocol === 'https:');
    redirect(303, data.mode === 'register' ? '/profil?baru=1' : '/beranda');
  }
};
