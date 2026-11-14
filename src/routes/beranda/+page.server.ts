import { redirect } from '@sveltejs/kit';
import { history } from '$lib/server/pilot';
import { db } from '$lib/server/db';
import { pilotCards } from '$lib/server/schema';
export const load = async ({ parent }) => {
  const data = await parent();
  if (!data.user) redirect(303, '/masuk');
  if (!data.children.length) redirect(303, '/profil?baru=1');
  const child = data.children.find((c) => c.id === data.activeChildId) ?? data.children[0];
  return {
    cards: (await db.select().from(pilotCards)).map((r) => r.content),
    sessions: (await history(data.user.id, child.id))
      .slice(0, 20)
      .map(({ session }) => ({ id: session.id, childId: child.id, ...session.state }))
  };
};
