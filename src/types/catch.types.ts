import { Result } from './result.types.js';
import { FunctionParameters } from './util.types.js';

/**
 * The Catch object.
 * @template E The error type.
 */
export interface Catch<E = unknown> {
  /**
   * Runs a function that will catch errors and transform
   * the result to a {@linkcode Result} type.
   * @param fn The function to run.
   * @param args The `this` and function arguments.
   * @returns The result.
   */
  run<T extends (...args: any) => any>(
    fn: T,
    ...args: FunctionParameters<T>
  ): Result<ReturnType<T>, E>;
  /**
   * Runs a function that will catch errors and transform
   * the result to a Promise that resolves to a {@linkcode Result} type.
   * @param fn The function to run.
   * @param args The `this` and function arguments.
   * @returns The Promise result.
   */
  runAsync<T extends (...args: any) => any>(
    fn: T,
    ...args: FunctionParameters<T>
  ): Promise<Result<Awaited<T>, E>>;
  /**
   * Resolves a promise, catch errors, and transform
   * the result to a {@linkcode Result} type.
   * @param promise The promise to resolve.
   * @returns The Promise result.
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
