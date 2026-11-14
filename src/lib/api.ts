export async function api<T = Record<string, unknown>>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const result = await response
    .json()
    .catch(() => ({ message: 'Koneksi terputus. Coba kembali, ya.' }));
  if (!response.ok) throw new Error(result.message || 'Permintaan belum berhasil. Coba lagi.');
  return result;
}
