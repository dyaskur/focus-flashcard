import { redirect, error } from '@sveltejs/kit';
import { z } from 'zod';
import { practiceDetails } from '$lib/server/pilot';
export const load = async ({ locals, params }) => {
  if (!locals.user) redirect(303, '/masuk');
  if (!z.uuid().safeParse(params.id).success) error(404);
  return { practice: await practiceDetails(locals.user.id, params.id) };
};
