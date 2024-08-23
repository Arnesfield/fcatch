/** Get `this` and function parameters. */
export type FunctionParameters<
  F extends (...args: any) => any,
  T = ThisParameterType<F>,
  P extends any[] = Parameters<F>
> = unknown extends T ? [T?, ...P] : [T, ...P];
