import type { Handle } from '@sveltejs/kit/hooks';
import { readAuthSession } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
  // JSON mutations also require same-origin; SvelteKit checks form actions itself.
  if (
    !['GET', 'HEAD', 'OPTIONS'].includes(event.request.method) &&
    event.request.headers.get('origin') !== event.url.origin
  ) {
    return new Response('Permintaan lintas situs ditolak.', { status: 403 });
  }
  event.locals.user = await readAuthSession(event.cookies.get('session'));
  const response = await resolve(event);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'microphone=(self), camera=()');
  response.headers.set('X-Frame-Options', 'DENY');
  if (event.locals.user || event.url.pathname.startsWith('/api'))
    response.headers.set('Cache-Control', 'private, no-store');
  return response;
};
