import { res } from './result.js';
import { Catch } from './types.js';

export function fcatch<E>(
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

  async function resolve<T>(promise: PromiseLike<T>) {
    try {
      return res<T, E>(await promise);
    } catch (error) {
      return res<T, E>(null, mapErr(error), false);
    }
  }

  return { sync, async, resolve };
}
