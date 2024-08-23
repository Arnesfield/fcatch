import { Catch } from '../types/catch.types.js';
import { FCatch } from '../types/fcatch.types.js';
import { Result } from '../types/result.types.js';
import { FunctionParameters } from '../types/util.types.js';
import { res } from './result.js';

/**
 * The FCatch object.
 * ```
 * f.run(() => 'Hello World'); // Result<string, unknown>
 * f<Error>().run(() => 'Hello World'); // Result<string, Error>
 * ```
 */
export const f = (() => f) as FCatch;
const props = { catch: mapErr => create(mapErr), ...create() } as FCatch;
for (const [key, value] of Object.entries(props)) {
  Object.defineProperty(f, key, { value, enumerable: true });
}

function create<E>(
  mapErr: (error: unknown) => E = error => error as E
): Catch<E> {
  function run<T extends (...args: any) => any>(
    fn: T,
    ...args: FunctionParameters<T>
  ): Result<ReturnType<T>, E>;
  function run<T extends (...args: any) => any>(
    fn: T,
    thisArg: ThisParameterType<T>,
    ...args: Parameters<T>
  ): Result<ReturnType<T>, E> {
    type V = ReturnType<T>;
    try {
      return res<V, E>(Function.prototype.apply.call(fn, thisArg, args));
    } catch (error) {
      return res<V, E>(null, mapErr(error), false);
    }
  }

  async function runAsync<T extends (...args: any) => any>(
    fn: T,
    ...args: FunctionParameters<T>
  ): Promise<Result<Awaited<ReturnType<T>>, E>>;
  async function runAsync<T extends (...args: any) => any>(
    fn: T,
    thisArg: ThisParameterType<T>,
    ...args: Parameters<T>
  ) {
    type V = Awaited<ReturnType<T>>;
    try {
      return res<V, E>(await Function.prototype.apply.call(fn, thisArg, args));
    } catch (error) {
      return res<V, E>(null, mapErr(error), false);
    }
  }

  function wrap<T extends (...args: any) => any>(fn: T) {
    return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
      return run(fn, this, ...args);
    };
  }

  function wrapAsync<T extends (...args: any) => any>(fn: T) {
    return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
      return runAsync(fn, this, ...args);
    };
  }

  return {
    run,
    runAsync,
    resolve: promise => runAsync(() => promise),
    wrap,
    wrapAsync
  };
}
