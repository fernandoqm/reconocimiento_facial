export function validateApiKey(key: unknown): key is string {
  if (typeof key !== 'string' || !key) return false;
  const valid = (process.env.API_KEYS ?? '')
    .split(',')
    .map(k => k.trim())
    .filter(Boolean);
  return valid.includes(key);
}
