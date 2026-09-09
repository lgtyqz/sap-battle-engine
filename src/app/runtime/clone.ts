/** Preserve prototypes and function references, as the upstream shallow clone does. */
export function clone<T>(value: T): T {
  if (Array.isArray(value)) return value.slice() as T;
  if (value && typeof value === 'object') return Object.assign(Object.create(Object.getPrototypeOf(value)), value);
  return value;
}
/** Clone equipment state without cloning its engine or service graph. */
export function cloneDeep<T>(value: T, seen = new Map<object, unknown>()): T {
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value) as T;
  if (value instanceof Map) { const result = new Map(); seen.set(value, result); for (const [k, v] of value) result.set(k, cloneDeep(v, seen)); return result as T; }
  if (value instanceof Set) { const result = new Set(); seen.set(value, result); for (const v of value) result.add(cloneDeep(v, seen)); return result as T; }
  const result = (Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value))) as Record<string, unknown>;
  seen.set(value, result);
  for (const key of Object.keys(value)) { const entry = (value as Record<string, unknown>)[key]; result[key] = key === 'runtime' || key.endsWith('Service') ? entry : cloneDeep(entry, seen); }
  return result as T;
}
