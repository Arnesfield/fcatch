import { Result } from './result.types.js';

/**
 * The Catch object.
 * @template E The error type.
 */
export interface Catch<E = unknown> {
  /**
   * Runs a function that will catch errors and transform
   * the result to a {@linkcode Result} type.
   * @param fn The function to run.
   * @returns The transformed result.
   */
  run<T>(fn: () => T): Result<T, E>;
  /**
   * Runs a function that will catch errors and transform
   * the result to a Promise that resolves to a {@linkcode Result} type.
   * @param fn The function to run.
   * @returns The transformed Promise result.
   */
  runAsync<T>(fn: () => T): Promise<Result<Awaited<T>, E>>;
  /**
   * Wrap the promise with another that catches errors and transforms
   * the result to a {@linkcode Result} type.
   * @param promise The promise to resolve.
   * @returns The wrapped promise.
   */
  resolve<T>(promise: PromiseLike<T>): Promise<Result<T, E>>;
  /**
   * Wraps a function with another that catches errors and transforms
   * the result to a {@linkcode Result} type.
   * @param fn The function to wrap.
   * @returns The wrapped function.
   */
  wrap<T extends (...args: any) => any>(
    fn: T
  ): (
    this: ThisParameterType<T>,
    ...args: Parameters<T>
  ) => Result<ReturnType<T>, E>;
  /**
   * Wraps a function with another that catches errors and transforms
   * the result to a Promise that resolves to a {@linkcode Result} type.
   * @param fn The function to wrap.
   * @returns The wrapped function.
   */
  wrapAsync<T extends (...args: any) => any>(
    fn: T
  ): (
    this: ThisParameterType<T>,
    ...args: Parameters<T>
  ) => Promise<Result<Awaited<ReturnType<T>>, E>>;
}
