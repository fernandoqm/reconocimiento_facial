/**
 * API keys format in .env:
 *   API_KEYS=key_cliente1:200,key_cliente2:100
 *
 * El número después de ":" es el límite de requests por hora.
 * Sin número = 200/h por defecto.
 */

interface KeyConfig {
  limitPerHour: number;
}

function parseKeys(): Map<string, KeyConfig> {
  const map = new Map<string, KeyConfig>();
  const raw = process.env.API_KEYS ?? '';
  raw.split(',').forEach(entry => {
    const [key, limit] = entry.trim().split(':');
    if (key) map.set(key, { limitPerHour: parseInt(limit ?? '200', 10) });
  });
  return map;
}

const KEY_MAP = parseKeys();

export function isValidKey(key: unknown): key is string {
  return typeof key === 'string' && KEY_MAP.has(key);
}

export function getLimitPerHour(key: string): number {
  return KEY_MAP.get(key)?.limitPerHour ?? 0;
}
