import { Catch } from '../types/catch.types.js';
import { FCatch } from '../types/fcatch.types.js';
import { res } from './result.js';

/**
 * The FCatch object.
 * ```
 * f.run(() => 'Hello World'); // Result<string, unknown>
 * f<Error>().run(() => 'Hello World'); // Result<string, Error>
 * ```
 */
export const f = (() => f) as FCatch;
const props = { ...create(), catch: mapErr => create(mapErr) } as FCatch;
for (const [key, value] of Object.entries(props)) {
  Object.defineProperty(f, key, { value, enumerable: true });
}

function create<E>(
  mapErr: (error: unknown) => E = error => error as E
): Catch<E> {
  function sync<T extends (...args: any) => any>(fn: T) {
    type V = ReturnType<T>;
    return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
      try {
        return res<V, E>(Function.prototype.apply.call(fn, this, args));
      } catch (error) {
        return res<V, E>(null, mapErr(error), false);
      }
    };
  }

  function async<T extends (...args: any) => any>(fn: T) {
    type V = Awaited<ReturnType<T>>;
    return async function (this: ThisParameterType<T>, ...args: Parameters<T>) {
      try {
        return res<V, E>(await Function.prototype.apply.call(fn, this, args));
      } catch (error) {
        return res<V, E>(null, mapErr(error), false);
      }
    };
  }

  // include async here to ensure promise in case fn is non-async
  async function runAsync<T>(fn: () => T) {
    return async(fn)();
  }

  return {
    sync,
    async,
    run: fn => sync(fn)(),
    runAsync,
    resolve: promise => runAsync(() => promise)
  };
}
