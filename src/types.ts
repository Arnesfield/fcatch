export type Result<T, E> = ([null, T] | [E, null]) &
  ({ ok: true; value: T; error: null } | { ok: false; value: null; error: E });

export interface Catch<E = unknown> {
  sync<T extends (...args: any) => any>(
    fn: T
  ): (
    this: ThisParameterType<T>,
    ...args: Parameters<T>
  ) => Result<ReturnType<T>, E>;

  async<T extends (...args: any) => any>(
    fn: T
  ): (
    this: ThisParameterType<T>,
    ...args: Parameters<T>
  ) => Promise<Result<Awaited<ReturnType<T>>, E>>;

  resolve<T>(promise: PromiseLike<T>): Promise<Result<T, E>>;
}
