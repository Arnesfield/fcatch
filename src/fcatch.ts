import { res } from './result.js';
import { Catch } from './types.js';

export function fcatch<E>(
  mapErr: (error: unknown) => E = error => error as E
): Catch<E> {
  async function resolve<V>(promise: PromiseLike<V>) {
    try {
      return res<V, E>(true, await promise, null);
    } catch (error) {
      return res<V, E>(false, null, mapErr(error));
    }
  }

  function sync<T extends (...args: any) => any>(fn: T) {
    type V = ReturnType<T>;
    return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
      try {
        // prettier-ignore
        return res<V, E>(true, Function.prototype.call.call(fn, this, ...args), null);
      } catch (error) {
        return res<V, E>(false, null, mapErr(error));
      }
    };
  }

  function async<T extends (...args: any) => any>(fn: T) {
    type V = Awaited<ReturnType<T>>;
    return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
      return resolve<V>(Function.prototype.call.call(fn, this, ...args));
    };
  }

  return { sync, async, resolve };
}
