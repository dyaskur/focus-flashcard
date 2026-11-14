import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { children } from '$lib/server/schema';
import { requireUser, removeAuthSession } from '$lib/server/auth';
const profileSchema = z.object({
  name: z.string().trim().min(1).max(40),
  parentName: z.string().trim().max(40).default(''),
  friendName: z.string().trim().max(40).default(''),
  petName: z.string().trim().max(40).default(''),
  age: z
    .union([z.literal(''), z.coerce.number().int().min(1).max(18)])
    .transform((v) => (v === '' ? null : v)),
  id: z.union([z.uuid(), z.literal('')]).optional()
});
export const load = ({ locals }) => {
  if (!locals.user) redirect(303, '/masuk');
};
export const actions = {
  save: async ({ request, locals, cookies, url }) => {
    const user = requireUser(locals);
    const data = profileSchema.safeParse(Object.fromEntries(await request.formData()));
    if (!data.success)
      return fail(400, { message: 'Nama wajib diisi; usia antara 1–18 tahun jika diisi.' });
    const { id, ...profile } = data.data;
    let saved;
    if (id)
      [saved] = await db
        .update(children)
        .set(profile)
        .where(and(eq(children.id, id), eq(children.userId, user.id)))
        .returning();
    else
      [saved] = await db
        .insert(children)
        .values({ ...profile, userId: user.id })
        .returning();
    if (!saved) return fail(404, { message: 'Profil tidak ditemukan.' });
    cookies.set('child', saved.id, {
      path: '/',
      httpOnly: true,
      secure: url.protocol === 'https:',
      sameSite: 'lax',
      maxAge: 30 * 86400
    });
    redirect(303, '/beranda');
  },
  delete: async ({ request, locals, cookies }) => {
    const user = requireUser(locals);
    const id = z.uuid().safeParse((await request.formData()).get('id'));
    if (!id.success) return fail(400, { message: 'Profil tidak valid.' });
    await db.delete(children).where(and(eq(children.id, id.data), eq(children.userId, user.id)));
    if (cookies.get('child') === id.data) cookies.delete('child', { path: '/' });
    redirect(303, '/profil');
  },
  logout: async ({ cookies }) => {
    await removeAuthSession(cookies);
    redirect(303, '/');
  }
};
