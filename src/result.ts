import { Result } from './types.js';

export function res<T, E>(
  ok: boolean,
  value: T | null,
  error: E | null
): Result<T, E> {
  return Object.assign([error, value] as Result<T, E>, { ok, value, error });
}
