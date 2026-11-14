import { redirect, error } from '@sveltejs/kit';
import { z } from 'zod';
import { sessionDetails } from '$lib/server/learning';
export const load = async ({ locals, params }) => {
  if (!locals.user) redirect(303, '/masuk');
  if (!z.uuid().safeParse(params.id).success) error(404);
  return sessionDetails(locals.user.id, params.id);
};
