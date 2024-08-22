import { Result } from '../types/result.types.js';

export function res<T, E>(value: T): Result<T, E>;
export function res<T, E>(value: null, error: E, ok: false): Result<T, E>;
export function res<T, E>(
  value: T | null,
  error: E | null = null,
  ok = true
): Result<T, E> {
  return Object.assign([error, value] as Result<T, E>, { ok, value, error });
}
