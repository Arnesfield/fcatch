import { Catch } from './catch.types.js';

/**
 * The FCatch object.
 * @template E The error type.
 */
export interface FCatch<E = unknown> extends Catch<E> {
  /**
   * Call to return itself to accept an error generic type.
   * ```
   * f<Error>().run(() => 'Hello World'); // Result<string, Error>
   * ```
   * @template F The error type.
   * @returns Itself but with the specified error generic type.
   */
  <F = E>(): FCatch<F>;
  /**
   * Creates a new {@linkcode Catch} object that uses
   * the provided function to map errors.
   * @template F The error type.
   * @param mapErr A function to map the caught error if any.
   * @returns The {@linkcode Catch} object.
   */
  catch<F = E>(mapErr: (error: unknown) => F): Catch<F>;
}
