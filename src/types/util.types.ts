/** Get function parameters including `this` type. */
export type FunctionParameters<
  F extends (...args: any) => any,
  T = ThisParameterType<F>,
  P extends any[] = Parameters<F>
> = unknown extends T ? [T?, ...P] : [T, ...P];
