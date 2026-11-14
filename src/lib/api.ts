export async function api<T = Record<string, unknown>>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error('Respons server tidak valid. Muat ulang untuk memeriksa hasil tersimpan.');
  }
  if (!response.ok) throw new Error(result.message || 'Permintaan belum berhasil. Coba lagi.');
  return result;
}
