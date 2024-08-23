/** The successful {@linkcode Result} type. */
export type Ok<T> = [null, T] & {
  /** A boolean that determines if the result resolved properly or not. */
  ok: true;
  /** The original value. */
  value: T;
  /** The caught error. */
  error: null;
};

/** The error {@linkcode Result} type. */
export type Err<T> = [T, null] & {
  /** A boolean that determines if the result resolved properly or not. */
  ok: false;
  /** The original value. */
  value: null;
  /** The caught error. */
  error: T;
};

/**
 * The Result type. Value changes based on the result.
 * - {@linkcode Ok<T>} - The successful result.
 * - {@linkcode Err<E>} - The error result.
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
export type Result<T, E = unknown> = Ok<T> | Err<E>;
