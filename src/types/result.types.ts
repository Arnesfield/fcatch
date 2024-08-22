/**
 * The Result type. Values change based on the result.
 * ```
 * // success
 * { ok: true, value: T, error: null }
 * // fail
 * { ok: false, value: null, error: E }
 * ```
 *
 * Can be used like an array or object.
 * ```
 * // array
 * const [error, value] = result;
 * console.log(error, value);
 * // object
 * if (result.ok) {
 *   console.log(result.value);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 * @template T The value type.
 * @template E The error type.
 */
export type Result<T, E = unknown> =
  | ([null, T] & {
      /** A boolean that determines if the result resolved properly or not. */
      ok: true;
      /** The original value. */
      value: T;
      /** The caught error. */
      error: null;
    })
  | ([E, null] & {
      /** A boolean that determines if the result resolved properly or not. */
      ok: false;
      /** The original value. */
      value: null;
      /** The caught error. */
      error: E;
    });
