import { redirect } from '@sveltejs/kit';
export const load = async ({ parent }) => {
  const data = await parent();
  if (!data.user) redirect(303, '/masuk');
  if (!data.children.length) redirect(303, '/profil?baru=1');
};
